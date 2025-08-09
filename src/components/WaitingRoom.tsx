import React, { useState, useEffect } from 'react';
import { Loader2, Wifi, Users, Clock } from 'lucide-react';
import { VersionDisplay } from './VersionDisplay';

interface WaitingRoomProps {
  playerName: string;
  opponentStatus?: 'connected' | 'disconnected' | 'reconnecting';
  onWaitForOpponent?: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  playerName, 
  opponentStatus = 'connected', 
  onWaitForOpponent 
}) => {
  const [dots, setDots] = useState('');
  const [connectionPulse, setConnectionPulse] = useState(false);
  
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    const pulseInterval = setInterval(() => {
      setConnectionPulse(prev => !prev);
    }, 2000);
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(pulseInterval);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md rounded-none md:rounded-3xl p-6 md:p-8 w-full md:max-w-md md:shadow-2xl border-0 md:border md:border-white/20 text-center flex flex-col items-center animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6 transition-all duration-500 transform hover:scale-110 ${
          connectionPulse ? 'scale-105 shadow-lg shadow-green-500/30' : 'scale-100'
        }`}>
          <Wifi className="w-8 h-8 text-white" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4 hover:text-green-200 transition-colors duration-300">
          Welcome, {playerName}!
        </h2>
        
        <div className="flex items-center justify-center gap-3 mb-6 group">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin group-hover:text-blue-300 transition-colors" />
          <p className="text-lg text-blue-100 group-hover:text-white transition-colors">
            Searching for an opponent{dots}
          </p>
        </div>
        
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-sm font-medium text-white">Matchmaking Active</span>
          </div>
          <p className="text-sm text-blue-200 group-hover:text-blue-100 transition-colors">
            You'll be automatically matched with another player when they join.
            Please wait while we find you an opponent!
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-300">
            <Clock className="w-3 h-3" />
            <span>Usually takes less than a minute</span>
          </div>
        </div>
        
        {/* Enhanced Loading Animation */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-center">
            <div className="flex space-x-1 hover:space-x-2 transition-all duration-300">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce hover:bg-blue-300 hover:scale-125 transition-all" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce hover:bg-purple-300 hover:scale-125 transition-all" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce hover:bg-indigo-300 hover:scale-125 transition-all" style={{ animationDelay: '300ms' }}></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce hover:bg-pink-300 hover:scale-125 transition-all" style={{ animationDelay: '450ms' }}></div>
            </div>
          </div>
          
          {/* Progress Wave */}
          <div className="flex justify-center">
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute w-8 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full animate-ping opacity-75"></div>
              <div className="absolute w-4 h-full bg-gradient-to-r from-transparent via-white to-transparent rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Connection Status Indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                connectionPulse ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-green-400'
              }`}></div>
              <span className="text-xs text-blue-200">Connected to server</span>
            </div>
          </div>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};