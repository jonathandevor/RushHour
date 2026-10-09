/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import { Trophy, RotateCcw, Settings2 } from 'lucide-react';

interface WinModalProps {
  isOpen: boolean;
  totalMoves: number;
  optimalMoves: number;
  puzzleTitle?: string;
  onPlayAgain: () => void;
  onEditSetup: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  totalMoves,
  optimalMoves,
  puzzleTitle,
  onPlayAgain,
  onEditSetup,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playWinFanfare();
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOptimal = totalMoves <= optimalMoves;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />

        {/* Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        {/* Congratulations Title */}
        <h2 id="win-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Puzzle Solved!
        </h2>
        {puzzleTitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {puzzleTitle}
          </p>
        )}
        <p className="text-sm text-slate-300 mt-2">
          The Red Car has escaped the traffic gridlock!
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-medium">Total Moves</span>
            <span className="text-3xl font-mono font-bold text-white tabular-nums mt-1">
              {totalMoves}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-medium">Shortest Path</span>
            <span className="text-3xl font-mono font-bold text-emerald-400 tabular-nums mt-1">
              {optimalMoves > 0 ? optimalMoves : totalMoves}
            </span>
          </div>
        </div>

        {/* Accuracy Callout */}
        <div className="w-full bg-slate-800/40 rounded-xl px-4 py-2.5 mb-6 text-xs text-slate-300 flex items-center justify-center gap-2">
          {isOptimal ? (
            <span className="text-emerald-400 font-semibold">
              Masterclass! You solved this in the fewest moves possible.
            </span>
          ) : (
            <span>
              Solved in <strong className="text-white">{totalMoves}</strong> moves (optimal path was {optimalMoves} moves).
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5">


          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onEditSetup}
            className="py-3 px-3 rounded-xl font-medium text-sm bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Edit puzzle in setup mode"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
