#!/usr/bin/env bash
# Honor STOP flag — exit non-zero if agent should halt
if [ -f "state/STOP" ]; then
  echo "STOP flag is set. Halting."
  exit 1
fi
exit 0
