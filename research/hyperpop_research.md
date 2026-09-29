# Hyperpop research for "Zoom Zoom P(doom)", current as of 2026-09-27

Scope: hyperpop conventions from 2019 to 2026 (including digicore, glitchcore and the 2025–26 offshoots), how to prompt the genre in Suno v6, and concrete changes to `suno.md`. Companion to `suno_research.md` in this folder, which holds the general v6 facts. The source trust labels are the same:

- **[OFFICIAL]** means Suno docs.
- **[3P-TESTED]** means a third party that says it tested the claim.
- **[3P]** means a third party with no stated testing.
- **[UNVERIFIED]** means a single source, a contradicted claim, or my own inference.

No third-party lyrics are reproduced here. Artist and track names appear only as references. Suno blocks artist names in style prompts, so none of the prompts below use them.

**Main caveat: I found no published test of hyperpop on Suno v6** (v6 launched 2026-09-09). The Suno-specific advice below combines general v6 findings, genre-agnostic tag research, and pre-v6 hyperpop prompt lists. Treat it as a starting point for A/B tests.

---

## 0. Summary of recommended changes

1. **Keep 150 BPM.**
   - Production guides put the sweet spot at 150–160.
   - The closest genre touchstone to this song's concept, a 2015 "Vroom Vroom"-style chant anthem, sits at about 152 BPM.
   - Don't go faster. The verse lines already run 15–18 syllables, against the 6–10 pop guideline and the pre-v6 threshold of about 12.
2. **Put the pitch-up on the hooks, not the lead.**
   - Genre practice layers pitched copies (+5 or +12 semitones) in parallel with a tuned lead.
   - Suno guides say to keep verses dry and solo and to stack only the choruses.
   - So ask for an "auto-tuned lead, dry and upfront" plus "pitched-up vocal chops and octave-up doubles on the hooks". Don't ask for a "pitched-up lead".
3. **Leave "glitchcore", "nightcore", "breakcore" and "digicore" out of the main prompt.**
   - By definition, glitchcore chops vocals into glitches, nightcore speeds up and pitches the whole track, and breakcore is 170–200+ BPM break chaos.
   - Each one works against intelligible lyrics.
   - Use "digicore" only in the wildcard v6-wild prompt.
4. **Name one beat switch, and put it at the Bridge** (about two-thirds through the song).
   - That is the genre's usual spot.
   - Put it in both the style prompt and the bracket, because v6 treats brackets as hints and restating an instruction helps.
5. **Shorten the section tags to 2–4 cues each** (972 → about 720 characters).
   - Use only positive wording, so "a cappella, natural voice" instead of "raw unprocessed".
   - Drop "hard cut", which some users report Suno sings literally.
6. **Change the lyric format only; no word of the lead lyric changes.** A script check confirmed all 530 lead words match the draft.
   - Split verse, break and bridge lines of 15 or more syllables at their existing commas or semicolons.
   - Add a hook-first intro chop built from the existing "Zoom" and "Doom" words.
   - Add 2 pitched echo ad-libs per verse, each repeating the line's own last words.
   - Change "(Who can tell?)" to ALL CAPS so it comes out as a shout, and switch "screamed gang vocals" to "shouted". v6 artifacts are worst on distorted and screamed vocals.
7. **Settings.**
   - v6: Style Influence **75** (the draft had 70), Weirdness **45** (range 35–50), Variety Off.
   - v6-wild: 1–2 wildcard batches with **Weirdness 35–40** and Style Influence 70, using prompt B.
   - Generate in two halves, or use Max Mode, because v6 reportedly turns muddy after about 2:00 on busy arrangements, and hyperpop is as busy as it gets.
8. **Exclude.**
   - Add: `metal, heavy guitars, muffled, breathy whisper vocals, heavy vocal reverb, nightcore`.
   - Keep autotune, distortion, EDM drop, rap and trap allowed.
   - Never exclude choir, crowd or gang vocals.

---

## 1. Genre conventions

### 1.1 What hyperpop is, and a short timeline

- **Definition.** Hyperpop is an exaggerated, maximalist take on 21st-century pop. Wikipedia lists its main traits as:
  - heavily processed vocals (pitch-shifting and Auto-Tune)
  - brash synth melodies
  - heavy compression and distortion
  - metallic percussion
  - memorable refrains
  - **short songs**
  - "the juxtaposition of 'shiny, cutesy aesthetics'" with lyrics about profound emotional distress
  - Sources: https://en.wikipedia.org/wiki/Hyperpop and https://www.soundbridge.io/hyperpop (search summary)
- **Timeline** (from Wikipedia):

  | Year | Event |
  |---|---|
  | Early 2010s | Roots in PC Music in the UK: SOPHIE, A. G. Cook, Hannah Diamond, Danny L Harle |
  | 2019 | 100 gecs' "money machine" goes viral; Spotify launches its hyperpop playlist |
  | 2020 | Lockdown brings the Alt-TikTok boom |
  | 2021 | ElyOtto's "SugarCrash!" |
  | 2022–24 | Artists reject the label; PC Music stops new releases in June 2023 |
  | 2024–25 | Charli XCX's *Brat* goes mainstream, and the scene splinters into microgenres: sigilkore, jerk, rage, hexD, krushclub |

- **Digicore** grew up alongside hyperpop from 2019 and leans on trap.
  - Sound: "heavy autotune, layered melodies…, high-pitched, breathy vocals, sing-rapping", sharp 808s and busy hi-hats.
  - Influences: trap, emo rap, plugg, cloud rap and nightcore.
  - Lyrics: "introspective, depressive or ironic".
  - Source: https://en.wikipedia.org/wiki/Digicore
- **Glitchcore** pushes hyperpop further with "rapidly chopped vocals designed to resemble audio glitches". It is the subgenre that most directly endangers intelligible lyrics.
  - Sources: Wikipedia Hyperpop and Digicore pages. https://neonmusic.co.uk/hyperpop-glitchcore-darkwave-how-underground-sounds-took-over-2025 adds bit crushers and extreme distortion as glitchcore's tools.
- **Dariacore** is chopped pop samples over breakbeats. **Hyper-rock** is guitars plus hyperpop vocals. Source: Wikipedia.

### 1.2 Tempo and feel

