#!/bin/bash

# Start Gemini HMS application in tmux session
# This script creates or attaches to a tmux session running the app on port 3009

SESSION_NAME="gemini-hms"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if tmux session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Tmux session '$SESSION_NAME' already exists."
    echo "Attaching to existing session..."
    echo "To detach: Press Ctrl+B, then D"
    tmux attach-session -t "$SESSION_NAME"
else
    echo "Creating new tmux session '$SESSION_NAME'..."
    echo "Starting Gemini HMS application on port 3009..."
    echo ""
    echo "To detach from tmux: Press Ctrl+B, then D"
    echo "To reattach later: tmux attach-session -t $SESSION_NAME"
    echo "To kill session: tmux kill-session -t $SESSION_NAME"
    echo ""
    
    # Create new tmux session and start the app
    cd "$APP_DIR"
    tmux new-session -d -s "$SESSION_NAME" -c "$APP_DIR" 'npm start'
    
    # Wait a moment for the session to start
    sleep 2
    
    # Attach to the session
    tmux attach-session -t "$SESSION_NAME"
fi
