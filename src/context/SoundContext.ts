import { createContext, type Dispatch, type SetStateAction } from 'react';

export interface SoundContextValue {
  soundEnabled: boolean;
  setSoundEnabled: Dispatch<SetStateAction<boolean>>;
  musicEnabled: boolean;
  setMusicEnabled: Dispatch<SetStateAction<boolean>>;
  volume: number;
  setVolume: Dispatch<SetStateAction<number>>;
  playButtonClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playNotification: () => void;
  playWarning: () => void;
  playDraw: () => void;
  playCorrectPosition: () => void;
  playCorrectDigit: () => void;
  playNoMatch: () => void;
  playGameStart: () => void;
  playGameWin: () => void;
  playGameLose: () => void;
  playKeypress: () => void;
  playConnect: () => void;
  playDisconnect: () => void;
}

export const SoundContext = createContext<SoundContextValue | null>(null);
