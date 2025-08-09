import React, { useState } from 'react';
import { Send, History, Trophy, Target, CheckCircle, AlertCircle, XCircle, Star } from 'lucide-react';
import { Player, GuessData } from '../types/game';
import { VersionDisplay } from './VersionDisplay';

interface GameBoardProps {
  players: Player[];
  myId: string;
  currentTurn: string;
  allGuesses: GuessData[];
  onMakeGuess: (guess: string) => void;
  gameNumber: number;
  gameState: any;
  opponentStatus: 'connected' | 'disconnected' | 'reconnecting';
  playerName: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  myId,
  currentTurn,
  allGuesses,
  onMakeGuess,
  gameNumber,
  gameState,
  opponentStatus,
  playerName
}) => {
  const [guess, setGuess] = useState('');
  
  const me = players.find(p => p.id === myId);
  const opponent = players.find(p => p.id !== myId);
  const isMyTurn = currentTurn === myId;
  
  const myGuesses = allGuesses.filter(g => g.playerId === myId);
  const opponentGuesses = allGuesses.filter(g => g.playerId !== myId);

  const validateGuess = (num: string) => {
    if (!/^\d{5}$/.test(num)) return false;
    const digits = num.split('');
    const uniqueDigits = new Set(digits);
    return uniqueDigits.size === 5;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateGuess(guess) && isMyTurn) {
      onMakeGuess(guess);
      setGuess('');
    }
  };

  const isValid = validateGuess(guess);
  
  const getValidationError = (num: string) => {
    if (num.length === 0) return '';
    if (num.length < 5) return `Need ${5 - num.length} more digit${5 - num.length > 1 ? 's' : ''}`;
    const digits = num.split('');
    const uniqueDigits = new Set(digits);
    if (uniqueDigits.size !== 5) {
      const duplicates = digits.filter((digit, index) => digits.indexOf(digit) !== index);
      return `Remove duplicate: ${[...new Set(duplicates)].join(', ')}`;
    }
    return '';
  };

  const validationError = getValidationError(guess);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Game {gameNumber} - Number Master
          </h1>
          <div className="flex items-center justify-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>{me?.name}: {me?.gamesWon ?? 0} wins</span>
            </div>
            <div className="w-px h-4 bg-blue-400"></div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>{opponent?.name}: {opponent?.gamesWon ?? 0} wins</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Input */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-none md:rounded-2xl p-4 md:p-6 shadow-xl border-0 md:border border-white/20">
              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  isMyTurn 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  <Target className="w-4 h-4" />
                  {isMyTurn ? 'Your Turn' : `${opponent?.name}'s Turn`}
                </div>
                
                {/* Warning message if opponent has won */}
                {gameState.potentialWinner && gameState.potentialWinner !== playerName && isMyTurn && (
                  <div className="mt-3 bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">
                    <div className="flex items-center gap-2 text-red-300 text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Warning: You must guess correctly or {gameState.potentialWinner} will win!</span>
                    </div>
                  </div>
                )}
              </div>

              {isMyTurn && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="guess" className="block text-sm font-medium text-blue-100 mb-2">
                      Enter your guess
                    </label>
                    <input
                      type="text"
                      id="guess"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      placeholder="12345"
                      maxLength={5}
                      required
                    />
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {guess.length > 0 && (
                            <>
                              {isValid ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className={`text-xs ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                                {isValid ? 'Valid guess' : validationError}
                              </span>
                            </>
                          )}
                        </div>
                        <span className={`text-xs ${guess.length === 5 ? 'text-green-400' : 'text-blue-300'}`}>
                          {guess.length}/5
                        </span>
                      </div>
                      {guess.length === 0 && (
                        <p className="text-xs text-blue-200">
                          Enter 5 unique digits
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Make Guess
                  </button>
                </form>
              )}

              {!isMyTurn && (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-orange-300" />
                  </div>
                  <p className="text-blue-100">
                    Waiting for {opponent?.name} to make their guess...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Game History */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-none md:rounded-2xl p-4 md:p-6 shadow-xl border-0 md:border border-white/20">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-blue-300" />
                <h3 className="text-xl font-semibold text-white">Game History</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* My Guesses */}
                <div>
                  <h4 className="text-lg font-medium text-green-300 mb-4">Your Guesses</h4>
                  <div className="overflow-y-auto">
                    {myGuesses.length === 0 ? (
                      <p className="text-blue-200 text-sm italic p-4 text-center">No guesses yet</p>
                    ) : (
                      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-4 gap-px bg-white/10 text-xs font-medium text-blue-200 p-2">
                          <div className="text-center">#</div>
                          <div className="text-center">Guess</div>
                          <div className="text-center">Pos</div>
                          <div className="text-center">Close</div>
                        </div>
                        {myGuesses.map((guessData, index) => {
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
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-600 text-gray-300'
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
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-600 text-gray-300'
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
                  <h4 className="text-lg font-medium text-purple-300 mb-4">
                    {opponent?.name}'s Guesses
                  </h4>
                  <div className="overflow-y-auto">
                    {opponentGuesses.length === 0 ? (
                      <p className="text-blue-200 text-sm italic p-4 text-center">No guesses yet</p>
                    ) : (
                      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-4 gap-px bg-white/10 text-xs font-medium text-blue-200 p-2">
                          <div className="text-center">#</div>
                          <div className="text-center">Guess</div>
                          <div className="text-center">Pos</div>
                          <div className="text-center">Close</div>
                        </div>
                        {opponentGuesses.map((guessData, index) => {
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
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-600 text-gray-300'
                                }`}>
                                  {guessData.feedback.correctPosition}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  guessData.feedback.correctDigitWrongPosition > 0
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-600 text-gray-300'
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
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};