import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export const SoundToggle: React.FC = () => {
  const {
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    sfxVolume,
    setSfxVolume,
    musicVolume,
    setMusicVolume,
    playButtonClick,
  } = useSound();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('pointerdown', handleClickOutside);
      return () => document.removeEventListener('pointerdown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) setTimeout(() => playButtonClick(), 100);
  };

  const handleMusicToggle = () => {
    setMusicEnabled(!musicEnabled);
    if (soundEnabled) playButtonClick();
  };

  const anyActive = soundEnabled || musicEnabled;

  return (
    <div ref={panelRef} className="fixed top-2 right-2 z-50 sm:top-3 sm:right-3">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 ${
          open
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : anyActive
              ? 'border-zinc-700/60 bg-zinc-900/70 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
              : 'border-zinc-800/60 bg-zinc-900/70 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
        }`}
        aria-label="Audio settings"
      >
        {anyActive ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <VolumeX className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute top-10 right-0 w-48 origin-top-right animate-in fade-in zoom-in-95 rounded-xl border border-zinc-700/50 bg-zinc-900/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          {/* SFX row */}
          <VolumeRow
            icon={<Volume2 className="h-3.5 w-3.5" />}
            iconOff={<VolumeX className="h-3.5 w-3.5" />}
            label="SFX"
            enabled={soundEnabled}
            volume={sfxVolume}
            onToggle={handleSoundToggle}
            onVolumeChange={setSfxVolume}
            accentColor="emerald"
          />

          <div className="my-2 h-px bg-zinc-800" />

          {/* Music row */}
          <VolumeRow
            icon={<Music className="h-3.5 w-3.5" />}
            iconOff={<Music className="h-3.5 w-3.5 opacity-40" />}
            label="Music"
            enabled={musicEnabled}
            volume={musicVolume}
            onToggle={handleMusicToggle}
            onVolumeChange={setMusicVolume}
            accentColor="sky"
          />
        </div>
      )}
    </div>
  );
};

/* ── Volume Row ──────────────────────────────────────────────── */

interface VolumeRowProps {
  icon: React.ReactNode;
  iconOff: React.ReactNode;
  label: string;
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
  accentColor: 'emerald' | 'sky';
}

const accentStyles = {
  emerald: {
    track: 'bg-emerald-500/60',
    thumb: 'accent-emerald-400',
    icon: 'text-emerald-400',
    label: 'text-emerald-400/80',
    pct: 'text-emerald-500/60',
  },
  sky: {
    track: 'bg-sky-500/60',
    thumb: 'accent-sky-400',
    icon: 'text-sky-400',
    label: 'text-sky-400/80',
    pct: 'text-sky-500/60',
  },
};

const VolumeRow: React.FC<VolumeRowProps> = ({
  icon,
  iconOff,
  label,
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  accentColor,
}) => {
  const styles = accentStyles[accentColor];
  const pct = Math.round(volume * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors duration-150 ${
            enabled
              ? `${styles.icon} hover:brightness-125`
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
          aria-label={`Toggle ${label}`}
        >
          {enabled ? icon : iconOff}
          <span className={`text-[11px] font-medium tracking-wide ${enabled ? styles.label : 'text-zinc-500'}`}>
            {label}
          </span>
        </button>
        <span className={`text-[10px] tabular-nums ${enabled ? styles.pct : 'text-zinc-600'}`}>
          {pct}%
        </span>
      </div>

      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 flex w-full items-center">
          <div className="h-[3px] w-full rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-100 ${enabled ? styles.track : 'bg-zinc-700/40'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className={`relative z-10 h-3 w-full cursor-pointer appearance-none bg-transparent ${styles.thumb} [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-md ${
            enabled
              ? `[&::-webkit-slider-thumb]:bg-white`
              : '[&::-webkit-slider-thumb]:bg-zinc-600'
          }`}
          disabled={!enabled}
          title={`${label}: ${pct}%`}
        />
      </div>
    </div>
  );
};
