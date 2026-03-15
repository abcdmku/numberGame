import React from 'react';

interface GameTitleProps {
  onClick?: () => void;
}

export const GameTitle: React.FC<GameTitleProps> = ({ onClick }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label="Number Master — return to lobby"
        className="flex items-center gap-2 hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-zinc-600 rounded-lg p-1 transition-opacity duration-200"
      >
        <img src="/favicon.svg" alt="" aria-hidden="true" className="w-7 h-7" />
        <span className="text-sm font-semibold text-zinc-100 tracking-wide">Number Master</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img src="/favicon.svg" alt="" aria-hidden="true" className="w-7 h-7" />
      <span className="text-sm font-semibold text-zinc-100 tracking-wide">Number Master</span>
    </div>
  );
};
