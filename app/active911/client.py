#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Active911 integration using a911client (Active911Client + asyncio).

Incoming XMPP stanzas call Active911Client.message_handler(), which invokes
fetch_alert() and then the user-supplied alert_handler (async). The older
A911CLIENT_API_FIX.md text about message_handler replacing alert_handler
referred to a different integration shape; this library expects alert_handler
for parsed alert payloads (see a911client.Active911Client docstring).

Changelog:
    - 2018-05-15 - Initial Commit
    - 2026-04-03 - Active911Client + asyncio; thread-pool persist; parsing errors do not kill XMPP
"""


__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"


import asyncio
import functools
import json
import math
import time
import zlib
from datetime import datetime

from a911client import Active911Client
from a911client.Active911Exceptions import Active911Error
from sqlalchemy.exc import IntegrityError

from app import db, socketio
from app.models import Alert

_ACTIVE911_RETRY_SEC = 60


def _coerce_int_pk(value):
    """Parse Active911 id / message_id to int for Alert.id (INTEGER PK)."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if value.is_integer():
            return int(value)
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return int(s, 10)
    except ValueError:
        try:
            f = float(s)
        except ValueError:
            return None
        if not math.isfinite(f):
            return None
        try:
            as_int = int(f)
        except (OverflowError, ValueError):
            return None
        if f == as_int:
            return as_int
    return None


def _alert_pk(alert_data, fallback_message_id=None):
    """
    Resolve a stable numeric primary key for Alert rows.

    Prefer **message_id** over **id**. Active911 often puts a CAD/incident id in
    ``id`` that repeats across multiple XMPP notifications; **message_id** is
    unique per message. Using ``id`` first caused every live alert to UPDATE the
    same DB row.

    a911client's fetch_alert() only passes data['message'] to alert_handler;
    patched fetch_* methods merge XMPP message_id when missing.
    """
    if not isinstance(alert_data, dict):
        return None
    candidates = []
    for key in ("message_id", "id", "alert_id"):
        v = alert_data.get(key)
        if v is not None and v != "":
            candidates.append(v)
    inner = alert_data.get("message")
    if isinstance(inner, dict):
        for key in ("message_id", "id"):
            v = inner.get(key)
            if v is not None and v != "":
                candidates.append(v)
    if fallback_message_id is not None and str(fallback_message_id).strip() != "":
        candidates.append(fallback_message_id)
    for c in candidates:
        pk = _coerce_int_pk(c)
        if pk is not None:
            return pk
    return None


def _hash_json_stable_pk(alert_obj, idx):
    """Stable 31-bit int from bulk JSON when no numeric id is present."""
    blob = json.dumps(alert_obj, sort_keys=True, default=str)
    h = zlib.crc32(f"{blob}:{idx}".encode()) & 0x7FFFFFFF
    if h == 0:
        return idx + 1
    return h


def _bulk_row_pk(alert_obj, idx, seen, logger=None):
    """
    Unique integer PK for one bulk_fetch_alerts row.

    The bulk payload often repeats the same message_id or CAD id across lines;
    without disambiguation every INSERT targets one primary key (updates only).
    """
    pk = _alert_pk(alert_obj)
    if pk is None:
        pk = _hash_json_stable_pk(alert_obj, idx)

    if pk not in seen and pk != 0:
        seen.add(pk)
        return pk

    if logger is not None:
        logger.info(
            "bulk_fetch_alerts: duplicate or zero pk at index %s (pk=%s); "
            "assigning alternate key",
            idx,
            pk,
        )
    blob = json.dumps(alert_obj, sort_keys=True, default=str)
    base = zlib.crc32(f"{blob}:{idx}".encode()) & 0x7FFFFFFF
    candidate = base if base != 0 else (idx + 1)
    n = 0
    while candidate in seen:
        n += 1
        candidate = (base + n * 104729) & 0x7FFFFFFF
        if candidate == 0:
            candidate = idx + n
    seen.add(candidate)
    return candidate


def _normalize_bulk_message_items(raw, logger):
    """
    bulk_fetch_alerts sometimes returns message as a JSON string, a single dict,
    or an envelope dict instead of a list of alert strings.
    """
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return []
        try:
            parsed = json.loads(s)
        except (json.JSONDecodeError, TypeError):
            logger.warning("bulk_fetch_alerts: message string is not valid JSON")
            return []
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            return [parsed]
        return []
    if isinstance(raw, dict):
        for key in ("alerts", "messages", "items", "data"):
            inner = raw.get(key)
            if isinstance(inner, list):
                return inner
        return [raw]
    logger.warning(
        "bulk_fetch_alerts: unexpected message type: %s", type(raw).__name__
    )
    return []


