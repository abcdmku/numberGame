import React from 'react';
import { Loader2, Wifi } from 'lucide-react';

interface WaitingRoomProps {
  playerName: string;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ playerName }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6">
          <Wifi className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Welcome, {playerName}!
        </h2>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-lg text-blue-100">Searching for an opponent...</p>
        </div>
        
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-sm text-blue-200">
            You'll be automatically matched with another player when they join.
            Please wait while we find you an opponent!
          </p>
        </div>
        
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};