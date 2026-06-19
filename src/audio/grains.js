// ============================================================
//  Grain generator — pure. Sparse, randomly-timed enveloped
//  noise bursts: the raw material for crackle (campfire) and
//  droplet ticks (rain on a tent). Bandpass-shaped later in the graph.
//  Bake into a looped buffer so it works live + offline identically.
// ============================================================

import { mulberry32 } from './noise.js';

/**
 * Fill `buf` with decaying white-noise bursts at random times.
 * @param {Float32Array} buf
 * @param {number} sampleRate
 * @param {{ rate?: number, decaySec?: number, attackSec?: number, seed?: number, amp?: number }} opts
 *   rate      — average bursts per second
 *   decaySec  — exponential decay time constant of each burst
 *   attackSec — soft fade-in before the decay (0 = instant click; >0 = "wash")
 *   amp       — peak amplitude (randomly varied per burst)
 */
export function fillGrains(buf, sampleRate, { rate = 8, decaySec = 0.04, attackSec = 0, seed = 1, amp = 0.85 } = {}) {
  buf.fill(0);
  if (rate <= 0) return buf;
  const rng = mulberry32(seed);
  const p = rate / sampleRate;                 // per-sample probability of a new burst
  const tau = Math.max(1, decaySec * sampleRate);
  const atk = Math.max(0, attackSec * sampleRate);
  const burstLen = Math.ceil(atk + tau * 6);   // attack + decay out to ~e^-6 (inaudible)

  for (let i = 0; i < buf.length; i++) {
    if (rng() < p) {
      const a = amp * (0.4 + 0.6 * rng());      // vary loudness per burst
      const end = Math.min(buf.length, i + burstLen);
      for (let j = i; j < end; j++) {
        const t = j - i;
        // smooth (raised-cosine) attack ramp, then exponential decay
        const env = t < atk
          ? 0.5 - 0.5 * Math.cos((t / atk) * Math.PI)
          : Math.exp(-(t - atk) / tau);
        buf[j] += (rng() * 2 - 1) * a * env;
      }
    }
  }
  for (let i = 0; i < buf.length; i++) {
    buf[i] = buf[i] < -1 ? -1 : buf[i] > 1 ? 1 : buf[i];
  }
  return buf;
}
