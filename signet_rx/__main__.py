#!/usr/bin/env python3
"""SIGNET-RX v1-beta

Runnable scaffold:
- Serves the retro UI (ui/static)
- Provides a demo Server-Sent Events stream at /events
- Provides a tiny REST API at /api/state

The SDR decode pipelines are intentionally stubbed for now.
"""

import asyncio
import json
import os
import time
from dataclasses import dataclass, asdict

from aiohttp import web
from dotenv import load_dotenv

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STATIC_DIR = os.path.join(ROOT, "ui", "static")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


@dataclass
class State:
    version: str = "1-beta"

    # Listening mode (top-level behavior)
    # WX_LIVE | WX_ALERT | WB_WX | SAME_ONLY
    mode: str = "WB_WX"

    # Wideband receiver ("WB RX")
    rx_freq_mhz: float = 89.3
    rx_profile: str = "WFM_BROADCAST"  # WFM_BROADCAST | MANUAL_RX
    rx_mod: str = "WFM"  # WFM | NFM | AM | SSB
    rx_bw_khz: int = 200
    rx_step_khz: float = 100.0
    rx_sql: int = 5
    rx_s: int = 9
    rx_over_db: int = 10  # 0..30 (over S9)
    stereo: bool = True

    # RDS (only meaningful in WFM_BROADCAST)
    rds_station: str = "WQED-FM"
    rds_text: str = "Classical music for Pittsburgh"

    # Weather receiver ("WX")
    wx_freq_mhz: float = 162.55
    wx_mod: str = "NFM"
    wx_bw_khz: int = 25
    wx_s: int = 7
    wx_over_db: int = 0
    audio_output: str = "HDMI"  # AUX | HDMI | BT
    volume: float = 0.60
    wx_status: str = "MONITORING"
    last_alert: str = "None"
    last_alert_time: str = ""


STATE = State()


async def api_state(request: web.Request) -> web.Response:
    return web.json_response(asdict(STATE))


async def index(request: web.Request) -> web.Response:
    return web.FileResponse(os.path.join(STATIC_DIR, "index.html"))


async def sse_events(request: web.Request) -> web.StreamResponse:
    resp = web.StreamResponse(
        status=200,
        reason="OK",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
    await resp.prepare(request)

    # Periodic demo updates
    try:
        while True:
            # Simulate RDS text changing occasionally
            if int(time.time()) % 12 == 0:
                STATE.rds_text = "Now playing: Retro hi-fi vibes"
            elif int(time.time()) % 12 == 6:
                STATE.rds_text = "SIGNET-RX demo mode (no SDR)"

            # Simulate profile changes for demo purposes
            if int(time.time()) % 30 == 0:
                # flip between WFM_BROADCAST and MANUAL_RX
                STATE.rx_profile = "MANUAL_RX" if STATE.rx_profile == "WFM_BROADCAST" else "WFM_BROADCAST"
                if STATE.rx_profile == "MANUAL_RX":
                    STATE.rx_mod = "NFM"
                    STATE.rx_bw_khz = 25
                    STATE.rx_step_khz = 12.5
                    STATE.stereo = False
                else:
                    STATE.rx_mod = "WFM"
                    STATE.rx_bw_khz = 200
                    STATE.rx_step_khz = 100.0
                    STATE.stereo = True

            payload = {"ts": now_iso(), "state": asdict(STATE)}
            await resp.write(f"event: state\ndata: {json.dumps(payload)}\n\n".encode())
            await asyncio.sleep(1.0)
    except asyncio.CancelledError:
        pass
    except ConnectionResetError:
        pass
    return resp


def load_config() -> None:
    load_dotenv(os.environ.get("SIGNET_RX_ENV", "/etc/signet-rx/signet-rx.env"), override=True)
    STATE.mode = os.getenv("MODE", STATE.mode)
    STATE.rx_freq_mhz = float(os.getenv("RX_FREQ_MHZ", STATE.rx_freq_mhz))
    STATE.rx_profile = os.getenv("RX_PROFILE", STATE.rx_profile)
    STATE.rx_mod = os.getenv("RX_MOD", STATE.rx_mod)
    STATE.rx_bw_khz = int(float(os.getenv("RX_BW_KHZ", str(STATE.rx_bw_khz))))
    STATE.rx_step_khz = float(os.getenv("RX_STEP_KHZ", str(STATE.rx_step_khz)))
    STATE.rx_sql = int(float(os.getenv("RX_SQL", str(STATE.rx_sql))))
    STATE.wx_freq_mhz = float(os.getenv("WX_FREQ_MHZ", STATE.wx_freq_mhz))
    STATE.wx_bw_khz = int(float(os.getenv("WX_BW_KHZ", str(STATE.wx_bw_khz))))
    STATE.audio_output = os.getenv("AUDIO_OUTPUT", STATE.audio_output)
    STATE.volume = float(os.getenv("VOLUME", STATE.volume))


def build_app() -> web.Application:
    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_get("/api/state", api_state)
    app.router.add_get("/events", sse_events)
    app.router.add_static("/static/", STATIC_DIR)
    return app


def main() -> None:
    load_config()
    port = int(os.getenv("HTTP_PORT", "8088"))
    host = os.getenv("BIND", "0.0.0.0")
    app = build_app()
    web.run_app(app, host=host, port=port)


if __name__ == "__main__":
    main()
