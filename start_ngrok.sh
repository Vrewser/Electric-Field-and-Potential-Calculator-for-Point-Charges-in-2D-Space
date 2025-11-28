#!/usr/bin/env bash
set -euo pipefail

# start_ngrok.sh
# Simple helper to install ngrok CLI (if missing), register authtoken, start a tunnel
# to a local port and print the public https URL. Run this locally (not required in the repo).

PORT=${1:-5000}
NGROK_BIN="$HOME/.local/bin/ngrok"

if [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo "ERROR: Please set NGROK_AUTHTOKEN environment variable before running."
  echo "Get a token at https://dashboard.ngrok.com/get-started/your-authtoken"
  exit 1
fi

# Download ngrok if missing
if [ ! -x "$NGROK_BIN" ]; then
  echo "Installing ngrok to $NGROK_BIN..."
  tmpzip="/tmp/ngrok.zip"
  curl -sS -o "$tmpzip" https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
  unzip -o "$tmpzip" -d /tmp
  mkdir -p "$(dirname "$NGROK_BIN")"
  mv /tmp/ngrok "$NGROK_BIN"
  chmod +x "$NGROK_BIN"
  echo "ngrok installed"
fi

# Register authtoken (idempotent)
"$NGROK_BIN" authtoken "$NGROK_AUTHTOKEN" || echo "ngrok authtoken command returned non-zero (it may already be set)"

# Start ngrok in background if not already running on the chosen port
# Use a log file so we can inspect if something fails
LOGFILE="/tmp/ngrok_${PORT}.log"
if pgrep -af "ngrok" | grep -q "http $PORT" 2>/dev/null; then
  echo "ngrok already has a process for port $PORT"
else
  echo "Starting ngrok tunnel to port $PORT (logs: $LOGFILE)"
  "$NGROK_BIN" http "$PORT" > "$LOGFILE" 2>&1 &
  sleep 1
fi

# Wait for ngrok's API to become available and fetch public URL
API="http://127.0.0.1:4040/api/tunnels"
for i in {1..20}; do
  if curl -sS "$API" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

resp=$(curl -sS "$API")
public=$(echo "$resp" | grep -oE '"public_url":"https:[^"]+' | head -n1 | sed -E 's/"public_url":"//') || true
if [ -n "$public" ]; then
  echo "ngrok public URL: $public"
  echo "Share this URL to let anyone reach your local app (http://localhost:$PORT must be running)."
  exit 0
else
  echo "Failed to get ngrok public URL. See log: $LOGFILE"
  tail -n 50 "$LOGFILE" || true
  exit 2
fi
