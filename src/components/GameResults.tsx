import React, { useState } from 'react';
import { Home, Users, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Player } from '../types/game';
import { VersionDisplay } from './VersionDisplay';

interface GameResultsProps {
  winner: string;
  players: Player[];
  myId: string;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  gameNumber: number;
  rematchState: {
    requested: boolean;
    opponentRequested: boolean;
  };
  onRequestRematch: () => void;
  onAcceptRematch: () => void;
  onJoinLobby: (name: string) => void;
  playerName: string;
  gameState: {
    isDraw?: boolean;
  };
  opponentLeft?: boolean;
}

export const GameResults: React.FC<GameResultsProps> = ({
  winner,
  players,
  myId,
  onPlayAgain,
  onReturnToLobby,
  gameNumber,
  rematchState,
  onRequestRematch,
  onAcceptRematch,
  onJoinLobby,
  playerName,
  gameState,
  opponentLeft = false
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const me = players.find(p => p.id === myId);
  const opponent = players.find(p => p.id !== myId);
  const isWinner = winner === me?.name;
  const meIsWinner = winner === me?.name;
  const opponentIsWinner = winner === opponent?.name;

  const renderGuessTable = (guesses: any[], label: string) => (
    <div>
      <h4 className="text-sm font-medium text-zinc-300 mb-3">{label}</h4>
      <div className="max-h-40 overflow-y-auto">
        {!guesses || guesses.length === 0 ? (
          <p className="text-zinc-600 text-sm py-4 text-center">No guesses made</p>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-px text-xs font-medium text-zinc-500 uppercase tracking-wider p-1.5 border-b border-zinc-800">
              <div className="text-center">#</div>
              <div className="text-center">Guess</div>
              <div className="text-center">Pos</div>
              <div className="text-center">Close</div>
            </div>
            {guesses.map((guessData: any, index: number) => {
              const isWin = guessData.feedback.correctPosition === 5;
              return (
                <div key={index} className={`grid grid-cols-4 gap-px p-1.5 border-t border-zinc-800/50 ${
                  isWin ? 'bg-emerald-500/5' : ''
                }`}>
                  <div className="text-center text-zinc-500 text-sm">
                    {guessData.turn}
                  </div>
                  <div className={`text-center font-mono text-base tracking-wider ${
                    isWin ? 'text-emerald-400 font-semibold' : 'text-zinc-100'
                  }`}>
                    {guessData.guess}
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-mono font-semibold ${
                      guessData.feedback.correctPosition > 0 ? 'text-emerald-400' : 'text-zinc-600'
                    }`}>
                      {guessData.feedback.correctPosition}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-mono font-semibold ${
                      guessData.feedback.correctDigitWrongPosition > 0 ? 'text-amber-400' : 'text-zinc-600'
                    }`}>
                      {guessData.feedback.correctDigitWrongPosition}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-3">
          <div className="text-zinc-500 text-sm mb-1">Game {gameNumber}</div>
          <h2 className={`text-2xl font-semibold ${
            gameState.isDraw ? 'text-zinc-300' : isWinner ? 'text-amber-400' : 'text-red-400'
          }`}>
            {gameState.isDraw ? "It's a Draw" : isWinner ? 'You Won!' : `${winner} Won`}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div className={`border rounded-lg p-3 ${
            meIsWinner ? 'bg-amber-500/10 border-amber-500/40' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${meIsWinner ? 'bg-amber-400' : 'bg-zinc-600'}`}></div>
              <span className={`text-sm font-medium ${meIsWinner ? 'text-amber-300' : 'text-zinc-100'}`}>{me?.name} (You)</span>
              {meIsWinner && <span className="text-xs text-amber-400 font-medium">Winner</span>}
            </div>
            <div className="space-y-1.5">
              <div className="bg-zinc-800/50 rounded-md p-2">
                <div className="text-xs text-zinc-500 mb-0.5">Your Number</div>
                <div className="text-lg font-mono text-zinc-100 tracking-wider">{me?.number}</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Guesses</span>
                <span className="text-zinc-100 font-mono">{me?.guesses?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Total wins</span>
                <span className="text-amber-400 font-mono">{me?.gamesWon || 0}</span>
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-3 ${
            opponentIsWinner ? 'bg-amber-500/10 border-amber-500/40' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-2 h-2 rounded-full ${opponentIsWinner ? 'bg-amber-400' : 'bg-zinc-600'}`}></div>
              <span className={`text-sm font-medium ${opponentIsWinner ? 'text-amber-300' : 'text-zinc-100'}`}>{opponent?.name}</span>
              {opponentIsWinner && <span className="text-xs text-amber-400 font-medium">Winner</span>}
            </div>
            <div className="space-y-1.5">
              <div className="bg-zinc-800/50 rounded-md p-2">
                <div className="text-xs text-zinc-500 mb-0.5">Their Number</div>
                <div className="text-lg font-mono text-zinc-100 tracking-wider">{opponent?.number}</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Guesses</span>
                <span className="text-zinc-100 font-mono">{opponent?.guesses?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Total wins</span>
                <span className="text-zinc-300 font-mono">{opponent?.gamesWon || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Game History */}
        <div className="mb-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 w-full text-left"
          >
            {showHistory ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
            <h3 className="text-sm font-medium text-zinc-100">Game History</h3>
          </button>
          {showHistory && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {renderGuessTable(me?.guesses || [], `${me?.name} (You)`)}
              {renderGuessTable(opponent?.guesses || [], opponent?.name || 'Opponent')}
            </div>
          )}
        </div>

        {/* Opponent left */}
        {opponentLeft && (
          <div className="space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <p className="text-zinc-400 text-sm">{opponent?.name || 'Your opponent'} has left the game.</p>
            </div>
            <button
              onClick={() => onJoinLobby(playerName)}
              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Find New Opponent
            </button>
          </div>
        )}

        {/* Rematch request from opponent */}
        {!opponentLeft && rematchState.opponentRequested && !rematchState.requested && (
          <div className="space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-zinc-300 text-sm text-center mb-4">
                {opponent?.name} wants to play again
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onAcceptRematch}
                  className="flex-1 bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={onReturnToLobby}
                  className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-lg font-medium hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waiting for opponent response */}
        {!opponentLeft && rematchState.requested && !rematchState.opponentRequested && (
          <div className="space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="text-zinc-300 text-sm">Waiting for {opponent?.name} to accept...</span>
              </div>
            </div>
            <button
              onClick={onReturnToLobby}
              className="w-full bg-zinc-800 text-zinc-400 py-2.5 px-4 rounded-lg font-medium hover:bg-zinc-700 hover:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Cancel & Find New Opponent
            </button>
          </div>
        )}

        {/* Initial options */}
        {!opponentLeft && !rematchState.requested && !rematchState.opponentRequested && (
          <div className="flex gap-3">
            <button
              onClick={onRequestRematch}
              className="flex-1 bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Request Rematch
            </button>
            <button
              onClick={() => onJoinLobby(playerName)}
              className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-lg font-medium hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              New Opponent
            </button>
          </div>
        )}
      </div>
      <VersionDisplay />
    </div>
  );
};