| Source or track | BPM | Notes |
|---|---|---|
| Production guides | **140–175, most often 150–160** | Breakcore sections run double-time against the project tempo, so a 150 BPM track can have percussion at an effective 300. https://musicproductionwiki.com/articles/how-to-make-hyperpop [3P] |
| Other guides | 140–200, "sweet spot 160"; some producers go up to 205 | https://surgesounds.com/post/how-to-make-hyperpop-complete-production-guide; https://contributor.pond5.com/2025/02/20/music-briefs-hyperpop/; https://blog.native-instruments.com/hyperpop/ (its tutorial is at 205) |
| 100 gecs, "money machine" (2019) | Detected at 99, **felt at about 198**; 1:54 | https://songbpm.com/@100-gecs/money-machine, https://tunebat.com/Info/money-machine-100-gecs-Laura-Les-Dylan-Brady/61bwFjzXGG1x2aZsANdLyl |
| 100 gecs, "ringtone" | Detected at 108, **felt at about 216** | https://songbpm.com/@100-gecs/ringtone |
| ElyOtto, "SugarCrash!" (2020) | Detected at 98, felt at about 196; **1:20** original, 2:32 remix | https://songbpm.com/@elyotto/sugarcrash; https://en.wikipedia.org/wiki/SugarCrash! |
| Charli XCX / SOPHIE, "Vroom Vroom" (2015) | **152**; 3:11 | https://tunebat.com/Info/Vroom-Vroom-Charli-xcx/5hyq3LBlCfjRQAFkdQwe8o; https://en.wikipedia.org/wiki/Vroom_Vroom_(song) |

- **Half-time and double-time.** Tempo detectors often report classic hyperpop at half speed (about 100). The felt pulse is double that (about 200), and vocals ride a half-time grid over machine-gun hi-hats, as in trap.
  - Source: https://beatstorapon.com/blog/bpm-explained-how-to-choose-the-right-tempo-for-your-rap-flow/ (via search summary)
- For this song, 150 BPM matches the common range and the "Vroom Vroom" chant-anthem model.
- "Vroom Vroom" is relevant because our title and "Zoom, zoom, zoom" chant echo it. Critics described it as having "so many bridges, buildups, breakdowns for a three-minute track", with an elastic bass line and metallic clanging percussion.
  - Can't be named in Suno; describe the sound instead.

### 1.3 Song length and structure

- **Length.** Songs usually run **2:00–2:30, and often under 2:00**. Pond5's brief allows 0:30–3:00.
  - Sources: https://musicproductionwiki.com/articles/how-to-make-hyperpop; https://contributor.pond5.com/2025/02/20/music-briefs-hyperpop/
  - Our song has 61 lines at about 3.2 s per line (two bars at 150 BPM). That is about **3:15 of vocals, or 3:30–3:50 with the intro and drops**. That is long for the genre, but in line with pop-leaning hyperpop singles such as "Vroom Vroom" at 3:11.
- **Structure.** Hyperpop does use verse, pre-chorus and chorus, but **compressed and subverted**:
  - The intro is 4–8 bars and is often a processed tease of the hook. "It arrives immediately."
  - The pre-chorus builds with filter sweeps, 32nd-note fills and noise risers.
  - The chorus is often a drop.
  - The bridge is **"where conventions break down"**: a genre switch, half-time, or extreme sparseness.
  - The final chorus adds a key change or new harmonies.
  - Sources: https://beatkey.app/how-to-make-hyperpop-music [3P]; https://musicproductionwiki.com/articles/how-to-make-hyperpop [3P]
- **Beat switches and abrupt transitions** are the signature move: "abrupt transitions, tempo shifts, and unexpected drops".
  - A track may leap from sugary chorus to industrial breakdown to dubstep drop within 30 s. "Nothing stays the same for too long."
  - Sources: https://www.edmprod.com/hyperpop/; https://microgenremusic.com/articles/what-is-hyperpop/; search summary citing musicproductionwiki
- **2025–26 shift.** The newer wave (2hollis, fakemink, Jane Remover, Underscores, Ninajirachi) shows tighter, more "orderly composition", "restless energy rather than pure overstimulation", and more floor-friendly grooves. So a recognizable pop form with one or two violent switches is current practice, not a compromise.
  - Sources: https://www.vpm.org/npr-news/npr-news/2025-04-24/anatomy-of-a-microgenre-hyperpops-next-evolution; https://www.ctpublic.org/2025-04-24/anatomy-of-a-microgenre-hyperpops-next-evolution

### 1.4 Vocal production

- **Hard tuning.** Retune speed is at or near 0 and humanize is off, so the "tuning artifacts" become part of the sound.
  - Sources: https://blog.native-instruments.com/hyperpop/; https://www.cedarsoundstudios.com/blogs/news/how-to-mix-vocals-for-hyperpop-a-step-by-step-guide
- **Pitch-up.**
  - Guides suggest +3 to +7 semitones with the formant left unshifted, for an artificial sound. Source: https://musicproductionwiki.com/articles/how-to-make-hyperpop
  - Or a **parallel layer at +5 or +12 semitones printed alongside the lead**. That is a lead plus a pitched double, not a chipmunked lead. Source: bchillmix via search summary, https://bchillmix.com/blogs/news/how-to-build-a-hyperpop-vocal-preset-with-stock-plugins [3P]
  - NI's tutorial shifts the formant to +7.20 for the "chipmunk effect".
- **Stacking.** Doubles and harmonies at different pitch intervals, OTT compression, saturation, big reverbs and modulated delays. Source: musicproductionwiki
- **Screams.** Pitched-up screamo (Rico Nasty's "IPHONE"), and switching between "sinister baby-doll sweetness" and screamo (Jazmin Bean's "Monster Truck").
  - Source: https://thefortyfive.com/opinion/best-hyperpop-songs-ever/
- **Gender play.** Processing lets artists present androgynously. A pitched male voice is normal in the genre. Source: Wikipedia Hyperpop and Digicore.
- **Digicore delivery.** Breathy, high sing-rap with emo pacing. Source: Wikipedia Digicore; The Forty-Five on Nabi:3's "emocore vocal pacing over baby-pink" production.

### 1.5 Lyric style

- **Repetition and ring hooks.** Find 2–4 phrases the listener should remember and repeat a title line that opens and closes the chorus. A stutter (a syllable repeated quickly, then cut) works well as a pre-drop hook.
  - Source: https://lyricassistant.com/how-to-write-hyperpop-lyrics/ [3P, low authority]
