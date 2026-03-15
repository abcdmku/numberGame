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

  // Let the sound manager enforce current enable/disable state so
  // long-lived socket listeners do not capture a stale soundEnabled value.
  const playSound = useCallback((soundFn: () => Promise<void>) => {
    soundFn().catch(console.warn);
  }, []);

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
    playWarning: () => playSound(() => soundManager.playWarning()),
    playDraw: () => playSound(() => soundManager.playDraw()),
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