def _emit_alarms_snapshot(app, limit=50):
    """Broadcast ids so browsers fetch details (fixes connect-before-bulk race)."""
    with app.app_context():
        rows = (
            Alert.query.with_entities(Alert.id)
            .order_by(Alert.timestamp.desc())
            .limit(limit)
            .all()
        )
        ids = [r[0] for r in rows]
        app.logger.info(
            "Active911 bulk complete: emitting alarms snapshot (%s ids)", len(ids)
        )
        # Omit room/to to broadcast to all clients (python-socketio has no broadcast= kw).
        socketio.emit(
            "a911_alarm",
            {"type": "alarms", "ids": ids},
            namespace="/afd",
        )


def _incident_utc(alert_data):
    """Parse payload timestamp to UTC datetime for DB ordering (newest incidents first)."""
    raw = alert_data.get("timestamp")
    if raw is None:
        return None
    try:
        sec = float(raw)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(sec):
        return None
    if sec > 1e12:
        sec = sec / 1000.0
    try:
        return datetime.utcfromtimestamp(sec)
    except (OSError, OverflowError, ValueError):
        # NaN/inf already filtered; still catch out-of-range for platform time_t,
        # and any remaining invalid values so one bad payload cannot kill XMPP.
        return None


def _persist_alert_sync(app, alert_data, emit_socket):
    """
    Synchronous Alert insert/update + optional Socket.IO emit.

    Intended for ``asyncio.loop.run_in_executor`` so SQLite/DB commits do not
    block the asyncio event loop during bulk_fetch (hundreds of rows).
    """
    if not isinstance(alert_data, dict):
        app.logger.warning(
            "Unexpected alert payload type: %s", type(alert_data)
        )
        return
    alert_id = _alert_pk(alert_data)
    if alert_id is None:
        app.logger.warning(
            "Alert payload missing resolvable id; keys=%s",
            list(alert_data.keys())[:30],
        )
        return

    incident = _incident_utc(alert_data)
    row = Alert(
        id=alert_id,
        content=json.dumps(alert_data),
        timestamp=incident if incident is not None else datetime.utcnow(),
    )
    with app.app_context():
        try:
            db.session.add(row)
            db.session.commit()
            app.logger.info("Alert received and added from Active 911.")
        except IntegrityError:
            db.session.rollback()
            existing = db.session.get(Alert, alert_id)
            if existing is None:
                app.logger.warning(
                    "IntegrityError for alert %s but row not found after rollback",
                    alert_id,
                )
                return
            existing.content = json.dumps(alert_data)
            existing.timestamp = (
                incident if incident is not None else datetime.utcnow()
            )
            try:
                db.session.commit()
                app.logger.info(
                    "Alert %s updated (duplicate id / refresh).", alert_id
                )
            except Exception as e:
                app.logger.warning("DB failure when updating alert: %s", e)
                db.session.rollback()
                return
        except Exception as e:
            app.logger.warning("DB failure when adding alert: %s", e)
            db.session.rollback()
            return

        if emit_socket:
            try:
                socketio.emit(
                    "a911_alarm",
                    {"type": "alarm", "id": alert_id},
                    namespace="/afd",
                )
            except Exception:
                app.logger.exception(
                    "Socket.IO emit failed for alert %s", alert_id
                )


