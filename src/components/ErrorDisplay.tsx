import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onClose: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-xl shadow-xl border border-red-400/30 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-200 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-200 hover:text-white transition-colors duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};