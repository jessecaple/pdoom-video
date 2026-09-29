#!/usr/bin/env bash
# Renders the motion vocabulary reel: one labelled clip per transition/effect on the real song, then concatenates.
set -euo pipefail
cd "$(dirname "$0")/../../.."
OUT=video/out/reel
FF=~/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg
rm -rf "$OUT"; mkdir -p "$OUT"
DEMOS=(
  "9.6:11.8|push|T1 · HARD CUT ON THE LINE + SLOW PUSH"
  "10.38:13.5|punch|E1 · PUNCH-IN ON THE DOWNBEAT"
  "16.66:19.5|reveal|E5 · WORD-SYNC REVEAL"
  "32.2:34.4|zoom,zoomchops,slam,freeze|T4 · CRASH ZOOM THROUGH → CHORUS"
  "36.4:38.3|shake,tear,clip,punch|E2–E4 · KICK SHAKE · SNARE TEAR · 808 CLIP"
  "37.9:39.4|tear|T2 · TEAR-WIPE"
  "44.3:47.3|freeze,drostepush|T6 · BAND STOP: FREEZE + RECURSION"
  "47.3:49.1|crunch,shake,clip,slam|E7 · 1-BIT CRUNCH ON THE DROP"
  "107.7:109.7|stutter|T5 · STUTTER REPLAY (“hit the gas!”)"
  "117.4:118.9|tape|E10 · TAPE DRAG ON THE PITCH-DIVE"
  "140.2:143.9|stutter,freeze,slam|E6 · RATCHET STUTTER → STOP → SLAM"
  "158.0:160.6|pan,shake,clip,slam|E8 · CONTINUOUS PAN, CARD PER KICK"
  "169.6:171.8|dissolve,push|T7 · 1-BIT DISSOLVE INTO THE HUSH"
  "189.0:191.6|flip,shake|E9 · FLIPBOOK ON THE KICK"
  "208.6:211.3|ALL|FINAL DROP · EVERYTHING ON"
  "226.8:229.6|ALL|HARD CUT TO BLACK"
)
i=0
for d in "${DEMOS[@]}"; do
  IFS='|' read -r span only label <<<"$d"
  q="motion=1&label=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$label")"
  [ "$only" != "ALL" ] && q="$q&only=$only"
  node tools/render/render.mjs --page "video/index.html?$q" --clip "$span" --fps 30 --out "$OUT/$i" 2>&1 | grep -E "wrote|Error" || true
  echo "file '$(ls "$PWD/$OUT/$i"/clip-*.mp4)'" >> "$OUT/list.txt"
  i=$((i+1))
done
"$FF" -loglevel error -y -f concat -safe 0 -i "$OUT/list.txt" -c:v h264_nvenc -preset p7 -cq 18 -c:a aac -b:a 256k "$OUT/reel.mp4"
echo "REEL: $OUT/reel.mp4"
