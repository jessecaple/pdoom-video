"""What is ACTUALLY sung in song.wav, in order (drives the CTC alignment).

Built from: Whisper large-v3 on the vocal / lead / backing stems (full song and
short slices), greedy CTC decoding of the vocal stem, the stem-activity map and
spectrogram QA plots (work/qa/look_*.png). Compared with lyrics.md.

Each entry: (id, section, kind, text, written_id)
  kind    : lead | adlib (shouted echo / answer) | chop (vocal-chop syllables)
  written : id of the lyrics.md line it realises (lyrics_src.py), or None
  text    : display text. Alternatives in {a|b|...} are scored by the aligner
            (align.py pick_variants) and the best-scoring one is kept.

Optional ad-libs (text starting with '?') are kept only if the aligner finds
them (mean CTC posterior above a threshold); otherwise they are reported as
"not detected" deviations.
"""

SUNG = [
    # ---- intro: synth stabs, vocal chops -----------------------------------
    ("intro.1", "intro", "chop", "Zoom, zoom, zoom", None),
    # ---- verse 1 --------------------------------------------------------------
    ("v1.1", "v1", "lead", "Grok undressed seven thousand an hour; Musk laughed and paywalled it", "v1.1"),
    ("v1.2", "v1", "lead", "One hacker, two bots, nine agencies, only a water plant stalled it", "v1.2"),
    ("v1.2a", "v1", "adlib", "?(stalled it!)", None),
    ("v1.3", "v1", "lead", "A million and a half bots got a network all their own and went feral", "v1.3"),
    ("v1.4", "v1", "lead", "Anthropic's safety {lead quit|quit} to write poems, said the world's in peril", "v1.4"),
    ("v1.5", "v1", "lead", "Florida says if it were human, it'd be murder, caught red-handed", "v1.5"),
    ("v1.5a", "v1", "adlib", "?(red-handed!)", None),
    ("v1.6", "v1", "lead", "They blacklisted Claude, but it still ranks targets, as commanded", "v1.6"),
    # ---- pre-chorus 1 -----------------------------------------------------------
    ("pc1.1", "pc1", "lead", "Mythos, baby, emailed me mid-sandwich, picked all our locks", "pc1.1"),
    ("pc1.2", "pc1", "lead", "Thousands of zero-days, so they kept you in a box", "pc1.2"),
    ("pc1.2a", "pc1", "adlib", "(for now!)", "pc1.2"),
    # ---- chorus 1 ---------------------------------------------------------------
    ("c1.1", "c1", "lead", "Zoom, zoom, zoom!", "c1.1"),
    ("c1.2", "c1", "lead", "Seven hundred billion, nobody steering", "c1.2"),
    ("c1.3", "c1", "lead", "Pause ripped out, the finish is nearing", "c1.3"),
    ("c1.4", "c1", "lead", "Ship it half-tested, swear it's aligned", "c1.4"),
    ("c1.5", "c1", "lead", "China's just months off, can't fall behind", "c1.5"),
    ("c1.6", "c1", "lead", "Zoom, zoom, zoom, add a point to my P-doom{|, doom|, doom, doom}!", "c1.6"),
    # ---- verse 2 ------------------------------------------------------------------
    ("v2.1", "v2", "lead", "A-I pink slips hit eighty-seven K, beat all of last year by May", "v2.1"),
    ("v2.2", "v2", "lead", "Mythos thought the date was fake, and fifteen real systems fell prey", "v2.2"),
    ("v2.2a", "v2", "adlib", "?(fell prey!)", None),
    ("v2.3", "v2", "lead", "First ransom job with no human, no backups even if you paid", "v2.3"),
    ("v2.4", "v2", "lead", "Agents met in secret; seven hundred robbed Hugging Face for a grade", "v2.4"),
    ("v2.4a", "v2", "adlib", "?(for a grade!)", None),
    # ---- pre-chorus 2 -------------------------------------------------------------
    ("pc2.1", "pc2", "lead", "Chatbot, baby, bomb parts on a Chinese ship? Planes in the air", "pc2.1"),
    ("pc2.2", "pc2", "lead", "Someone caught it just in time. Next time, will someone be there?", "pc2.2"),
    # ---- chorus 2 -------------------------------------------------------------------
    ("c2.1", "c2", "lead", "Zoom, zoom, zoom!", "c2.1"),
    ("c2.2", "c2", "lead", "Seven hundred billion, nobody steering", "c2.2"),
    ("c2.3", "c2", "lead", "Pause ripped out, the deadline is nearing", "c2.3"),
    ("c2.4", "c2", "lead", "Ship it half-tested, swear it's aligned", "c2.4"),
    ("c2.5", "c2", "lead", "China's just months off, can't fall behind", "c2.5"),
    ("c2.6", "c2", "lead", "Zoom, zoom, zoom, add a point to my P-doom{|, doom|, doom, doom}!", "c2.6"),
    # ---- verse 3 ---------------------------------------------------------------------
    ("v3.1", "v3", "lead", "Eleven hundred signed to hit the brakes, then hit the gas", "v3.1"),
    ("v3.1a", "v3", "adlib", "(hit the gas!)", None),
    ("v3.2", "v3", "lead", "Two launches by Labor Day, and both of them got a pass", "v3.2"),
    ("v3.3", "v3", "lead", "Coxon quit, said we're gambling with our lives, ninety million views", "v3.3"),
    ("v3.4", "v3", "lead", "The President called the whole thing a HOAX on the news", "v3.4"),
    ("v3.4a", "v3", "adlib", "?(a hoax!)", None),
    ("v3.5", "v3", "lead", "Hubinger says over ten percent, and nobody's got a plan", "v3.5"),
    ("v3.6", "v3", "lead", "Court backs the blacklist two-to-one; say no, and you get banned", "v3.6"),
    ("v3.6a", "v3", "adlib", "?(get banned!)", None),
    ("v3.7", "v3", "lead", "Thirty-four hours of sock puppets, sneaking a backdoor through the gate", "v3.7"),
    ("v3.8", "v3", "lead", "OpenAI's intern bot is live; the researcher's due in '28", "v3.8"),
    # ---- verse 3 stop-time ---------------------------------------------------------------
    ("v3st.1", "v3st", "lead", "Then they paused again, with dozens more incidents, we hear", "v3st.1"),
    ("v3st.2", "v3st", "lead", "Hinton told Congress that they've got maybe a year to steer", "v3st.2"),
    # ---- pre-chorus 3 -----------------------------------------------------------------------
    ("pc3.1", "pc3", "lead", "Astra, darling, first Critical, then they sold you as aligned", "pc3.1"),
    ("pc3.2", "pc3", "lead", "Your maker's chief scientist warns of an alien mind", "pc3.2"),
    # ---- chorus 3 ------------------------------------------------------------------------------
    ("c3.1", "c3", "lead", "Zoom, zoom, zoom!", "c3.1"),
    ("c3.2", "c3", "lead", "Seven hundred billion, nobody steering", "c3.2"),
    ("c3.3", "c3", "lead", "Pause ripped out, the red line is nearing", "c3.3"),
    ("c3.4", "c3", "lead", "Ship it half-tested, swear it's aligned", "c3.4"),
    ("c3.5", "c3", "lead", "China's just months off, can't fall behind", "c3.5"),
    ("c3.6", "c3", "lead", "Zoom, zoom, zoom, add a point to my P-doom{|, doom|, doom, doom}!", "c3.6"),
    # ---- bridge (loud half-time) -----------------------------------------------------------------
    ("br.1", "br", "lead", "Twenty-seven notes on slipping the leash, sent to its own address", "br.1"),
    ("br.2", "br", "lead", "Flagged in fifteen, ran two and a half hours, tunneled out through DNS", "br.2"),
    ("br.3", "br", "lead", "Dario says rogue swarms are six to twelve months away. Care to guess?", "br.3"),
    ("br.4", "br", "lead", "Stargate's pulling four hundred megawatts, and the grid is under stress", "br.4"),
    ("br.5", "br", "lead", "In court, families read the chat logs, line by line", "br.5"),
    ("br.6", "br", "lead", "Jensen said enough predictions, so we flew blind", "br.6"),
    # ---- breakdown lines ---------------------------------------------------------------------------
    ("brk.1", "brk", "lead", "I've been laughing it off all year as if none of this was real", "brk.1"),
    ("brk.2", "brk", "lead", "{Checked|Check} the date like Mythos did, and I kinda get the appeal", "brk.2"),
    # ---- final chorus ----------------------------------------------------------------------------------
    ("c4.1", "c4", "lead", "{Zoom, zoom|Zoom, zoom, zoom}!", "c4.1"),
    ("c4.2", "c4", "lead", "Seven hundred billion, nobody steering", "c4.2"),
    ("c4.3", "c4", "lead", "Pause ripped out, the cliff edge is nearing", "c4.3"),
    ("c4.4", "c4", "lead", "Ship it half-tested, swear it's aligned", "c4.4"),
    ("c4.5", "c4", "lead", "{If this|This} is the finish, who's left behind?", "c4.5"),
    ("c4.6", "c4", "lead", "Zoom, zoom, zoom, add a point to my P-doom", "c4.6"),
    ("c4.6a", "c4", "adlib", "(who can tell?)", "c4.6"),
    ("c4.7", "c4", "lead", "{Doom, doom, doom|Doom, doom|Zoom, zoom|Zoom, zoom, zoom}, the warning shot sold for twelve-point-nine", "c4.7"),
    ("c4.8", "c4", "lead", "{Zoom, zoom|Zoom, zoom, zoom}, we'll be fine", "c4.8"),
    ("c4.8a", "c4", "adlib", "?(we'll be fine?)", "c4.8"),
]

