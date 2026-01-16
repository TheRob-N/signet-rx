# Bluetooth audio

SIGNET-RX uses the system audio stack (PipeWire recommended). Bluetooth is treated as just another output sink.

## Pair a speaker (GUI)

1. Put your speaker in pairing mode.
2. Run:
   ```bash
   blueman-manager
   ```
3. Pair, Trust, and Connect.

## Set as default output

List sinks:
```bash
wpctl status
```
Set the default sink (replace `<SINK_ID>`):
```bash
wpctl set-default <SINK_ID>
```

Set volume:
```bash
wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.60
```
