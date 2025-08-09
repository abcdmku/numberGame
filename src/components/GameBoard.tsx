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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  
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
    if (validateGuess(guess) && isMyTurn && !isSubmitting) {
      setIsSubmitting(true);
      setTimeout(() => {
        onMakeGuess(guess);
        setGuess('');
        setIsSubmitting(false);
      }, 200);
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
          <h1 className="text-3xl font-bold text-white mb-4">
            Game {gameNumber} - Number Master
          </h1>
          <div className="flex items-center justify-center gap-6 text-blue-100 mb-4">
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
          
          {/* Game Progress Overview */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-sm text-blue-200 mb-3">Game Progress</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">{myGuesses.length}</div>
                <div className="text-xs text-blue-200">Your Guesses</div>
                <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((myGuesses.length / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">{opponentGuesses.length}</div>
                <div className="text-xs text-blue-200">{opponent?.name}'s Guesses</div>
                <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((opponentGuesses.length / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Game Input */}
          <div className="lg:col-span-1 order-2 lg:order-1">
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="guess"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      onFocus={() => setFocusedInput(true)}
                      onBlur={() => setFocusedInput(false)}
                      className={`w-full px-4 py-4 md:py-3 bg-white/20 backdrop-blur-sm border rounded-xl text-white text-center text-3xl md:text-2xl font-mono tracking-widest placeholder-blue-200 focus:outline-none transition-all duration-300 transform touch-manipulation ${
                        focusedInput
                          ? 'border-blue-400 ring-2 ring-blue-400/30 scale-[1.02] bg-white/25 shadow-lg shadow-blue-500/20'
                          : 'border-white/30 hover:border-white/50 hover:bg-white/25'
                      }`}
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
                    disabled={!isValid || isSubmitting}
                    className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 md:py-3 px-6 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform touch-manipulation ${
                      !isValid || isSubmitting
                        ? 'opacity-50 scale-95'
                        : 'hover:from-blue-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 md:active:scale-95 active:scale-[0.97]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Make Guess
                      </>
                    )}
                  </button>
                </form>
              )}

              {!isMyTurn && (
                <div className="text-center p-6 md:p-8">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse">
                    <Target className="w-8 h-8 text-orange-300" />
                  </div>
                  <p className="text-blue-100 text-base md:text-sm">
                    Waiting for {opponent?.name} to make their guess...
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game History */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white/10 backdrop-blur-md rounded-none md:rounded-2xl p-4 md:p-6 shadow-xl border-0 md:border border-white/20">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-blue-300" />
                <h3 className="text-xl font-semibold text-white">Game History</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* My Guesses */}
                <div>
                  <h4 className="text-lg font-medium text-green-300 mb-4">Your Guesses</h4>
                  <div className="overflow-y-auto max-h-64 md:max-h-96">
                    {myGuesses.length === 0 ? (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                          <Target className="w-6 h-6 text-green-300" />
                        </div>
                        <p className="text-blue-200 text-sm italic">No guesses yet</p>
                        <p className="text-xs text-blue-300 mt-1">Make your first guess!</p>
                        
                        {/* Skeleton loader for upcoming guesses */}
                        <div className="mt-4 space-y-2 opacity-30">
                          <div className="h-3 bg-white/10 rounded animate-pulse"></div>
                          <div className="h-3 bg-white/5 rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
                          <div className="h-3 bg-white/10 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
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
                                    ? 'relative'
                                    : guessData.feedback.correctPosition > 0
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-600 text-gray-300'
                                }`}>
                                  {isWin ? (
                                    <>
                                      <Star className="w-8 h-8 absolute inset-0 text-yellow-400 fill-current" />
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-purple-300">
                      {opponent?.name}'s Guesses
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-300">{opponentGuesses.length}</span>
                      </div>
                      {opponentGuesses.some(g => g.feedback.correctPosition === 5) && (
                        <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-64 md:max-h-96">
                    {opponentGuesses.length === 0 ? (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                          <Target className="w-6 h-6 text-purple-300" />
                        </div>
                        <p className="text-blue-200 text-sm italic">No guesses yet</p>
                        <p className="text-xs text-blue-300 mt-1">Waiting for {opponent?.name}...</p>
                        
                        {/* Animated waiting indicator */}
                        <div className="mt-4 flex justify-center space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
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
                                    ? 'relative' 
                                    : guessData.feedback.correctPosition > 0
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-600 text-gray-300'
                                }`}>
                                  {isWin ? (
                                    <>
                                      <Star className="w-8 h-8 absolute inset-0 text-yellow-400 fill-current" />
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
              </div>
            </div>
          </div>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};