import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export const SoundToggle: React.FC = () => {
  const { soundEnabled, setSoundEnabled, volume, setVolume, playButtonClick } = useSound();

  const handleToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      // Play a sound when enabling to confirm it works
      setTimeout(() => playButtonClick(), 100);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-lg">
        <button
          onClick={handleToggle}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group"
          aria-label={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
          title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <VolumeX className="w-5 h-5 text-white/60 group-hover:scale-110 transition-transform" />
          )}
        </button>
        
        {soundEnabled && (
          <div className="mt-2 px-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Volume control"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 12px;
                width: 12px;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .slider::-moz-range-thumb {
                height: 12px;
                width: 12px;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};