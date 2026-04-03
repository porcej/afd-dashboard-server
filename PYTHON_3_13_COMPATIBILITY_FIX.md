# Python 3.13 Compatibility Fix

## Issue
The application was failing to start with Python 3.13 due to a compatibility issue with the `eventlet` package. The error occurred because:

```
AttributeError: module 'collections' has no attribute 'MutableMapping'
```

This happens because `collections.MutableMapping` was moved to `collections.abc.MutableMapping` in Python 3.3, and `eventlet` hasn't been updated to handle this change properly in Python 3.13.

## Solution

### 1. Updated Configuration (`config.py`)
Changed the `ASYNC_MODE` from `None` (auto-detect) to `'threading'` for better Python 3.13 compatibility:

```python
# Before
ASYNC_MODE = os.environ.get('ASYNC_MODE') or None

# After  
ASYNC_MODE = os.environ.get('ASYNC_MODE') or 'threading'
```

### 2. Updated Requirements (`requirements.txt`)
Commented out `eventlet` dependency to avoid compatibility issues:

```python
# eventlet>=0.33.3  # Commented out due to Python 3.13 compatibility issues
```

### 3. Created Test Script (`test_config.py`)
Added a test script to verify that all imports and configuration work correctly.

## Why This Fix Works

1. **Threading Mode**: Flask-SocketIO's `threading` mode is more compatible with Python 3.13 and doesn't rely on `eventlet`
2. **No Eventlet Dependency**: By removing the `eventlet` dependency, we avoid the `collections.MutableMapping` issue
3. **Maintained Functionality**: The application maintains all its functionality while being compatible with Python 3.13

## Testing

Run the test script to verify everything works:

```bash
python test_config.py
```

If successful, you should see:
```
✓ Successfully imported create_app
✓ Successfully created app
✓ ASYNC_MODE: threading
✓ ACTIVE_911_DEVICE_ID: 551742-ZQFT
✓ Successfully imported socketio

🎉 All imports and configuration successful!
You can now run: python afddashboard.py
```

## Running the Application

After the fix, you can run the application normally:

```bash
python afddashboard.py
```

## Alternative Solutions (if needed)

If you need `eventlet` functionality, you can:

1. **Use a different async mode**: Set `ASYNC_MODE = 'gevent'` in config.py
2. **Downgrade Python**: Use Python 3.11 or 3.12
3. **Use a fork of eventlet**: Look for Python 3.13 compatible forks
4. **Wait for eventlet update**: Monitor the eventlet repository for Python 3.13 support

## Files Modified

1. `config.py` - Changed ASYNC_MODE to 'threading'
2. `requirements.txt` - Commented out eventlet dependency
3. `test_config.py` - Added test script (new file)

## Files Not Modified

- `afddashboard.py` - No changes needed
- `app/__init__.py` - No changes needed
- All other application files - No changes needed

The fix maintains full application functionality while ensuring Python 3.13 compatibility.
