import { test } from 'node:test';
import assert from 'node:assert/strict';

import { encodeProfile, decodeProfile, buildShareUrl, parseShareHash } from '../src/profile/share.js';
import { createProfileStore } from '../src/profile/store.js';

const sampleProfile = () => ({
  version: 1,
  tinnitus: { pitchHz: 6300, character: 'tonal' },
  layers: [{ type: 'noise', color: 'pink', gain: 0.5, notch: { enabled: true, centerHz: 6300, octaves: 1.0 } }],
  master: { gain: 0.35 },
  timer: { minutes: 0, fadeOutSec: 30 },
});

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

// ───────────────────────────── Share codec ─────────────────────────────

test('encode → decode round-trips a profile exactly', () => {
  const p = sampleProfile();
  const decoded = decodeProfile(encodeProfile(p));
  assert.deepEqual(decoded, p);
});

test('encoded form is URL-safe (no +, /, =, or whitespace)', () => {
  const s = encodeProfile(sampleProfile());
  assert.ok(!/[+/=\s]/.test(s), `not URL-safe: ${s}`);
});

test('decodeProfile returns null on garbage or tampered input', () => {
  assert.equal(decodeProfile('not-base64!!!'), null);
  assert.equal(decodeProfile(''), null);
  assert.equal(decodeProfile(encodeProfile({ version: 2, junk: true })), null, 'invalid profile rejected');
});

test('buildShareUrl + parseShareHash round-trip', () => {
  const p = sampleProfile();
  const url = buildShareUrl('https://example.com/app/', p);
  assert.ok(url.includes('#p='));
  const hash = '#' + url.split('#')[1];
  assert.deepEqual(parseShareHash(hash), p);
});

test('parseShareHash ignores hashes without our key', () => {
  assert.equal(parseShareHash('#section'), null);
  assert.equal(parseShareHash(''), null);
});

// ───────────────────────────── Profile store ─────────────────────────────

test('save then get returns the stored profile', () => {
  const store = createProfileStore(fakeStorage());
  store.save('Night pink', sampleProfile(), 1000);
  assert.deepEqual(store.get('Night pink'), sampleProfile());
});

test('list returns saved profiles newest-first with metadata', () => {
  const store = createProfileStore(fakeStorage());
  store.save('A', sampleProfile(), 1000);
  store.save('B', sampleProfile(), 2000);
  const list = store.list();
  assert.equal(list.length, 2);
  assert.deepEqual(list.map((e) => e.name), ['B', 'A']); // newest first
  assert.equal(list[0].savedAt, 2000);
  assert.ok(list[0].profile);
});

test('saving the same name overwrites (no duplicates)', () => {
  const store = createProfileStore(fakeStorage());
  store.save('X', sampleProfile(), 1000);
  const edited = sampleProfile(); edited.master.gain = 0.2;
  store.save('X', edited, 1500);
  assert.equal(store.list().length, 1);
  assert.equal(store.get('X').master.gain, 0.2);
});

test('remove deletes a profile', () => {
  const store = createProfileStore(fakeStorage());
  store.save('Y', sampleProfile(), 1000);
  store.remove('Y');
  assert.equal(store.get('Y'), null);
  assert.equal(store.list().length, 0);
});

test('store survives corrupt storage gracefully', () => {
  const s = fakeStorage();
  s.setItem('peace.profiles', '{not json');
  const store = createProfileStore(s);
  assert.deepEqual(store.list(), []); // no throw
  store.save('Z', sampleProfile(), 1000);
  assert.equal(store.list().length, 1);
});

test('invalid profiles are rejected on save', () => {
  const store = createProfileStore(fakeStorage());
  assert.throws(() => store.save('bad', { version: 99 }, 1000));
});
