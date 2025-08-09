import React from 'react';
import { Trophy, Home, Crown, Users, Clock, Check, X, History, Star } from 'lucide-react';
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
  gameState
}) => {
  const me = players.find(p => p.id === myId);
  const opponent = players.find(p => p.id !== myId);
  const isWinner = winner === me?.name;

  const renderFeedbackBadges = (feedback: { correctPosition: number; correctDigitWrongPosition: number }) => {
    const badges = [];
    
    // Position badges (correct position)
    if (feedback.correctPosition > 0) {
      badges.push(
        <div key="position" className="flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-medium border border-green-500/30">
          <CheckCircle className="w-3 h-3" />
          <span>Position: {feedback.correctPosition}</span>
        </div>
      );
    }
    
    // Close badges (correct digit, wrong position)
    if (feedback.correctDigitWrongPosition > 0) {
      badges.push(
        <div key="close" className="flex items-center gap-1 bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full text-xs font-medium border border-orange-500/30">
          <AlertCircle className="w-3 h-3" />
          <span>Close: {feedback.correctDigitWrongPosition}</span>
        </div>
      );
    }
    
    // Show "None" only if no matches at all
    if (feedback.correctPosition === 0 && feedback.correctDigitWrongPosition === 0) {
      badges.push(
        <div key="none" className="flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs font-medium border border-red-500/30">
          <XCircle className="w-3 h-3" />
          <span>None</span>
        </div>
      );
    }
    
    return badges;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 md:flex md:items-center md:justify-center p-4">
      <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md rounded-none md:rounded-3xl p-6 md:p-8 w-full md:max-w-2xl md:shadow-2xl border-0 md:border md:border-white/20 text-center min-h-screen md:min-h-0 flex flex-col justify-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
          isWinner 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}>
          {isWinner ? (
            <Crown className="w-10 h-10 text-white" />
          ) : (
            <Trophy className="w-10 h-10 text-white" />
          )}
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Game {gameNumber} Results
        </h2>

        <div className={`text-2xl font-semibold mb-6 ${
          gameState.isDraw ? 'text-purple-300' : isWinner ? 'text-yellow-300' : 'text-blue-300'
        }`}>
          {gameState.isDraw ? '🤝 It\'s a Draw!' : isWinner ? '🎉 You Won!' : `${winner} Wins!`}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-white font-medium">{me?.name} (You)</span>
            </div>
            <div className="text-blue-200 text-sm space-y-1">
              <p>Number: {me?.number}</p>
              <p>Guesses made: {me?.guesses?.length || 0}</p>
              <p>Games won: {me?.gamesWon || 0}</p>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-white font-medium">{opponent?.name}</span>
            </div>
            <div className="text-blue-200 text-sm space-y-1">
              <p>Number: {opponent?.number}</p>
              <p>Guesses made: {opponent?.guesses?.length || 0}</p>
              <p>Games won: {opponent?.gamesWon || 0}</p>
            </div>
          </div>
        </div>

        {/* Complete Game History */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-none md:rounded-2xl p-4 md:p-6 shadow-xl border-0 md:border border-white/20">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-blue-300" />
              <h3 className="text-xl font-semibold text-white">Complete Game History</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* My Guesses */}
              <div>
                <h4 className="text-lg font-medium text-green-300 mb-4">{me?.name} (You)</h4>
                <div className="max-h-60 overflow-y-auto">
                  {!me?.guesses || me.guesses.length === 0 ? (
                    <p className="text-blue-200 text-sm italic p-4 text-center">No guesses made</p>
                  ) : (
                    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                      <div className="grid grid-cols-4 gap-px bg-white/10 text-xs font-medium text-blue-200 p-2">
                        <div className="text-center">#</div>
                        <div className="text-center">Guess</div>
                        <div className="text-center">Pos</div>
                        <div className="text-center">Close</div>
                      </div>
                      {me.guesses.map((guessData, index) => {
                        const isWin = guessData.feedback.correctPosition === 5;
                        return (
                          <div key={index} className={`grid grid-cols-4 gap-px p-2 border-t border-white/5 hover:bg-white/5 transition-colors ${
                            isWin ? 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10' : ''
                          }`}>
                            <div className="text-center text-blue-300 text-sm font-medium">
                              {guessData.turn}
                            </div>
                            <div className={`text-center font-mono text-lg tracking-wider ${
                              isWin ? 'text-green-400 font-bold' : 'text-white'
                            }`}>
                              {guessData.guess}
                            </div>
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                isWin 
                                  ? 'bg-yellow-400 text-yellow-900 shadow-lg relative'
                                  : guessData.feedback.correctPosition > 0
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {isWin ? (
                                  <>
                                    <Star className="w-6 h-6 absolute inset-0 text-yellow-600 fill-current" />
                                    <span className="relative z-10 text-xs font-bold">5</span>
                                  </>
                                ) : (
                                  guessData.feedback.correctPosition
                                )}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                guessData.feedback.correctDigitWrongPosition > 0
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-amber-600/30 text-amber-400'
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

              {/* Opponent Guesses */}
              <div>
                <h4 className="text-lg font-medium text-purple-300 mb-4">{opponent?.name}</h4>
                <div className="max-h-60 overflow-y-auto">
                  {!opponent?.guesses || opponent.guesses.length === 0 ? (
                    <p className="text-blue-200 text-sm italic p-4 text-center">No guesses made</p>
                  ) : (
                    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                      <div className="grid grid-cols-4 gap-px bg-white/10 text-xs font-medium text-blue-200 p-2">
                        <div className="text-center">#</div>
                        <div className="text-center">Guess</div>
                        <div className="text-center">Pos</div>
                        <div className="text-center">Close</div>
                      </div>
                      {opponent.guesses.map((guessData, index) => {
                        const isWin = guessData.feedback.correctPosition === 5;
                        return (
                          <div key={index} className={`grid grid-cols-4 gap-px p-2 border-t border-white/5 hover:bg-white/5 transition-colors ${
                            isWin ? 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10' : ''
                          }`}>
                            <div className="text-center text-blue-300 text-sm font-medium">
                              {guessData.turn}
                            </div>
                            <div className={`text-center font-mono text-lg tracking-wider ${
                              isWin ? 'text-yellow-200 font-bold' : 'text-white'
                            }`}>
                              {guessData.guess}
                            </div>
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                isWin 
                                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg' 
                                  : guessData.feedback.correctPosition > 0
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {guessData.feedback.correctPosition}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                guessData.feedback.correctDigitWrongPosition > 0
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-amber-600/30 text-amber-400'
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
            </div>
          </div>
        </div>

        {/* Show rematch request from opponent */}
        {rematchState.opponentRequested && !rematchState.requested && (
          <div className="space-y-4">
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Users className="w-5 h-5 text-blue-300" />
                <span className="text-blue-100 font-medium">Rematch Request</span>
              </div>
              <p className="text-sm text-blue-200 text-center mb-4">
                {opponent?.name} wants to play another game. Accept?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onAcceptRematch}
                  className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Accept Rematch
                </button>
                <button
                  onClick={onReturnToLobby}
                  className="w-full sm:flex-1 bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Decline & Leave
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show waiting for opponent response */}
        {rematchState.requested && !rematchState.opponentRequested && (
          <div className="space-y-4">
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-blue-300 animate-pulse" />
                <span className="text-blue-100 font-medium">Rematch Request Sent</span>
              </div>
              <p className="text-sm text-blue-200 text-center">
                Waiting for {opponent?.name} to accept...
              </p>
              <div className="mt-3 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
            
            <button
              onClick={onReturnToLobby}
              className="w-full bg-white/10 backdrop-blur-sm text-white py-2 px-4 rounded-lg font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Cancel & Find New Opponent
            </button>
          </div>
        )}

        {/* Show initial options */}
        {!rematchState.requested && !rematchState.opponentRequested && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRequestRematch}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Request Rematch
            </button>
            
            <button
              onClick={() => onJoinLobby(playerName)}
              className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Find New Opponent
            </button>
          </div>
        )}

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-sm font-medium text-white mb-2">What happens next?</h4>
          <div className="text-xs text-blue-200 space-y-1">
            <p>• <strong>Request Rematch:</strong> Ask {opponent?.name} to play another round</p>
            <p>• <strong>Find New Opponent:</strong> Return to lobby and match with someone else</p>
            <p>• Both players must accept to start a new game together</p>
          </div>
        </div>

      </div>
      <VersionDisplay />
    </div>
  );
};