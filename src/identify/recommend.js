// ============================================================
//  Recommend — pure. Turns a matched tinnitus pitch + character
//  into an evidence-aligned starting Profile for the studio.
//
//  Evidence (docs/BACKBONE.md §1): frequency-matching is the best-
//  replicated principle; notched therapy is supported mainly for
//  pitches ≤ 8 kHz; above that, fall back to shaped broadband masking
//  and say so honestly. Notch width ½–1 octave (never narrower).
// ============================================================

const NOTCH_CEILING_HZ = 8000;

/** Character → a sensible default noise color (comfort + spectral fit). */
function colorFor(character) {
  switch (character) {
    case 'buzzing':
    case 'roaring': return 'brown';   // low, rumbly
    case 'hissing': return 'white';   // broad, bright
    case 'tonal':
    case 'cricket':
    default: return 'pink';           // warm, balanced
  }
}

/**
 * @param {{ pitchHz: number|null, character: string }} input
 * @returns {{ strategy, profile, explanation, caveats: string[] }}
 */
export function recommend({ pitchHz = null, character = 'tonal' } = {}) {
  const color = colorFor(character);
  const caveats = [];
  let strategy, notch, explanation;

  // Patterns that point to a specific cause — steer to care first; a soothing
  // masking sound is offered only as comfort, never as the headline.
  if (character === 'pulsatile' || character === 'clicking') {
    const profile = {
      version: 1,
      tinnitus: { pitchHz: Number.isFinite(pitchHz) ? Math.round(pitchHz) : null, character },
      layers: [{ type: 'noise', color: 'pink', gain: 0.4, notch: { enabled: false, centerHz: 4000, octaves: 1.0 } }],
      master: { gain: 0.3 },
      timer: { minutes: 0, fadeOutSec: 30 },
    };
    return {
      strategy: 'see-clinician-first',
      profile,
      explanation: character === 'pulsatile'
        ? 'Whooshing in time with your heartbeat should be checked by a doctor before relying on sound therapy. If you find background sound soothing meanwhile, here is a gentle masking option.'
        : 'Rhythmic clicking often comes from muscle or jaw activity rather than the inner ear, so sound therapy is usually less relevant. Please get it checked; a gentle masking option is here if you find it soothing.',
      caveats: ['This pattern warrants professional review — see the guidance above.'],
    };
  }

  if (!Number.isFinite(pitchHz) || pitchHz <= 0) {
    strategy = 'masking';
    notch = { enabled: false, centerHz: 4000, octaves: 1.0 };
    explanation = 'No matched pitch yet — start with comfortable broadband masking and tune by ear. Match your pitch to unlock frequency-centred and notched options.';
  } else if (pitchHz <= NOTCH_CEILING_HZ) {
    strategy = 'notched';
    notch = { enabled: true, centerHz: Math.round(pitchHz), octaves: 1.0 };
    explanation = `Notched ${color} noise with a 1-octave band removed around your matched pitch (${Math.round(pitchHz)} Hz). This targets the frequency-matching evidence while keeping the sound gentle.`;
  } else {
    strategy = 'broadband-masking';
    notch = { enabled: false, centerHz: Math.round(pitchHz), octaves: 1.0 };
    explanation = `Your matched pitch (${Math.round(pitchHz)} Hz) is high. We use shaped broadband masking rather than notched sound here.`;
    caveats.push('Notched-sound evidence is strongest for tinnitus at or below ~8 kHz; above that, notched music/noise has not shown clear benefit, so we default to gentle broadband masking.');
  }

  const profile = {
    version: 1,
    tinnitus: { pitchHz: Number.isFinite(pitchHz) ? Math.round(pitchHz) : null, character },
    layers: [{ type: 'noise', color, gain: 0.5, notch }],
    master: { gain: 0.35 },          // quiet, mixing-point oriented
    timer: { minutes: 0, fadeOutSec: 30 },
  };

  return { strategy, profile, explanation, caveats };
}
