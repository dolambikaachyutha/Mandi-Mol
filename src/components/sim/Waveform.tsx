import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isRecording: boolean;
  analyser?: AnalyserNode | null;
}

export const Waveform: React.FC<WaveformProps> = ({ isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isRecording) {
        // Flat resting line
        ctx.strokeStyle = '#D4A373';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      phase += 0.15;
      ctx.strokeStyle = '#D62828';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      for (let x = 0; x < width; x += 3) {
        const norm = (x / width) * Math.PI * 4;
        const wave1 = Math.sin(norm + phase) * 14;
        const wave2 = Math.sin(norm * 2.2 - phase * 1.5) * 8;
        const jitter = (Math.random() - 0.5) * 6;
        const y = mid + wave1 + wave2 + jitter;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={48}
      className="w-full h-12 rounded-lg bg-amber-50/50 border border-amber-200"
    />
  );
};
