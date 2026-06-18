# Tinnitus Relief Web App — Backbone Document

> **Status:** Draft v1 · 2026-06-18
> **Purpose:** The single source of truth tying the *scientific evidence* to *what we build and how*. Everything downstream (audio engine, UI, defaults, safety copy) should trace back to a finding here.

---

## 0. One-paragraph thesis

We are building a **free, web-based tinnitus sound tool** that (a) helps a person **recreate and characterise their own tinnitus**, (b) uses that to **generate an evidence-aligned, individually-tuned sound** (frequency-matched noise / notched sound / maskers), (c) lets them **fine-tune and save** their personal sound, and (d) lets them **download a seamless, loopable file** in WAV and a compressed format. It is wrapped in honest education, strong **safe-listening limits**, and clear **"see a clinician" triage** — never diagnosis.

---

## 1. What the evidence actually supports (and what it doesn't)

A deep, fact-checked review of the literature (Cochrane review, 2024–2025 meta-analyses, foundational TMNMT trials, residual-inhibition studies, WHO safe-listening, AAO-HNS 2014 guideline). Each claim below carries a **confidence** level and primary sources. The honest headline: **sound therapy has modest, mixed evidence for *cure* or durable distress reduction, but well-established mechanistic/psychoacoustic support for *relief*.** We design for relief and self-management, and we say so plainly.

### 1.1 Headline findings

| # | Finding | Confidence | Design implication |
|---|---------|-----------|--------------------|
| F1 | **Simple masking has limited, inconclusive evidence.** Cochrane review (6 RCTs, 553 ppl) found no significant effect on loudness/severity vs active comparators — but "absence of evidence ≠ evidence of absence." | High | Don't over-promise. Position as relief/self-management, not treatment. |
| F2 | **Frequency-matching to the tinnitus pitch is psychoacoustically real.** Noise centred at the tinnitus frequency (or hearing-loss slope) masks and induces residual inhibition at *much lower intensity* (~24 dB SL lower masking level). | High | **The pitch-matcher is core.** Center generated sound on the matched pitch → quieter, safer relief. |
| F3 | **Residual inhibition (RI) is well-established** — brief suppression of tinnitus (seconds–minutes, avg ~93 s) after a sound stops. | High | Offer an optional "RI burst" mode; set expectations (temporary). |
| F4 | **Notched sound therapy** = remove a **½–1 octave band centred on the matched pitch** from broadband noise or music (lateral-inhibition mechanism; measurable cortical N1m reduction). | High | Implement a notch filter centred on matched pitch; default width 1 octave (½ allowed); **never narrower than ½ octave**. |
| F5 | **Notching works mainly for tinnitus ≤ 8 kHz.** Above 8 kHz, notched *music* shows no significant effect (little musical energy up there). | High | If matched pitch > 8 kHz, switch strategy: notched **broadband noise** / masking, and warn that notched-music evidence doesn't extend here. |
| F6 | **Notch width 1/4–1 octave doesn't change outcomes;** use 1 octave or ½ octave. | High | Width control defaults to 1 octave; clamp minimum to ½ octave. |
| F7 | **Standard dose ≈ 2 hours/day for ~3 months** (≈168 h). | High | Sleep timer + session dosing UI defaulting to ~2 h; gentle 3-month framing. |
| F8 | **Benefit is front-loaded:** biggest improvement by ~3 months, then plateaus (maintenance, not further gains). | High | Set expectations; "maintain" messaging after 3 months. |
| F9 | **Notched therapy ≈ plain music on global distress** (2024 meta-analysis, no significant THI difference; ~11% reduction, below clinical threshold). A 2025 meta-analysis found it *beats conventional music* on handicap+loudness, but borderline/fragile. | High (null) / Medium (positive) | Be candid: effects small and contested. Make the tool genuinely pleasant regardless. |
| F10 | **Where it helps, it lowers perceived *loudness* more than *distress*.** | High | Frame outcomes around loudness/relief; pair with coping content for distress. |
| F11 | **CBT + sound is complementary:** CBT lowers *distress* more; sound lowers *loudness* more. | Medium | Include CBT-style coping/education module alongside the generator. |

