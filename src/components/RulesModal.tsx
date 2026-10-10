/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl shadow-black/80 flex flex-col gap-4 sm:gap-5 text-slate-300 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 id="rules-modal-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Game Rules & Controls</span>
          </h2>
        </div>

        <div className="flex flex-col gap-4 text-xs leading-relaxed">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Objective</h3>
              <p className="text-slate-400 mt-0.5">
                Navigate the <strong>Red Car</strong> out through the designated <strong>Exit</strong> opening on the right side of Row 3.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Movement Constraints</h3>
              <p className="text-slate-400 mt-0.5">
                Vehicles can <strong>only slide forward or backward along their orientation axis</strong>. They cannot turn, jump over cars, or cross boundaries.
              </p>
              <div className="mt-2 text-slate-300 space-y-1">
                <div>• <strong>Horizontal Cars/Trucks</strong>: Click the left half to move left; click the right half to move right.</div>
                <div>• <strong>Vertical Cars/Trucks</strong>: Click the upper half to move up; click the lower half to move down.</div>
                <div>• You can also click and drag smoothly along the vehicle axis!</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Real-time BFS Solver AI</h3>
              <p className="text-slate-400 mt-0.5">
                The game runs a Breadth-First Search (BFS) graph algorithm in the background on every move to find the best solution of legal moves. A pulsating <strong>arrow in the center of a vehicle</strong> indicates the next optimal step.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
