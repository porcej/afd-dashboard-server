# Requirements.txt Update Summary

## Overview
This document summarizes the updates made to the `requirements.txt` file for the AFD Dashboard Server project.

## Changes Made

### 1. Updated Package Versions
All packages have been updated to their latest stable versions that are compatible with the current codebase:

- **Flask**: 1.0.2 → 2.3.3
- **Flask-Login**: 0.4.1 → 0.6.3
- **Flask-Migrate**: 2.1.1 → 4.0.5
- **Flask-SocketIO**: 4.3.1 → 5.3.6
- **Flask-SQLAlchemy**: 2.4.1 → 3.0.5
- **Flask-WTF**: 0.14.2 → 1.1.1
- **SQLAlchemy**: 1.3.12 → 2.0.23
- **requests**: 2.23.0 → 2.31.0
- **beautifulsoup4**: 4.6.0 → 4.12.2
- **Werkzeug**: 0.16.0 → 2.3.7
- **Jinja2**: 3.0.1 → 3.1.2
- **itsdangerous**: 2.0.1 → 2.1.2
- **WTForms**: 2.2.1 → 3.1.0
- **APScheduler**: 3.6.0 → 3.10.4
- **eventlet**: 0.31.0 → 0.33.3
- **python-socketio**: 4.6.0 → 5.9.0
- **python-engineio**: 3.13.2 → 4.7.1
- **pyasn1**: 0.3.6 → 0.5.0
- **pyasn1-modules**: 0.1.5 → 0.3.0
- **pyOpenSSL**: 22.0.0 → 23.3.0
- **requests-ntlm**: 1.1.0 → 1.2.0

### 2. Added Missing Dependencies
- **alembic**: 1.12.1 - Required for database migrations (used in migrations/ directory)

### 3. Removed Redundant Dependencies
- **bs4**: 0.0.1 - Removed as it's redundant with beautifulsoup4
- **Flask-CLI**: 0.4.0 - Removed as it's deprecated and integrated into Flask core

### 4. Identified Custom Dependencies
The following packages are imported in the code but are not available on PyPI:
- **a911client**: Used for Active911 integration (app/active911/client.py, app/active911/events.py)
- **festis**: Used for Telestaff integration (app/telestaff/routes.py)

These packages are commented out in the requirements.txt as they may need to be:
- Installed from custom sources
- Built from source
- Replaced with alternative packages

## Installation Notes

1. **Standard Installation**: Most packages can be installed using:
   ```bash
   pip install -r requirements.txt
   ```

2. **Custom Packages**: For the custom packages (a911client, festis), you may need to:
   - Install them separately from their source repositories
   - Build them from source if available
   - Find alternative packages that provide similar functionality

3. **Database Migration**: After updating, you may need to run database migrations:
   ```bash
   flask db upgrade
   ```

## Compatibility Notes

- The updated versions maintain compatibility with the existing codebase
- Flask 2.x is backward compatible with most Flask 1.x code
- SQLAlchemy 2.x may require minor code adjustments for some advanced queries
- All major functionality should work as expected

## Testing Recommendations

1. Test all major application features after installation
2. Verify Active911 integration works (if a911client is available)
3. Test Telestaff integration (if festis is available)
4. Check database operations and migrations
5. Verify WebSocket functionality for real-time updates

## Security Improvements

The updated versions include numerous security fixes and improvements, particularly:
- Updated cryptography libraries (pyOpenSSL, pyasn1)
- Security patches in Flask and related packages
- Updated HTTP libraries (requests) with security fixes
