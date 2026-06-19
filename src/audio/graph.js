// ============================================================
//  Web Audio graph builder — browser only.
//  Builds the SAME node graph for a live AudioContext and an
//  OfflineAudioContext, so live playback and exported audio are
//  guaranteed identical. Driven entirely by a Profile object.
// ============================================================

import { fillNoise, mulberry32 } from './noise.js';
import { crossfadeLoop } from './loop.js';
import { clampMasterGain } from './profile.js';

const NOISE_LOOP_SECONDS = 8; // long enough that looping isn't audibly periodic

/**
 * Band edges for a notch centred at `centerHz` spanning `octaves`.
 * e.g. 1 octave around 4000 → [2828, 5657].
 */
export function notchEdges(centerHz, octaves = 1.0) {
  const half = Math.max(0.25, octaves) / 2;
  return { fLow: centerHz / 2 ** half, fHigh: centerHz * 2 ** half };
}

/**
 * Build a "nature texture" shaping chain (rain / waves) from noise.
 * Returns { input, output, oscs } — connect the noise source into `input`,
 * route `output` onward, and start each oscillator in `oscs`.
 *
 * Works identically in live and offline contexts (no samples). LFO-driven
 * amplitude (and, for waves, filter-cutoff) modulation creates the motion.
 */
export function buildNature(ctx, kind) {
  const input = ctx.createGain();
  const oscs = [];

  if (kind === 'rain') {
    // broadband hiss with a presence peak + gentle flutter
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420; hp.Q.value = 0.7;
    const peak = ctx.createBiquadFilter(); peak.type = 'peaking'; peak.frequency.value = 4800; peak.Q.value = 0.8; peak.gain.value = 5;
    const amp = ctx.createGain(); amp.gain.value = 0.9;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.7;
    const depth = ctx.createGain(); depth.gain.value = 0.08;
    lfo.connect(depth).connect(amp.gain); oscs.push(lfo);
    input.connect(hp); hp.connect(peak); peak.connect(amp);
    return { input, output: amp, oscs };
  }

  if (kind === 'waves') {
    // muffled low-mid roar that swells in and out (~11s), filter opening with the swell
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.7;
    const amp = ctx.createGain(); amp.gain.value = 0.55;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.09;
    const ampDepth = ctx.createGain(); ampDepth.gain.value = 0.4;
    const cutoffDepth = ctx.createGain(); cutoffDepth.gain.value = 550;
    lfo.connect(ampDepth).connect(amp.gain);
    lfo.connect(cutoffDepth).connect(lp.frequency);
    oscs.push(lfo);
    input.connect(lp); lp.connect(amp);
    return { input, output: amp, oscs };
  }

  if (kind === 'wind') {
    // airy band-limited noise with a slowly sweeping resonance + gusty swells.
    // High-pass first to shed sub rumble so the swept band reads as "howl", not "boom".
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 200; hp.Q.value = 0.7;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 1.4;
    const amp = ctx.createGain(); amp.gain.value = 0.6;
    // slow gust
    const lfo1 = ctx.createOscillator(); lfo1.type = 'sine'; lfo1.frequency.value = 0.11;
    const amp1 = ctx.createGain(); amp1.gain.value = 0.3;
    const sweep = ctx.createGain(); sweep.gain.value = 260; // moves the howl 240–760 Hz
    lfo1.connect(amp1).connect(amp.gain);
    lfo1.connect(sweep).connect(bp.frequency);
    // faster, shallower gust for irregularity
    const lfo2 = ctx.createOscillator(); lfo2.type = 'sine'; lfo2.frequency.value = 0.29;
    const amp2 = ctx.createGain(); amp2.gain.value = 0.13;
    lfo2.connect(amp2).connect(amp.gain);
    oscs.push(lfo1, lfo2);
    input.connect(hp); hp.connect(bp); bp.connect(amp);
    return { input, output: amp, oscs };
  }

  return null; // no texture
}

