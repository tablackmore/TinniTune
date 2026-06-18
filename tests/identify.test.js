import { test } from 'node:test';
import assert from 'node:assert/strict';

import { triage, SEVERITY_RANK } from '../src/identify/triage.js';
import { recommend } from '../src/identify/recommend.js';
import { validateProfile } from '../src/audio/profile.js';

const has = (flags, id) => flags.some((f) => f.id === id);
const find = (flags, id) => flags.find((f) => f.id === id);

// ───────────────────────────── Triage ─────────────────────────────

test('triage always includes the non-diagnosis disclaimer', () => {
  const { flags } = triage({ character: 'tonal', laterality: 'both', timing: 'constant', onset: 'gradual', symptoms: [] });
  assert.ok(has(flags, 'not-a-diagnosis'), 'disclaimer flag should always be present');
});

test('benign presentation yields no red flags (top severity info)', () => {
  const r = triage({ character: 'tonal', laterality: 'both', timing: 'constant', onset: 'gradual', symptoms: [] });
  assert.equal(r.topSeverity, 'info');
  assert.ok(!r.flags.some((f) => f.severity === 'urgent' || f.severity === 'emergency'));
});

test('pulsatile tinnitus is flagged urgent (vascular workup)', () => {
  const r = triage({ character: 'pulsatile', laterality: 'left', timing: 'pulsatile', onset: 'gradual', symptoms: [] });
  assert.ok(has(r.flags, 'pulsatile'));
  assert.equal(find(r.flags, 'pulsatile').severity, 'urgent');
});

test('sudden onset with hearing loss is an emergency', () => {
  const r = triage({ character: 'tonal', laterality: 'left', timing: 'constant', onset: 'sudden', symptoms: ['hearingLoss'] });
  assert.ok(has(r.flags, 'sudden-hearing-loss'));
  assert.equal(find(r.flags, 'sudden-hearing-loss').severity, 'emergency');
  assert.equal(r.topSeverity, 'emergency');
});

test('unilateral tinnitus prompts clinician review (asymmetry)', () => {
  const r = triage({ character: 'tonal', laterality: 'right', timing: 'constant', onset: 'gradual', symptoms: [] });
  assert.ok(has(r.flags, 'unilateral'));
  assert.equal(find(r.flags, 'unilateral').severity, 'see-clinician');
});

test('bilateral / in-head tinnitus does NOT raise the unilateral flag', () => {
  for (const laterality of ['both', 'inHead']) {
    const r = triage({ character: 'tonal', laterality, timing: 'constant', onset: 'gradual', symptoms: [] });
    assert.ok(!has(r.flags, 'unilateral'), `${laterality} should not flag unilateral`);
  }
});

test('clicking / rhythmic is flagged as somatic (info, sound therapy less relevant)', () => {
  const r = triage({ character: 'clicking', laterality: 'both', timing: 'rhythmic', onset: 'gradual', symptoms: [] });
  assert.ok(has(r.flags, 'somatic-clicking'));
});

test('neurological symptoms escalate to emergency', () => {
  const r = triage({ character: 'tonal', laterality: 'both', timing: 'constant', onset: 'gradual', symptoms: ['neuro'] });
  assert.equal(find(r.flags, 'neuro').severity, 'emergency');
});

test('ear pain / discharge / fever suggests infection (see clinician)', () => {
  const r = triage({ character: 'hissing', laterality: 'both', timing: 'constant', onset: 'gradual', symptoms: ['earPainOrDischarge'] });
  assert.ok(has(r.flags, 'infection'));
  assert.equal(find(r.flags, 'infection').severity, 'see-clinician');
});

test('flags are sorted most-severe first', () => {
  const r = triage({ character: 'pulsatile', laterality: 'right', timing: 'pulsatile', onset: 'sudden', symptoms: ['hearingLoss', 'neuro'] });
  for (let i = 1; i < r.flags.length; i++) {
    assert.ok(SEVERITY_RANK[r.flags[i - 1].severity] >= SEVERITY_RANK[r.flags[i].severity],
      'flags must be in non-increasing severity order');
  }
  assert.equal(r.topSeverity, 'emergency');
});

// ───────────────────────────── Recommend ─────────────────────────────

test('pitch ≤ 8 kHz recommends notched sound centred on the pitch', () => {
  const r = recommend({ pitchHz: 6000, character: 'tonal' });
  assert.equal(r.strategy, 'notched');
  assert.equal(validateProfile(r.profile).ok, true);
  const layer = r.profile.layers[0];
  assert.equal(layer.notch.enabled, true);
  assert.equal(layer.notch.centerHz, 6000);
  assert.ok(layer.notch.octaves >= 0.5 && layer.notch.octaves <= 1.0);
});

test('pitch > 8 kHz switches to broadband masking with an honest caveat', () => {
  const r = recommend({ pitchHz: 11000, character: 'cricket' });
  assert.equal(r.strategy, 'broadband-masking');
  assert.equal(r.profile.layers[0].notch.enabled, false);
  assert.ok(r.caveats.some((c) => /8\s?kHz/i.test(c)), 'should warn that notched evidence stops ~8 kHz');
  assert.equal(validateProfile(r.profile).ok, true);
});

test('no matched pitch falls back to plain masking (no notch)', () => {
  const r = recommend({ pitchHz: null, character: 'hissing' });
  assert.equal(r.strategy, 'masking');
  assert.equal(r.profile.layers[0].notch.enabled, false);
  assert.equal(validateProfile(r.profile).ok, true);
});

test('character maps to a sensible default noise color', () => {
  assert.equal(recommend({ pitchHz: 2000, character: 'buzzing' }).profile.layers[0].color, 'brown');
  assert.equal(recommend({ pitchHz: 2000, character: 'roaring' }).profile.layers[0].color, 'brown');
  assert.equal(recommend({ pitchHz: 5000, character: 'hissing' }).profile.layers[0].color, 'white');
  assert.equal(recommend({ pitchHz: 5000, character: 'tonal' }).profile.layers[0].color, 'pink');
});

test('recommended profile opens at a safe, quiet master level', () => {
  const r = recommend({ pitchHz: 4000, character: 'tonal' });
  assert.ok(r.profile.master.gain <= 0.4);
});

test('pulsatile / clicking steer to clinical care first, not a therapy notch', () => {
  for (const character of ['pulsatile', 'clicking']) {
    const r = recommend({ pitchHz: 4000, character });
    assert.equal(r.strategy, 'see-clinician-first', `${character} should steer to care`);
    assert.equal(r.profile.layers[0].notch.enabled, false, `${character} should not push a notch`);
    assert.ok(/clinician|doctor|checked|care/i.test(r.explanation), 'explanation should steer to care');
    assert.equal(validateProfile(r.profile).ok, true);
  }
});
