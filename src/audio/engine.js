// ============================================================
//  AudioEngine — live playback + REAL level metering.
//  Browser only. Wraps an AudioContext around buildGraph and
//  exposes play/stop, a safety-capped master, and an honest
//  RMS level read (drives the safety story — no faked meters).
// ============================================================

import { buildGraph, notchEdges } from './graph.js';
import { clampMasterGain } from './profile.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.graph = null;
    this.analyser = null;
    this._timeData = null;
    this.profile = null;
    this.playing = false;
    this._rampSec = 0.04; // de-click ramp on gain changes
  }

  /** Lazily create the AudioContext (must follow a user gesture). */
  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.82;
      this._timeData = new Float32Array(this.analyser.fftSize);
      this._freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  /** Hz represented by each FFT bin (bin i ≈ i * binHz). */
  get binHz() {
    return this.ctx ? this.ctx.sampleRate / this.analyser.fftSize : 0;
  }

  /**
   * Fill and return the byte frequency spectrum (0..255 per bin).
   * Returns an empty array when not playing.
   */
  getFrequencyData() {
    if (!this.analyser || !this.playing) return this._freqData ? this._freqData.fill(0) : new Uint8Array(0);
    this.analyser.getByteFrequencyData(this._freqData);
    return this._freqData;
  }

  /** Build the graph for `profile` and start it. Resumes if suspended. */
  async play(profile) {
    this._ensureContext();
    if (this.playing) this.stop();
    this.profile = profile;

    const seed = (Date.now() & 0xffff) ^ 0x5eed;
    this.graph = buildGraph(this.ctx, profile, seed);

    // Route master → analyser as well, for metering.
    this.graph.master.connect(this.analyser);

    // Soft-start: ramp the master from 0 to its (capped) target to avoid a click.
    const target = clampMasterGain(profile.master?.gain ?? 0.35);
    const t = this.ctx.currentTime;
    this.graph.master.gain.cancelScheduledValues(t);
    this.graph.master.gain.setValueAtTime(0.0001, t);
    this.graph.master.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), t + this._rampSec);

    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.graph.start(0);
    this.playing = true;
  }

  /** Ramp down to avoid a click, then stop sources. */
  stop() {
    if (!this.graph || !this.playing) return;
    const t = this.ctx.currentTime;
    try {
      this.graph.master.gain.cancelScheduledValues(t);
      this.graph.master.gain.setValueAtTime(this.graph.master.gain.value, t);
      this.graph.master.gain.exponentialRampToValueAtTime(0.0001, t + this._rampSec);
    } catch {}
    const g = this.graph;
    setTimeout(() => { try { g.stop(); g.master.disconnect(); } catch {} }, this._rampSec * 1000 + 20);
    this.graph = null;
    this.playing = false;
  }

  /** Live, safety-capped master gain change (smoothly ramped). */
  setMasterGain(gain) {
    if (!this.graph) return;
    const target = clampMasterGain(gain);
    const t = this.ctx.currentTime;
    this.graph.master.gain.setTargetAtTime(Math.max(0.0001, target), t, this._rampSec);
  }

  /** Live per-layer gain change (smoothly ramped). No-op if not playing. */
  setLayerGain(index, gain) {
    const layer = this.graph?.layers?.[index];
    if (!layer) return;
    layer.gain.gain.setTargetAtTime(Math.max(0, gain), this.ctx.currentTime, this._rampSec);
  }

  /**
   * Live notch update (center frequency + octave width) for a layer, if its
   * notch is currently active. Enabling/disabling a notch is structural — call
   * play() again for that.
   */
  setNotch(index, { centerHz, octaves } = {}) {
    const layer = this.graph?.layers?.[index];
    if (!layer || !layer.bandLows) return;
    layer.notchCenter = Number.isFinite(centerHz) ? centerHz : layer.notchCenter;
    layer.notchOct = Number.isFinite(octaves) ? octaves : layer.notchOct;
    const { fLow, fHigh } = notchEdges(layer.notchCenter, layer.notchOct);
    const t = this.ctx.currentTime;
    layer.bandLows.forEach((f) => f.frequency.setTargetAtTime(fLow, t, this._rampSec));
    layer.bandHighs.forEach((f) => f.frequency.setTargetAtTime(fHigh, t, this._rampSec));
  }

  /**
   * Current output level as RMS in 0..1 (honest meter from the real signal).
   * Returns 0 when not playing.
   */
  getLevel() {
    if (!this.analyser || !this.playing) return 0;
    this.analyser.getFloatTimeDomainData(this._timeData);
    let sum = 0;
    for (let i = 0; i < this._timeData.length; i++) sum += this._timeData[i] * this._timeData[i];
    return Math.sqrt(sum / this._timeData.length);
  }

  dispose() {
    this.stop();
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}