- **Short, punchy lines** in hook-first writing. Source: same.
- **Tone.**
  - Wikipedia describes "angst-ridden or ironic lyricism" plus Web 2.0 and 2000s-internet nostalgia.
  - Digicore lyrics are "introspective, depressive or ironic".
  - The genre is known for being **sincere and ironic at once**. Its founders (SOPHIE, Danny L Harle) said they meant it sincerely, and the mainstream read it as irony.
  - Sources: https://stemdistribution.substack.com/p/internet-musics-sincerity-arc; https://rateyourmusic.com/list/lamotrigine/defining-hyperpop-camp-sincerity-and-postmodern-pastiche/
- **Trend from 2025 to 2026: a "sincerity arc".** Artists such as Underscores, Ninajirachi and Oklou foreground love, fear and connection over ironic distance.
  - Source: https://stemdistribution.substack.com/p/internet-musics-sincerity-arc
- **Internet and meme language, apps, online life** are common. Self-deprecating lyrics too.
  - Sources: https://www.edmprod.com/hyperpop/; lyricassistant
- **Dense versus sparse.** Both exist.
  - Digicore and rage-leaning tracks use fast sing-rap verses.
  - Bubblegum hyperpop uses short chant hooks.
  - Our structure (dense verses, short chant chorus) fits the genre.

### 1.6 Sound palette