### 1.2 Sound-type guidance

The literature centres on **masking-in-general** and **notched** approaches. Head-to-head ranking of white vs pink vs broadband vs nature vs fractal tones is **not settled** by high-quality evidence (an open question). Practical, defensible defaults:

- **Broadband noise shaped toward the tinnitus pitch** (or its hearing-loss slope) — best psychoacoustic support (F2).
- **Notched broadband noise / notched music** — mechanism support; modest clinical effect (F4, F9).
- **Pink noise** — gentler, less harsh high end than white; widely preferred for sleep (comfort rationale, not a cure claim).
- **Nature sounds & fractal tones** — popular, pleasant, low-annoyance; offered for **comfort and adherence**, labelled as such (no strong efficacy claim).

> **Rule:** any sound we present as *comfort* vs *evidence-aligned* is labelled honestly in the UI.

---

## 2. Safety model (non-negotiable)

A sound tool used for hours/day is a **hearing-safety surface**. These are hard requirements, not options.

### 2.1 Volume / level

- **Mixing point (TRT, Jastreboff):** the ideal therapeutic level is where the external sound *just begins to blend* with the tinnitus — audible alongside it, **not** masking it, not annoying. This is **partial masking**, deliberately *below* total masking. (TRT trials found mixing-point and total-masking equally effective, so we default to the gentler, safer mixing point.)
- **WHO safe-listening budget** (verified): permissible weekly dose — **80 dB ≈ 40 h/week**, 85 dB ≈ 12.5 h/week, 90 dB ≈ 4 h/week (halves roughly every 3 dB). Personal devices: **keep volume ≤ 60% of max**, take a **10-min break every hour**.
- **Implementation:**
  - Master gain **capped**; calibration is relative (browsers can't know absolute SPL) so we (a) cap output, (b) default low, (c) show a clear "this should be soft — like a background, not a wall of sound" guide, (d) nudge toward the mixing point, not full masking.
  - **"Listening budget" awareness:** optional running timer + break reminders (every 60 min), echoing WHO guidance.
  - **Sudden-level protection:** ramp gains (no clicks/jumps); guard against feedback loops; cap on headphones.

### 2.2 Medical triage — "see a clinician" (NOT diagnosis)

See §4. The app educates and flags red-flag patterns; it never names a cause.

### 2.3 Disclaimers & guideline honesty

- **AAO-HNS 2014 Clinical Practice Guideline (verified):** **CBT is "Recommended" (Level A evidence)** for persistent bothersome tinnitus; **sound therapy is an "option"** clinicians *may* offer (weaker). The app reflects this hierarchy: sound is the engaging core, but we actively surface CBT/coping and professional care.
- Persistent disclaimer: *not a medical device, not a substitute for an audiologist/doctor.*

---

## 3. Feature: **Identify Your Tinnitus** (the clinical lynchpin)

A guided flow to **recreate the user's tinnitus sound**, producing (a) a matched **pitch + sound character** that drives the generator, and (b) **education + triage** — never a diagnosis.

### 3.1 Pitch & character matching (drives therapy)

1. **Sound character picker** — user selects what theirs is most like, with audio previews. Each maps to a generator starting point and shows the common clinical descriptor:
   - **Tonal / ringing / whistling** (pure tone) → tone or narrowband noise at matched pitch. *Most common; typically associated with noise exposure / sensorineural hearing loss.*
   - **Hissing / "shhh" / steady** (broadband) → shaped broadband noise.
   - **Buzzing / humming** (low, rough) → low-frequency tone/noise.
   - **Roaring / ocean-like** (low, fluctuating) → low-frequency shaped noise.
   - **Cricket / electric / "tea-kettle"** (very high) → high tone (flag the >8 kHz caveat, F5).
   - **Clicking / rhythmic (not heartbeat)** → *somatic/muscular pattern* (e.g. middle-ear myoclonus, TMJ) — flag for clinician; sound therapy less relevant.
   - **Pulsatile / whooshing in time with heartbeat** → **RED FLAG** (see §4); route to triage, de-emphasise the generator.
2. **Pitch match** — a frequency sweep / two-tone comparison (the "higher or lower?" method audiologists use) to find the dominant pitch. Output: a frequency (Hz/kHz).
3. **Loudness & bandwidth match** — adjust level and width until it resembles theirs (this also calibrates the *minimum* sound needed → mixing point).
4. **Laterality & timing** — left / right / both / in-head; constant / pulsatile / rhythmic. (Feeds triage.)
5. **Result → therapy mapping:**
   - Matched pitch ≤ 8 kHz → offer **notched sound centred on pitch** + frequency-shaped masking.
   - Matched pitch > 8 kHz → **notched/shaped broadband noise**, with an honest note that notched-*music* evidence doesn't extend this high.
   - Save the matched profile (see §6) so the generator opens pre-tuned to *them*.

### 3.2 Education & triage (NOT diagnosis)

A plain-language library mapping **patterns** (not the user's specific sound) to "what this can be associated with" and **when to seek care** — always framed as *possibilities*, with a prominent "only a clinician can determine the cause" banner.

**Red-flag patterns → prompt professional review** (well-established):

| Pattern the user reports | Why it matters | Action surfaced |
|---|---|---|
| **Pulsatile** (whooshing with heartbeat) | Can reflect a vascular cause needing workup | "See a doctor — ask about pulsatile tinnitus" |
| **One-sided / unilateral** | Asymmetry warrants ruling out e.g. acoustic neuroma (MRI) | "See a doctor for asymmetric tinnitus" |
| **Sudden onset + hearing loss** | Possible sudden sensorineural hearing loss — *treat within days* | "Seek urgent care now" |
| **With vertigo / fullness / fluctuating hearing** | Pattern associated with Ménière's-type presentations | "See an ENT/audiologist" |
| **With ear pain, discharge, fever** | Suggests infection | "See a doctor — possible ear infection" |
| **Recent, with blocked/muffled feeling** | Can accompany earwax (cerumen) build-up — often reversible | "A clinician can check for earwax" |
| **With new neurological symptoms** (weakness, facial droop, severe headache) | Emergency | "Seek emergency care" |

> Copy principle: *"Tinnitus is a symptom, not a disease. These notes describe possibilities and when to get checked — they are not a diagnosis. If in doubt, see a professional."*

---

## 4. Feature → component map

**Design approach (explicit):** AURUM is a **style reference and a starting toolkit, not a constraint.** The app is *not* a mixer and should not look like one — no decks, no DJ chrome. We freely (a) reuse AURUM primitives where they fit, (b) **build new, custom components** the therapy needs (pitch matcher, spectrum picker, triage cards, breathing/sleep visuals), and (c) **adapt or depart from** the obsidian-and-gold aesthetic wherever a calmer, more restful, or more accessible treatment serves tinnitus users better. The design system buys us polish and consistency for free; it does not dictate the layout or limit the component set.

The table maps features to a *likely* primitive only where one fits cleanly — everything else is purpose-built.

**Responsive requirement (explicit):** the app must **work well on mobile and make good use of space on desktop** — one codebase, fluid layout, not a stretched phone view. Principles: (1) **mobile-first** — primary actions (play/stop, master level, the current sound) reachable with a thumb; controls are large, touch-friendly hit targets (the AURUM primitives already support pointer + touch). (2) **Progressive layout** — on phones, a single focused column with the generator front-and-centre and secondary controls in collapsible sections / a bottom sheet; on tablets/desktop, a multi-column workspace (e.g. controls + live spectrum + saved profiles side-by-side) that fills the width rather than a narrow centred strip. (3) **Fluid, not fixed** — CSS grid with `minmax`/`clamp()` and container queries so panels reflow by available space, not hard breakpoints alone. (4) **Audio is layout-independent** — the Phase 1 engine has no UI assumptions, so responsiveness is purely a Phase 2 presentation concern. (5) Respect `prefers-reduced-motion` (already in tokens) and keep text/controls legible at small sizes.

| App feature | AURUM primitive(s) | Audio parameter |
|---|---|---|
| Tinnitus pitch matcher | `Knob` / sweep + `Waveform`/spectrum | center frequency (Hz) |
| Sound-character previews | `Button` / `Badge` cards | source type preset |
| Layer volumes | `Fader` / `Slider` (gain-capped) | per-layer gain |
| Master level (safety-capped) | `Fader` + `VUMeter` (real level) | master gain, true RMS/peak |
| Notch controls | `Knob` (center, width, depth) | biquad notch filter |
| Noise color (Hi/Mid/Low) | `Knob` (bipolar EQ) | 3-band EQ on noise |
| Layer on/off, loop, RI mode | `Toggle` | node enable |
| Live spectrum/visualizer | `Waveform` (rewired to AnalyserNode) | FFT of real output |
| Sleep timer / dosing | `Knob` dial + `Badge` | fade-out schedule |
| Presets / saved profiles | `Button` + `Badge` | serialized profile JSON |
| Export (WAV / compressed) | `Button` | offline render |

**Dropped from the mixer:** jog wheels, BPM, crossfader-as-DJ-tool, track library, decks. (A "blend two sources" control — notched noise vs nature sound — *is* worth keeping conceptually, restyled as a simple A/B blend, not a DJ crossfader.)

---

## 5. Audio engine architecture (Web Audio API)

**Engine = a parameter graph.** A saved profile is just the parameters; the same parameters drive both live playback and offline export. This makes "save", "share via URL", and "download" fall out for free.

```
            ┌─ Source layer(s) ─────────────┐
            │  • Noise (white/pink/brown)    │   each layer:
 profile →  │  • Tone / narrowband           │   gain → EQ (3-band) → optional notch
            │  • Nature/fractal (buffer)     │
            └───────────────┬────────────────┘
                            ▼
                  per-layer GainNode
                            ▼
                    notch BiquadFilter (center=matched pitch, Q from octave width)
                            ▼
                     master GainNode (SAFETY CAP)
                            ▼
              ┌─────────────┴──────────────┐
              ▼                             ▼
         AudioDestination            AnalyserNode → live spectrum (Waveform)
```

- **Noise generation:** white via filled `AudioBuffer`; **pink/brown** via IIR shaping (Voss-McCartney or a simple pink filter). Loop the buffer seamlessly.
- **Notch:** `BiquadFilterNode type="notch"`, `frequency = matchedPitch`, `Q` derived from desired octave width (`Q = √(2^n) / (2^n − 1)` for n octaves) — default 1 octave, clamp ≥ ½ octave (F4/F6).
- **Frequency-shaped masking:** bandpass/peaking around matched pitch for the F2 effect.
- **Real level metering:** `AnalyserNode` → true RMS/peak into `VUMeter` (honest safety signal, unlike the mixer's fake meters).
- **Export (seamless loop):** `OfflineAudioContext` renders an exact integer number of loop periods → `AudioBuffer`. Encode:
  - **WAV** — write PCM header from the buffer (no dependency).
  - **Compressed** — `lamejs` (MP3) or an OGG/Opus encoder; small, phone-friendly.
  - Seamlessness: choose a loop length that's a whole number of cycles for any periodic content; for noise, equal-power crossfade the tail into the head so the loop point is inaudible.

---

## 6. Data model & persistence

Single serializable **Profile** object is the source of truth (drives live + export + share):

```jsonc
{
  "version": 1,
  "tinnitus": { "pitchHz": 6300, "character": "tonal", "laterality": "right",
                "timing": "constant", "matchedLoudness": 0.18 },
  "layers": [
    { "type": "noise", "color": "pink", "gain": 0.4,
      "eq": { "low": 0, "mid": 0, "high": -3 },
      "notch": { "enabled": true, "centerHz": 6300, "octaves": 1.0 } },
    { "type": "nature", "preset": "rain", "gain": 0.25 }
  ],
  "master": { "gain": 0.5, "capped": true },
  "timer": { "minutes": 120, "fadeOutSec": 30 }
}
```

- **Persistence:** localStorage for the active profile + a small library of saved profiles; IndexedDB if/when we cache rendered audio or large nature-sound buffers. (User chose "full app with saved profiles.")
- **Share:** base64-encode the profile into a URL fragment — no backend needed.
- **Privacy:** all local by default; health-adjacent data never leaves the device unless the user explicitly shares/export.

---

## 7. Proposed site structure

1. **Home / "Start"** — short, calm intro; "Find your sound" CTA; honest one-liner on what this is/isn't.
2. **Identify Your Tinnitus** (§3) — pitch/character match → produces a tuned profile + triage education.
3. **Generator / Studio** — the AURUM-styled tuning surface; layers, notch, EQ, real VU, live spectrum, timer.
4. **My Sounds** — saved profiles, presets, export (WAV / compressed).
5. **Learn** — evidence (honest), how sound therapy works, dosing (~2 h/day, 3 months), CBT/coping, safe listening, **when to see a clinician**.
6. **About / Safety** — disclaimers, sources, accessibility, privacy.

---

## 8. Phased build plan

- **Phase 1 — Audio core (headless):** noise colors, tone, gain graph, master cap, seamless loop, WAV export. *Verify with real playback + level metering.*
- **Phase 2 — Generator UI:** wire AURUM primitives to the engine; live spectrum via AnalyserNode; presets.
- **Phase 3 — Identify Your Tinnitus:** pitch matcher, character picker, triage/education, profile output.
- **Phase 4 — Profiles & persistence:** save/load, share-by-URL, library.
- **Phase 5 — Export polish:** compressed format (MP3/OGG), gapless verification, filename/metadata.
- **Phase 6 — Learn/Safety content + a11y pass** (reduced-motion already in tokens; keyboard control of knobs/faders; ARIA on custom controls).
- **Cross-cutting:** safe-listening limits and disclaimers land in Phase 1–2, not bolted on later.

---

## 9. Key open questions (from the research — flagged honestly)

- Exact absolute dB / mixing-point target can't be set in-browser (no SPL calibration) → we use *relative caps + mixing-point guidance*.
- No high-quality head-to-head of white/pink/broadband/nature/fractal → we default on psychoacoustics + comfort, labelled honestly.
- Best approach for **>8 kHz** tinnitus is unsettled → notched broadband noise + candour.
- Long-term/durable benefit is weak across the board → product framing is **relief & self-management**, with CBT/clinical care surfaced per AAO-HNS.

---

## 10. Primary sources

- Cochrane — Sound therapy (masking) for tinnitus in adults (CD006371): https://www.cochrane.org/evidence/CD006371_sound-therapy-masking-management-tinnitus-adults
- Cochrane — CBT for tinnitus (CD012614): https://www.cochrane.org/evidence/CD012614_cognitive-behavioural-therapy-adults-tinnitus
- AAO-HNS Clinical Practice Guideline: Tinnitus (Tunkel et al. 2014): https://aao-hnsfjournals.onlinelibrary.wiley.com/doi/10.1177/0194599814547475
- Fournier et al. 2018, Trends in Hearing — frequency-centred masking/RI thresholds: https://journals.sagepub.com/doi/10.1177/2331216518769996
- Stein et al. 2011, PLOS ONE — "The Tinnitus Frequency Matters" (≤8 kHz): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3174191/
- Wunderlich et al. 2015, PLoS One — notch width: https://pmc.ncbi.nlm.nih.gov/articles/PMC4583393/
- Stein et al. 2016, BMC Neurology — TMNMT RCT (loudness vs distress): https://pmc.ncbi.nlm.nih.gov/articles/PMC4797223/
- Pantev/Okamoto (Münster) TMNMT mechanism: https://pmc.ncbi.nlm.nih.gov/articles/PMC3942518/
- Notched white noise + CBT RCT 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11511275/
- 2024 meta-analysis (null vs music): https://www.sciencedirect.com/science/article/abs/pii/S0196070924002539
- 2025 meta-analysis (positive, borderline): https://pubmed.ncbi.nlm.nih.gov/39992369/
- Residual inhibition review: https://pmc.ncbi.nlm.nih.gov/articles/PMC7940720/
- TRT mixing point vs total masking (equally effective): https://pubmed.ncbi.nlm.nih.gov/22609540/
- WHO safe listening: https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening

*Caveats: evidence is uneven (the flagship Cochrane masking review predates notched/fractal modalities; many trials are small n=8–100; effects often small/sub-clinical; positive and null meta-analyses coexist). The tool is honest about this.*
