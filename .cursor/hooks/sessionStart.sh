#!/usr/bin/env bash
# Session start: remind agent of Runboard rules
echo "Runboard: Read AGENT.md and state/STATE.json before working."
if [ -f "state/STOP" ]; then
  echo "Warning: state/STOP is set — user requested halt."
fi
exit 0
