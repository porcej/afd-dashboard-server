# afd-dashboard-server

A Chalk.js based dashboard server, writing in python, for the Alexandria, VA Fire Department.

## Getting started.

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

This module is designed to work with `Python >=3.5`.  `Python 2` may work, your milage may very.  The `requirements.txt` file contains the required libraries.  The use of Python Virtual Envirnments is highly recommended.  This author assums the user posses a working knowldge of Python and the tools available in the user's choosen envirnment.

The `requirments.txt` file contains a listing of the required Python Modules.  These can be installed using `pip` with the `-r` option.

```
python >=  3.5
$ pip install -r requirements.txt
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