/**
 * Create a seamless, loopable noise AudioBuffer for a given color.
 * We generate slightly extra, crossfade the tail into the head, then
 * hand back a buffer whose loop point is inaudible.
 */
function makeNoiseBuffer(ctx, color, seed) {
  const sr = ctx.sampleRate;
  const fadeSec = 0.05;
  const total = Math.ceil((NOISE_LOOP_SECONDS + fadeSec) * sr);
  const raw = new Float32Array(total);
  fillNoise(color, raw, mulberry32(seed));
  const looped = crossfadeLoop(raw, sr, fadeSec);
  const audioBuf = ctx.createBuffer(1, looped.length, sr);
  audioBuf.copyToChannel(looped, 0);
  return audioBuf;
}

/**
 * Build the graph into `ctx`. Connects master → destination.
 * @returns {{ master: GainNode, start: (when?: number) => void, stop: () => void }}
 */
export function buildGraph(ctx, profile, seed = 1337) {
  const master = ctx.createGain();
  master.gain.value = clampMasterGain(profile.master?.gain ?? 0.35);
  master.connect(ctx.destination);

  const starters = [];
  const stoppers = [];
  const layers = []; // live-tweakable refs, indexed to profile.layers

  (profile.layers || []).forEach((layer, i) => {
    const layerGain = ctx.createGain();
    layerGain.gain.value = Math.max(0, layer.gain ?? 0.5);

    // Optional band-reject notch (a flat ½–1 octave band removed around the
    // matched tinnitus pitch — faithful to TMNMT, not a single sharp null).
    // Implemented as parallel paths: low-pass(fLow) ∥ high-pass(fHigh), each a
    // 2-stage cascade for steep walls. Frequencies below fLow and above fHigh
    // pass; the band between is rejected.
    let bandLows = null, bandHighs = null;
    const centerHz = layer.notch?.centerHz ?? 4000;
    const octaves = layer.notch?.octaves ?? 1.0;
    if (layer.notch?.enabled) {
      const { fLow, fHigh } = notchEdges(centerHz, octaves);
      const mk = (type, freq) => {
        const f = ctx.createBiquadFilter();
        f.type = type; f.frequency.value = freq; f.Q.value = 0.707;
        return f;
      };
      bandLows = [mk('lowpass', fLow), mk('lowpass', fLow)];
      bandHighs = [mk('highpass', fHigh), mk('highpass', fHigh)];
      layerGain.connect(bandLows[0]); bandLows[0].connect(bandLows[1]); bandLows[1].connect(master);
      layerGain.connect(bandHighs[0]); bandHighs[0].connect(bandHighs[1]); bandHighs[1].connect(master);
    } else {
      layerGain.connect(master);
    }

    let source;
    if (layer.type === 'noise') {
      source = ctx.createBufferSource();
      source.buffer = makeNoiseBuffer(ctx, layer.color, seed + i);
      source.loop = true;
    } else if (layer.type === 'tone') {
      source = ctx.createOscillator();
      source.type = layer.wave || 'sine';
      source.frequency.value = layer.freqHz;
    } else {
      return;
    }
    // Optional nature texture (rain / waves) shaping between source and layerGain.
    const nature = layer.type === 'noise' ? buildNature(ctx, layer.nature) : null;
    if (nature) {
      source.connect(nature.input);
      nature.output.connect(layerGain);
      nature.oscs.forEach((o) => { starters.push((when) => o.start(when)); stoppers.push(() => { try { o.stop(); } catch {} }); });
    } else {
      source.connect(layerGain);
    }
    starters.push((when) => source.start(when));
    stoppers.push(() => { try { source.stop(); } catch {} });
    layers.push({ gain: layerGain, bandLows, bandHighs, notchCenter: centerHz, notchOct: octaves });
  });

  return {
    master,
    layers,
    start: (when = 0) => starters.forEach((s) => s(when)),
    stop: () => stoppers.forEach((s) => s()),
  };
}
