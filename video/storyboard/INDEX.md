# Storyboard: THE RECORD (approved 2026-09-28)

- **Shots.** 71 stills, 1920×1080, in song order, in `frames/`.
- **File names.** `NN_m-ss.s_id.png`, where NN is the shot number, m-ss.s is the song time (minutes-seconds) and id is the shot id.
- **Contact sheets.** `sheet-1.png` to `sheet-3.png`.
- **Machine-readable list.** `shots.json`.
- **Facts.** Every claim on screen is logged in `../FACTS.md`.
- **Preview.** Render any shot live at `/video/index.html?t=<seconds>` (serve with `node tools/render/serve.mjs`), or pick one by id with `?shot=<id>`.

| # | Time | Section | Moment | File | Code |
|---|---|---|---|---|---|
| 1 | 0:00.4 | INTRO | zoom, zoom, zoom | [01_0-00.4_introZoom.png](frames/01_0-00.4_introZoom.png) | `frames/v1.js · fIntroZoom` |
| 2 | 0:04.0 | INTRO | synth riff alone | [02_0-04.0_introCode.png](frames/02_0-04.0_introCode.png) | `frames/v1.js · fIntroCode` |
| 3 | 0:08.5 | V1 | Grok … paywalled it | [03_0-08.5_grok.png](frames/03_0-08.5_grok.png) | `frames/v1.js · fGrok` |
| 4 | 0:12.0 | V1 | one hacker, two bots, nine agencies | [04_0-12.0_hack.png](frames/04_0-12.0_hack.png) | `frames/core.js · fHack` |
| 5 | 0:14.5 | V1 | a million and a half bots | [05_0-14.5_bots.png](frames/05_0-14.5_bots.png) | `frames/core.js · fBots` |
| 6 | 0:18.0 | V1 | quit to write poems, “peril” | [06_0-18.0_sharma.png](frames/06_0-18.0_sharma.png) | `frames/v1.js · fSharma` |
| 7 | 0:21.5 | V1 | Florida: it’d be murder | [07_0-21.5_florida.png](frames/07_0-21.5_florida.png) | `frames/v1.js · fFlorida` |
| 8 | 0:24.5 | V1 | blacklisted, still ranks targets | [08_0-24.5_blacklist.png](frames/08_0-24.5_blacklist.png) | `frames/v1.js · fBlacklist` |
| 9 | 0:27.5 | PC1 | emailed me mid-sandwich | [09_0-27.5_email.png](frames/09_0-27.5_email.png) | `frames/v1.js · fEmail` |
| 10 | 0:30.0 | PC1 | thousands of zero-days | [10_0-30.0_zerodays.png](frames/10_0-30.0_zerodays.png) | `frames/v1.js · fZeroDays` |
| 11 | 0:31.9 | PC1 | (for now!) · band stops | [11_0-31.9_box.png](frames/11_0-31.9_box.png) | `frames/v1.js · fBox` |
| 12 | 0:33.8 | CH1 | zoom, zoom, zoom! | [12_0-33.8_ch1zoom.png](frames/12_0-33.8_ch1zoom.png) | `frames/chorus.js · chZoom` |
| 13 | 0:35.3 | CH1 | seven hundred billion, nobody steering | [13_0-35.3_ch1capex.png](frames/13_0-35.3_ch1capex.png) | `frames/chorus.js · chCapex` |
| 14 | 0:39.5 | CH1 | pause ripped out, the finish | [14_0-39.5_ch1pause.png](frames/14_0-39.5_ch1pause.png) | `frames/chorus.js · chPause` |
| 15 | 0:42.2 | CH1 | ship it half-tested | [15_0-42.2_ch1ship.png](frames/15_0-42.2_ch1ship.png) | `frames/chorus.js · chShip` |
| 16 | 0:43.8 | CH1 | China’s just months off | [16_0-43.8_ch1china.png](frames/16_0-43.8_ch1china.png) | `frames/chorus.js · chChina` |
| 17 | 0:46.0 | CH1 | add a point to my p(doom) · band stops | [17_0-46.0_ch1hook.png](frames/17_0-46.0_ch1hook.png) | `frames/chorus.js · chHook` |
| 18 | 0:50.5 | POST 1 | instrumental | [18_0-50.5_post.png](frames/18_0-50.5_post.png) | `frames/core.js · fPost` |
| 19 | 0:55.0 | V2 | AI pink slips | [19_0-55.0_slips.png](frames/19_0-55.0_slips.png) | `frames/core.js · fSlips` |
| 20 | 0:58.5 | V2 | Mythos thought the date was fake | [20_0-58.5_mythos.png](frames/20_0-58.5_mythos.png) | `frames/core.js · fMythos` |
| 21 | 1:02.0 | V2 | first ransom job with no human | [21_1-02.0_ransom.png](frames/21_1-02.0_ransom.png) | `frames/v2.js · fRansom` |
| 22 | 1:05.0 | V2 | agents met in secret, for a grade | [22_1-05.0_grade.png](frames/22_1-05.0_grade.png) | `frames/core.js · fGrade` |
| 23 | 1:08.5 | PC2 | Chinese ship? planes in the air | [23_1-08.5_ship.png](frames/23_1-08.5_ship.png) | `frames/v2.js · fShip` |
| 24 | 1:11.4 | PC2 | caught it … next time? · band stops | [24_1-11.4_caught.png](frames/24_1-11.4_caught.png) | `frames/v2.js · fCaught` |
| 25 | 1:13.2 | CH2 | zoom, zoom, zoom! | [25_1-13.2_ch2zoom.png](frames/25_1-13.2_ch2zoom.png) | `frames/chorus.js · chZoom` |
| 26 | 1:15.5 | CH2 | seven hundred billion | [26_1-15.5_ch2capex.png](frames/26_1-15.5_ch2capex.png) | `frames/chorus.js · chCapex` |
| 27 | 1:19.0 | CH2 | the deadline is nearing | [27_1-19.0_ch2pause.png](frames/27_1-19.0_ch2pause.png) | `frames/chorus.js · chPause` |
| 28 | 1:21.4 | CH2 | ship it half-tested | [28_1-21.4_ch2ship.png](frames/28_1-21.4_ch2ship.png) | `frames/chorus.js · chShip` |
| 29 | 1:23.0 | CH2 | China’s just months off | [29_1-23.0_ch2china.png](frames/29_1-23.0_ch2china.png) | `frames/chorus.js · chChina` |
| 30 | 1:25.5 | CH2 | add a point · band stops | [30_1-25.5_ch2hook.png](frames/30_1-25.5_ch2hook.png) | `frames/chorus.js · chHook` |
| 31 | 1:30.0 | POST 2 | instrumental | [31_1-30.0_chant.png](frames/31_1-30.0_chant.png) | `frames/inst.js · fChant` |
| 32 | 1:36.5 | SOLO | lead synth takes over | [32_1-36.5_solo.png](frames/32_1-36.5_solo.png) | `frames/core.js · fSolo` |
| 33 | 1:42.0 | SOLO | beat gone, synth alone | [33_1-42.0_idle.png](frames/33_1-42.0_idle.png) | `frames/inst.js · fIdle` |
| 34 | 1:46.5 | V3 | eleven hundred signed | [34_1-46.5_letter.png](frames/34_1-46.5_letter.png) | `frames/v3.js · fLetter` |
| 35 | 1:50.0 | V3 | hit the gas · two launches | [35_1-50.0_launch.png](frames/35_1-50.0_launch.png) | `frames/v3.js · fLaunch` |
| 36 | 1:53.5 | V3 | Coxon quit, ninety million views | [36_1-53.5_coxon.png](frames/36_1-53.5_coxon.png) | `frames/core.js · fCoxon` |
| 37 | 1:57.0 | V3 | the President: HOAX | [37_1-57.0_hoax.png](frames/37_1-57.0_hoax.png) | `frames/core.js · fHoax` |
| 38 | 2:00.0 | V3 | over ten percent, no plan | [38_2-00.0_hubinger.png](frames/38_2-00.0_hubinger.png) | `frames/v3.js · fHubinger` |
| 39 | 2:03.0 | V3 | court backs the blacklist 2–1 | [39_2-03.0_court.png](frames/39_2-03.0_court.png) | `frames/v3.js · fCourt` |
| 40 | 2:06.5 | V3 | 34 hours of sock puppets | [40_2-06.5_sock.png](frames/40_2-06.5_sock.png) | `frames/v3.js · fSock` |
| 41 | 2:09.8 | V3 | intern live, researcher ’28 · stop | [41_2-09.8_intern.png](frames/41_2-09.8_intern.png) | `frames/v3.js · fIntern` |
| 42 | 2:12.5 | STOP-TIME | paused again | [42_2-12.5_paused.png](frames/42_2-12.5_paused.png) | `frames/v3.js · fPaused` |
| 43 | 2:15.5 | STOP-TIME | maybe a year to steer | [43_2-15.5_stop.png](frames/43_2-15.5_stop.png) | `frames/core.js · fStop` |
| 44 | 2:18.5 | PC3 | Critical, then “aligned” | [44_2-18.5_astra.png](frames/44_2-18.5_astra.png) | `frames/v3.js · fAstra` |
| 45 | 2:21.5 | PC3 | an alien mind | [45_2-21.5_alien.png](frames/45_2-21.5_alien.png) | `frames/v3.js · fAlien` |
| 46 | 2:23.8 | CH3 | zoom, zoom, zoom! | [46_2-23.8_ch3zoom.png](frames/46_2-23.8_ch3zoom.png) | `frames/chorus.js · chZoom` |
| 47 | 2:26.0 | CH3 | seven hundred billion | [47_2-26.0_ch3capex.png](frames/47_2-26.0_ch3capex.png) | `frames/chorus.js · chCapex` |
| 48 | 2:29.5 | CH3 | the red line is nearing | [48_2-29.5_ch3pause.png](frames/48_2-29.5_ch3pause.png) | `frames/chorus.js · chPause` |
| 49 | 2:32.0 | CH3 | ship it half-tested | [49_2-32.0_ch3ship.png](frames/49_2-32.0_ch3ship.png) | `frames/chorus.js · chShip` |
| 50 | 2:33.6 | CH3 | can’t fall behind | [50_2-33.6_ch3china.png](frames/50_2-33.6_ch3china.png) | `frames/chorus.js · chChina` |
| 51 | 2:35.8 | CH3 | add a point · band stops | [51_2-35.8_ch3hook.png](frames/51_2-35.8_ch3hook.png) | `frames/chorus.js · chHook` |
| 52 | 2:39.5 | BRIDGE | 27 notes to its own address | [52_2-39.5_notes.png](frames/52_2-39.5_notes.png) | `frames/bridge.js · fNotes` |
| 53 | 2:46.0 | BRIDGE | flagged in 15, out through DNS | [53_2-46.0_dns.png](frames/53_2-46.0_dns.png) | `frames/bridge.js · fDNS` |
| 54 | 2:52.5 | BRIDGE 2 (hush) | rogue swarms | [54_2-52.5_swarm.png](frames/54_2-52.5_swarm.png) | `frames/bridge.js · fSwarm` |
| 55 | 2:58.5 | BRIDGE 2 | Stargate, grid under stress | [55_2-58.5_grid.png](frames/55_2-58.5_grid.png) | `frames/bridge.js · fGrid` |
| 56 | 3:03.5 | BRIDGE 2 | families read the chat logs | [56_3-03.5_logs.png](frames/56_3-03.5_logs.png) | `frames/bridge.js · fLogs` |
| 57 | 3:07.5 | BRIDGE 2 | “enough predictions”, flew blind | [57_3-07.5_blind.png](frames/57_3-07.5_blind.png) | `frames/bridge.js · fBlind` |
| 58 | 3:10.5 | BREAKDOWN | laughing it off all year | [58_3-10.5_allyear.png](frames/58_3-10.5_allyear.png) | `frames/bridge.js · fAllYear` |
| 59 | 3:15.0 | BREAKDOWN | kinda get the appeal (bare) | [59_3-15.0_confess.png](frames/59_3-15.0_confess.png) | `frames/core.js · fConfess` |
| 60 | 3:16.0 | FINAL | zoom, zoom! (a cappella) | [60_3-16.0_ch4zoom.png](frames/60_3-16.0_ch4zoom.png) | `frames/chorus.js · chZoom` |
| 61 | 3:18.8 | FINAL | nobody steering (band slams back) | [61_3-18.8_ch4capex.png](frames/61_3-18.8_ch4capex.png) | `frames/chorus.js · chCapex` |
| 62 | 3:21.5 | FINAL | the cliff edge is nearing | [62_3-21.5_ch4pause.png](frames/62_3-21.5_ch4pause.png) | `frames/chorus.js · chPause` |
| 63 | 3:23.6 | FINAL | ship it half-tested | [63_3-23.6_ch4ship.png](frames/63_3-23.6_ch4ship.png) | `frames/chorus.js · chShip` |
| 64 | 3:25.2 | FINAL | who’s left behind? | [64_3-25.2_ch4china.png](frames/64_3-25.2_ch4china.png) | `frames/chorus.js · chChina` |
| 65 | 3:27.5 | FINAL | add a point · a cappella stop | [65_3-27.5_ch4hook.png](frames/65_3-27.5_ch4hook.png) | `frames/chorus.js · chHook` |
| 66 | 3:29.2 | FINAL | who can tell? · the estimates | [66_3-29.2_who.png](frames/66_3-29.2_who.png) | `frames/ending.js · fWhoScatter` |
| 67 | 3:30.8 | FINAL | the warning shot sold for 12.9 | [67_3-30.8_final.png](frames/67_3-30.8_final.png) | `frames/core.js · fFinal` |
| 68 | 3:34.0 | FINAL | we’ll be fine · held over the shred | [68_3-34.0_fine.png](frames/68_3-34.0_fine.png) | `frames/ending.js · fFineHeld` |
| 69 | 3:37.0 | OUTRO | drop + laugh | [69_3-37.0_outrodrop.png](frames/69_3-37.0_outrodrop.png) | `frames/inst.js · fOutroDrop` |
| 70 | 3:44.0 | OUTRO | lone synth | [70_3-44.0_outrolone.png](frames/70_3-44.0_outrolone.png) | `frames/inst.js · fOutroLone` |
| 71 | 3:48.4 | HARD CUT | 1 s of silence | [71_3-48.4_end.png](frames/71_3-48.4_end.png) | `frames/inst.js · fEnd` |
