import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Player, GuessData } from '../types/game';
import { VersionDisplay } from './VersionDisplay';
import { SocketDebugger } from './SocketDebugger';
import { useSound } from '../hooks/useSound';

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
  socket?: any;
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
  playerName,
  socket
}) => {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitDots, setWaitDots] = useState('');
  const { playButtonClick, playKeypress } = useSound();

  useEffect(() => {
    if (isMyTurn) { setWaitDots(''); return; }
    const id = setInterval(() => setWaitDots(p => p.length >= 3 ? '' : p + '.'), 500);
    return () => clearInterval(id);
  }, [isMyTurn]);

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
      playButtonClick();
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

  const renderGuessTable = (guesses: GuessData[], label: string, emptyText: string, isMe: boolean) => (
    <div>
      <div className={`text-xs font-medium mb-1.5 truncate ${isMe ? 'text-emerald-400' : 'text-zinc-400'}`}>{label}</div>
      {guesses.length === 0 ? (
        <p className="text-zinc-600 text-xs py-3 text-center">{emptyText}</p>
      ) : (
        <div className="bg-zinc-950/50 rounded overflow-hidden">
          <div className="grid grid-cols-4 text-[10px] font-medium text-zinc-600 uppercase py-1 px-1 border-b border-zinc-800">
            <div className="text-center">#</div>
            <div className="text-center">G</div>
            <div className="text-center">P</div>
            <div className="text-center">C</div>
          </div>
          {guesses.map((guessData, index) => {
            const isWin = guessData.feedback.correctPosition === 5;
            return (
              <div key={index} className={`grid grid-cols-4 py-1 px-1 border-t border-zinc-800/30 ${isWin ? 'bg-emerald-500/5' : ''}`}>
                <div className="text-center text-zinc-600 text-[10px]">{guessData.turn}</div>
                <div className={`text-center font-mono text-xs ${isWin ? 'text-emerald-400 font-semibold' : 'text-zinc-100'}`}>
                  {guessData.guess}
                </div>
                <div className="text-center">
                  <span className={`text-xs font-mono font-semibold ${
                    isWin || guessData.feedback.correctPosition > 0 ? 'text-emerald-400' : 'text-zinc-600'
                  }`}>
                    {guessData.feedback.correctPosition}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-xs font-mono font-semibold ${
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
  );

  return (
    <div className="bg-zinc-950 p-2 md:p-4 pb-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-lg font-semibold text-zinc-100 mb-3">Game {gameNumber}</h1>
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 mb-4">
            <span>{me?.name}: <span className="text-emerald-400 font-medium">{me?.gamesWon ?? 0}</span></span>
            <span className="text-zinc-700">|</span>
            <span>{opponent?.name}: <span className="text-zinc-300 font-medium">{opponent?.gamesWon ?? 0}</span></span>
          </div>

          {/* Game Progress */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-zinc-100 font-mono">{myGuesses.length}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Your Guesses</div>
                <div className="w-full bg-zinc-800 rounded-full h-0.5 mt-2">
                  <div
                    className="h-0.5 bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((myGuesses.length / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-zinc-100 font-mono">{opponentGuesses.length}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">{opponent?.name}'s Guesses</div>
                <div className="w-full bg-zinc-800 rounded-full h-0.5 mt-2">
                  <div
                    className="h-0.5 bg-zinc-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((opponentGuesses.length / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Game Input */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                  isMyTurn
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isMyTurn ? 'Your Turn' : `${opponent?.name}'s Turn`}
                </div>

                {gameState.potentialWinner && gameState.potentialWinner !== playerName && isMyTurn && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">
                      You must guess correctly or {gameState.potentialWinner} wins!
                    </p>
                  </div>
                )}
              </div>

              {isMyTurn && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="guess" className="block text-xs font-medium text-zinc-400 mb-2">
                      Enter your guess
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="guess"
                      value={guess}
                      onChange={(e) => {
                        const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
                        if (newValue.length > guess.length) {
                          playKeypress();
                        }
                        setGuess(newValue);
                      }}
                      aria-label="Enter your guess for the opponent's number"
                      aria-describedby="guess-validation-status guess-requirements"
                      aria-invalid={guess.length > 0 && !isValid}
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-2xl font-mono tracking-[0.3em] text-center placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-200"
                      placeholder="12345"
                      maxLength={5}
                      required
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {guess.length > 0 && (
                          <span id="guess-validation-status" className={`text-xs ${isValid ? 'text-emerald-400' : 'text-red-400'}`} role="status" aria-live="polite">
                            {isValid ? 'Valid' : validationError}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${guess.length === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {guess.length}/5
                      </span>
                    </div>
                    {guess.length === 0 && (
                      <p id="guess-requirements" className="text-xs text-zinc-500 mt-1">
                        Enter 5 unique digits
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    aria-label={isSubmitting ? 'Submitting your guess, please wait' : 'Submit your guess'}
                    className={`w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200 flex items-center justify-center gap-2 ${
                      !isValid || isSubmitting
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-emerald-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Make Guess
                      </>
                    )}
                  </button>
                </form>
              )}

              {!isMyTurn && (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-sm">
                    Waiting for {opponent?.name}{waitDots}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Game History */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                {renderGuessTable(myGuesses, 'You', 'No guesses yet', true)}
                {renderGuessTable(opponentGuesses, opponent?.name ?? 'Opponent', `Waiting...`, false)}
              </div>
            </div>
          </div>
        </div>

        <SocketDebugger socket={socket} inline />
      </div>
      <VersionDisplay />
    </div>
  );
};
