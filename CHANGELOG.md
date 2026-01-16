# Changelog

All notable changes to this project will be documented in this file.

---

## [v1-beta] – Unreleased

### Added
- **Wideband Receiver (WB RX)** concept replacing single-purpose FM Broadcast mode
- **Manual RX mode** allowing explicit selection of:
  - WFM (Broadcast)
  - NFM
  - AM
  - SSB (future)
- **Classic ham-style S-meter** (S1–S9 + dB) for both WB RX and WX receivers
- **Bandwidth (kHz) display** per receiver
- **Modulation stack UI** (WFM / NFM / AM / SSB) with active mode highlighted
- **FM stereo path (Option A)** planned: true stereo decode instead of pilot-only indicator
- **Adaptive bottom panel**:
  - Hi-fi spectrum analyzer visible only in WFM Broadcast mode
  - Control space reclaimed for Manual RX settings in other modes
- UI language updated to reflect **receiver-first design**

### Changed
- Renamed **FM Broadcast Receiver** → **Wideband Receiver (WB RX)**
- UI layout updated to place S-meter, bandwidth, and modulation stack
  **on the same row as the frequency**
- Configuration keys generalized from `FM_*` to `RX_*` (wideband receiver)
- Version bumped from **v1-alpha** → **v1-beta**

### Notes
- This is still **early development**; RF pipelines are stubbed.
- Manual RX controls and scanner functionality are UI-ready but not yet wired to DSP chains.
- Future versions may add analog scanning and optional RadioReference integration.

---

## [v1-alpha] – Initial Scaffold

### Added
- Project structure and install scaffolding
- Web-based kiosk UI (HyperPixel + HDMI)
- NOAA SAME alert architecture
- Listening mode state machine
- Retro hi-fi visual design baseline
- Multi-output audio abstraction (AUX / HDMI / Bluetooth)

