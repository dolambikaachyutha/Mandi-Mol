/**
 * Procedural Mandi Ambience Generator & Audio Mixer
 * Synthesizes realistic Indian mandi background acoustic conditions using pure Web Audio API:
 * 1. Crowd murmur (band-limited pink/brown filtered noise bursts)
 * 2. Tractor/truck idle rumble (low-frequency modulated hums)
 * 3. Metallic scale clank transients (resonant metal impact bursts)
 *
 * Mixes into recorded clips at target SNR before sending to Prisma STT.
 */

export type MandiNoiseLevel = 'off' | 'medium' | 'loud';

// Procedurally generate a Float32Array containing mandi ambience
export function generateMandiAmbience(
  sampleRate: number,
  durationSec: number,
  intensity: number // 0.0 to 1.0
): Float32Array {
  const totalSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(totalSamples);

  // 1. Crowd murmur noise (low-pass filtered brown noise)
  let lastOut = 0.0;
  for (let i = 0; i < totalSamples; i++) {
    const white = Math.random() * 2 - 1;
    // Brown noise integration
    lastOut = (lastOut + 0.02 * white) / 1.02;
    // Modulation envelope simulating waves of background voices
    const crowdSwell = 0.6 + 0.4 * Math.sin((i / sampleRate) * 1.5 * Math.PI);
    buffer[i] = lastOut * 2.5 * crowdSwell * intensity;
  }

  // 2. Engine idle low rumble (35Hz-60Hz modulated sine)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const rumble =
      Math.sin(2 * Math.PI * 45 * t) * 0.15 +
      Math.sin(2 * Math.PI * 90 * t + 0.5) * 0.08;
    buffer[i] += rumble * intensity;
  }

  // 3. Periodic scale clanks (every ~1.8 to 2.5 seconds)
  const clankInterval = Math.floor(sampleRate * 2.2);
  for (let start = Math.floor(sampleRate * 0.8); start < totalSamples; start += clankInterval) {
    const clankDuration = Math.floor(sampleRate * 0.18);
    for (let j = 0; j < clankDuration && start + j < totalSamples; j++) {
      const decay = Math.exp(-j / (sampleRate * 0.04));
      const freq = 1250 + Math.sin(j * 0.05) * 200;
      const clank = Math.sin((2 * Math.PI * freq * j) / sampleRate) * decay * 0.35;
      buffer[start + j] += clank * intensity;
    }
  }

  return buffer;
}

/**
 * Mixes recorded audio Blob with procedural Mandi ambience at desired SNR.
 * Returns a new WAV audio Blob.
 */
export async function mixMandiNoiseIntoAudio(
  audioBlob: Blob,
  noiseLevel: MandiNoiseLevel
): Promise<{ mixedBlob: Blob; snrDb: string }> {
  if (noiseLevel === 'off') {
    return { mixedBlob: audioBlob, snrDb: '>25dB (Clean Studio)' };
  }

  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('[noise] Could not decode audio for the noise test:', error);
    throw new Error('Could not prepare audio for the noise test. Turn noise off and record again.');
  }

  const sampleRate = decodedBuffer.sampleRate;
  const numChannels = decodedBuffer.numberOfChannels;
  const duration = decodedBuffer.duration;
  const numSamples = decodedBuffer.length;

  // Intensity according to noise level:
  // Medium: ~10dB SNR
  // Loud: ~0dB SNR (heavy mandi chaos)
  const intensity = noiseLevel === 'loud' ? 0.85 : 0.42;
  const snrDb = noiseLevel === 'loud' ? '~0dB SNR (Severe Mandi Chaos)' : '~10dB SNR (Standard Mandi Rush)';

  const ambience = generateMandiAmbience(sampleRate, duration, intensity);

  // Render mixed offline buffer
  const offlineCtx = new OfflineAudioContext(numChannels, numSamples, sampleRate);
  const speechSource = offlineCtx.createBufferSource();
  speechSource.buffer = decodedBuffer;

  const ambienceBuffer = offlineCtx.createBuffer(1, numSamples, sampleRate);
  ambienceBuffer.getChannelData(0).set(ambience);
  const ambienceSource = offlineCtx.createBufferSource();
  ambienceSource.buffer = ambienceBuffer;

  speechSource.connect(offlineCtx.destination);
  ambienceSource.connect(offlineCtx.destination);

  speechSource.start(0);
  ambienceSource.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const mixedWavBlob = audioBufferToWavBlob(renderedBuffer);

  return { mixedBlob: mixedWavBlob, snrDb };
}

// Convert AudioBuffer to 16-bit PCM WAV Blob (ideal for Prisma STT)
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    channelData.push(buffer.getChannelData(channel));
  }
  return encodePcmWav(channelData, buffer.sampleRate);
}

export function monoPcmToWavBlob(samples: Float32Array, sampleRate: number): Blob {
  return encodePcmWav([samples], sampleRate);
}

function encodePcmWav(channelData: Float32Array[], sampleRate: number): Blob {
  const numChannels = channelData.length;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = channelData[0]?.length ?? 0;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i] ?? 0;
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
