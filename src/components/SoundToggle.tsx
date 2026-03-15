import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export const SoundToggle: React.FC = () => {
  const { soundEnabled, setSoundEnabled, playButtonClick } = useSound();

  const handleToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      setTimeout(() => playButtonClick(), 100);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed top-3 right-3 z-50 flex items-center justify-center w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors duration-200"
      aria-label={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
      title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
    >
      {soundEnabled ? (
        <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
      ) : (
        <VolumeX className="w-3.5 h-3.5 text-zinc-600" />
      )}
    </button>
  );
};
