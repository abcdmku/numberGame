import React from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export const SoundToggle: React.FC = () => {
  const {
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    playButtonClick,
  } = useSound();

  const handleSoundToggle = () => {
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);

    if (nextValue) {
      setTimeout(() => playButtonClick(), 100);
    }
  };

  const handleMusicToggle = () => {
    setMusicEnabled(!musicEnabled);

    if (soundEnabled) {
      playButtonClick();
    }
  };

  const buttonClasses = (enabled: boolean) => (
    `flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium uppercase transition-colors duration-200 sm:h-auto sm:w-auto sm:gap-1.5 sm:border sm:bg-zinc-900 sm:px-2 sm:py-1.5 sm:tracking-[0.18em] ${
      enabled
        ? 'text-zinc-200 sm:border-zinc-700 sm:hover:bg-zinc-800'
        : 'text-zinc-500 hover:text-zinc-300 sm:border-zinc-800 sm:hover:bg-zinc-800'
    }`
  );

  return (
    <div className="fixed top-2 right-2 z-50 flex flex-col items-center gap-1 sm:top-3 sm:right-3 sm:flex-row sm:gap-1.5">
      <button
        onClick={handleSoundToggle}
        className={buttonClasses(soundEnabled)}
        aria-label={soundEnabled ? 'Disable game sounds' : 'Enable game sounds'}
        title={soundEnabled ? 'Disable game sounds' : 'Enable game sounds'}
      >
        {soundEnabled ? (
          <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        ) : (
          <VolumeX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        )}
        <span className="hidden sm:inline">Game</span>
      </button>

      <button
        onClick={handleMusicToggle}
        className={buttonClasses(musicEnabled)}
        aria-label={musicEnabled ? 'Pause background song' : 'Play background song'}
        title={musicEnabled ? 'Pause background song' : 'Play background song'}
      >
        {musicEnabled ? (
          <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        ) : (
          <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        )}
        <span className="hidden sm:inline">Song</span>
      </button>
    </div>
  );
};
