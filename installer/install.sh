#!/usr/bin/env bash
set -euo pipefail

# SIGNET-RX v1-alpha installer
# Target: Raspberry Pi OS (Bookworm) recommended

if [[ ${EUID:-1000} -ne 0 ]]; then
  echo "Please run as root: sudo $0" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_DIR="/etc/signet-rx"
ENV_FILE="${ENV_DIR}/signet-rx.env"
APP_DIR="/opt/signet-rx/app"
VENV_DIR="/opt/signet-rx/venv"

echo "== SIGNET-RX v1-alpha installer =="

echo "[1/6] Installing OS packages"
apt update
apt install -y --no-install-recommends \
  python3 python3-venv python3-pip \
  git \
  sox rtl-sdr multimon-ng \
  chromium-browser \
  xserver-xorg x11-xserver-utils openbox \
  bluetooth bluez blueman \
  pipewire pipewire-audio wireplumber \
  || true


echo "[2/6] Installing application to ${APP_DIR}"
mkdir -p /opt/signet-rx
rm -rf "${APP_DIR}"
cp -a "${REPO_DIR}" "${APP_DIR}"

echo "[3/6] Creating Python venv at ${VENV_DIR}"
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${APP_DIR}/requirements.txt"

echo "[4/6] Writing config (if missing): ${ENV_FILE}"
mkdir -p "${ENV_DIR}"
if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${APP_DIR}/config/signet-rx.example.env" "${ENV_FILE}"
  echo "  Wrote ${ENV_FILE}"
else
  echo "  Keeping existing ${ENV_FILE}"
fi

echo "[5/6] Installing systemd services"
cp "${APP_DIR}/services/signet-rx.service" /etc/systemd/system/signet-rx.service
cp "${APP_DIR}/services/signet-rx-kiosk.service" /etc/systemd/system/signet-rx-kiosk.service
systemctl daemon-reload
systemctl enable --now signet-rx.service
systemctl enable --now signet-rx-kiosk.service || true

echo "[6/6] Done"
echo "  UI: http://raspberrypi.local:8088"
echo "  Config: ${ENV_FILE}"

echo "[6/6] Done"
echo "Web UI: http://raspberrypi.local:${HTTP_PORT:-8088}"
echo "Config: ${ENV_FILE}"
echo "Logs:   journalctl -u signet-rx -f"
