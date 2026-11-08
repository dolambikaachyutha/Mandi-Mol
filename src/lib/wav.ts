/**
 * Prisma accepts WAV, MP3, OGG, FLAC, AAC and M4A — but Chrome records WEBM/Opus.
 * Recordings are decoded and re-rendered as 16 kHz mono WAV before upload, which
 * also trims the payload the browser sends to the function.
 */

import { audioBufferToWavBlob } from './noise';

export async function convertToPrismaWav(blob: Blob, targetSampleRate = 16000): Promise<Blob> {
  if (!blob || blob.size === 0) return blob;
  if (blob.type.split(';')[0].trim().toLowerCase() === 'audio/wav') return blob;

  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) {
    throw new Error('This browser cannot convert the recording to WAV. Try a current version of Chrome, Edge, or Safari.');
  }

  const audioContext = new AudioCtor();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    // decodeAudioData detaches its input; hand it a copy so callers keep their blob.
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const duration = Math.max(decoded.duration, 0.15);
    const frameCount = Math.ceil(duration * targetSampleRate);

    const offline = new OfflineAudioContext(1, frameCount, targetSampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    return audioBufferToWavBlob(rendered);
  } catch (error) {
    console.error('[wav] Could not convert the recording to Prisma-compatible WAV:', error);
    throw new Error('Could not convert the recording to WAV. Please try recording again or use text input.');
  } finally {
    void audioContext.close?.();
  }
}
