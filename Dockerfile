# AFD Dashboard — Flask + Flask-SocketIO + Active911 client thread
# Build: docker build -t afd-dashboard .
# Run:  see docker-compose.yml or pass env vars (-e SECRET_KEY=... etc.)

FROM python:3.12-slim-bookworm

# Quieter pip during image build (install runs as root in this stage)
ENV PIP_ROOT_USER_ACTION=ignore

# git: required for pip install from git URLs in requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Layer cache: dependencies before application code
# VCS deps: install PyPI lines first, then git URLs with --no-build-isolation so
# a911client can import slixmpp during metadata. Non-isolated builds still invoke
# PEP 517 backends (setuptools.build_meta, flit_core.buildapi); slim images do not
# always ship those, so install them explicitly before the git installs.
COPY requirements.txt requirements-vcs.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir setuptools wheel flit-core \
    && pip install --no-cache-dir --no-build-isolation -r requirements-vcs.txt

COPY . .

RUN mkdir -p /data \
    && chmod +x docker-entrypoint.sh \
    && useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app /data

USER appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_APP=app:create_app

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
# Gunicorn gthread: matches Flask-SocketIO async_mode=threading; -w 1 required for Socket.IO
CMD ["sh", "-c", "exec gunicorn -k gthread -w 1 --threads ${GUNICORN_THREADS:-20} --bind 0.0.0.0:${DASHBOARD_PORT:-5000} --access-logfile - --error-logfile - wsgi:app"]
