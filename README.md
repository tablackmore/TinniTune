# TinniTune

**A free, web-based tinnitus relief sound tool.** Match the sound you hear, tune an evidence-aligned relief sound to it, save and share it, and download a seamless loop to play on repeat.

🔊 **Live:** https://tablackmore.github.io/TinniTune/

> **What it is:** a self-management tool grounded in the published literature, with strong safe-listening limits and honest "see a clinician" guidance.
> **What it isn't:** a medical device, or a substitute for an audiologist or doctor. Sound therapy can offer *relief* and help habituation; evidence for a durable *cure* is limited — and TinniTune says so plainly.

---

## Features

- **Identify Your Tinnitus** — a pure-tone **pitch matcher** and sound-character picker that recreate your tinnitus, plus **education & triage** that flags patterns worth getting checked (it never diagnoses).
- **The Studio** — generate **white / pink / brown** noise, apply a **notch centred on your pitch** (a faithful ½–1 octave band-reject), watch a **live spectrum**, and monitor a **real output meter**.
- **Safety-first** — output is hard-capped, opens quiet, and is oriented to the gentle "mixing point" (partial masking), echoing WHO safe-listening guidance.
- **Saved profiles & sharing** — save personal sounds on-device, **share them as a link** (no backend — the sound is encoded in the URL), and reload instantly.
- **Download seamless loops** — gapless **WAV** export you can play on repeat in any player.
- **Works on mobile and desktop** — one responsive interface, thumb-friendly on phones, space-filling on desktop.

## The evidence behind it

The defaults aren't guesswork. They come from a fact-checked review of the literature (Cochrane, AAO-HNS 2014 guideline, TMNMT trials, residual-inhibition studies, WHO safe-listening), captured in the backbone document:

📄 **[Research & design document → `docs/BACKBONE.md`](docs/BACKBONE.md)**

Headlines that shaped the build: frequency-matching to your pitch is the best-replicated principle; notched therapy is supported mainly for pitches ≤ 8 kHz; benefit front-loads over ~3 months at ~2 h/day; sound lowers perceived *loudness* while CBT lowers *distress* (so we surface clinical care, per AAO-HNS). The document is candid that effects are modest and contested.

## Run locally

No build step. Serve the folder over HTTP (ES modules + the design system are fetched at runtime, so `file://` won't work):

```bash
python3 -m http.server 8731
# then open http://localhost:8731/
```

Run the unit tests (pure DSP, WAV codec, seamless loop, triage rules, recommendation logic, profile store/share):

```bash
npm test          # node --test
```

## Project structure

```
index.html              landing page (GitHub Pages entry)
app/
  identify.html         "Identify Your Tinnitus" — pitch matcher + triage
  index.html            the Studio — generator, spectrum, profiles, export
src/
  audio/                engine (browser) + pure DSP (noise, wav, loop, profile, graph)
  identify/             triage + recommendation (pure, unit-tested)
  profile/              saved-profile store + URL share codec (pure)
design-system/          the AURUM design system (tokens + components)
docs/BACKBONE.md        the research & design document
tests/                  node --test suites for all pure logic
dev/audio-core.html     Phase-1 audio engine test harness
```

## How it works

A tuned sound is just a serializable **profile** (noise colour, gains, notch centre/width, master). The same profile drives live playback (Web Audio `AudioContext`), the offline render for download (`OfflineAudioContext` → seamless-crossfaded WAV), saved profiles, and share links. The notch is a parallel cascaded low-pass ∥ high-pass band-reject; the spectrum and meter read the real signal via an `AnalyserNode`.

UI is built on the **AURUM** design system (obsidian + gold), composed at runtime — no bundler.

## Safety & scope

TinniTune offers relief and self-management. It is **not a medical device**. Tinnitus is a symptom, not a disease, and the sound you hear cannot identify its cause. Seek professional care — especially for **one-sided**, **pulsatile** (heartbeat-synced), or **sudden tinnitus with hearing loss**.

## License

MIT (see `LICENSE`).