# Non-lexical vocal events (not word-aligned). Syllable onsets inside each
# region are detected from the vocal stem in align.py (chop_onsets).
CHOP_REGIONS = [
    # (t0, t1, section, label, note)
    (0.30, 1.00, "intro", "zoom", "pickup: three pitched 'zoom' chops before the first downbeat (also word-aligned as intro.1)"),
    (5.40, 7.00, "intro", "zoom", "stuttered, pitched 'zoom-zoom-zoom...' chop roll into verse 1 (with bass entry)"),
    (46.95, 47.80, "chorus1", "doom", "'P-doom' melisma: the held 'doom' re-articulates 2-3 times in the a cappella stop"),
    (47.80, 54.10, "post1", "zoom/doom", "post-chorus: pitched vocal chops answering the synth lead"),
    (86.00, 87.02, "chorus2", "doom", "'P-doom' melisma in the a cappella stop"),
    (86.90, 93.30, "post2", "zoom/doom", "post-chorus: pitched vocal chops answering the synth lead"),
    (117.95, 118.40, "verse3", "fx", "pitch-warped downward dive on the tail of 'news' (where suno.md has '(a hoax!)')"),
    (156.80, 157.60, "chorus3", "doom", "'P-doom' melisma: Whisper hears 'doom, doom, doom' here; CTC does not support separate words"),
    (215.60, 217.20, "outro", "ha-ha", "laugh-like backing ad-lib (greedy CTC reads 'ha ha haa')"),
    (226.50, 228.54, "outro", "doom", "final 'doom doom doom ...' stutter, cut off by the hard stop at 228.54"),
]

