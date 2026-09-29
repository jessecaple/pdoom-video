"""Display token -> pronunciation sub-words (plain letters) used for CTC alignment.

Hyphenated tokens are split into sub-words, so their parts get their own
timings ('syl' in lyrics.json).
"""
import re

PRON = {
    "a-i": "ay eye",
    "k": "kay",
    "p-doom": "pee doom",
    "dns": "dee en ess",
    "openai's": "open ay eyes",
    "'28": "twenty eight",
    "backdoor": "back door",
    "grok": "grock",
}


def key(token):
    return re.sub(r"[^a-z0-9'\-]", "", token.lower().replace("’", "'")).strip("-")


def pron(token: str) -> list[str]:
    k = key(token)
    if k in PRON:
        return PRON[k].split()
    if k.strip("'") in PRON:
        return PRON[k.strip("'")].split()
    w = k.replace("-", " ")
    w = re.sub(r"[^a-z' ]", " ", w)
    return [p.strip("'") for p in w.split() if p.strip("'")]


def display_tokens(text):
    """Split display text into tokens; strip the ad-lib parentheses and '?' marker."""
    t = text.lstrip("?")
    return [x for x in t.split(" ") if x]


if __name__ == "__main__":
    from lyrics_sung import SUNG
    for lid, *_rest in SUNG:
        text = _rest[2]
        print(lid, "->", " | ".join(" ".join(pron(w)) for w in display_tokens(re.sub(r"\{([^}|]*)[^}]*\}", r"\1", text))))
