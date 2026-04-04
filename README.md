# afd-dashboard-server

A Chalk.js based dashboard server, writing in python, for the Alexandria, VA Fire Department.

## Getting started.

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

This module is designed to work with `Python >=3.5`.  `Python 2` may work, your milage may very.  The `requirements.txt` file contains the required libraries.  The use of Python Virtual Envirnments is highly recommended.  This author assums the user posses a working knowldge of Python and the tools available in the user's choosen envirnment.

Install PyPI dependencies, then VCS packages (`a911client` needs `slixmpp` already present and `--no-build-isolation` during its build):

```
python >= 3.5   # use a current 3.x (3.12+ recommended)
$ pip install -r requirements.txt
$ pip install setuptools wheel flit-core
$ pip install --no-build-isolation -r requirements-vcs.txt
```

### Getting Started

For the purpose of this description we will refer to `test_app.py` to instantiate the dashboard server.  This will create a test/development envirnment with Flask's debug console enabled that is accessable only from port 5000 on the local machine `http://localhost:5000`.  A production harness is available by replacing `test_app.py` with `prd_app.py`.  The production application has Flask's debug console disabled, listens for requests from any host and runs on port 80.  If another configuration is desired please see the `app` options available in the Flask docs. 

First you will have to export your Flask envirnemnt 

For Unix:
```
$ export FLASK_APP=test_app.py
```

For Windows
```
$ set FLASK_APP=test_app.py
```


Next you will want to initialize the database:
```
$ flask db init
Creating directory migrations ... done
Creating directory migrations/versions ... done
Generating migrations/script.py.mako ... done
Generating migrations/env.py ... done
Generating migrations/README ... done
Generating migrations/alembic.ini ... done
Please edit configuration/connection/logging settings in '/migrations/alembic.ini' before proceeding.

$ flask db migrate -m "Initial db migration"
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
INFO  [alembic.autogenerate.compare] Detected added table 'alert'
INFO  [alembic.autogenerate.compare] Detected added index 'ix_alert_timestamp' on '['timestamp']'
INFO  [alembic.autogenerate.compare] Detected added table 'roster'
INFO  [alembic.autogenerate.compare] Detected added index 'ix_roster_date' on '['date']'
INFO  [alembic.autogenerate.compare] Detected added index 'ix_roster_timestamp' on '['timestamp']'
INFO  [alembic.autogenerate.compare] Detected added table 'station'
INFO  [alembic.autogenerate.compare] Detected added index 'ix_station_name' on '['name']'
INFO  [alembic.autogenerate.compare] Detected added table 'unit'
INFO  [alembic.autogenerate.compare] Detected added index 'ix_unit_name' on '['name']'
  Generating /migrations/versions/28ac83a346bf_initial_db_migration.py ... done

$ flask db upgrade
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 28ac83a346bf, Initial db migration
```

Next, you will want to launch the server:
```
$ python test_app.py
```

### Docker

Build and run with [Docker Compose](https://docs.docker.com/compose/) (see `docker-compose.yml`):

```bash
cp .env.example .env   # edit: secrets, ACTIVE_911_DEVICE_ID, etc.
docker compose build
docker compose up
```

The image runs `flask db upgrade` on startup, then **Gunicorn** (`gthread` worker, `wsgi:app`) on **port 5000 inside the container**. Compose maps **`HOST_PORT` → 5000** (default **8000** when unset; see `.env.example`). Optional compose-only knobs: **`COMPOSE_IMAGE`**, **`DOCKER_RESTART`**. Do not rely on `DASHBOARD_PORT` in `.env` for Docker: that value is for local `python afddashboard.py` only — if it matched your public port (e.g. 8000), Gunicorn would listen on the wrong port inside the container and the browser would see **ERR_CONNECTION_RESET**.

SQLite is stored on the `dashboard-data` volume at `/data/app.db` when `DATABASE_URL` defaults to `sqlite:////data/app.db`. Override `DATABASE_URL` for PostgreSQL or another backend. Locally you can still run `python afddashboard.py` (also Gunicorn).

`docker-compose.yml` sets `DASHBOARD_DEBUG` to `true` by default so `SECRET_KEY` is not required for local runs (the app generates an ephemeral key). For production, set `DASHBOARD_DEBUG=false` and provide `SECRET_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in `.env`.

Compose reads a project `.env` for `${VAR}` substitution in the YAML. **`docker compose --env-file .env` does not inject that file into containers by itself** — the compose file uses `env_file: .env` on the service so variables like `SECRET_KEY` and `ACTIVE_911_DEVICE_ID` reach the app. Use a `.env` next to `docker-compose.yml` (or adjust `env_file` / use `environment:` explicitly).

For a one-off build without Compose: `docker build -t afd-dashboard .` then `docker run --rm -p 5000:5000 -e DASHBOARD_DEBUG=true ... afd-dashboard`.

If a plain `pip install -r requirements.txt` misses the git deps, run the same sequence as above: `requirements.txt` then `setuptools wheel flit-core` then `pip install --no-build-isolation -r requirements-vcs.txt`.

**Docker build and GitHub:** The image must clone `git+https://github.com/...` dependencies during `docker build`. If you see `Could not resolve host: github.com` (or similar), the build environment has no working DNS or outbound HTTPS. Fix network/DNS on the host (Docker Desktop → Settings → network/DNS, VPN split-tunnel, corporate proxy). On Linux, `docker build --network=host -t afd-dashboard .` sometimes helps when bridge DNS is broken. Air-gapped builds need wheels or vendored copies of those packages instead of live `git clone`.


## Using the Dashboard

### Site Layout
```

http:\\localhost:5000 (prd: http:\\server_name)
|- station/                         # End point for viewing Dashboard client
|
|  +- HEADQUARTERS                  # Headquarters "Station" Dashboard
|  +- PDC                           # Dashboard for PDC
|  +- 201
|  +- 202
|  +- 203
|  +- 204
|  +- 205
|  +- 206
|  +- 207
|  +- 208
|  +- 209
|  +- 210
|- admin/                           # Admin features/interface
|  +- console                       # Admin tool for SocketIO Testing
|  +- unitmanager                   # Add, remove, assign, delete units
|  +- stationmanager                # Add, rename, delete stations
|  +- _station                      # CRUD API endpoint for stations
|  +- _unit                         # CRUD API endpoint for units

```


Units that are "homed at at a particular station will show up in the Telestaff view for that station if that unit is staffed in Telestaff.  Unit's that are set to alert at a particular station will display full screen alert messages for any Active911 Alarm's that include that unit.

For more information about the CRUD API endpoints, please review their associated routes in `app\admin\routes.py`.

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/porcej/cc71497a2b455f27bca8c879731e68dc) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/porcej/a911_bridge/tags). 

## Authors

* **Joseph Porcelli** - *Initial work* - [porcej](https://github.com/porcej)

See also the list of [contributors](https://github.com/porcej/a911_bridge/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

