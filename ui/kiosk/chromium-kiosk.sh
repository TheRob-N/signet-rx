#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:8088}"

# Start a minimal X session with Openbox and Chromium in kiosk mode.
# This is intentionally simple; you can customize for HyperPixel/HDMI layouts later.

export DISPLAY=:0

if ! pgrep -x Xorg >/dev/null 2>&1; then
  /usr/bin/startx /usr/bin/openbox-session -- :0 -nocursor &
  sleep 2
fi

# Disable screen blanking; screensaver/visualization is handled by the web UI.
xset s off || true
xset -dpms || true
xset s noblank || true

# Launch Chromium
/usr/bin/chromium-browser \
  --kiosk \
  --incognito \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  "$URL"