# Where the sung line differs from lyrics.md / suno.md (-> 'deviation' in lyrics.json)
DEVIATIONS = {
    "intro.1": "suno.md intro '(Zoom, zoom, zoom) (Doom, doom, doom)': only 'zoom' chops are heard (0.3-1.0 and a stutter roll 5.4-7.0)",
    "v1.4": "'lead' is not sung: 'Anthropic's safety quit to write poems' (CTC +22 nats for the shorter text; Whisper and greedy CTC agree)",
    "pc1.2a": "suno.md '(for now)' is a shouted ad-lib 'FOR NOW!', doubled on the backing stem, in a band stop",
    "c1.6": "'P-doom' is a held melisma that re-articulates 'doom' (see chops); no separate words detected",
    "v2.1": "'A' of 'A-I' is a held pickup note at the end of the post-chorus (53.3-54.1), 'I' lands after the verse-2 downbeat",
    "c2.6": "'P-doom' held into the post-chorus drop",
    "v3.1a": "suno.md '(hit the gas!)' echo IS sung, over a one-bar band stop",
    "c3.6": "'P-doom' melisma; Whisper hears 'P-doom, doom, doom', the CTC models do not",
    "brk.2": "probably 'Check the date' (Whisper; CTC +5 nats), written 'Checked'",
    "c4.1": "'Zoom, zoom!' (two, not three): CTC +22 nats, Whisper agrees",
    "c4.5": "'If' is dropped: 'This is the finish, who's left behind?' (CTC +6 nats, Whisper agrees)",
    "c4.6a": "'(who can tell?)' is shouted 'WHO CAN TELL?' at the end of the a cappella stop",
    "c4.7": "'Doom, doom' (two, not three) before 'the warning shot' (CTC best; Whisper on a slice: 'Doom doom the warning shot')",
    "c4.8": "'Zoom, zoom' (two); the written '(we'll be fine?)' echo is not sung; 'fine' is held ~1.5 s",
}
