import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillGrains } from '../src/audio/grains.js';
import { mulberry32 } from '../src/audio/noise.js';

const energy = (b) => { let s = 0; for (const v of b) s += v * v; return s; };

test('grains are deterministic for a seed', () => {
  const a = new Float32Array(44100); fillGrains(a, 44100, { rate: 10, seed: 5 });
  const b = new Float32Array(44100); fillGrains(b, 44100, { rate: 10, seed: 5 });
  assert.deepEqual(a, b);
});

test('grains stay within [-1, 1]', () => {
  const buf = new Float32Array(88200);
  fillGrains(buf, 44100, { rate: 30, decaySec: 0.05, seed: 2, amp: 1 });
  for (const v of buf) assert.ok(v >= -1 && v <= 1, `out of range: ${v}`);
});

test('at a low rate the signal is sparse (silence between bursts)', () => {
  const buf = new Float32Array(44100 * 2);
  fillGrains(buf, 44100, { rate: 4, decaySec: 0.008, seed: 7 });
  let nearZero = 0;
  for (const v of buf) if (Math.abs(v) < 1e-4) nearZero++;
  assert.ok(nearZero / buf.length > 0.5, `expected mostly silence, got ${(nearZero / buf.length).toFixed(2)} near-zero`);
});

test('higher rate yields more total energy (more events)', () => {
  const lo = new Float32Array(44100 * 2); fillGrains(lo, 44100, { rate: 4, seed: 3 });
  const hi = new Float32Array(44100 * 2); fillGrains(hi, 44100, { rate: 40, seed: 3 });
  assert.ok(energy(hi) > energy(lo) * 3, `expected hi >> lo: ${energy(hi).toFixed(1)} vs ${energy(lo).toFixed(1)}`);
});

test('an empty rate produces silence', () => {
  const buf = new Float32Array(4410); fillGrains(buf, 44100, { rate: 0, seed: 1 });
  assert.equal(energy(buf), 0);
});
