# SIGNET-RX

<p align="center">
  <img src="docs/screenshots/signet-rx-logo.png" alt="SIGNET-RX Logo" width="480">
</p>

**Signal Intelligence Receiver & Alert Console**

---

## ⚠️ Alpha Status Notice

> **SIGNET-RX is currently in very early development (v1-beta).**  
> Expect incomplete features, breaking changes, and rough edges.  
> The architecture, UI direction, and core workflows are actively evolving.

---

## Overview

**SIGNET-RX** is a Raspberry Pi–based **wideband receiver and NOAA weather alert console** with a retro 80s/90s hi-fi aesthetic.

It combines:
- A **Wideband Receiver (WB RX)** for analog radio monitoring
- **NOAA Weather Radio** with SAME alert decoding
- Automatic **alert audio override**
- Touch and HDMI-based visual interfaces
- Multi-output audio (analog, HDMI, Bluetooth)

SIGNET-RX is designed to behave like a real piece of radio equipment — not just a software demo.

<p align="center">
  <img src="docs/screenshots/ui-render-v1-alpha.png" alt="SIGNET-RX UI Render" width="800">
</p>

---

## What SIGNET-RX Does

### 📡 Wideband Receiver (WB RX)
- **WFM Broadcast** (FM stereo + RDS)
- **NFM** (scanner-style analog reception)
- **AM** (airband, utilities)
- **SSB** (planned)

### 🚨 NOAA Weather Radio
- Continuous monitoring of NOAA Weather Radio
- SAME (Specific Area Message Encoding) decoding
- Alert metadata extraction and display

### 🔁 Alert Override
- Wideband Receiver audio is automatically interrupted by NOAA alerts
- Live NOAA audio is played during active alerts
- Audio resumes automatically when alerts expire

### 🖥️ Displays
- **HyperPixel 4.0** touchscreen (primary “front panel”)
- **HDMI output**
  - Mirrored UI or extended visualization mode
  - Screensaver-style visualizations when idle

### 🔊 Audio Outputs
- 3.5mm analog audio
- HDMI audio
- Bluetooth speakers

Audio outputs are fully abstracted and selectable at runtime.

---

## Listening Modes

| Mode | Audio | NOAA | WB RX | Behavior |
|-----|------|------|------|---------|
| WX LIVE | NOAA | ✅ | ❌ | Continuous NOAA audio |
| WX ALERT | Silent → NOAA | ✅ | ❌ | Audio only during alerts |
| WB RX + WX | WB RX → NOAA | ✅ | ✅ | Receiver audio overridden by alerts |
| SAME ONLY | Silent | ✅ | ❌ | Visual alerts only |

---

## User Interface & Visual Design

- Retro **hi-fi receiver** aesthetic inspired by 80s/90s stereo equipment
- **Classic ham-style S-meter** (S1–S9 + dB)
- Bandwidth (kHz) display per receiver
- Modulation stack indicators (WFM / NFM / AM / SSB)
- FM stereo and RDS indicators
- Hi-fi spectrum analyzer shown **only in WFM Broadcast mode**
- Manual RX modes reclaim screen space for receiver controls

Touch any section to expand detailed views.

---

## Hardware (Recommended)

- Raspberry Pi 4 (4GB recommended)
- 2× RTL-SDR devices (WB RX + NOAA simultaneously)
- HyperPixel 4.0 touchscreen
- HDMI display (optional)
- VHF antenna (162 MHz) + wideband antenna
- Speakers (analog, HDMI, or Bluetooth)
- Reliable power supply (powered USB hub recommended)

---

## Project Status

- RF pipelines are **under active development**
- UI and state machine are functional but evolving
- Scanner-style features and RadioReference integration are **future goals**
- Encrypted digital public-safety systems are **out of scope**

See `CHANGELOG.md` for version history.

---

## License

This project is released under the MIT License.

---

## Disclaimer

This project is intended for **receiving and monitoring** radio signals only.
Users are responsible for complying with all local laws and regulations.
Encrypted or restricted communications cannot and will not be decoded.
