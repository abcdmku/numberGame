import React from 'react';
import { getVersionString } from '../version';

export const VersionDisplay: React.FC = () => {
  return (
    <div className="fixed bottom-2 left-2 z-10">
      <div className="bg-black/20 backdrop-blur-sm text-white/60 px-2 py-1 rounded text-xs font-mono">
        {getVersionString()}
      </div>
    </div>
  );
};