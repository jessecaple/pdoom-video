#!/usr/bin/env python3
"""Approximate photosensitivity check (Harding-style) for a rendered clip.

A "transition" is a change of >= 10% in mean relative luminance between consecutive frames over a
>= 25% screen-area region (the frame is split into a 4x4 grid; each cell is tested). A flash is a
pair of opposing transitions. The guideline is at most 3 flashes in any 1-second window.

    python3 video/tools/flashcheck.py release/zoom-zoom-pdoom_4K60.mp4 0
"""
import subprocess, sys, os, json

FFMPEG = os.path.expanduser('~/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg')
if not os.path.exists(FFMPEG):
    FFMPEG = 'ffmpeg'
W, H = 64, 36


def frames(path):
    cmd = [FFMPEG, '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=area,format=rgb24', '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (W * H * 3)
    lin = [((c / 255) / 12.92 if c <= 10 else (((c / 255) + 0.055) / 1.055) ** 2.4) for c in range(256)]
    out = []
    for i in range(n):
        b = raw[i * W * H * 3:(i + 1) * W * H * 3]
        # Relative luminance per pixel.
        Y = [0.2126 * lin[b[j]] + 0.7152 * lin[b[j + 1]] + 0.0722 * lin[b[j + 2]] for j in range(0, len(b), 3)]
        out.append(Y)
    return out


def region_means(Y, gx=4, gy=4):
    cw, ch = W // gx, H // gy
    m = []
    for cy in range(gy):
        for cx in range(gx):
            s = 0
            for y in range(cy * ch, (cy + 1) * ch):
                row = y * W
                s += sum(Y[row + cx * cw: row + (cx + 1) * cw])
            m.append(s / (cw * ch))
    return m


def probe_fps(path):
    fp = os.path.join(os.path.dirname(FFMPEG), 'ffprobe') if os.path.dirname(FFMPEG) else 'ffprobe'
    r = subprocess.run([fp, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    a, b = (r.splitlines()[0].strip(',') if r else '30/1').split('/')
    return float(a) / float(b)


def main(path, start=0.0):
    fps = probe_fps(path)
    F = frames(path)
    R = [region_means(Y) for Y in F]
    # Per frame: signed transition if >= 4 of 16 cells (25% area) change >= 0.1 in the same
    # direction and the darker state is below 0.8.
    trans = []
    for i in range(1, len(R)):
        up = sum(1 for a, b in zip(R[i - 1], R[i]) if b - a >= 0.1 and min(a, b) < 0.8)
        dn = sum(1 for a, b in zip(R[i - 1], R[i]) if a - b >= 0.1 and min(a, b) < 0.8)
        s = 1 if up >= 4 else -1 if dn >= 4 else 0
        trans.append((i, s))
    ev = [(i, s) for i, s in trans if s]
    flashes = []
    last = None
    for i, s in ev:
        if last is not None and s != last[1]:
            flashes.append(i)
            last = None
        else:
            last = (i, s)
    worst, worst_t = 0, 0
    for k, f in enumerate(flashes):
        n = sum(1 for g in flashes if f <= g < f + fps)
        if n > worst:
            worst, worst_t = n, start + f / fps
    print(json.dumps({'file': os.path.basename(path), 'frames': len(F), 'transitions': len(ev), 'flashes': len(flashes),
                      'max_flashes_per_s': worst, 'at_s': round(worst_t, 2), 'pass': worst <= 3}))


if __name__ == '__main__':
    # Usage: flashcheck.py clip.mp4 [song-start-seconds]   (window = 1 s at the clip's real fps; at_s in song time)
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 0.0)
