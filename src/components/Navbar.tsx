/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Car } from 'lucide-react';

interface NavbarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRules: () => void;
  mode: 'SETUP' | 'PLAY';
}

export const Navbar: React.FC<NavbarProps> = ({
  isMuted,
  onToggleMute,
  onOpenRules,
  mode,
}) => {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800/80 px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-6 z-30 shrink-0">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-950/60">
          <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
        </div>
        <span className="text-base sm:text-lg font-bold tracking-tight text-white">
          Rush Hour
        </span>
      </div>

      {/* Zone 2: Nav Links (Clean single-line links & mode label) */}
      <nav className="flex items-center gap-2.5 sm:gap-6 text-[11px] sm:text-xs font-medium text-slate-400">
        <button
          onClick={onOpenRules}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Rules
        </button>
        <span className="text-emerald-400 font-semibold whitespace-nowrap shrink-0 select-none">
          {mode === 'SETUP' ? 'Board Builder' : 'Play Mode'}
        </span>
      </nav>

      {/* Zone 3: 1 Primary Action (Audio Mute Toggle) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer
            ${
              isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }
          `}
        >
          {isMuted ? <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>
    </header>
  );
};
