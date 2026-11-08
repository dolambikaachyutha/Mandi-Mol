import { NoiseTestLog, TurnTelemetry } from '../types';

class TelemetryTracker {
  private turnHistory: TurnTelemetry[] = [];
  private noiseLogs: NoiseTestLog[] = [];

  public recordTurn(telemetry: TurnTelemetry) {
    this.turnHistory.push(telemetry);
  }

  public recordNoiseTest(log: NoiseTestLog) {
    this.noiseLogs.push(log);
  }

  public updateNoiseTestConfirmation(id: string, confirmed: boolean) {
    const item = this.noiseLogs.find((l) => l.id === id);
    if (item) {
      item.farmerConfirmedCorrect = confirmed;
    }
  }

  public getTurnHistory(): TurnTelemetry[] {
    return [...this.turnHistory];
  }

  public getNoiseLogs(): NoiseTestLog[] {
    return [...this.noiseLogs];
  }

  public clear() {
    this.turnHistory = [];
  }

  public exportNoiseTestCsv(): string {
    const headers = [
      'ID',
      'Timestamp',
      'Noise Level',
      'Estimated SNR',
      'Recognized Transcript',
      'Confirmed Correct?',
      'Prisma Confidence',
      'Latency (ms)',
    ];

    const rows = this.noiseLogs.map((log) => [
      `"${log.id}"`,
      `"${new Date(log.timestamp).toISOString()}"`,
      `"${log.noiseLevel}"`,
      `"${log.snrEstimate}"`,
      `"${(log.recognizedTranscript || '').replace(/"/g, '""')}"`,
      `"${log.farmerConfirmedCorrect === null ? 'Pending' : log.farmerConfirmedCorrect ? 'Yes (Accurate)' : 'No (Distorted)'}"`,
      (log.confidence * 100).toFixed(1) + '%',
      log.latencyMs,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const telemetry = new TelemetryTracker();
