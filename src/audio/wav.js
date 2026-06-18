// ============================================================
//  WAV (16-bit PCM) encode/decode — pure, no dependencies.
//  Lets us export a downloadable, universally-playable file
//  straight from rendered Float32 channel data.
// ============================================================

function clampSample(x) {
  return x < -1 ? -1 : x > 1 ? 1 : x;
}

/**
 * Encode interleaved 16-bit PCM WAV.
 * @param {{channelData: Float32Array[], sampleRate: number}} opts
 * @returns {ArrayBuffer}
 */
export function encodeWav({ channelData, sampleRate }) {
  if (!channelData?.length) throw new Error('encodeWav: need at least one channel');
  const channels = channelData.length;
  const frames = channelData[0].length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(buffer);

  const writeTag = (offset, str) => {
    for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i));
  };

  writeTag(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  writeTag(8, 'WAVE');
  writeTag(12, 'fmt ');
  dv.setUint32(16, 16, true);                       // PCM fmt chunk size
  dv.setUint16(20, 1, true);                        // audio format = PCM
  dv.setUint16(22, channels, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * blockAlign, true);  // byte rate
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true);                       // bits per sample
  writeTag(36, 'data');
  dv.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (let ch = 0; ch < channels; ch++) {
      const s = clampSample(channelData[ch][frame]);
      // Symmetric quantization: scale by 32767 so ±1 -> ±32767.
      dv.setInt16(offset, Math.round(s * 32767), true);
      offset += 2;
    }
  }
  return buffer;
}

/**
 * Minimal WAV parser (16-bit PCM) for round-trip testing/verification.
 * @returns {{channelData: Float32Array[], sampleRate: number}}
 */
export function parseWav(buffer) {
  const dv = new DataView(buffer);
  const channels = dv.getUint16(22, true);
  const sampleRate = dv.getUint32(24, true);
  const bits = dv.getUint16(34, true);
  if (bits !== 16) throw new Error('parseWav: only 16-bit PCM supported');
  const dataSize = dv.getUint32(40, true);
  const frames = dataSize / (channels * 2);
  const channelData = Array.from({ length: channels }, () => new Float32Array(frames));
  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (let ch = 0; ch < channels; ch++) {
      channelData[ch][frame] = dv.getInt16(offset, true) / 32767;
      offset += 2;
    }
  }
  return { channelData, sampleRate };
}

/** Wrap an encoded WAV ArrayBuffer in a Blob for download. */
export function wavBlob(opts) {
  return new Blob([encodeWav(opts)], { type: 'audio/wav' });
}
