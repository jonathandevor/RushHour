/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Orientation } from '../types/game';
import { Play, Trash2, Shuffle } from 'lucide-react';

interface SetupPaletteProps {
  onDone: () => void;
  onClearBoard: () => void;
  onRandom: () => void;
  hasRedCar: boolean;
  onDragStartTemplate?: (dragState: { length: 2 | 3; orientation: Orientation; offsetX: number; offsetY: number }) => void;
  onDragEndTemplate?: () => void;
  cellSize?: number;
}

interface PaletteItem {
  id: string;
  length: 2 | 3;
  orientation: Orientation;
  color: string;
  widthPx: number;
  heightPx: number;
}

export const SetupPalette: React.FC<SetupPaletteProps> = ({
  onDone,
  onClearBoard,
  onRandom,
  onDragStartTemplate,
  onDragEndTemplate,
  cellSize,
}) => {
  const unit = cellSize && cellSize > 0 ? Math.min(cellSize, 68) : 68;
  const templates: PaletteItem[] = [
    {
      id: 'h-car',
      length: 2,
      orientation: 'horizontal',
      color: '#06b6d4',
      widthPx: 2 * unit,
      heightPx: unit,
    },
    {
      id: 'h-truck',
      length: 3,
      orientation: 'horizontal',
      color: '#3b82f6',
      widthPx: 3 * unit,
      heightPx: unit,
    },
    {
      id: 'v-car',
      length: 2,
      orientation: 'vertical',
      color: '#10b981',
      widthPx: unit,
      heightPx: 2 * unit,
    },
    {
      id: 'v-truck',
      length: 3,
      orientation: 'vertical',
      color: '#f59e0b',
      widthPx: unit,
      heightPx: 3 * unit,
    },
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        length: item.length,
        orientation: item.orientation,
        isNew: true,
        offsetX,
        offsetY,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';

    onDragStartTemplate?.({
      length: item.length,
      orientation: item.orientation,
      offsetX,
      offsetY,
    });
  };

  const handleDragEnd = () => {
    onDragEndTemplate?.();
  };

  return (
    <aside
      aria-label="Board Builder"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col items-center gap-3.5 sm:gap-5 shadow-2xl backdrop-blur-sm shrink-0 select-none max-w-full"
    >
      {/* 4 Vehicles in their actual dimensions */}
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {/* 1. Horizontal Car */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, templates[0])}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex items-center justify-between px-2 sm:px-3"
          style={{
            width: `${templates[0].widthPx}px`,
            height: `${templates[0].heightPx}px`,
            backgroundColor: templates[0].color,
          }}
        >
          <div className="w-1.5 sm:w-2 h-3/5 rounded-sm bg-black/25 shrink-0" />
          <div className="flex-1 mx-1.5 sm:mx-2 h-3/4 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="w-5 sm:w-6 h-2 rounded bg-black/20" />
          </div>
          <div className="w-1.5 sm:w-2 h-3/5 rounded-sm bg-black/25 flex flex-col justify-between py-1 shrink-0">
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
          </div>
        </div>

        {/* 2. Horizontal Truck */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, templates[1])}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex items-center justify-between px-2 sm:px-3"
          style={{
            width: `${templates[1].widthPx}px`,
            height: `${templates[1].heightPx}px`,
            backgroundColor: templates[1].color,
          }}
        >
          <div className="w-1.5 sm:w-2 h-3/5 rounded-sm bg-black/25 shrink-0" />
          <div className="flex-1 mx-1.5 sm:mx-2 h-3/4 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 opacity-30">
              <div className="w-0.5 h-5 sm:h-7 bg-white" />
              <div className="w-0.5 h-5 sm:h-7 bg-white" />
              <div className="w-0.5 h-5 sm:h-7 bg-white" />
              <div className="w-0.5 h-5 sm:h-7 bg-white" />
            </div>
          </div>
          <div className="w-1.5 sm:w-2 h-3/5 rounded-sm bg-black/25 flex flex-col justify-between py-1 shrink-0">
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
            <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
          </div>
        </div>

        {/* 3 & 4. Vertical Car and Vertical Truck */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Vertical Car */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, templates[2])}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex flex-col items-center justify-between py-2 sm:py-3"
            style={{
              width: `${templates[2].widthPx}px`,
              height: `${templates[2].heightPx}px`,
              backgroundColor: templates[2].color,
            }}
          >
            <div className="h-1.5 sm:h-2 w-3/5 rounded-sm bg-black/25 flex justify-between px-1 shrink-0">
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
            </div>
            <div className="flex-1 my-1.5 sm:my-2 w-3/4 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div className="h-5 sm:h-6 w-2 rounded bg-black/20" />
            </div>
            <div className="h-1.5 sm:h-2 w-3/5 rounded-sm bg-black/25 shrink-0" />
          </div>

          {/* Vertical Truck */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, templates[3])}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex flex-col items-center justify-between py-2 sm:py-3"
            style={{
              width: `${templates[3].widthPx}px`,
              height: `${templates[3].heightPx}px`,
              backgroundColor: templates[3].color,
            }}
          >
            <div className="h-1.5 sm:h-2 w-3/5 rounded-sm bg-black/25 flex justify-between px-1 shrink-0">
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-200/90" />
            </div>
            <div className="flex-1 my-1.5 sm:my-2 w-3/4 rounded-lg bg-black/20 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 opacity-30">
                <div className="h-0.5 w-5 sm:w-7 bg-white" />
                <div className="h-0.5 w-5 sm:w-7 bg-white" />
                <div className="h-0.5 w-5 sm:w-7 bg-white" />
                <div className="h-0.5 w-5 sm:w-7 bg-white" />
              </div>
            </div>
            <div className="h-1.5 sm:h-2 w-3/5 rounded-sm bg-black/25 shrink-0" />
          </div>
        </div>
      </div>

      {/* Control Buttons: Clear Board, Random & Play */}
      <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={onClearBoard}
          className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Board</span>
        </button>

        <button
          onClick={onRandom}
          className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 border border-slate-700/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span>Random</span>
        </button>

        <button
          onClick={onDone}
          className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play</span>
        </button>
      </div>
    </aside>
  );
};