- **808s.** Distorted sine 808s with 80–300 ms glide, run through hard clipping, waveshaping and optional bitcrushing. Kicks are all transient. Snares are layered and pitched up 2–4 semitones. Source: https://musicproductionwiki.com/articles/how-to-make-hyperpop
- **Drums.**
  - Clipped, "cartoon sound effect" drums (https://microgenremusic.com/articles/what-is-hyperpop/).
  - Four-on-the-floor with extra 16ths, constant 16th-note hats, and 32nd-note fills before drops (search summary of musicproductionwiki).
  - Or half-time trap with hi-hat rolls (digicore).
- **Synths.** Bright supersaws with 6–8 unison voices, 16th and 32nd arpeggios, and ring-mod or granular glitch fills. Clean layers are mixed with bitcrushed ones (musicproductionwiki). NI's example bitcrushes to 8-bit at 12 kHz.
- **Chiptune and video-game sounds.** SugarCrash! began as a soundfont test inspired by Pokémon Black and White. Jane Remover layers Wii, Pokémon and guitar-game sounds.
  - Sources: Wikipedia SugarCrash!; NPR 2025
- **Trance and Eurodance.** "Mutated Cascada-like Eurodance"; 2hollis's trance and techno lean. Source: NPR 2025
- **Breakcore and DnB.** Double-time breaks in drops and outros. Sources: musicproductionwiki; NPR ("leveled-up drum 'n' bass")
- **Nightcore.** A whole track sped up about 35%, which raises the pitch. It is an ancestor of the pitched sound, not a production layer. Source: https://en.wikipedia.org/wiki/Nightcore
- **Pluggnb and plugg.** These feed into digicore's beats. Source: Wikipedia Digicore

### 1.7 How "candy-bright over dread" is typically done

This is my synthesis of the sources above.

1. **In the arrangement.** Cute, major-key toplines and timbres go on top, and a blown-out low end goes underneath:
   - cute timbres: bells, chiptune, bubbly plucks, "gloopy, popping-candy percussion", "baby-pink" production
   - low end: clipped 808s and distortion
   - The contrast is baked into the mix.
   - Sources: The Forty-Five; microgenremusic
2. **In the delivery.** Cheerful, flirty or deadpan singing of distressing content. The pitched voice works as a cute mask over dark lines.
   - SugarCrash! pairs a hyperactive, buoyant sound with pandemic fatigue, uncertainty about the future, and dysphoria. One critic said it "works so well because it's also about exactly what it sounds like."
   - Source: Wikipedia SugarCrash!
3. **In the structure, the "sugar crash".** The maximalism suddenly drops out for a fragile, less-processed confession, then slams back in. Bridges are the usual place for "extreme sparseness" or a genre switch (beatkey). Our a cappella breakdown is exactly this move.
4. **In the words.** Irony and sincerity at once. A reassuring mantra gets repeated until it curdles, often ending as a question. Our "(we'll be fine?)" ending already does this.

### 1.8 Evolutions in 2025–26 ("hyperpop 2.0", sleazepop)

- **"Hyperpop 2.0"** has no stable definition. One trend piece uses it for a club-ready turn: "tighter songwriting and DJ-friendly arrangements", crossing over with techno and drum and bass.
  - Sources: https://medium.com/@gsgmedia/five-music-trends-that-will-define-2026-6cebd4239b6c and https://www.earvolt.com/five-music-trends-that-will-define-2026 [3P, low authority]
- **Rage-infused digicore.** Jane Remover's *Revengeseekerz* (2025) "detonat[es]" overdriven rage trap into fragments. Source: NPR 2025
- **Trance and techno sleekness.** 2hollis: less distortion, "floor-fillers". Source: NPR 2025
- **Sleazepop (a fan-coined name from 2025, discussed through 2026).**
  - Sound: "messier, grittier and more physical", "blown-out rap production", a collision of rap, electroclash and indie sleaze. It pulls from indie sleaze, Tumblr-era lo-fi and 2010s bloghouse.
  - Artists: 2hollis, fakemink, Underscores, Ninajirachi, Frost Children, Jane Remover.
  - Sources: https://www.dazeddigital.com/music/article/70442/1/sleazepop-favourite-new-genre-hyperpop-2hollis-underscores-ninjirachi-fakemink (June 2026); https://notion.online/what-comes-after-hyperpop/; https://www.nssmag.com/en/lifestyle/45811/what-is-sleazepop
- **What this means for us.**
  - The draft's "trance supersaws" and "blown-out 808s" are current.
  - A sleazepop-leaning variant would add grittier, overdriven drums and less chiptune sparkle.
  - I would not use the word "sleazepop" in Suno, since it is probably too new to be in the training data [UNVERIFIED].

---

## 2. Suno-specific hyperpop prompting

### 2.1 Descriptors that reportedly work (pre-v6 prompt lists, not v6-tested)

- Jack Righteous prompt guide (G–I, v4-era):
  - `Hyperpop, futuristic, 160 BPM, glitch synths, heavy bass, bright drums, pop hook energy`
  - The "stronger" version adds `chaotic, emotional…, pitchy vocal chops, exaggerated sparkle, fast drops, neon mix, hook-first structure`.
  - It advises one anchor style plus mood words and concrete sounds, and warns against stacking descriptors.
  - Source: https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/explore-more-suno-ai-prompts-guide-g-i-for-music-creation-mastery [3P]
- MusicFlowAI: `Hyperpop Pop, maximalist, distorted 808s, pitch-shifted vocals, internet culture, glitchy production, … vocal chops, 140-160 BPM, female lead`.
  - It also has a minimal fallback for when Suno over-produces: `Hyperpop Pop, maximalist, distorted 808s, 140-160 BPM`.
  - It excludes long instrumental intros of 8+ bars and lo-fi.
  - Source: https://www.musicflowai.com/suno-prompts/pop/hyperpop/running-cadence [3P, undated]
- Other lists use "pitch-shifted vocal chops, over-the-top synth stacks, explosive 808-tuned bass" and "pitched-up vocals, glitchy synths, distorted 808s, maximalist production, 160 BPM".
  - Sources: https://james-palm.medium.com/the-ultimate-list-of-suno-ai-music-prompts-genres-2026-78604c82e38f (403 when fetched; search summary only); https://gptprompts.ai/suno-prompts [3P]
- **Autotune wording.** HookGenius: "heavy autotune, robotic vocal effect, vocoder-like" for heavy tuning, and "polished vocals, pitch-perfect" for subtle tuning. **"layered chorus vocals" keeps verses solo.**
  - Source: https://hookgenius.app/learn/suno-vocal-effects/ (May 2026) [3P]
- **Stacking.** Songsmith: **use at most 3 vocal effects** to avoid mud; "dry verses contrasted against stacked choruses". "Octave stack" is listed as a pop-chorus staple.
  - Source: https://songsmith.studio/blog/suno-vocal-stack-cheat-sheet [3P]
- **"Beat switch".** Suno hosts style pages for "beat switch", "beat switches" and "beat switch mid break". That means users put the phrase in style prompts. It is weak evidence that the phrase means something to the model.
  - Sources: https://suno.com/style/beat-switch and https://suno.com/style/beat-switch-mid-break [OFFICIAL site, user-generated tags]

### 2.2 Descriptors likely to cause mush or mangled lyrics

These are my inferences from the definitions and from Suno's general clarity research, and are untested on v6 hyperpop.

| Descriptor | Risk | Why |
|---|---|---|
| glitchcore | High | Defined by vocals chopped to sound like glitches, so it invites chopping on lyric lines |
| nightcore | High | The whole track gets sped up and pitched up, which means a chipmunk lead and blur |
| pitched-up lead / chipmunk vocals (global) | High | The formant shift thins consonants. Localize it to hooks and chops instead |
| breathy, whispered, dreamy, lo-fi | High | HookGenius: lo-fi and dreamy tags conflict with clarity. Digicore's "breathy" is the same problem (https://hookgenius.app/learn/fix-suno-mumbling/) |
| breakcore (global) | Medium to high | Pushes 170–200+ BPM breaks, often instrumental chaos. Use only as a section flavor |
| screamed / distorted vocals (global) | Medium | v6 artifacts are worst on distorted and male-distorted vocals and on metal ([3P-TESTED] AI Musicpreneur; Jack Righteous v6 reviews: "distorted guitars sound absolutely awful") |
| vocal chops (global) | Medium | A Suno v5.5 user group asked how to *stop* Suno "injecting vocal chops", so the tag spreads. Name the section instead (https://www.facebook.com/groups/1673444546790462/posts/2171241083677470/) |
| 10+ stacked vocal adjectives | Medium | They get "averaged into mush". Use 2–3 per category (https://roo.beehiiv.com/p/suno-v5-and-v5-5-prompts-why-it-ignores-half-your-words-and-how-to-fix-it; v5/v5.5) |
| Conflicting pairs (e.g. "jazzy" + "hyperpop") | Medium | The model picks one at random unless you bridge them ("jazz-influenced hyperpop"). Source: HookGenius prompt guide via search summary |

### 2.3 Weirdness and Style Influence

- **Official.** Weirdness at 50% is "the normal expected result". Style Influence defaults to 50%.
  - Sources: https://help.suno.com/en/articles/6141377 [OFFICIAL]; HookGenius [3P-TESTED]
- **Moe Lueker (2026-09-19)** [3P-TESTED, 150 songs, not hyperpop]:
  - v6: Weirdness 30–50 and higher Style Influence (about 65) for detailed prompts.
  - v6-wild: Weirdness 60–75 with lower Style Influence, for exploration.
  - 90+ risks artifacts.
  - Source: https://moelueker.com/blog/suno-v6-vs-wild-vs-mini-150-song-test
- **A third-party "564 genres" catalogue** lists hyperpop at Weirdness 60 and Style Influence 95. The author describes it as "strangeness held tightly inside a form".
  - The method, model version and whether anything was tested are all unstated, so it is [UNVERIFIED].
  - Style Influence 95 conflicts with the artifact warnings above.
  - Source: https://dev.to/musaisong/what-564-documented-genres-reveal-about-how-sunos-settings-actually-behave-39jn (2026-09-15)
- **Adherence consensus for v6** [3P]: Weirdness about 20, Style Influence 75–85, Variety Off. Sources: https://sunostyles.com/blog/suno-v6-settings (2026-09-12); Undetectr
- **My recommendation.**
  - Hyperpop wants more chaos than synth-pop, but this song needs intelligibility. So use v6 at **Weirdness 45 (35–50) and Style Influence 75 (70–80)**.
  - Use v6-wild at **Weirdness 35–40 and Style Influence 70**. The wild model already moves away from the prompt, so don't also raise Weirdness. Moe's wild settings are meant for idea-hunting, not lyric fidelity.

### 2.4 v6 or v6-wild for hyperpop?

- **No hyperpop-specific comparison exists.** The evidence points both ways:
  - **For v6:** cleanest vocals and best adherence ([3P-TESTED] Moe Lueker). v6-wild "started with vocals right away" despite being told not to.
  - **For v6-wild:**
    - EDM and drum and bass users dislike v6, calling it "synth arms everywhere".
    - The community advises "start on v6, switch to v6-wild when it goes flat", describing wild as "where the old personality went".
    - Officially, wild is about "genre-blending" and results "further from the prompt".
    - Sources: https://undetectr.com/blog/suno-v6-reactions (2026-09-25); https://help.suno.com/en/articles/13924737 [OFFICIAL]
  - Jack Righteous calls v6-wild "the most polarized branch": useful for strange ideas, but prone to "distorted or repetitive long generations".
    - Source: https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-v6-reviews-problems-whats-next
- **Verdict.** Keep **v6 as the main model** (about 70% of batches). The words are the point of this song.
  - Run 1–2 batches on v6-wild using prompt B (below) to hunt for a more authentically chaotic arrangement.
  - Keep a wild take only if at least Verse 1 and the chorus are fully intelligible. Fix up to about 3 lines with Replace Section; if more are wrong, drop the take.

### 2.5 Tag tricks for beat switches, drops and glitch stutters

- **v6 reads per-section cues in brackets.** Its own track captions quoted directions that appeared only in the brackets. Pipe syntax such as `[Verse | …]` also works.
  - Source: https://hookgenius.app/learn/suno-v6-guide/ [3P-TESTED, launch day]
- **v6 often rolls through bare labels.** Descriptive brackets such as `[Intro: two bars, drums only]` restore the resets.
  - Source: https://heho.ai/blog/suno-v6-what-changed-for-lyrics [3P-TESTED]
- **"Beat switch".** There is no confirmed `[Beat Switch]` tag. Use a descriptor inside the section bracket, such as `[Bridge: beat switch, half-time trap, …]`, and repeat the idea once in Styles. Brackets are hints, so stating an instruction twice (style plus tag) is the most reliable approach.
  - Source: https://undetectr.com/blog/suno-v6-intro-outro-prompts (2026-09-11)
- **Glitch** (Jack Righteous, v6-era guide) [3P]:
  - `[Glitch]` is a cue, not a command.
  - Say which section it is, which element gets glitched, how, how much, **what stays clean**, and where it returns to normal. The example keeps "the lead vocal intelligible" while the drums stutter.
  - Put glitch in transitions and breakdowns. "Glitch everywhere" destroys contrast.
  - Source: https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-ai-glitch-effect-music
- **Stutters in the lyric line.**
  - Community reports say repeating a word with commas, or using hyphen repeats, makes the vocal stutter. [3P, search summary]
  - Warning: in our sheet, hyphens already mean "spell the letters" (A-I, D-N-S), so a "z-z-zoom" might be spelled out. **Test it on v6-mini first, or skip it.**
- **Drop and Build.** These work "when the musical lane supports them" (Jack Righteous meta tags guide, in `suno_research.md`), and hyperpop does.
- **Hard ending.** Undetectr's v6 template: "ends on a hard stop on the last beat… no outro, no fade… silence after the last hit", plus an End tag.
  - Some unusual tags such as `[hard cut]` are reportedly sung literally (in `suno_research.md`). Use "abrupt stop".
- **High BPM.** Suno may read 160–170 BPM as half-time, especially with trap drums. Add "half-time feel" where you want it, and name fast breaks where you don't.
  - Sources: https://hookgenius.app/learn/suno-tempo-bpm-guide/; search summary of Lyro and HookGenius [3P]
  - MixMasterAI says quality degrades above about 180–200 BPM: https://www.mixmasterai.co/suno-prompts/fix/wrong-tempo [3P]

### 2.6 Keeping dense lyrics intelligible with pitched vocals

1. **Localize the processing.**
   - Verses: "dry clear lead".
   - Hooks, post-choruses and the intro: "pitched vocal chops", "octave-up doubles".
   - This matches real hyperpop practice (a lead plus a pitched parallel layer) and Suno's "dry verses, stacked choruses" advice.
2. **Clarity words in Styles.** "Crisp enunciation, every word intelligible, dry and upfront, vocals on top". Put them early in the prompt, in the vocal clause.
   - Source: https://hookgenius.app/learn/fix-suno-mumbling/
3. **Lyric shape beats adjectives.**
   - "Describing a voice does not change how it phrases a line."
   - Dense lines come out flat and spoken, so cut syllables or add line breaks.
   - A dense verse followed by a short, open chorus gives the model a contrast it acts on. Our chorus already does this.
   - Source: https://sunowatermark.com/blog/suno-v6-vocal-prompts-2026/
4. **Line length.**
   - Pre-v6 guidance put the line-density threshold at about 12 syllables (heho.ai), with 6–10 as the pop norm.
   - Our verse lines run **15–18** by a heuristic count.
   - Splitting at existing commas gives half-lines of 6–10 syllables, each with its own phrase boundary and breath. The delivery rate doesn't change (still about 5 syllables/s), but the model gets clear phrasing cues.
5. **Parentheses become pitched backing vocals** on v6 (heho.ai), which is genre-appropriate. Use them only for echoes of words already in the line. Don't pair them with `[ad-lib]` tags, which creates an accidental double echo.
6. **Tempo.** Stay at or below 150. If words blur, the order of fixes is:
   1. Lower Weirdness.
   2. Remove "auto-tuned" from the lead clause.
   3. Drop to 140 BPM.
7. **Length and mud.** v6 reportedly muddies after about 2:00 on busy arrangements. Use Max Mode for keepers, or generate Verse 1 through Post-Chorus 2 first, then Extend with Verse 3 onward.

---

## 3. Recommended changes to `suno.md`

### 3.1 Style prompt A (main, v6), 643 characters

```
Hyperpop, 150 BPM, sugary major-key bubblegum hooks over blown-out distorted 808s; euphoric, frantic and anxious. Bright auto-tuned lead vocal, dry and upfront, crisp enunciation, every word intelligible, fast sing-rap verses. Pitched-up vocal chops and octave-up doubles on the hooks, layered gang vocals on the choruses. Clipped trap drums with rapid hi-hat rolls, sparkling chiptune arpeggios, trance supersaw chords, music-box bells. Hook-first with a short intro, glitch stutter fills between sections, one beat switch into a half-time bridge, final chorus key change, abrupt ending. Loud glossy maximal mix, vocals on top, crisp top end.
```

Changes from the draft, and why:
- **"Pitched-up, hard-tuned lead"** becomes an auto-tuned lead plus pitched chops and doubles on the hooks. This protects the verses.
- **"Candy-bright on the surface, panic underneath"** becomes concrete sound and mood words: "sugary major-key… over blown-out distorted 808s; euphoric, frantic and anxious". Suno acts on sound descriptions more reliably than on metaphor [UNVERIFIED inference].
- **"Screamed ad-libs"** leaves the global prompt, because of v6's distortion artifacts. The one shout now lives in the lyric as an ALL CAPS parenthetical.
- **"Bitcrushed"** is dropped from the global prompt, so the crunch doesn't land on the vocal. It moves to the glitch fills.
- **Arrangement events** are cut to the ones that matter globally. The a cappella breakdown and the quiet pre-chorus now live in the section tags.
- **"Clipped trap drums with rapid hi-hat rolls"** is new: the digicore and trap backbone that suits fast sing-rap verses.
- **"Crisp top end, vocals on top"** targets v6's reported muffled, buried-vocal problem.
- Optional sound-alike for the "Vroom Vroom" DNA: add "elastic rubbery bass, metallic clanging percussion".

### 3.2 Style prompt B (wildcard, v6-wild, 1–2 batches), 449 characters

```
Hyperpop with a digicore edge, 150 BPM, glitchy and maximal, candy-bright melodies over clipped, overdriven 808s and rage-style synth leads; manic and anxious. Auto-tuned lead vocal, upfront and intelligible, fast emo sing-rap verses, pitched-up vocal chops and screamed ad-libs on the drops. Bitcrushed chiptune arps, trance supersaws, stutter edits, sudden beat switches, half-time bridge, a cappella break, final chorus key change, abrupt ending.
```

This leans toward the 2025–26 sound (rage and digicore, grittier). It is only for exploration.

### 3.3 Exclude styles, 226 characters

```
acoustic, folk, country, orchestral, jazz, reggae, metal, heavy guitars, slow ballad, lo-fi, muffled, muddy mix, buried vocals, mumbled vocals, slurred vocals, breathy whisper vocals, heavy vocal reverb, nightcore, spoken word
```

- **Added:**
  - `metal, heavy guitars`: v6's weakest area, and hyperpop doesn't need them.
  - `muffled`: v6's most common complaint.
  - `breathy whisper vocals` and `heavy vocal reverb`: both mask words.
  - `nightcore`: stops a sped-up chipmunk lead.
- **Still intentionally allowed:** autotune, distorted, EDM drop, rap, trap, choir, crowd and gang vocals.
- **Optional, if takes turn into generic festival EDM:** add `big room`.

### 3.4 Settings table changes

| Setting | Draft | Recommended | Why |
|---|---|---|---|
| Model | v6, plus 2 takes on v6-wild | v6 for about 70% of batches; **1–2 batches** on v6-wild with prompt B | v6 wins on adherence and vocals; wild may carry more character, which suits electronic chaos. No hyperpop test exists either way |
| Style Influence | 70 | **75** (70–80) | Holds BPM and vocal-clarity clauses in a long prompt. Avoid 90+ |
| Weirdness | 45 (35–55) | **45 (35–50)** on v6; **35–40** on v6-wild | 50 is Suno's "normal". Wild already adds unpredictability |
| Variety | Off | Off | Unchanged |
| Max Mode | Off for tests, on for keepers | Same, but **always on for any take past 2:00** you plan to keep | Busy arrangements get muddy past about 2:00 |
| Duration | (not set) | Auto. If quality sags, split into two generations: Verse 1 to Post-Chorus 2, then Extend from Verse 3 | Expected length 3:30–3:50 |
| Vocal Gender | Female, then Male | Same | A pitched male voice reads as androgynous, which is genre-typical |

Tempo note: keep 150 BPM with a fallback to 140. Don't go to 160+, because verse density is already at rap rate (about 5 syllables/s).

**Cover shortcut caveat.** Covering the 120 BPM synth-pop take keeps its melody. Whether it also carries over the 120 BPM phrasing and overrides "150 BPM" is [UNVERIFIED]. Expect a slower, bouncier result.

### 3.5 Section tags (shorter, positive wording, vocal treatment named per section)

| Draft | Proposed |
|---|---|
| `[Intro: glitchy chiptune arpeggio, stuttered vocal chops, distorted 808 hit]` | `[Intro: 4 bars, pitched vocal chops, chiptune arp]` |
| `[Verse 1: rapid-fire, pitched-up, crisp and clear, bouncy bitcrushed beat]` | `[Verse 1: dry clear lead, bouncy 808s]` |
| `[Pre-Chorus: synth riser, vocal pitch climbing]` | `[Pre-Chorus: riser, vocal climbs]` |
| `[Chorus: maximal drop, distorted 808s, supersaws, layered pitched gang vocals]` | `[Chorus: drop, supersaws, gang vocals]` |
| `[Post-Chorus: stuttered vocal-chop hook, bitcrushed]` | `[Post-Chorus: pitched vocal chop hook]` |
| `[Verse 2: rapid-fire, more frantic, glitch fills]` | `[Verse 2: dry clear lead, glitch fills]` |
| `[Chorus: maximal drop, harder]` | `[Chorus: harder drop, gang vocals]` |
| `[Verse 3: breakneck, distorted, urgent]` | `[Verse 3: urgent sing-rap, distorted 808s]` ("distorted" moves from the voice to the 808s) |
| `[Break: stutter-edit, beat cuts in and out, glitch hit between lines]` | `[Break: stutter edits, beat drops in and out]` |
| `[Pre-Chorus: sudden quiet, soft pitched-up vocal, twinkling synth]` | `[Pre-Chorus: sudden quiet, soft vocal, bells]` |
| `[Chorus: maximal drop, louder, more distorted]` | `[Chorus: louder drop, gang vocals]` |
| `[Bridge: woozy half-time, detuned synth pads, emo]` | `[Bridge: beat switch, half-time trap, detuned pads]` |
| `[Breakdown: everything cuts out, raw unprocessed human vocal alone]` | `[Breakdown: a cappella, natural voice]` ("unprocessed" is a negation the model may flip) |
| `[Final Chorus: key change up, biggest distorted drop, screamed gang vocals]` | `[Final Chorus: key change up, biggest drop, shouted gang vocals]` |
| `[Outro: glitch stutter, hard cut to silence]` | `[Outro: glitch stutter, abrupt stop]` then `[End]` |

The beat switch sits at the Bridge, about 65–70% through the song, which is the genre's usual switch point. The Break before Pre-Chorus 3 remains the "fake-out" stutter section.

### 3.6 Lyric-format changes (no facts or lead words changed)

A script compared the lead words, with parentheticals removed, against the draft: **530 of 530 words are identical and in the same order.** Every added parenthetical repeats words already in its own line or chorus.

1. **A hook-first intro.** `(Zoom, zoom, zoom) (Doom, doom, doom)` under the intro tag. Hyperpop "arrives immediately" with a processed tease of the hook.
2. **Split long lines at their existing commas and semicolons.** This applies to verses 1–3, the Break, and the first three Bridge lines. The result is half-lines of about 6–10 syllables, and phrase boundaries fall where the stutter edits and glitch fills can land.
   - Pre-choruses, choruses and the breakdown stay whole. They are melodic, and their lines are already shorter.
   - Risk: Suno may give each half-line its own full phrase and stretch the song. **A/B test split against unsplit on v6-mini (2 takes each)** before committing.
3. **Pitched echo ad-libs, 2 per verse, at line ends:**
   - (stalled it!), (red-handed!)
   - (fell prey!), (for a grade!)
   - (old news!), (hit the fan!)
   - v6 pulls parentheses into backing voices, which here means the pitched layer. Keep it to 2 per verse to limit clutter.
4. **One loud shout.** `(Who can tell?)` becomes `(WHO CAN TELL?)`, since ALL CAPS gives a more forceful delivery. This is the single scream-like moment, instead of screaming the whole final chorus.
5. **Optional, test only:**
   - A held vowel on the chorus opener, `Zoom, zoom, zooom!`, using the spelled-sustain trick.
   - A stutter in the post-chorus, e.g. `Doom, doom, doom, doom`.
   - Skip hyphen stutters, since hyphens mean letter-spelling elsewhere in the sheet.
6. **Optional short edit for social:** Pre-Chorus 1, Chorus 1, Post-Chorus, Breakdown, Final Chorus, at about 1:15. Pond5 suggests 1- and 2-minute versions of hyperpop tracks for social. Build it in the Song Editor from a keeper; don't regenerate. It **omits** facts, but doesn't alter any.

Size: the proposed lyric block is **4,010 characters**, against 4,141 in the draft. Tags went from 972 to 719 characters; echoes and the intro added back about 130. That is still above the roughly 3,000-character level where Suno reportedly starts rushing, which is another reason for two-part generation.

### 3.7 Full proposed lyric block (paste into the Lyrics field)

```
[Intro: 4 bars, pitched vocal chops, chiptune arp]
(Zoom, zoom, zoom) (Doom, doom, doom)

[Verse 1: dry clear lead, bouncy 808s]
Grok stripped seven kay an hour,
Musk went way funnier, then paywalled it
One hacker, two bots, nine agencies;
a water plant stalled it (stalled it!)
Anthropic's safety lead quit to write poems,
said the world's in peril
They put G-P-T four-oh down,
and eight hundred kay went feral
Florida says if it were human,
it'd be murder, caught red-handed (red-handed!)
Blacklisted Claude still ranks targets, as commanded

[Pre-Chorus: riser, vocal climbs]
Mythos, baby, mailed me mid-sandwich, picked all our locks
Thousands of zero-days, so they kept you in a box

[Chorus: drop, supersaws, gang vocals]
Zoom, zoom, zoom!
Seven hundred billion, nobody steering
Pause ripped out, the finish is nearing
Ship it half-tested, swear it's aligned
China's just months off, can't fall behind
Zoom, zoom, zoom, add a point to my P-doom! (Ten percent!)

[Post-Chorus: pitched vocal chop hook]
Doom, doom, doom, up it goes
Doom, doom, doom (nobody knows!)

[Verse 2: dry clear lead, glitch fills]
A-I pink slips hit eighty-seven kay,
beat all of last year by May
Mythos thought the year was fake,
and fifteen real systems fell prey (fell prey!)
First ransom job with no human,
no backups even if you paid
Bots met in secret;
seven hundred robbed Hugging Face for a grade (for a grade!)

[Pre-Chorus: riser, vocal climbs]
Chatbot, baby, bomb parts on a Chinese ship? Planes in the air
Someone caught it just in time. Next time, will someone be there?

[Chorus: harder drop, gang vocals]
Zoom, zoom, zoom!
Seven hundred billion, nobody steering
Pause ripped out, the deadline is nearing
Ship it half-tested, swear it's aligned
China's just months off, can't fall behind
Zoom, zoom, zoom, add a point to my P-doom! (Twenty-five!)

[Post-Chorus: pitched vocal chop hook]
Doom, doom, doom, up it goes
Doom, doom, doom (heaven knows!)

[Verse 3: urgent sing-rap, distorted 808s]
Eleven hundred signed to slow it down;
two launches later, old news (old news!)
Coxon quit, said we're gambling with our lives,
got ninety million views
Hubinger says over ten percent,
and nobody's got a plan
Trump posted HOAX, and that same day
the chip stocks hit the fan (hit the fan!)
Thirty-four hours of sock puppets,
sneaking a backdoor through the gate
Open A-I's intern bot's here;
the researcher's due in twenty-eight

[Break: stutter edits, beat drops in and out]
Open A-I paused again,
with dozens more incidents, we hear
Hinton told Congress
that they've got maybe a year to steer

[Pre-Chorus: sudden quiet, soft vocal, bells]
Astra, darling, first Critical, then they sold you as aligned
Your maker's chief scientist warns of an alien mind

[Chorus: louder drop, gang vocals]
Zoom, zoom, zoom!
Seven hundred billion, nobody steering
Pause ripped out, the red line is nearing
Ship it half-tested, swear it's aligned
China's just months off, can't fall behind
Zoom, zoom, zoom, add a point to my P-doom! (Heads or tails!)

[Bridge: beat switch, half-time trap, detuned pads]
Twenty-seven notes to its future self,
and some said hide the mess
Flagged in fifteen, ran two and a half hours,
slipped out through D-N-S
Dario says a rogue swarm's six to twelve months away.
Care to guess?
In court, families read the chat logs, line by line
Jensen said enough predictions, so we flew blind

[Breakdown: a cappella, natural voice]
I've been laughing it off all year like none of this was real
Checked the date like Mythos did, and I kinda get the appeal

[Final Chorus: key change up, biggest drop, shouted gang vocals]
Zoom, zoom, zoom!
Seven hundred billion, nobody steering
Pause ripped out, the cliff edge is nearing
Ship it half-tested, swear it's aligned
If this is the finish, who's left behind?
Zoom, zoom, zoom, add a point to my P-doom! (WHO CAN TELL?)
Doom, doom, doom, the warning shot sold for twelve-point-nine
Zoom, zoom, zoom, we'll be fine (we'll be fine?)

[Outro: glitch stutter, abrupt stop]
[End]
```

A copy of this block is at `hp_lyrics.txt` in this scratchpad. The prompts are in `hp_style_a.txt`, `hp_style_b.txt` and `hp_excl.txt`.

### 3.8 Workflow tweaks

1. **v6-mini, 4 takes:** 2 with the split lyrics and 2 unsplit, all with prompt A. Check for moderation blocks, whether the chops stay on the hooks, and whether the verses stay clear.
2. **v6, 3–4 batches:** prompt A, Variety Off, Style Influence 75, Weirdness 45. Pick takes where:
   - Verse 1 and the chorus are fully intelligible
   - a beat switch lands at the bridge
   - the breakdown actually drops out
3. **v6-wild, 1–2 batches:** prompt B, Weirdness 35–40, Style Influence 70. Keep a take only if the words hold.
4. **Lock the keeper** with Max Mode. If the back half goes to mud, regenerate from Verse 3 with Extend.
5. **Fix lines** with Replace Section, selecting whole lines or split pairs. If the chops land on verse lines, use Replace Section with the prompt "dry clear lead, no chops" in the section's bracket.

---

## 4. Open questions (not verified)

- No v6 or v6-wild hyperpop test has been published. All v6 genre claims come from pop, folk, EDM and metal reports.
- Whether Suno understands "beat switch" as a structural instruction, or only as a vibe.
- Whether splitting lines lengthens v6 output, or only changes the phrasing.
- Whether hyphen stutters ("z-z-zoom") stutter or get spelled out.
- Whether the "564 genres" catalogue numbers (hyperpop at Weirdness 60 and Style Influence 95) reflect any testing.
- Whether "octave-up doubles" reliably renders as a parallel pitched layer rather than a pitched lead.
- Whether Cover keeps the source take's tempo.

---

## Sources

**Genre**
- https://en.wikipedia.org/wiki/Hyperpop
- https://en.wikipedia.org/wiki/Digicore
- https://en.wikipedia.org/wiki/SugarCrash!
- https://en.wikipedia.org/wiki/Vroom_Vroom_(song)
- https://en.wikipedia.org/wiki/Nightcore
- https://www.edmprod.com/hyperpop/
- https://musicproductionwiki.com/articles/how-to-make-hyperpop
- https://surgesounds.com/post/how-to-make-hyperpop-complete-production-guide
- https://blog.native-instruments.com/hyperpop/
- https://beatkey.app/how-to-make-hyperpop-music
- https://contributor.pond5.com/2025/02/20/music-briefs-hyperpop/
- https://microgenremusic.com/articles/what-is-hyperpop/
- https://www.epidemicsound.com/blog/what-is-hyperpop/
- https://mixdownmag.com.au/features/a-beginners-guide-to-hyperpop-production/
- https://www.cedarsoundstudios.com/blogs/news/how-to-mix-vocals-for-hyperpop-a-step-by-step-guide
- https://bchillmix.com/blogs/news/how-to-build-a-hyperpop-vocal-preset-with-stock-plugins
- https://thefortyfive.com/opinion/best-hyperpop-songs-ever/
- https://www.vpm.org/npr-news/npr-news/2025-04-24/anatomy-of-a-microgenre-hyperpops-next-evolution
- https://www.ctpublic.org/2025-04-24/anatomy-of-a-microgenre-hyperpops-next-evolution
- https://notion.online/what-comes-after-hyperpop/
- https://www.dazeddigital.com/music/article/70442/1/sleazepop-favourite-new-genre-hyperpop-2hollis-underscores-ninjirachi-fakemink
- https://www.nssmag.com/en/lifestyle/45811/what-is-sleazepop
- https://neonmusic.co.uk/hyperpop-glitchcore-darkwave-how-underground-sounds-took-over-2025
- https://stemdistribution.substack.com/p/internet-musics-sincerity-arc
- https://rateyourmusic.com/list/lamotrigine/defining-hyperpop-camp-sincerity-and-postmodern-pastiche/
- https://lyricassistant.com/how-to-write-hyperpop-lyrics/
- https://medium.com/@gsgmedia/five-music-trends-that-will-define-2026-6cebd4239b6c
- https://www.earvolt.com/five-music-trends-that-will-define-2026
- https://beatstorapon.com/blog/bpm-explained-how-to-choose-the-right-tempo-for-your-rap-flow/
- BPM data:
  - https://songbpm.com/@100-gecs/money-machine
  - https://tunebat.com/Info/money-machine-100-gecs-Laura-Les-Dylan-Brady/61bwFjzXGG1x2aZsANdLyl
  - https://songbpm.com/@100-gecs/ringtone
  - https://songbpm.com/@elyotto/sugarcrash
  - https://tunebat.com/Info/Vroom-Vroom-Charli-xcx/5hyq3LBlCfjRQAFkdQwe8o

**Suno**
- https://help.suno.com/en/articles/6141377
- https://help.suno.com/en/articles/13924737
- https://moelueker.com/blog/suno-v6-vs-wild-vs-mini-150-song-test
- https://undetectr.com/blog/suno-v6-reactions
- https://undetectr.com/blog/suno-v6-intro-outro-prompts
- https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-v6-reviews-problems-whats-next
- https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/inside-suno-ai-models-mechanics
- https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-ai-glitch-effect-music
- https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/explore-more-suno-ai-prompts-guide-g-i-for-music-creation-mastery
- https://queststudio.io/blog/suno-v6-guide
- https://hookgenius.app/learn/suno-v6-guide/
- https://hookgenius.app/learn/suno-vocal-effects/
- https://hookgenius.app/learn/fix-suno-mumbling/
- https://hookgenius.app/learn/suno-tempo-bpm-guide/
- https://heho.ai/blog/suno-v6-what-changed-for-lyrics
- https://sunowatermark.com/blog/suno-v6-vocal-prompts-2026/
- https://sunostyles.com/blog/suno-v6-settings
- https://dev.to/musaisong/what-564-documented-genres-reveal-about-how-sunos-settings-actually-behave-39jn
- https://songsmith.studio/blog/suno-vocal-stack-cheat-sheet
- https://kordra.io/knowledge/meta-tags/auto-tune
- https://roo.beehiiv.com/p/suno-v5-and-v5-5-prompts-why-it-ignores-half-your-words-and-how-to-fix-it
- https://www.musicflowai.com/suno-prompts/pop/hyperpop/running-cadence
- https://www.mixmasterai.co/suno-prompts/fix/wrong-tempo
- https://suno.com/style/beat-switch
- https://suno.com/style/beat-switch-mid-break
- https://www.facebook.com/groups/1673444546790462/posts/2171241083677470/ (title only)
