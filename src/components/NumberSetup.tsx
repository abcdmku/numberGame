import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Player } from '../types/game';
import { VersionDisplay } from './VersionDisplay';
import { useSound } from '../hooks/useSound';

interface NumberSetupProps {
  players: Player[];
  myId: string;
  onSetNumber: (number: string) => void;
  onGenerateRandom: () => void;
  myNumber: string;
  gameNumber: number;
  opponentStatus?: 'connected' | 'disconnected' | 'reconnecting';
}

export const NumberSetup: React.FC<NumberSetupProps> = ({
  players,
  myId,
  onSetNumber,
  onGenerateRandom,
  myNumber,
  gameNumber,
  opponentStatus = 'connected'
}) => {
  const [inputNumber, setInputNumber] = useState(myNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { playButtonClick, playKeypress, playSuccess, playNotification } = useSound();
  const me = players.find(p => p.id === myId);
  const opponent = players.find(p => p.id !== myId);

  const validateNumber = (num: string) => {
    if (!/^\d{5}$/.test(num)) return false;
    const digits = num.split('');
    const uniqueDigits = new Set(digits);
    return uniqueDigits.size === 5;
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateNumber(inputNumber) && !isSubmitting) {
      setIsSubmitting(true);
      playButtonClick();
      setTimeout(() => {
        onSetNumber(inputNumber);
        playSuccess();
      }, 200);
    }
  };

  const handleGenerate = () => {
    playButtonClick();
    onGenerateRandom();
    setTimeout(() => playNotification(), 100);
  };

  React.useEffect(() => {
    setInputNumber(myNumber);
  }, [myNumber]);

  const isValid = validateNumber(inputNumber);
  const validationError = getValidationError(inputNumber);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-zinc-500 text-sm mb-1">Game {gameNumber}</div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-1">Number Setup</h2>
          <p className="text-zinc-500 text-sm">Create your secret 5-digit number</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`bg-zinc-900 border rounded-lg p-3 ${
            me?.ready ? 'border-emerald-500/50' : 'border-zinc-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${me?.ready ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
              <span className="text-zinc-100 text-sm font-medium">{me?.name} (You)</span>
              {me?.ready && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="text-xs text-zinc-500">
              {me?.ready ? 'Ready' : 'Setting number...'}
            </p>
          </div>

          <div className={`bg-zinc-900 border rounded-lg p-3 ${
            opponent?.ready ? 'border-emerald-500/50' : 'border-zinc-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${opponent?.ready ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
              <span className="text-zinc-100 text-sm font-medium">{opponent?.name}</span>
              {opponent?.ready && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="text-xs text-zinc-500">
              {opponent?.ready ? 'Ready' : 'Setting number...'}
            </p>
            {opponentStatus === 'disconnected' && (
              <div className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                Disconnected
              </div>
            )}
          </div>
        </div>

        {!me?.ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="secretNumber" className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                Your Secret Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="secretNumber"
                value={inputNumber}
                onChange={(e) => {
                  const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
                  if (newValue.length > inputNumber.length) {
                    playKeypress();
                  }
                  setInputNumber(newValue);
                }}
                aria-label="Enter your secret 5-digit number"
                aria-describedby="number-validation-status number-requirements"
                aria-invalid={inputNumber.length > 0 && !isValid}
                autoComplete="off"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-2xl font-mono tracking-[0.3em] text-center placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-200"
                placeholder="12345"
                maxLength={5}
                required
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {inputNumber.length > 0 && (
                    <span id="number-validation-status" className={`text-xs ${isValid ? 'text-emerald-400' : 'text-red-400'}`} role="status" aria-live="polite">
                      {validationError || 'Ready to play'}
                    </span>
                  )}
                </div>
                <span className={`text-xs ${inputNumber.length === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {inputNumber.length}/5
                </span>
              </div>
              {inputNumber.length === 0 && (
                <p id="number-requirements" className="text-xs text-zinc-500 mt-1">
                  Enter 5 unique digits (0-9)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                aria-label="Generate a random 5-digit number with unique digits"
                className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 px-4 rounded-lg font-medium hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors duration-200"
              >
                Random
              </button>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                aria-label={isSubmitting ? 'Setting your number, please wait' : 'Confirm your secret number and ready up'}
                className={`flex-1 bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200 flex items-center justify-center gap-2 ${
                  !isValid || isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-emerald-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting...
                  </>
                ) : (
                  'Set Number'
                )}
              </button>
            </div>
          </form>
        )}

        {me?.ready && !opponent?.ready && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin"></div>
              <span className="text-zinc-400 text-sm">Waiting for {opponent?.name} to set their number</span>
            </div>
            <p className="text-zinc-500 text-xs">The game will start automatically once both players are ready</p>
          </div>
        )}

        {me?.ready && opponent?.ready && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-100 text-sm font-medium">Both players ready!</span>
            </div>
            <p className="text-emerald-400 text-xs">Starting the game...</p>
          </div>
        )}

        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wider">Rules</h3>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>- Must be exactly 5 digits</li>
            <li>- All digits must be unique (no repeats)</li>
            <li>- Examples: <code className="font-mono text-zinc-400">12345</code>, <code className="font-mono text-zinc-400">01234</code>, <code className="font-mono text-zinc-400">98765</code></li>
          </ul>
        </div>
      </div>
      <VersionDisplay />
    </div>
  );
};
