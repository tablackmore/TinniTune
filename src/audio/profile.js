// ============================================================
//  Profile — the single serializable source of truth.
//  Drives live playback, offline export, save, and share-by-URL.
//  Pure (no Web Audio), so it validates/clamps anywhere.
// ============================================================

/**
 * MASTER_GAIN_CEILING — the hard cap on output gain (linear, 0..1).
 *
 * A browser CANNOT know the real-world SPL (it depends on the user's
 * device/headphones/OS volume), so this is a *relative* safeguard, not a
 * calibrated dB limit. Rationale for 0.6: it mirrors the WHO "keep volume
 * ≤ 60% of maximum" personal-audio guidance, and tinnitus sound therapy
 * intentionally targets the "mixing point" (partial masking — sound that
 * just blends with the tinnitus), which should be soft. Output can never
 * exceed this even if a slider/profile asks for more.
 *
 * ▸ This is a safety policy decision — see docs/BACKBONE.md §2.1.
 */
export const MASTER_GAIN_CEILING = 0.6;

/** Clamp any requested master gain into the safe range [0, ceiling]. */
export function clampMasterGain(gain) {
  if (!Number.isFinite(gain) || gain < 0) return 0;
  return Math.min(gain, MASTER_GAIN_CEILING);
}

/**
 * The default profile: pink noise at a low, safe level, plus a (disabled)
 * notch ready to be centred on the user's matched pitch. Opens quiet.
 */
export const DEFAULT_PROFILE = Object.freeze({
  version: 1,
  tinnitus: { pitchHz: null, character: null, laterality: null, timing: null, matchedLoudness: null },
  layers: [
    {
      type: 'noise',
      color: 'pink',
      gain: 0.5,
      notch: { enabled: false, centerHz: 4000, octaves: 1.0 },
    },
  ],
  master: { gain: 0.35 },   // deliberately quiet on first launch
  timer: { minutes: 0, fadeOutSec: 30 },
});

const NOISE_COLORS = new Set(['white', 'pink', 'brown']);
const LAYER_TYPES = new Set(['noise', 'tone']);

/**
 * Validate a profile's shape. Returns {ok, errors}. Kept permissive on
 * optional fields but strict on anything the engine indexes into.
 */
export function validateProfile(p) {
  const errors = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['profile is not an object'] };
  if (p.version !== 1) errors.push('unsupported version');
  if (!Array.isArray(p.layers)) errors.push('layers must be an array');
  else {
    p.layers.forEach((l, i) => {
      if (!LAYER_TYPES.has(l?.type)) errors.push(`layer ${i}: bad type`);
      if (l?.type === 'noise' && !NOISE_COLORS.has(l.color)) errors.push(`layer ${i}: bad noise color`);
      if (l?.type === 'tone' && !(l.freqHz > 0)) errors.push(`layer ${i}: tone needs freqHz > 0`);
      if (!Number.isFinite(l?.gain)) errors.push(`layer ${i}: gain must be a number`);
    });
  }
  if (!p.master || !Number.isFinite(p.master.gain)) errors.push('master.gain must be a number');
  return { ok: errors.length === 0, errors };
}

/** Octave notch width → biquad Q. n octaves between -3dB points. */
export function octavesToQ(octaves) {
  const n = Math.max(0.5, octaves); // never narrower than 1/2 octave (evidence: F6)
  return Math.sqrt(2 ** n) / (2 ** n - 1);
}
