#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================
# PiOS Hub — One-Command Launch Script
# Run from the project root: bash scripts/start.sh
# ==============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "🚀  PiOS Hub — Launcher"
echo "   Project: $PROJECT_DIR"
echo ""

# Activate venv if present
VENV="$PROJECT_DIR/venv"
if [ -d "$VENV" ]; then
  source "$VENV/bin/activate"
  echo "✅  Python venv activated."
else
  echo "⚠️  No venv found at $VENV — using system Python."
fi

# Check if React build exists; rebuild if missing
CLIENT_DIST="$PROJECT_DIR/client/dist"
CLIENT_SRC="$PROJECT_DIR/client"
if [ ! -d "$CLIENT_DIST" ]; then
  echo ""
  echo "📦  React build not found. Building frontend…"
  if command -v npm &>/dev/null; then
    cd "$CLIENT_SRC"
    npm install --silent
    npm run build
    cd "$PROJECT_DIR"
    echo "✅  Frontend built."
  else
    echo "⚠️  npm not found — skipping frontend build."
    echo "   On the Pi: pkg install nodejs"
  fi
fi

echo ""
echo "🌐  Starting PiOS Hub on http://0.0.0.0:8080"
echo "   Press Ctrl+C to stop."
echo ""

# Use gunicorn in production, fall back to Flask dev server
cd "$PROJECT_DIR"
if command -v gunicorn &>/dev/null; then
  gunicorn --chdir server app:app \
    --bind 0.0.0.0:8080 \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
else
  echo "⚠️  gunicorn not found — using Flask dev server."
  python server/app.py
fi
