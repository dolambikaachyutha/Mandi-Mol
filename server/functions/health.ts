import type { Handler } from './types';
import { getGnaniConfig, getProviderStatus, isEvonConfigured, isSpeechConfigured, pingGnaniProviders } from './_gnani';

export const handler: Handler = async (event) => {
  const config = getGnaniConfig();
  const status = getProviderStatus();
  const shouldPing = event?.queryStringParameters?.ping === '1' || event?.queryStringParameters?.live === 'true';

  let livePings: Awaited<ReturnType<typeof pingGnaniProviders>> | null = null;
  if (shouldPing) {
    livePings = await pingGnaniProviders();
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      status: status.killSwitch ? 'PAUSED' : 'OPERATIONAL',
      killSwitch: status.killSwitch,
      configured: {
        gnani: isSpeechConfigured(),
        evon: isEvonConfigured(),
      },
      baseUrl: config.baseUrl,
      prisma: {
        ...status.prisma,
        latencyMs: livePings ? livePings.latenciesMs.baseUrl : 0,
        pingOk: livePings ? livePings.prismaPingOk : undefined,
      },
      timbre: {
        ...status.timbre,
        latencyMs: livePings ? livePings.latenciesMs.baseUrl : 0,
        pingOk: livePings ? livePings.timbrePingOk : undefined,
      },
      evon: {
        ...status.evon,
        latencyMs: livePings ? livePings.latenciesMs.evon : 0,
        pingOk: livePings ? livePings.evonPingOk : undefined,
      },
      voices: config.ttsVoices,
    }),
  };
};
