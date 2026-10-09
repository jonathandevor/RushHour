/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Vehicle, GameMode, MoveDirection, SolverStep, VehicleType, Orientation } from '../types/game';
import { VehiclePiece } from './VehiclePiece';
import { isValidPlacement } from '../utils/solver';
import { soundManager } from '../utils/audio';
import { LogOut, ChevronRight } from 'lucide-react';

interface BoardProps {
  vehicles: Vehicle[];
  mode: GameMode;
  nextMove: SolverStep | null;
  onMoveOneStep: (vehicleId: string, direction: MoveDirection) => boolean;
  onPlaceVehicle: (vehicle: { type: VehicleType; orientation: Orientation; row: number; col: number }) => void;
  onRelocateVehicle?: (vehicleId: string, row: number, col: number) => void;
  onRemoveVehicle: (vehicleId: string) => void;
  isWinningSequence: boolean;
  activeDragState?: { type: VehicleType; orientation: Orientation; offsetX: number; offsetY: number; vehicleId?: string } | null;
  onDragStartExisting?: (dragState: { type: VehicleType; orientation: Orientation; vehicleId: string; offsetX: number; offsetY: number }) => void;
  onDragEndExisting?: () => void;
}

export const Board: React.FC<BoardProps> = ({
  vehicles,
  mode,
  nextMove,
  onMoveOneStep,
  onPlaceVehicle,
  onRelocateVehicle,
  onRemoveVehicle,
  isWinningSequence,
  activeDragState,
  onDragStartExisting,
  onDragEndExisting,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragOverCells, setDragOverCells] = useState<{
    cells: Array<{ row: number; col: number }>;
    isValid: boolean;
  } | null>(null);

  // 6x6 Grid Dimensions: 72px cell size, seamless grid with straight brown line overlay
  const CELL_SIZE = 72; // pixels
  const BOARD_PIXEL_SIZE = 6 * CELL_SIZE; // 432px
  const BROWN_LINE_COLOR = '#8B5A2B'; // Straight brown grid line color

  // Drag over handler for Setup mode: calculates exact anchor so marked squares alight perfectly under the dragged vehicle
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (mode !== 'SETUP' || !boardRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = activeDragState?.vehicleId ? 'move' : 'copy';

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const offsetX = activeDragState?.offsetX ?? (CELL_SIZE / 2);
    const offsetY = activeDragState?.offsetY ?? (CELL_SIZE / 2);

    const type = activeDragState?.type ?? 'car';
    const orientation = activeDragState?.orientation ?? 'horizontal';
    const ignoreId = activeDragState?.vehicleId;

    // Math.round((coord - offset) / CELL_SIZE) aligns the marked squares directly underneath the dragged vehicle ghost
    const col = Math.round((x - offsetX) / CELL_SIZE);
    const row = Math.round((y - offsetY) / CELL_SIZE);

    const len = type === 'car' ? 2 : 3;
    const valid = isValidPlacement({ row, col, orientation, type }, vehicles, ignoreId);

    const candidateCells: Array<{ row: number; col: number }> = [];
    for (let i = 0; i < len; i++) {
      const r = orientation === 'vertical' ? row + i : row;
      const c = orientation === 'horizontal' ? col + i : col;
      if (r >= 0 && r < 6 && c >= 0 && c < 6) {
        candidateCells.push({ row: r, col: c });
      }
    }

    setDragOverCells({ cells: candidateCells, isValid: valid });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverCells(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (mode !== 'SETUP' || !boardRef.current) return;
    e.preventDefault();
    setDragOverCells(null);

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let type: VehicleType = activeDragState?.type ?? 'car';
    let orientation: Orientation = activeDragState?.orientation ?? 'horizontal';
    let offsetX = activeDragState?.offsetX ?? (CELL_SIZE / 2);
    let offsetY = activeDragState?.offsetY ?? (CELL_SIZE / 2);
    let vehicleId = activeDragState?.vehicleId;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.type) type = parsed.type;
        if (parsed.orientation) orientation = parsed.orientation;
        if (typeof parsed.offsetX === 'number') offsetX = parsed.offsetX;
        if (typeof parsed.offsetY === 'number') offsetY = parsed.offsetY;
        if (parsed.vehicleId) vehicleId = parsed.vehicleId;
      }
    } catch {
      // Fallback
    }

    const col = Math.round((x - offsetX) / CELL_SIZE);
    const row = Math.round((y - offsetY) / CELL_SIZE);

    if (isValidPlacement({ row, col, orientation, type }, vehicles, vehicleId)) {
      soundManager.playSnapSound();
      if (vehicleId && onRelocateVehicle) {
        onRelocateVehicle(vehicleId, row, col);
      } else {
        onPlaceVehicle({ type, orientation, row, col });
      }
    } else {
      soundManager.playBlockedSound();
    }
  };

  return (
    <div className="relative flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Outer Board Frame */}
      <div className="relative bg-slate-950 p-4 rounded-3xl border-2 border-slate-800 shadow-2xl shadow-black/80 flex items-center">
        {/* Main 6x6 Board Container */}
        <div
          ref={boardRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative bg-slate-900 overflow-visible shadow-inner"
          style={{
            width: `${BOARD_PIXEL_SIZE}px`,
            height: `${BOARD_PIXEL_SIZE}px`,
          }}
        >
          {/* Real-time Flat Drag Candidate Rectangles */}
          {dragOverCells && (
            <div className="absolute inset-0 pointer-events-none z-0">
              {dragOverCells.cells.map(({ row, col }) => (
                <div
                  key={`drag-${row}-${col}`}
                  className={`absolute ${
                    dragOverCells.isValid ? 'bg-emerald-500/30' : 'bg-rose-500/30'
                  }`}
                  style={{
                    left: `${col * CELL_SIZE}px`,
                    top: `${row * CELL_SIZE}px`,
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                  }}
                />
              ))}
            </div>
          )}

          {/* ---------------- GRID OF STRAIGHT LINES COLORED BROWN ---------------- */}
          {/* Overlay of perfectly straight perpendicular brown lines (replacing rounded squares) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            width={BOARD_PIXEL_SIZE}
            height={BOARD_PIXEL_SIZE}
            viewBox={`0 0 ${BOARD_PIXEL_SIZE} ${BOARD_PIXEL_SIZE}`}
          >
            {/* Top Border */}
            <line
              x1="0"
              y1="1"
              x2={BOARD_PIXEL_SIZE}
              y2="1"
              stroke={BROWN_LINE_COLOR}
              strokeWidth="2"
            />
            {/* Bottom Border */}
            <line
              x1="0"
              y1={BOARD_PIXEL_SIZE - 1}
              x2={BOARD_PIXEL_SIZE}
              y2={BOARD_PIXEL_SIZE - 1}
              stroke={BROWN_LINE_COLOR}
              strokeWidth="2"
            />
            {/* Left Border */}
            <line
              x1="1"
              y1="0"
              x2="1"
              y2={BOARD_PIXEL_SIZE}
              stroke={BROWN_LINE_COLOR}
              strokeWidth="2"
            />

            {/* Right Border with OPENING AT ROW 3 (y: 144 to 216) for the Exit */}
            <line
              x1={BOARD_PIXEL_SIZE - 1}
              y1="0"
              x2={BOARD_PIXEL_SIZE - 1}
              y2={2 * CELL_SIZE}
              stroke={BROWN_LINE_COLOR}
              strokeWidth="2"
            />
            <line
              x1={BOARD_PIXEL_SIZE - 1}
              y1={3 * CELL_SIZE}
              x2={BOARD_PIXEL_SIZE - 1}
              y2={BOARD_PIXEL_SIZE}
              stroke={BROWN_LINE_COLOR}
              strokeWidth="2"
            />

            {/* 5 Vertical Interior Straight Brown Lines */}
            {[1, 2, 3, 4, 5].map((idx) => (
              <line
                key={`v-line-${idx}`}
                x1={idx * CELL_SIZE}
                y1="0"
                x2={idx * CELL_SIZE}
                y2={BOARD_PIXEL_SIZE}
                stroke={BROWN_LINE_COLOR}
                strokeWidth="1.5"
                strokeDasharray="none"
              />
            ))}

            {/* 5 Horizontal Interior Straight Brown Lines */}
            {[1, 2, 3, 4, 5].map((idx) => (
              <line
                key={`h-line-${idx}`}
                x1="0"
                y1={idx * CELL_SIZE}
                x2={BOARD_PIXEL_SIZE}
                y2={idx * CELL_SIZE}
                stroke={BROWN_LINE_COLOR}
                strokeWidth="1.5"
                strokeDasharray="none"
              />
            ))}
          </svg>

          {/* Placed Vehicles Layer */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: `${BOARD_PIXEL_SIZE}px`, height: `${BOARD_PIXEL_SIZE}px` }}
          >
            {vehicles.map((v) => (
              <VehiclePiece
                key={v.id}
                vehicle={v}
                mode={mode}
                cellSize={CELL_SIZE}
                gapSize={0}
                nextMove={nextMove}
                onMoveOneStep={onMoveOneStep}
                onRemove={onRemoveVehicle}
                isExitingWin={v.isTarget && isWinningSequence}
                onDragStartExisting={onDragStartExisting}
                onDragEndExisting={onDragEndExisting}
              />
            ))}
          </div>
        </div>

        {/* ---------------- EXIT GATE ON RIGHT SIDE OF 3RD ROW (INDEX 2) ---------------- */}
        <div
          className="absolute -right-10 sm:-right-14 z-30 flex items-center"
          style={{
            top: `${16 + 2 * CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
          }}
        >
          {/* Exit Channel Graphic & Arrow */}
          <div className="flex items-center gap-1">
            {/* Visual gate cut with brown accent boundary */}
            <div className="w-3 h-14 bg-gradient-to-r from-transparent to-amber-500/20 border-r border-[#8B5A2B] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-amber-400 animate-pulse -mr-1" />
            </div>

            {/* EXIT Sign Badge */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-2 sm:px-2.5 py-1.5 rounded-lg shadow-lg shadow-red-950/60 border border-white/20 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase">
                  EXIT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
