// ============================================================
//  Seamless looping — pure.
//  Equal-power crossfade of a buffer's tail into its head so the
//  loop point is inaudible. Essential for a downloaded file that
//  the user plays "on repeat" with no click every N seconds.
// ============================================================

/**
 * Produce a seamlessly-loopable buffer by crossfading the last `fade`
 * samples over the first `fade` samples (equal-power sin/cos curves).
 *
 * The result is `fade` samples shorter than the input. When looped:
 *   …result[L-f-1] = buf[L-f-1]  →  result[0] = buf[L-f]
 * which are *adjacent samples of the original* — hence continuous.
 *
 * @param {Float32Array} buf      source samples
 * @param {number} sampleRate     Hz
 * @param {number} fadeSec        crossfade duration in seconds
 * @returns {Float32Array}        looped buffer (length = buf.length - fadeSamples)
 */
export function crossfadeLoop(buf, sampleRate, fadeSec = 0.05) {
  const L = buf.length;
  let fade = Math.round(fadeSec * sampleRate);
  fade = Math.max(1, Math.min(fade, Math.floor(L / 2)));
  const out = new Float32Array(L - fade);

  // Straight copy of the middle section (indices fade … L-fade-1).
  for (let i = fade; i < L - fade; i++) out[i] = buf[i];

  // Crossfade region: blend head (fading in) with tail (fading out).
  const HALF_PI = Math.PI / 2;
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    const gIn = Math.sin(t * HALF_PI);
    const gOut = Math.cos(t * HALF_PI);
    out[i] = gIn * buf[i] + gOut * buf[L - fade + i];
  }
  return out;
}
