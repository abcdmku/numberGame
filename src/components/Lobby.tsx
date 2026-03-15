import React, { useState } from 'react';
import { VersionDisplay } from './VersionDisplay';
import { useSound } from '../hooks/useSound';

interface LobbyProps {
  onJoin: (name: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { playButtonClick, playKeypress, playSuccess } = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      playButtonClick();
      setTimeout(() => {
        onJoin(name.trim());
        playSuccess();
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="w-10 h-10" />
            <h1 className="text-2xl font-semibold text-zinc-100">Number Master</h1>
          </div>
          <p className="text-zinc-500 text-sm">Real-time multiplayer number guessing game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
              Player name
            </label>
            <input
              type="text"
              id="playerName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.length > name.length) {
                  playKeypress();
                }
              }}
              aria-label="Enter your player name"
              aria-describedby="name-input-description"
              autoComplete="nickname"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-200"
              placeholder="Your player name"
              maxLength={20}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            aria-label={isSubmitting ? 'Joining game, please wait' : 'Join the multiplayer game'}
            className={`w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200 flex items-center justify-center gap-2 ${
              !name.trim() || isSubmitting
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-emerald-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              'Join Game'
            )}
          </button>
        </form>

        <div id="name-input-description" className="sr-only">
          Enter a unique player name to join the multiplayer number guessing game
        </div>

        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg p-4" role="region" aria-labelledby="how-to-play-heading">
          <h3 id="how-to-play-heading" className="text-sm font-medium text-zinc-100 mb-3">How to Play</h3>
          <ul className="text-sm text-zinc-400 space-y-1.5">
            <li>- Create a 5-digit number with no repeated digits</li>
            <li>- Take turns guessing your opponent's number</li>
            <li>- Get feedback on correct digits and positions</li>
            <li>- First to guess correctly wins!</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <h4 className="text-xs font-medium text-zinc-300 mb-2">Feedback</h4>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-mono">P</span>
              <span className="text-zinc-500">Right digit, right spot</span>
            </div>
            <div className="flex items-center gap-3 text-xs mt-1.5">
              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded font-mono">C</span>
              <span className="text-zinc-500">Right digit, wrong spot</span>
            </div>
            <div className="flex items-center gap-3 text-xs mt-1.5">
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded font-mono">&mdash;</span>
              <span className="text-zinc-500">No matching digits</span>
            </div>
          </div>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};
