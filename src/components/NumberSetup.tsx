import React, { useState } from 'react';
import { Shuffle, Check, Users, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Player } from '../types/game';
import { VersionDisplay } from './VersionDisplay';

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
  const [focusedInput, setFocusedInput] = useState(false);
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
      setTimeout(() => {
        onSetNumber(inputNumber);
      }, 200);
    }
  };

  const handleGenerate = () => {
    onGenerateRandom();
  };

  React.useEffect(() => {
    setInputNumber(myNumber);
  }, [myNumber]);

  const isValid = validateNumber(inputNumber);
  const validationError = getValidationError(inputNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 md:flex md:items-center md:justify-center p-4">
      <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md rounded-none md:rounded-3xl p-6 md:p-8 w-full md:max-w-2xl md:shadow-2xl border-0 md:border md:border-white/20 min-h-screen md:min-h-0 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Game {gameNumber} - Number Setup
          </h2>
          <p className="text-blue-100">Create your secret 5-digit number</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className={`bg-white/5 rounded-xl p-4 border border-white/10 transition-all duration-500 ${
            me?.ready ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/10' : 'hover:bg-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                me?.ready ? 'bg-green-400 shadow-lg shadow-green-400/50 scale-110' : 'bg-green-400'
              }`}></div>
              <span className="text-white font-medium">{me?.name} (You)</span>
              {me?.ready && (
                <Check className="w-4 h-4 text-green-400 animate-in zoom-in-50 duration-300" />
              )}
            </div>
            <p className="text-sm text-blue-200 transition-colors duration-300">
              {me?.ready ? '✅ Number set and ready!' : 'Waiting for your number...'}
            </p>
          </div>
          
          <div className={`bg-white/5 rounded-xl p-4 border border-white/10 transition-all duration-500 ${
            opponent?.ready ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'hover:bg-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                opponent?.ready ? 'bg-purple-400 shadow-lg shadow-purple-400/50 scale-110' : 'bg-purple-400'
              }`}></div>
              <span className="text-white font-medium">{opponent?.name}</span>
              {opponent?.ready && (
                <Check className="w-4 h-4 text-green-400 animate-in zoom-in-50 duration-300" />
              )}
            </div>
            <p className="text-sm text-blue-200 transition-colors duration-300">
              {opponent?.ready ? '✅ Number set and ready!' : 'Waiting for their number...'}
            </p>
            {opponentStatus === 'disconnected' && (
              <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                Opponent disconnected
              </div>
            )}
          </div>
        </div>

        {!me?.ready && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
              <label htmlFor="secretNumber" className="block text-sm font-medium text-blue-100 mb-2">
                Your Secret Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="secretNumber"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
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
                    {inputNumber.length > 0 && (
                      <>
                        {isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-xs ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                          {validationError || 'Perfect! Ready to play'}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`text-xs ${inputNumber.length === 5 ? 'text-green-400' : 'text-blue-300'}`}>
                    {inputNumber.length}/5
                  </span>
                </div>
                {inputNumber.length === 0 && (
                  <p className="text-xs text-blue-200">
                    Enter 5 unique digits (0-9)
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full sm:flex-1 bg-white/20 backdrop-blur-sm text-white py-4 md:py-3 px-6 rounded-xl font-semibold hover:bg-white/30 hover:scale-105 active:scale-95 md:active:scale-95 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 flex items-center justify-center gap-2 group hover:shadow-lg touch-manipulation"
              >
                <Shuffle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                Generate Random
              </button>
              
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`w-full sm:flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 md:py-3 px-6 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform touch-manipulation ${
                  !isValid || isSubmitting
                    ? 'opacity-50 scale-95'
                    : 'hover:from-blue-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 md:active:scale-95 active:scale-[0.97]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Set Number
                  </>
                )}
              </button>
              </div>
            </form>
          </div>
        )}
        
        {me?.ready && !opponent?.ready && (
          <div className="text-center py-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30 mb-4">
              <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-200 text-sm">Waiting for {opponent?.name} to set their number</span>
            </div>
            <p className="text-blue-300 text-sm">The game will start automatically once both players are ready</p>
          </div>
        )}
        
        {me?.ready && opponent?.ready && (
          <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-green-500/30 mb-4">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Both players ready!</span>
            </div>
            <p className="text-green-300 text-sm">Starting the game...</p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">Rules Reminder</h3>
          <ul className="text-sm text-blue-100 space-y-1">
            <li>• Must be exactly 5 digits</li>
            <li>• All digits must be unique (no repeats)</li>
            <li>• Examples: 12345, 01234, 98765, 04681</li>
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
      <VersionDisplay />
    </div>
  );
};