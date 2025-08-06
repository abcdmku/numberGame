import React, { useState } from 'react';
import { Users, Gamepad2 } from 'lucide-react';

interface LobbyProps {
  onJoin: (name: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-none sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl border-0 sm:border border-white/20 min-h-screen sm:min-h-0 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Number Master</h1>
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
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="Your player name"
              maxLength={20}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            Join Game
          </button>
        </form>

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">How to Play</h3>
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
    </div>
  );
};