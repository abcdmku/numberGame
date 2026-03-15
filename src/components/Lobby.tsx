import React, { useState, useEffect } from 'react';
import { Users, Gamepad2, Sparkles } from 'lucide-react';
import { VersionDisplay } from './VersionDisplay';
import { useSound } from '../hooks/useSound';

interface LobbyProps {
  onJoin: (name: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const { playButtonClick, playKeypress, playSuccess } = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      playButtonClick();
      // Add a small delay for visual feedback
      setTimeout(() => {
        onJoin(name.trim());
        playSuccess();
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 md:flex md:items-center md:justify-center p-0 md:p-4">
      <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md rounded-none md:rounded-3xl p-6 md:p-8 w-full md:max-w-md md:shadow-2xl border-0 md:border md:border-white/20 min-h-screen md:min-h-0 flex flex-col justify-center animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full mb-6 hover:scale-110 transition-all duration-500 cursor-pointer group relative shadow-lg shadow-blue-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
            <Gamepad2 className="w-10 h-10 text-white group-hover:rotate-12 transition-transform duration-300 relative z-10 drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 hover:text-blue-200 transition-colors duration-300 tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Number Master</span>
          </h1>
          <p className="text-blue-100/90 text-lg font-medium tracking-wide">Real-time multiplayer number guessing game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-semibold text-blue-100 mb-3 tracking-wide uppercase text-xs opacity-90">
              Enter your name
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
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              aria-label="Enter your player name"
              aria-describedby="name-input-description"
              autoComplete="nickname"
              className={`w-full px-4 py-4 md:py-3 bg-white/20 backdrop-blur-sm border rounded-xl text-white placeholder-blue-200 focus:outline-none transition-all duration-300 transform touch-manipulation text-lg md:text-base ${
                focusedInput 
                  ? 'border-blue-400 ring-2 ring-blue-400/30 scale-[1.02] bg-white/25' 
                  : 'border-white/30 hover:border-white/50 hover:bg-white/25'
              }`}
              placeholder="Your player name"
              maxLength={20}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            aria-label={isSubmitting ? 'Joining game, please wait' : 'Join the multiplayer game'}
            aria-describedby="join-button-description"
            className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 md:py-3 px-6 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform touch-manipulation ${
              !name.trim() || isSubmitting
                ? 'opacity-50 scale-95'
                : 'hover:from-blue-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 md:active:scale-95 active:scale-[0.97]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <div className="absolute inset-0 w-5 h-5 border border-white/10 rounded-full animate-ping"></div>
                </div>
                <span className="animate-pulse">Joining game...</span>
              </>
            ) : (
              <>
                <Users className="w-5 h-5 group-hover:bounce" />
                Join Game
              </>
            )}
          </button>
        </form>
        
        {/* Screen reader descriptions */}
        <div id="name-input-description" className="sr-only">
          Enter a unique player name to join the multiplayer number guessing game
        </div>
        <div id="join-button-description" className="sr-only">
          Click to enter the game lobby and find an opponent to play against
        </div>

        <div className="mt-10 p-6 bg-gradient-to-br from-white/5 via-white/10 to-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 transition-all duration-500 group backdrop-blur-sm" role="region" aria-labelledby="how-to-play-heading">
          <h3 id="how-to-play-heading" className="text-lg font-semibold text-white mb-2 flex items-center gap-2 group-hover:text-blue-200 transition-colors">
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
            How to Play
          </h3>
          <ul className="text-sm text-blue-100/90 space-y-2 leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Create a 5-digit number with no repeated digits</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Take turns guessing your opponent's number</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Get feedback on correct digits and positions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>First to guess correctly wins!</span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-2">Feedback System:</h4>
            <div className="text-xs text-blue-100/80 space-y-2 leading-relaxed">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <span><strong className="text-green-400">Position:</strong> Right digit, right spot</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <span><strong className="text-orange-400">Close:</strong> Right digit, wrong spot</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">—</span>
                </div>
                <span><strong className="text-gray-400">None:</strong> No matching digits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};