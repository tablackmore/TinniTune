// ============================================================
//  Noise generation — pure DSP over Float32Array.
//  No Web Audio dependency, so this is unit-testable in Node.
//  Each `fill*` writes mono samples in [-1, 1] into the buffer.
// ============================================================

/**
 * mulberry32 — a tiny, fast, seedable PRNG.
 * We use a seedable RNG (not Math.random) so noise buffers are
 * reproducible in tests and shareable/deterministic from a profile seed.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** White noise: flat spectrum, uncorrelated samples. */
export function fillWhite(buf, rng = Math.random) {
  for (let i = 0; i < buf.length; i++) buf[i] = rng() * 2 - 1;
  return buf;
}

/**
 * Pink noise (~ -3 dB/octave): equal energy per octave — warmer, less
 * harsh than white, and the most common "comfortable" masking noise.
 * Paul Kellet's economical filter approximation.
 */
export function fillPink(buf, rng = Math.random) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < buf.length; i++) {
    const w = rng() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    // The filter sums to roughly ±5; scale to keep within [-1, 1].
    pink *= 0.11;
    buf[i] = Math.max(-1, Math.min(1, pink));
  }
  return buf;
}

/**
 * Brown / red noise (~ -6 dB/octave): a bounded random walk (leaky
 * integrator of white). Deep, rumbly — good for low-pitch tinnitus.
 */
export function fillBrown(buf, rng = Math.random) {
  let last = 0;
  for (let i = 0; i < buf.length; i++) {
    const w = rng() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;       // leaky integrator (DC-stable)
    buf[i] = Math.max(-1, Math.min(1, last * 3.5)); // normalise to usable level
  }
  return buf;
}

/**
 * Lag-1 autocorrelation — a cheap proxy for spectral "redness".
 * White ≈ 0; pink > white; brown ≈ near 1 (smooth, slowly varying).
 * Used in tests to assert the colors are ordered correctly.
 */
export function lag1Autocorr(buf) {
  let mean = 0;
  for (const v of buf) mean += v;
  mean /= buf.length;
  let num = 0, den = 0;
  for (let i = 1; i < buf.length; i++) {
    num += (buf[i] - mean) * (buf[i - 1] - mean);
  }
  for (let i = 0; i < buf.length; i++) {
    den += (buf[i] - mean) * (buf[i] - mean);
  }
  return den === 0 ? 0 : num / den;
}

/** Convenience dispatch by color name. */
export function fillNoise(color, buf, rng = Math.random) {
  switch (color) {
    case 'white': return fillWhite(buf, rng);
    case 'pink': return fillPink(buf, rng);
    case 'brown': return fillBrown(buf, rng);
    default: throw new Error(`unknown noise color: ${color}`);
  }
}
