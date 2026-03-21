import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { SoundContext } from '../context/SoundContext';
import { soundManager } from '../utils/soundManager';

const SOUND_ENABLED_STORAGE_KEY = 'soundEnabled';
const SFX_VOLUME_STORAGE_KEY = 'sfxVolume';
const MUSIC_ENABLED_STORAGE_KEY = 'musicEnabled';
const MUSIC_VOLUME_STORAGE_KEY = 'musicVolume';
const BACKGROUND_TRACK_PATH = '/audio/soft-looping-stage.mp3';

const readStoredBoolean = (key: string, fallbackValue: boolean) => {
  const savedValue = localStorage.getItem(key);
  return savedValue !== null ? JSON.parse(savedValue) : fallbackValue;
};

const readStoredNumber = (key: string, fallbackValue: number) => {
  const savedValue = localStorage.getItem(key);
  return savedValue !== null ? parseFloat(savedValue) : fallbackValue;
};

export const SoundProvider = ({ children }: PropsWithChildren) => {
  const [soundEnabled, setSoundEnabled] = useState(() => readStoredBoolean(SOUND_ENABLED_STORAGE_KEY, true));
  const [musicEnabled, setMusicEnabled] = useState(() => readStoredBoolean(MUSIC_ENABLED_STORAGE_KEY, true));
  const [sfxVolume, setSfxVolume] = useState(() => readStoredNumber(SFX_VOLUME_STORAGE_KEY, 0.5));
  const [musicVolume, setMusicVolume] = useState(() => readStoredNumber(MUSIC_VOLUME_STORAGE_KEY, 0.75));
  const backgroundTrackRef = useRef<HTMLAudioElement | null>(null);
  const soundManagerInitializedRef = useRef(false);

  if (!soundManagerInitializedRef.current) {
    soundManager.setEnabled(soundEnabled);
    soundManager.setVolume(sfxVolume);
    soundManagerInitializedRef.current = true;
  }

  useEffect(() => {
    const backgroundTrack = new Audio(BACKGROUND_TRACK_PATH);
    backgroundTrack.loop = true;
    backgroundTrack.preload = 'auto';
    backgroundTrack.volume = musicVolume;
    backgroundTrackRef.current = backgroundTrack;

    return () => {
      backgroundTrack.pause();
      backgroundTrack.currentTime = 0;
      backgroundTrack.src = '';
      backgroundTrackRef.current = null;
    };
  }, []);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    soundManager.setVolume(sfxVolume);
    localStorage.setItem(SFX_VOLUME_STORAGE_KEY, sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, musicVolume.toString());
    if (backgroundTrackRef.current) {
      backgroundTrackRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, JSON.stringify(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    const backgroundTrack = backgroundTrackRef.current;
    if (!backgroundTrack) {
      return;
    }

    if (!musicEnabled) {
      backgroundTrack.pause();
      return;
    }

    const startBackgroundTrack = () => {
      if (!backgroundTrack.paused) {
        return;
      }

      backgroundTrack.play().catch((error) => {
        if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
          return;
        }

        console.warn('Unable to start background music:', error);
      });
    };

    startBackgroundTrack();

    window.addEventListener('pointerdown', startBackgroundTrack);
    window.addEventListener('keydown', startBackgroundTrack);

    return () => {
      window.removeEventListener('pointerdown', startBackgroundTrack);
      window.removeEventListener('keydown', startBackgroundTrack);
    };
  }, [musicEnabled]);

  const playSound = (soundFn: () => Promise<void>) => {
    soundFn().catch(console.warn);
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        musicEnabled,
        setMusicEnabled,
        sfxVolume,
        setSfxVolume,
        musicVolume,
        setMusicVolume,
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
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};
