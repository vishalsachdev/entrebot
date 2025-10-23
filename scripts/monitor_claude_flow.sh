#!/bin/zsh
set -euo pipefail

ROOT="/Users/vishal/Desktop/entrebot"
DOC_DIR="$ROOT/docs/monitor"
LOG_FILE="$DOC_DIR/CLAUDE_FLOW_ACTIVITY.md"
STATE_DIR="$ROOT/scripts/.monitor"
MARKER_FILE="$STATE_DIR/last_run"
PID_FILE="$STATE_DIR/monitor.pid"

mkdir -p "$DOC_DIR" "$STATE_DIR"

if [ ! -f "$LOG_FILE" ]; then
  echo "# Claude-Flow Activity Log" > "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo "This log captures filesystem and repo activity snapshots every ~2 minutes." >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
fi

echo $$ > "$PID_FILE"

while true; do
  TS=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
  {
    echo "## $TS"
    echo ""
    echo "- Processes (claude-flow):"
    ps aux | grep -i 'claude-flow' | grep -v grep | sed 's/^/  /' || true
    echo ""
    echo "- Git status (short, including untracked):"
    git -C "$ROOT" status -s -uall | sed 's/^/  /'
    echo ""
    if [ -f "$MARKER_FILE" ]; then
      echo "- Files changed since last run (excluding .git):"
      (cd "$ROOT" && find . -type f -not -path "*/.git/*" -newer "$MARKER_FILE" -print | sed 's/^/  /')
      echo ""
      echo "- Diff summary (tracked changes):"
      git -C "$ROOT" diff --name-only | sed 's/^/  /'
      echo ""
    else
      echo "- First run; establishing baseline."
      echo ""
    fi
    echo "- Top-level directory sizes:"
    (cd "$ROOT" && du -sh ./* 2>/dev/null | sed 's/^/  /') || true
    echo ""
  } >> "$LOG_FILE"

  touch "$MARKER_FILE"
  sync || true
  sleep 120
done


