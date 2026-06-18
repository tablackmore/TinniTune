// ============================================================
//  Profile store — named, saved profiles in localStorage.
//  Factory takes a storage object (injectable for testing), so the
//  read/write logic is unit-testable in Node without a real DOM.
//  All health-adjacent data stays on the device.
// ============================================================

import { validateProfile } from '../audio/profile.js';

const KEY = 'peace.profiles';

/**
 * @param {Storage} storage  localStorage-like ({getItem,setItem,removeItem})
 */
export function createProfileStore(storage = globalThis.localStorage) {
  const readAll = () => {
    try {
      const raw = storage?.getItem(KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === 'object' ? obj : {};
    } catch {
      return {}; // corrupt storage → start clean rather than throw
    }
  };
  const writeAll = (obj) => storage?.setItem(KEY, JSON.stringify(obj));

  return {
    /** Newest-first list of { name, profile, savedAt }. */
    list() {
      const all = readAll();
      return Object.entries(all)
        .map(([name, v]) => ({ name, profile: v.profile, savedAt: v.savedAt || 0 }))
        .sort((a, b) => b.savedAt - a.savedAt);
    },

    /** Save (or overwrite) a named profile. Rejects invalid profiles. */
    save(name, profile, savedAt = Date.now()) {
      if (!name || !name.trim()) throw new Error('profile needs a name');
      const v = validateProfile(profile);
      if (!v.ok) throw new Error('invalid profile: ' + v.errors.join('; '));
      const all = readAll();
      all[name] = { profile, savedAt };
      writeAll(all);
    },

    /** @returns {object|null} */
    get(name) {
      const e = readAll()[name];
      return e ? e.profile : null;
    },

    remove(name) {
      const all = readAll();
      if (name in all) { delete all[name]; writeAll(all); }
    },
  };
}
