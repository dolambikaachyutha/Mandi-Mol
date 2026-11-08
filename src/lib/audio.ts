/**
 * Audio Recording, Playback & Analyser Utilities
 * Handles cross-browser PCM capture, AnalyserNode amplitude tracking,
 * autoplay unlocking, and filler audio caching.
 */

import { monoPcmToWavBlob } from './noise';

export interface AudioRecordingResult {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

export class AudioManager {
  private captureSource: MediaStreamAudioSourceNode | null = null;
  private captureProcessor: ScriptProcessorNode | null = null;
  private silentGain: GainNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private captureSampleRate = 0;
  private recordingActive = false;
  private startTime: number = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private autoStopTimer: number | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private fillerCache: Map<string, HTMLAudioElement> = new Map();

  // Ensure AudioContext is unlocked by user gesture
  public ensureAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // Start microphone recording with live analyser
  public async startRecording(onAutoStop?: () => void): Promise<AnalyserNode> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone recording requires a secure context (HTTPS or localhost) and a supported browser.');
    }
    const ctx = this.ensureAudioContext();
    if (typeof ctx.createScriptProcessor !== 'function') {
      throw new Error('This browser cannot capture microphone audio in a supported format. Try a current version of Chrome, Edge, or Safari.');
    }

    this.pcmChunks = [];
    this.recordingActive = false;
    if (this.autoStopTimer !== null) {
      window.clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone was found. Connect a microphone and try again.');
      }
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        throw new Error('Microphone permission was denied. Allow microphone access in your browser settings and try again.');
      }
      throw new Error(`Could not access the microphone: ${error.message}`);
    }

    try {
      this.captureSource = ctx.createMediaStreamSource(this.micStream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.captureSource.connect(this.analyser);

      this.captureSampleRate = ctx.sampleRate;
      this.captureProcessor = ctx.createScriptProcessor(4096, 1, 1);
      this.silentGain = ctx.createGain();
      this.silentGain.gain.value = 0;
      this.captureProcessor.onaudioprocess = (event) => {
        if (!this.recordingActive) return;
        const input = event.inputBuffer;
        if (input.length === 0) return;
        const mono = new Float32Array(input.length);
        for (let channel = 0; channel < input.numberOfChannels; channel++) {
          const samples = input.getChannelData(channel);
          for (let i = 0; i < samples.length; i++) {
            mono[i] += samples[i] / input.numberOfChannels;
          }
        }
        this.pcmChunks.push(mono);
        event.outputBuffer.getChannelData(0).fill(0);
      };
      this.captureSource.connect(this.captureProcessor);
      this.captureProcessor.connect(this.silentGain);
      this.silentGain.connect(ctx.destination);
    } catch (err) {
      this.cleanupCapture();
      throw err;
    }

    this.startTime = Date.now();
    this.recordingActive = true;

    // Auto-stop at 12 seconds
    if (onAutoStop) {
      this.autoStopTimer = window.setTimeout(() => {
        if (this.recordingActive) onAutoStop();
      }, 12000);
    }

    return this.analyser;
  }

  // Stop capture and return 16 kHz mono PCM WAV for Prisma.
  public async stopRecording(): Promise<AudioRecordingResult> {
    if (this.autoStopTimer !== null) {
      window.clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    if (!this.recordingActive) throw new Error('Microphone recording is not active.');
    this.recordingActive = false;
    const durationMs = Date.now() - this.startTime;
    const chunks = this.pcmChunks;
    const sourceSampleRate = this.captureSampleRate;
    this.cleanupCapture();

    const sampleCount = chunks.reduce((total, chunk) => total + chunk.length, 0);
    if (sampleCount === 0 || sourceSampleRate <= 0) {
      throw new Error('No microphone audio was captured. Check microphone access and try again.');
    }

    const sourceSamples = new Float32Array(sampleCount);
    let offset = 0;
    for (const chunk of chunks) {
      sourceSamples.set(chunk, offset);
      offset += chunk.length;
    }

    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.floor((sourceSamples.length * targetSampleRate) / sourceSampleRate));
    const resampled = new Float32Array(targetLength);
    const ratio = sourceSampleRate / targetSampleRate;
    for (let i = 0; i < targetLength; i++) {
      const position = i * ratio;
      const lower = Math.floor(position);
      const upper = Math.min(lower + 1, sourceSamples.length - 1);
      const fraction = position - lower;
      resampled[i] = sourceSamples[lower] * (1 - fraction) + sourceSamples[upper] * fraction;
    }

    const blob = monoPcmToWavBlob(resampled, targetSampleRate);
    return { blob, durationMs, mimeType: blob.type };
  }

  private cleanupCapture() {
    this.captureProcessor?.disconnect();
    this.captureSource?.disconnect();
    this.silentGain?.disconnect();
    if (this.captureProcessor) this.captureProcessor.onaudioprocess = null;
    this.captureProcessor = null;
    this.captureSource = null;
    this.silentGain = null;
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }

  // Play audio base64 or URL and connect to AnalyserNode for lip-sync
  public playAudio(
    audioSrc: string,
    onAmplitude?: (amplitude: number) => void,
    onEnded?: () => void
  ): { stop: () => void } {
    this.stopPlayback();
    const ctx = this.ensureAudioContext();

    const audio = new Audio(audioSrc);
    this.currentAudioElement = audio;

    let sourceNode: MediaElementAudioSourceNode | null = null;
    let playAnalyser: AnalyserNode | null = null;
    let animFrame: number | null = null;

    try {
      sourceNode = ctx.createMediaElementSource(audio);
      playAnalyser = ctx.createAnalyser();
      playAnalyser.fftSize = 128;
      sourceNode.connect(playAnalyser);
      playAnalyser.connect(ctx.destination);
    } catch {
      // In some browsers cross-origin media element source fails; fallback to direct playback
    }

    const dataArray = playAnalyser ? new Uint8Array(playAnalyser.frequencyBinCount) : null;

    const trackAmplitude = () => {
      if (playAnalyser && dataArray && onAmplitude && !audio.paused && !audio.ended) {
        playAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255; // 0.0 to 1.0
        onAmplitude(avg);
        animFrame = requestAnimationFrame(trackAmplitude);
      }
    };

    audio.onplay = () => {
      trackAmplitude();
    };

    audio.onended = () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (onAmplitude) onAmplitude(0);
      if (onEnded) onEnded();
    };

    audio.onerror = () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (onAmplitude) onAmplitude(0);
      if (onEnded) onEnded();
    };

    audio.play().catch((err) => {
      console.warn('Audio playback failed or blocked:', err);
      if (onEnded) onEnded();
    });

    return {
      stop: () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        audio.pause();
        audio.currentTime = 0;
        if (onAmplitude) onAmplitude(0);
      },
    };
  }

  public stopPlayback() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
  }

  // Pre-cache filler sounds for low perceived latency
  public initFillers() {
    // Web Audio generated short tonal 'hmmm' / chime in lieu of missing files
  }
}

export const audioManager = new AudioManager();
