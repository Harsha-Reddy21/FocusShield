import { useState, useEffect } from 'react';

interface SoundHookResult {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
}

export function useSound(soundUrl: string, options?: {
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
}): SoundHookResult {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Initialize audio element
  useEffect(() => {
    const audioElement = new Audio(soundUrl);
    
    // Set options
    if (options?.volume !== undefined) {
      audioElement.volume = options.volume;
    }
    
    if (options?.loop !== undefined) {
      audioElement.loop = options.loop;
    }
    
    // Setup event listeners
    audioElement.addEventListener('play', () => setIsPlaying(true));
    audioElement.addEventListener('pause', () => setIsPlaying(false));
    audioElement.addEventListener('ended', () => setIsPlaying(false));
    
    setAudio(audioElement);
    
    // Auto play if requested
    if (options?.autoplay) {
      audioElement.play().catch(err => console.error("Failed to autoplay sound:", err));
    }
    
    // Cleanup on unmount
    return () => {
      audioElement.pause();
      audioElement.removeEventListener('play', () => setIsPlaying(true));
      audioElement.removeEventListener('pause', () => setIsPlaying(false));
      audioElement.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [soundUrl, options?.volume, options?.loop, options?.autoplay]);
  
  const play = () => {
    if (audio) {
      // Reset to beginning if already ended
      if (audio.ended) {
        audio.currentTime = 0;
      }
      
      audio.play().catch(err => console.error("Failed to play sound:", err));
    }
  };
  
  const stop = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };
  
  return { play, stop, isPlaying };
}

// Create a component for preloading sounds
export function SoundPreloader({ urls }: { urls: string[] }) {
  useEffect(() => {
    // Preload all sounds
    const audioElements = urls.map(url => {
      const audio = new Audio(url);
      audio.load();
      return audio;
    });
    
    // Cleanup
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = "";
      });
    };
  }, [urls]);
  
  // Render nothing, this is just for preloading
  return null;
}
