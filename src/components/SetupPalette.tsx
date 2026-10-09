/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VehicleType, Orientation } from '../types/game';
import { Play, Trash2 } from 'lucide-react';

interface SetupPaletteProps {
  onDone: () => void;
  onClearBoard: () => void;
  hasRedCar: boolean;
}

interface PaletteItem {
  id: string;
  type: VehicleType;
  orientation: Orientation;
  color: string;
  widthPx: number;
  heightPx: number;
}

// 4 vehicles in their actual dimensions (72px unit grid)
const PALETTE_TEMPLATES: PaletteItem[] = [
  {
    id: 'h-car',
    type: 'car',
    orientation: 'horizontal',
    color: '#06b6d4',
    widthPx: 144, // 2 × 72px
    heightPx: 72, // 1 × 72px
  },
  {
    id: 'h-truck',
    type: 'truck',
    orientation: 'horizontal',
    color: '#3b82f6',
    widthPx: 216, // 3 × 72px
    heightPx: 72, // 1 × 72px
  },
  {
    id: 'v-car',
    type: 'car',
    orientation: 'vertical',
    color: '#10b981',
    widthPx: 72, // 1 × 72px
    heightPx: 144, // 2 × 72px
  },
  {
    id: 'v-truck',
    type: 'truck',
    orientation: 'vertical',
    color: '#f59e0b',
    widthPx: 72, // 1 × 72px
    heightPx: 216, // 3 × 72px
  },
];

export const SetupPalette: React.FC<SetupPaletteProps> = ({
  onDone,
  onClearBoard,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: item.type,
        orientation: item.orientation,
        isNew: true,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      aria-label="Board Builder"
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col items-center gap-5 shadow-2xl backdrop-blur-sm shrink-0 select-none"
    >
      {/* 4 Vehicles in their actual dimensions */}
      <div className="flex flex-col items-center gap-4">
        {/* 1. Horizontal Car (144px × 72px) */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, PALETTE_TEMPLATES[0])}
          className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex items-center justify-between px-3"
          style={{
            width: `${PALETTE_TEMPLATES[0].widthPx}px`,
            height: `${PALETTE_TEMPLATES[0].heightPx}px`,
            backgroundColor: PALETTE_TEMPLATES[0].color,
          }}
        >
          <div className="w-2 h-7 rounded-sm bg-black/25 shrink-0" />
          <div className="flex-1 mx-2 h-9 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="w-6 h-2 rounded bg-black/20" />
          </div>
          <div className="w-2 h-7 rounded-sm bg-black/25 flex flex-col justify-between py-1 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
          </div>
        </div>

        {/* 2. Horizontal Truck (216px × 72px) */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, PALETTE_TEMPLATES[1])}
          className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex items-center justify-between px-3"
          style={{
            width: `${PALETTE_TEMPLATES[1].widthPx}px`,
            height: `${PALETTE_TEMPLATES[1].heightPx}px`,
            backgroundColor: PALETTE_TEMPLATES[1].color,
          }}
        >
          <div className="w-2 h-7 rounded-sm bg-black/25 shrink-0" />
          <div className="flex-1 mx-2 h-9 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="flex items-center gap-2 opacity-30">
              <div className="w-0.5 h-7 bg-white" />
              <div className="w-0.5 h-7 bg-white" />
              <div className="w-0.5 h-7 bg-white" />
              <div className="w-0.5 h-7 bg-white" />
            </div>
          </div>
          <div className="w-2 h-7 rounded-sm bg-black/25 flex flex-col justify-between py-1 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
          </div>
        </div>

        {/* 3 & 4. Vertical Car (72px × 144px) and Vertical Truck (72px × 216px) */}
        <div className="flex items-start gap-4">
          {/* Vertical Car (72px × 144px) */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, PALETTE_TEMPLATES[2])}
            className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex flex-col items-center justify-between py-3"
            style={{
              width: `${PALETTE_TEMPLATES[2].widthPx}px`,
              height: `${PALETTE_TEMPLATES[2].heightPx}px`,
              backgroundColor: PALETTE_TEMPLATES[2].color,
            }}
          >
            <div className="h-2 w-7 rounded-sm bg-black/25 flex justify-between px-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
            </div>
            <div className="flex-1 my-2 w-9 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div className="h-6 w-2 rounded bg-black/20" />
            </div>
            <div className="h-2 w-7 rounded-sm bg-black/25 shrink-0" />
          </div>

          {/* Vertical Truck (72px × 216px) */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, PALETTE_TEMPLATES[3])}
            className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform rounded-xl border border-white/20 shadow-md overflow-hidden relative flex flex-col items-center justify-between py-3"
            style={{
              width: `${PALETTE_TEMPLATES[3].widthPx}px`,
              height: `${PALETTE_TEMPLATES[3].heightPx}px`,
              backgroundColor: PALETTE_TEMPLATES[3].color,
            }}
          >
            <div className="h-2 w-7 rounded-sm bg-black/25 flex justify-between px-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200/90" />
            </div>
            <div className="flex-1 my-2 w-9 rounded-lg bg-black/20 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center gap-2 opacity-30">
                <div className="h-0.5 w-7 bg-white" />
                <div className="h-0.5 w-7 bg-white" />
                <div className="h-0.5 w-7 bg-white" />
                <div className="h-0.5 w-7 bg-white" />
              </div>
            </div>
            <div className="h-2 w-7 rounded-sm bg-black/25 shrink-0" />
          </div>
        </div>
      </div>

      {/* Control Buttons: Done & Clear Board */}
      <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={onDone}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Done</span>
        </button>

        <button
          onClick={onClearBoard}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Board</span>
        </button>
      </div>
    </aside>
  );
};
