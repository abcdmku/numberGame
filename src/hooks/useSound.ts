import { useState, useEffect, useCallback } from 'react';
import { soundManager } from '../utils/soundManager';

export const useSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('soundVolume');
    return saved !== null ? parseFloat(saved) : 0.3;
  });

  // Initialize sound manager on mount
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    soundManager.setVolume(volume);
  }, []);

  // Update sound manager when settings change
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    soundManager.setVolume(volume);
    localStorage.setItem('soundVolume', volume.toString());
  }, [volume]);

  // Sound effect functions with null checks
  const playSound = useCallback((soundFn: () => Promise<void>) => {
    if (soundEnabled) {
      soundFn().catch(console.warn);
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    
    // Sound effect functions
    playButtonClick: () => playSound(() => soundManager.playButtonClick()),
    playSuccess: () => playSound(() => soundManager.playSuccess()),
    playError: () => playSound(() => soundManager.playError()),
    playNotification: () => playSound(() => soundManager.playNotification()),
    playCorrectPosition: () => playSound(() => soundManager.playCorrectPosition()),
    playCorrectDigit: () => playSound(() => soundManager.playCorrectDigit()),
    playNoMatch: () => playSound(() => soundManager.playNoMatch()),
    playGameStart: () => playSound(() => soundManager.playGameStart()),
    playGameWin: () => playSound(() => soundManager.playGameWin()),
    playGameLose: () => playSound(() => soundManager.playGameLose()),
    playKeypress: () => playSound(() => soundManager.playKeypress()),
    playConnect: () => playSound(() => soundManager.playConnect()),
    playDisconnect: () => playSound(() => soundManager.playDisconnect()),
  };
};