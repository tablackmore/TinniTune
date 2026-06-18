// ============================================================
//  Offline export — render a Profile to a seamless, loopable WAV.
//  Browser only (OfflineAudioContext). Renders a little extra,
//  then crossfades the tail into the head so the DOWNLOADED file
//  loops with no click — exactly what "play on repeat" needs.
// ============================================================

import { buildGraph } from './graph.js';
import { crossfadeLoop } from './loop.js';
import { wavBlob } from './wav.js';

/**
 * Render `profile` to a WAV Blob that loops seamlessly.
 * @param {object} profile
 * @param {{ seconds?: number, sampleRate?: number, loopFadeSec?: number, seed?: number }} opts
 * @returns {Promise<Blob>}
 */
export async function renderProfileToWav(profile, opts = {}) {
  const sampleRate = opts.sampleRate ?? 44100;
  const seconds = opts.seconds ?? 60;
  const loopFadeSec = opts.loopFadeSec ?? 0.1;
  const seed = opts.seed ?? 1337;

  // Render seconds + fade so the crossfade has tail material to fold in.
  const renderSeconds = seconds + loopFadeSec;
  const frames = Math.ceil(renderSeconds * sampleRate);

  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new Offline(1, frames, sampleRate);

  const graph = buildGraph(ctx, profile, seed);
  graph.start(0);

  const rendered = await ctx.startRendering();
  const channel = rendered.getChannelData(0); // Float32Array, length = frames

  // Make it seamlessly loopable; result length ≈ seconds * sampleRate.
  const looped = crossfadeLoop(channel, sampleRate, loopFadeSec);

  return wavBlob({ channelData: [looped], sampleRate });
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