def start_active911_client(app):
    """Run the Active911 client in this thread using an asyncio event loop."""

    with app.app_context():
        try:
            db.session.query(Alert).delete()
            db.session.commit()
        except Exception as e:
            app.logger.warning(
                "DB CONNECTION FAILURE - Unable to initialize database: %s", e
            )
            db.session.rollback()

    device_code = app.config["ACTIVE_911_DEVICE_ID"]

    async def main():
        async with Active911Client(device_code, logger=app.logger) as client:

            async def _persist_alert(alert_data, emit_socket):
                """
                emit_socket=False for bulk_fetch rows (snapshot at end).
                emit_socket=True for live XMPP fetch_alert (must not be tied to bulk,
                or concurrent bulk could suppress emits and the UI never updates).

                DB work runs in the default ThreadPoolExecutor so synchronous
                SQLAlchemy commits do not block the asyncio loop (XMPP I/O).
                """
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(
                    None,
                    functools.partial(
                        _persist_alert_sync, app, alert_data, emit_socket
                    ),
                )

            async def on_alert(alert_data):
                await _persist_alert(alert_data, emit_socket=True)

            async def fetch_alert_merge_message_id(message_id: str) -> None:
                # a911client only passes data["message"] to alert_handler; the API often
                # omits "id" there while XMPP already gave us the canonical message_id.
                try:
                    app.logger.debug("Fetching alert for message ID: %s", message_id)
                    request_data = {
                        "operation": "fetch_alert",
                        "message_id": message_id,
                    }
                    data = await client.post_request(request_data)
                except Active911Error:
                    raise
                try:
                    app.logger.debug(
                        "Successfully fetched alert for message ID: %s", message_id
                    )
                    msg = data.get("message")
                    if not isinstance(msg, dict):
                        app.logger.warning(
                            "fetch_alert: message is not a dict (%s); response keys=%s",
                            type(msg).__name__,
                            list(data.keys()) if isinstance(data, dict) else None,
                        )
                        return
                    msg = dict(msg)
                    mid = str(message_id).strip()
                    # XMPP message_id is unique per notification; API "id" is often
                    # incident/CAD id shared by many messages; always key rows by mid.
                    msg["message_id"] = mid
                    api_id = msg.get("id")
                    pk_mid = _coerce_int_pk(mid)
                    if api_id is not None and str(api_id).strip() != mid:
                        if _coerce_int_pk(api_id) != pk_mid:
                            msg["incident_id"] = api_id
                    if pk_mid is not None:
                        msg["id"] = pk_mid
                    elif msg.get("id") is None:
                        msg["id"] = mid
                    handler = getattr(client, "alert_handler", None)
                    if handler:
                        await handler(msg)
                except Active911Error:
                    raise
                except Exception:
                    app.logger.exception(
                        "fetch_alert: failed to process payload for message_id=%r",
                        message_id,
                    )

            async def fetch_all_alerts_merge() -> None:
                try:
                    app.logger.debug("Fetching all alerts (bulk)")
                    request_data = {"operation": "bulk_fetch_alerts"}
                    data = await client.post_request(request_data)
                except Active911Error:
                    raise
                try:
                    app.logger.debug("Successfully fetched all alerts")
                    items = _normalize_bulk_message_items(
                        data.get("message"), app.logger
                    )
                    if not items:
                        app.logger.warning(
                            "bulk_fetch_alerts: no items after normalizing message "
                            "(raw type was %s)",
                            type(data.get("message")).__name__,
                        )
                    app.logger.info("bulk_fetch_alerts: %s items", len(items))
                    seen_pks = set()
                    for idx, alert in enumerate(items):
                        try:
                            app.logger.info("Bulk alert: %s", alert)
                            if isinstance(alert, str):
                                try:
                                    alert_obj = json.loads(alert)
                                except json.JSONDecodeError:
                                    app.logger.warning(
                                        "bulk_fetch_alerts: invalid JSON at index %s",
                                        idx,
                                    )
                                    continue
                            else:
                                alert_obj = alert
                            if not isinstance(alert_obj, dict):
                                app.logger.warning(
                                    "Bulk alert %s not a dict: %s",
                                    idx,
                                    type(alert_obj).__name__,
                                )
                                continue
                            alert_obj = dict(alert_obj)
                            orig_id = alert_obj.get("id")
                            orig_mid = alert_obj.get("message_id")
                            pk = _bulk_row_pk(alert_obj, idx, seen_pks, app.logger)
                            if orig_id is not None and _coerce_int_pk(orig_id) != pk:
                                alert_obj["incident_id"] = orig_id
                            alert_obj["id"] = pk
                            if orig_mid is not None and str(orig_mid).strip() != "":
                                alert_obj["message_id"] = orig_mid
                            else:
                                alert_obj["message_id"] = str(pk)
                            await _persist_alert(alert_obj, emit_socket=False)
                        except Active911Error:
                            raise
                        except Exception:
                            app.logger.exception(
                                "bulk_fetch_alerts: failed at index %s", idx
                            )
                except Active911Error:
                    raise
                except Exception:
                    app.logger.exception(
                        "bulk_fetch_alerts: failed after successful post_request"
                    )
                finally:
                    try:
                        _emit_alarms_snapshot(app)
                    except Exception:
                        app.logger.exception(
                            "Failed to emit alarms snapshot after bulk_fetch"
                        )

            # Library calls this after fetch_alert(); message_handler is internal XMPP->fetch_alert
            client.alert_handler = on_alert
            client.fetch_alert = fetch_alert_merge_message_id
            client.fetch_all_alerts = fetch_all_alerts_merge
            await client.register_device()
            await client.authenticate()
            await client.active911_xmpp()

    while True:
        try:
            asyncio.run(main())
        except Active911Error as e:
            with app.app_context():
                app.logger.error(
                    "Active911 client error (%s): %s. Retrying in %s s. "
                    "Unauthorized usually means ACTIVE_911_DEVICE_ID is wrong, "
                    "revoked, or the device is not registered for this agency.",
                    type(e).__name__,
                    e,
                    _ACTIVE911_RETRY_SEC,
                )
        except Exception:
            with app.app_context():
                app.logger.exception(
                    "Unexpected Active911 thread error; retrying in %s s.",
                    _ACTIVE911_RETRY_SEC,
                )
        else:
            with app.app_context():
                app.logger.warning(
                    "Active911 session ended (main loop exited, e.g. XMPP closed); "
                    "reconnecting in %s s.",
                    _ACTIVE911_RETRY_SEC,
                )
        time.sleep(_ACTIVE911_RETRY_SEC)
