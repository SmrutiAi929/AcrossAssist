# WebSocket Connection Errors - Troubleshooting

## Error You're Seeing:
```
WebSocket is already in CLOSING or CLOSED state.
```

## What This Means:
The app is trying to send data through a WebSocket connection that has already been closed. This usually happens when:

1. **API key is invalid** - Connection closes immediately, then app tries to send data
2. **Connection fails** - The WebSocket closes due to an error, but code continues trying to use it
3. **Race condition** - Multiple connection attempts happening at once

## How to Check if API Key is Working:

### Method 1: Check the App's Log Panel
1. Look at the **left side panel** in the app (where it says "Console")
2. Look for log messages that say:
   - ❌ `server.close disconnected with reason: API key not valid. Please pass a valid API key.`
   - ✅ `client.open Connected` (no errors after this)

### Method 2: Browser Console (F12)
1. Press **F12** to open Developer Tools
2. Go to the **Console** tab
3. Look for error messages

### Method 3: Check Your .env File
Make sure your `.env` file has:
```env
REACT_APP_GEMINI_API_KEY=your-api-key-here
```
- No spaces around the `=`
- The key starts with `AIza`
- The key is on one line

## If API Key is Still Invalid:

1. **Verify the key in .env**:
   - Open `.env` file
   - Make sure the key is correct (no typos, no extra spaces)

2. **Restart the server** (IMPORTANT!):
   ```bash
   # Stop the server (Ctrl+C)
   # Then start again:
   npm start
   ```
   - Changes to `.env` only take effect after restarting

3. **Get a fresh API key**:
   - Go to: https://aistudio.google.com/apikey
   - Create a new API key
   - Make sure to copy the ENTIRE key
   - Update `.env` file
   - Restart server

## If You Don't See "API key not valid" Error:

If you're NOT seeing the "API key not valid" message anymore, these WebSocket errors might just be cleanup errors. Try:

1. **Refresh the page** (F5 or Ctrl+R)
2. **Wait a few seconds** after the page loads
3. **Then try to use features** (click play button, etc.)

The WebSocket errors might just be from failed initial connection attempts that are being cleaned up.

