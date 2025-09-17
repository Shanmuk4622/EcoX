
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeAudio = useCallback(() => {
    if (!audioCtxRef.current) {
        // Check if window is defined (runs only on client)
        if (typeof window !== 'undefined') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }
  }, []);

  const playSound = useCallback((freq = 440, duration = 100) => {
    initializeAudio();
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
    }, duration);
  }, [initializeAudio]);

  const playBeep = useCallback((count: number) => {
    let played = 0;
    const interval = setInterval(() => {
      if (played < count) {
        playSound(880, 150);
        played++;
      } else {
        clearInterval(interval);
      }
    }, 400);
  }, [playSound]);

  const startContinuousBeep = useCallback(() => {
    initializeAudio();
    const audioCtx = audioCtxRef.current;
    if (!audioCtx || isPlaying) return;

    stopContinuousBeep(); // Ensure any existing beep is stopped

    setIsPlaying(true);
    beepIntervalRef.current = setInterval(() => {
        playSound(1200, 200);
    }, 500);

  }, [initializeAudio, isPlaying, playSound]);

  const stopContinuousBeep = useCallback(() => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);


  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopContinuousBeep();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stopContinuousBeep]);

  return { playBeep, startContinuousBeep, stopContinuousBeep, isPlaying };
}
