import { describe, expect, it } from 'vitest';
import { monoPcmToWavBlob } from '../src/lib/noise';

describe('Prisma WAV recording format', () => {
  it('encodes mono PCM samples as a 16 kHz WAV file', async () => {
    const blob = monoPcmToWavBlob(new Float32Array([0, 0.5, -0.5]), 16000);
    const bytes = new DataView(await blob.arrayBuffer());

    expect(blob.type).toBe('audio/wav');
    expect(bytes.getUint32(24, true)).toBe(16000);
    expect(bytes.getUint16(22, true)).toBe(1);
    expect(bytes.getUint32(40, true)).toBe(6);
    expect(bytes.byteLength).toBe(50);
  });
});
