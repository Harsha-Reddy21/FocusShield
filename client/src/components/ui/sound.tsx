import { useState, useEffect, useCallback } from 'react';

interface SoundHookResult {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
}

// Generate sounds using Web Audio API instead of audio files
function generateSound(type: 'start' | 'complete'): (options?: { volume?: number }) => void {
  return (options?: { volume?: number }) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported in this browser');
        return;
      }
      
      const audioCtx = new AudioContext();
      const volume = options?.volume !== undefined ? options.volume : 0.5;
      
      // Create gain node for volume control
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(audioCtx.destination);
      
      if (type === 'start') {
        // Start sound: rising tone
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.2);
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        // Complete sound: two tone sequence
        const oscillator1 = audioCtx.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.value = 587.33; // D5
        oscillator1.connect(gainNode);
        oscillator1.start();
        oscillator1.stop(audioCtx.currentTime + 0.15);
        
        const oscillator2 = audioCtx.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.value = 880; // A5
        oscillator2.connect(gainNode);
        oscillator2.start(audioCtx.currentTime + 0.2);
        oscillator2.stop(audioCtx.currentTime + 0.5);
      }
    } catch (error) {
      console.error('Error generating sound:', error);
    }
  };
}

export function useSound(soundType: string, options?: {
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
}): SoundHookResult {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Determine sound type to play
  const soundFn = useCallback(() => {
    if (soundType.includes('start')) {
      generateSound('start')({ volume: options?.volume });
    } else if (soundType.includes('complete')) {
      generateSound('complete')({ volume: options?.volume });
    }
    
    // Since our sounds are short, set isPlaying and then clear it after sound duration
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 500);
  }, [soundType, options?.volume]);
  
  // Auto play if requested
  useEffect(() => {
    if (options?.autoplay) {
      soundFn();
    }
  }, [soundFn, options?.autoplay]);
  
  const play = useCallback(() => {
    soundFn();
  }, [soundFn]);
  
  const stop = useCallback(() => {
    setIsPlaying(false);
    // Nothing to stop in our implementation since sounds finish on their own
  }, []);
  
  return { play, stop, isPlaying };
}

// Simplified preloader - no longer needed with generated sounds but kept for API compatibility
export function SoundPreloader({ urls }: { urls: string[] }) {
  // No preloading needed
  return null;
}
