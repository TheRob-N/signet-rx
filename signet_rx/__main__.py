#!/usr/bin/env python3
"""SIGNET-RX v1-alpha

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
    version: str = "1-alpha"
    mode: str = "FM_WX"  # WX_LIVE | WX_ALERT | FM_WX | SAME_ONLY
    fm_freq_mhz: float = 89.3
    wx_freq_mhz: float = 162.55
    audio_output: str = "HDMI"  # AUX | HDMI | BT
    volume: float = 0.60
    stereo: bool = True
    rds_station: str = "WQED-FM"
    rds_text: str = "Classical music for Pittsburgh"
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
    STATE.fm_freq_mhz = float(os.getenv("FM_FREQ_MHZ", STATE.fm_freq_mhz))
    STATE.wx_freq_mhz = float(os.getenv("WX_FREQ_MHZ", STATE.wx_freq_mhz))
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
