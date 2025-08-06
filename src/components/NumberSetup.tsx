import React, { useState } from 'react';
import { Shuffle, Check, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Player } from '../types/game';
import { VersionDisplay } from './VersionDisplay';

interface NumberSetupProps {
  players: Player[];
  myId: string;
  onSetNumber: (number: string) => void;
  onGenerateRandom: () => void;
  myNumber: string;
  gameNumber: number;
}

export const NumberSetup: React.FC<NumberSetupProps> = ({
  players,
  myId,
  onSetNumber,
  onGenerateRandom,
  myNumber,
  gameNumber
}) => {
  const [inputNumber, setInputNumber] = useState(myNumber);
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
    if (validateNumber(inputNumber)) {
      onSetNumber(inputNumber);
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
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-white font-medium">{me?.name} (You)</span>
              {me?.ready && <Check className="w-4 h-4 text-green-400" />}
            </div>
            <p className="text-sm text-blue-200">
              {me?.ready ? 'Number set and ready!' : 'Waiting for your number...'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-white font-medium">{opponent?.name}</span>
              {opponent?.ready && <Check className="w-4 h-4 text-green-400" />}
            </div>
            <p className="text-sm text-blue-200">
              {opponent?.ready ? 'Number set and ready!' : 'Waiting for their number...'}
            </p>
          </div>
        </div>

        {!me?.ready && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="secretNumber" className="block text-sm font-medium text-blue-100 mb-2">
                Your Secret Number
              </label>
              <input
                type="text"
                id="secretNumber"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full sm:flex-1 bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Shuffle className="w-5 h-5" />
                Generate Random
              </button>
              
              <button
                type="submit"
                disabled={!isValid}
                className="w-full sm:flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Set Number
              </button>
            </div>
          </form>
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