// ============================================================
//  Share codec — pure. Encodes a Profile into a URL-safe string
//  so a tuned sound can be shared as a link (#p=…) with no backend.
//  Cross-environment (Node + browser): UTF-8 via TextEncoder, then
//  a hand-rolled base64url over bytes (no btoa/Buffer dependency).
// ============================================================

import { validateProfile } from '../audio/profile.js';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const REV = (() => { const m = {}; for (let i = 0; i < B64.length; i++) m[B64[i]] = i; return m; })();

function bytesToB64url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += B64[b2 & 63];
  }
  return out; // no padding
}

function b64urlToBytes(str) {
  const out = [];
  for (let i = 0; i < str.length; i += 4) {
    const c0 = REV[str[i]], c1 = REV[str[i + 1]], c2 = REV[str[i + 2]], c3 = REV[str[i + 3]];
    if (c0 === undefined || c1 === undefined) break;
    out.push((c0 << 2) | (c1 >> 4));
    if (c2 === undefined) break;
    out.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 === undefined) break;
    out.push(((c2 & 3) << 6) | c3);
  }
  return new Uint8Array(out);
}

/** Profile → compact URL-safe string. */
export function encodeProfile(profile) {
  const json = JSON.stringify(profile);
  return bytesToB64url(new TextEncoder().encode(json));
}

/** URL-safe string → Profile, or null if invalid/tampered. */
export function decodeProfile(str) {
  if (!str || /[^A-Za-z0-9\-_]/.test(str)) return null;
  try {
    const json = new TextDecoder().decode(b64urlToBytes(str));
    const obj = JSON.parse(json);
    return validateProfile(obj).ok ? obj : null;
  } catch {
    return null;
  }
}

/** Build a shareable URL with the profile in the fragment (never sent to a server). */
export function buildShareUrl(baseUrl, profile) {
  const base = baseUrl.split('#')[0];
  return `${base}#p=${encodeProfile(profile)}`;
}

/** Extract a profile from a location.hash like "#p=…", or null. */
export function parseShareHash(hash) {
  if (!hash) return null;
  const m = /[#&]p=([A-Za-z0-9\-_]+)/.exec(hash);
  return m ? decodeProfile(m[1]) : null;
}
