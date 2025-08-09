import React, { useState, useEffect } from 'react';
import { Users, Gamepad2, Sparkles } from 'lucide-react';
import { VersionDisplay } from './VersionDisplay';

interface LobbyProps {
  onJoin: (name: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      // Add a small delay for visual feedback
      setTimeout(() => {
        onJoin(name.trim());
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 md:flex md:items-center md:justify-center p-0 md:p-4">
      <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md rounded-none md:rounded-3xl p-6 md:p-8 w-full md:max-w-md md:shadow-2xl border-0 md:border md:border-white/20 min-h-screen md:min-h-0 flex flex-col justify-center animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 hover:scale-110 transition-transform duration-300 cursor-pointer group relative">
            <Gamepad2 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 hover:text-blue-200 transition-colors duration-300">Number Master</h1>
          <p className="text-blue-100">Real-time multiplayer number guessing game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-blue-100 mb-2">
              Enter your name
            </label>
            <input
              type="text"
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
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

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 group-hover:text-blue-200 transition-colors">
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            How to Play
          </h3>
          <ul className="text-sm text-blue-100 space-y-1">
            <li>• Create a 5-digit number with no repeated digits</li>
            <li>• Take turns guessing your opponent's number</li>
            <li>• Get feedback on correct digits and positions</li>
            <li>• First to guess correctly wins!</li>
          </ul>
          <div className="mt-4 pt-3 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-2">Feedback System:</h4>
            <div className="text-xs text-blue-100 space-y-1">
              <p>• <strong>Position:</strong> Right digit, right spot</p>
              <p>• <strong>Close:</strong> Right digit, wrong spot</p>
              <p>• <strong>None:</strong> No matching digits</p>
            </div>
          </div>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};