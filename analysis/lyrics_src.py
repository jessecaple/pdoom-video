"""Parse the written lyrics (../lyrics.md) into sections and line ids.

Line ids: <section-id>.<n>, e.g. v1.1, pc1.2, c3.4, br.5 (1-based per section).
Section ids: v1 pc1 c1 post1 v2 pc2 c2 post2 v3 v3st pc3 c3 br brk c4
"""
import re

import common

SECTION_IDS = {
    "Verse 1": "v1", "Verse 2": "v2", "Verse 3": "v3",
    "Pre-Chorus": "pc", "Chorus": "c", "Post-Chorus": "post",
    "Bridge": "br", "Final Chorus": "c4",
}


def parse(path=common.PROJECT / "lyrics.md"):
    """-> list of dict(id, section, text) in written order."""
    lines, sec, counts, n = [], None, {}, 0
    seen = {"pc": 0, "c": 0, "post": 0}
    for raw in path.read_text(encoding="utf-8").splitlines():
        s = raw.strip()
        if not s or s.startswith("#") or (s.startswith("(") and s.endswith(")")):
            continue
        m = re.match(r"^\[(.+?)\]$", s)
        if m:
            tag = m.group(1)
            base = tag.split(":")[0].strip()
            if base.startswith("stop-time"):
                sec = "v3st"
            elif base.startswith("music drops out"):
                sec = "brk"
            elif base in ("Pre-Chorus", "Chorus", "Post-Chorus"):
                k = SECTION_IDS[base]
                seen[k] += 1
                sec = f"{k}{seen[k]}"
            else:
                sec = SECTION_IDS.get(base, base.lower())
            n = 0
            continue
        n += 1
        lines.append(dict(id=f"{sec}.{n}", section=sec, text=s))
    return lines


if __name__ == "__main__":
    for l in parse():
        print(f"{l['id']:8s} {l['text']}")
