import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-12">
      <div className="w-full max-w-sm text-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>

        <h2 className="text-lg text-zinc-100 font-medium mb-1">
          Welcome, {playerName}
        </h2>

        <p className="text-zinc-400 text-sm mb-4">
          Searching for an opponent{dots}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          <span className="text-zinc-500 text-xs">Connected to server</span>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};
