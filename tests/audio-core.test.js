import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mulberry32, fillWhite, fillPink, fillBrown, lag1Autocorr } from '../src/audio/noise.js';
import { encodeWav, parseWav } from '../src/audio/wav.js';
import { crossfadeLoop } from '../src/audio/loop.js';
import { DEFAULT_PROFILE, MASTER_GAIN_CEILING, clampMasterGain, validateProfile } from '../src/audio/profile.js';

// ───────────────────────────── Noise ─────────────────────────────

test('mulberry32 is deterministic for a given seed', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test('white noise stays within [-1, 1] and is ~zero mean', () => {
  const buf = new Float32Array(20000);
  fillWhite(buf, mulberry32(1));
  let min = Infinity, max = -Infinity, sum = 0;
  for (const v of buf) { if (v < min) min = v; if (v > max) max = v; sum += v; }
  assert.ok(min >= -1 && max <= 1, `out of range: ${min}..${max}`);
  assert.ok(Math.abs(sum / buf.length) < 0.05, `mean too far from 0: ${sum / buf.length}`);
});

test('pink and brown are "redder" than white (higher lag-1 autocorrelation)', () => {
  const n = 40000;
  const white = new Float32Array(n); fillWhite(white, mulberry32(7));
  const pink = new Float32Array(n); fillPink(pink, mulberry32(7));
  const brown = new Float32Array(n); fillBrown(brown, mulberry32(7));
  const rWhite = lag1Autocorr(white);
  const rPink = lag1Autocorr(pink);
  const rBrown = lag1Autocorr(brown);
  // Spectral "redness" ordering: brown > pink > white.
  assert.ok(rWhite < rPink, `expected white(${rWhite.toFixed(3)}) < pink(${rPink.toFixed(3)})`);
  assert.ok(rPink < rBrown, `expected pink(${rPink.toFixed(3)}) < brown(${rBrown.toFixed(3)})`);
});

test('all noise colors stay within [-1, 1]', () => {
  for (const fill of [fillWhite, fillPink, fillBrown]) {
    const buf = new Float32Array(20000);
    fill(buf, mulberry32(3));
    for (const v of buf) assert.ok(v >= -1 && v <= 1, `${fill.name} out of range: ${v}`);
  }
});

// ───────────────────────────── WAV ─────────────────────────────

test('encodeWav writes a valid 16-bit PCM RIFF/WAVE header', () => {
  const sampleRate = 44100;
  const channelData = [new Float32Array([0, 0.5, -0.5, 1, -1])];
  const buf = encodeWav({ channelData, sampleRate });
  const dv = new DataView(buf);
  const tag = (o) => String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
  assert.equal(tag(0), 'RIFF');
  assert.equal(tag(8), 'WAVE');
  assert.equal(tag(12), 'fmt ');
  assert.equal(dv.getUint32(16, true), 16, 'fmt chunk size');
  assert.equal(dv.getUint16(20, true), 1, 'PCM format');
  assert.equal(dv.getUint16(22, true), 1, 'channels');
  assert.equal(dv.getUint32(24, true), sampleRate, 'sample rate');
  assert.equal(dv.getUint16(34, true), 16, 'bits per sample');
  assert.equal(tag(36), 'data');
  assert.equal(dv.getUint32(40, true), 5 * 2, 'data size (5 samples * 2 bytes)');
  assert.equal(buf.byteLength, 44 + 5 * 2, 'total file size');
});

test('encodeWav round-trips sample values within 16-bit quantization', () => {
  const sampleRate = 48000;
  const input = new Float32Array([0, 0.25, -0.25, 0.999, -0.999]);
  const buf = encodeWav({ channelData: [input], sampleRate });
  const { channelData, sampleRate: sr } = parseWav(buf);
  assert.equal(sr, sampleRate);
  for (let i = 0; i < input.length; i++) {
    assert.ok(Math.abs(channelData[0][i] - input[i]) < 1 / 32767 + 1e-6,
      `sample ${i}: ${channelData[0][i]} vs ${input[i]}`);
  }
});

test('encodeWav interleaves stereo channels', () => {
  const buf = encodeWav({ channelData: [new Float32Array([1, 1]), new Float32Array([-1, -1])], sampleRate: 44100 });
  const dv = new DataView(buf);
  assert.equal(dv.getUint16(22, true), 2, 'channels');
  assert.equal(dv.getUint16(32, true), 4, 'block align = channels * bytes/sample');
  // first frame: L then R
  assert.equal(dv.getInt16(44, true), 32767);
  assert.equal(dv.getInt16(46, true), -32767);
});

// ───────────────────────────── Seamless loop ─────────────────────────────

test('crossfadeLoop shortens the buffer by the fade length', () => {
  const n = 1000, fade = 100;
  const out = crossfadeLoop(new Float32Array(n).fill(0.3), 1000, fade / 1000);
  assert.equal(out.length, n - fade);
});

test('crossfadeLoop makes the loop seam continuous', () => {
  // A ramp 0..1; naive looping would jump 1.0 -> 0.0 at the seam.
  const n = 1000, fadeSamples = 100, sr = 1000;
  const ramp = new Float32Array(n);
  for (let i = 0; i < n; i++) ramp[i] = i / n;
  const out = crossfadeLoop(ramp, sr, fadeSamples / sr);
  // out[0] should equal the original sample at index (n - fadeSamples) (gOut(0)=1, gIn(0)=0),
  // and out's last sample (ramp[n-fadeSamples-1]) is contiguous with ramp[n-fadeSamples] == out[0].
  assert.ok(Math.abs(out[0] - ramp[n - fadeSamples]) < 1e-6,
    `out[0]=${out[0]} should ≈ ramp[n-fade]=${ramp[n - fadeSamples]}`);
  const seamJump = Math.abs(out[0] - out[out.length - 1]);
  assert.ok(seamJump < 1.5 / n, `seam jump too large: ${seamJump}`);
});

test('crossfadeLoop output stays within [-1, 1] for noise input', () => {
  const n = 20000, sr = 44100;
  const noise = new Float32Array(n); fillPink(noise, mulberry32(9));
  const out = crossfadeLoop(noise, sr, 0.05);
  for (const v of out) assert.ok(v >= -1 && v <= 1, `out of range: ${v}`);
});

// ───────────────────────────── Profile / safety ─────────────────────────────

test('master gain is clamped to the safety ceiling', () => {
  assert.equal(clampMasterGain(2.0), MASTER_GAIN_CEILING);
  assert.equal(clampMasterGain(-1), 0);
  assert.equal(clampMasterGain(MASTER_GAIN_CEILING / 2), MASTER_GAIN_CEILING / 2);
});

test('safety ceiling is conservative (well below unity)', () => {
  assert.ok(MASTER_GAIN_CEILING <= 0.7, `ceiling ${MASTER_GAIN_CEILING} should be conservative`);
});

test('DEFAULT_PROFILE validates and opens at a low, safe master level', () => {
  assert.equal(validateProfile(DEFAULT_PROFILE).ok, true);
  assert.ok(DEFAULT_PROFILE.master.gain <= MASTER_GAIN_CEILING);
  assert.ok(DEFAULT_PROFILE.master.gain <= 0.5, 'should default quiet');
});

test('validateProfile rejects malformed profiles', () => {
  assert.equal(validateProfile(null).ok, false);
  assert.equal(validateProfile({}).ok, false);
  assert.equal(validateProfile({ version: 1, layers: 'nope', master: { gain: 0.5 } }).ok, false);
});
