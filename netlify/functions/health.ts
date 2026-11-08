import { Handler } from '@netlify/functions';
import { getGnaniConfig, getProviderStatus, isEvonConfigured, isSpeechConfigured } from './_gnani';

export const handler: Handler = async () => {
  const config = getGnaniConfig();
  const status = getProviderStatus();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      configured: {
        gnani: isSpeechConfigured(),
        evon: isEvonConfigured(),
      },
      baseUrl: config.baseUrl,
      prisma: { ...status.prisma, latencyMs: 0 },
      evon: { ...status.evon, latencyMs: 0 },
      timbre: { ...status.timbre, latencyMs: 0 },
      voices: config.ttsVoices,
    }),
  };
};
