import React from 'react';
import { getVersionString } from '../version';

export const VersionDisplay: React.FC = () => {
  return (
    <div className="fixed bottom-2 left-2 z-10">
      <span className="text-zinc-600 text-xs font-mono">
        {getVersionString()}
      </span>
    </div>
  );
};
