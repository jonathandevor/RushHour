/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Vehicle, GameMode, MoveDirection, SolverStep, VehicleType, Orientation } from '../types/game';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface VehiclePieceProps {
  vehicle: Vehicle;
  mode: GameMode;
  cellSize: number;
  gapSize: number;
  nextMove: SolverStep | null;
  onMoveOneStep: (vehicleId: string, direction: MoveDirection) => boolean;
  onRemove?: (vehicleId: string) => void;
  isExitingWin?: boolean;
  onDragStartExisting?: (dragState: { type: VehicleType; orientation: Orientation; vehicleId: string; offsetX: number; offsetY: number }) => void;
  onDragEndExisting?: () => void;
}

export const VehiclePiece: React.FC<VehiclePieceProps> = ({
  vehicle,
  mode,
  cellSize,
  gapSize,
  nextMove,
  onMoveOneStep,
  onRemove,
  isExitingWin = false,
  onDragStartExisting,
  onDragEndExisting,
}) => {
  const [hoveredHalf, setHoveredHalf] = useState<'first' | 'second' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const isH = vehicle.orientation === 'horizontal';
  const len = vehicle.type === 'car' ? 2 : 3;

  // Exact pixel bounds on the grid
  const widthPx = isH ? len * cellSize + (len - 1) * gapSize : cellSize;
  const heightPx = isH ? cellSize : len * cellSize + (len - 1) * gapSize;
  const leftPx = vehicle.col * (cellSize + gapSize);
  const topPx = vehicle.row * (cellSize + gapSize);

  // Check if this vehicle is the target of the solver hint
  const isHintVehicle = mode === 'PLAY' && nextMove?.vehicleId === vehicle.id;
  const hintDirection = isHintVehicle ? nextMove?.direction : null;

  // HTML5 Drag handlers for repositioning on the board in Setup mode
  const handleDragStartSetup = (e: React.DragEvent<HTMLDivElement>) => {
    if (mode !== 'SETUP') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: vehicle.type,
        orientation: vehicle.orientation,
        vehicleId: vehicle.id,
        isExisting: true,
        offsetX,
        offsetY,
      })
    );
    e.dataTransfer.effectAllowed = 'move';

    onDragStartExisting?.({
      type: vehicle.type,
      orientation: vehicle.orientation,
      vehicleId: vehicle.id,
      offsetX,
      offsetY,
    });
  };

  const handleDragEndSetup = () => {
    onDragEndExisting?.();
  };

  // Handle pointer down for both half-clicks and tactile dragging in PLAY mode
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode === 'SETUP') return;
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode === 'SETUP') return;
    if (!isDragging || !dragStartPos.current) {
      setIsDragging(false);
      return;
    }

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const dragDistance = Math.hypot(dx, dy);

    setIsDragging(false);
    dragStartPos.current = null;

    // If dragged noticeably along the allowed axis
    const threshold = cellSize * 0.28;
    if (dragDistance > threshold) {
      if (isH) {
        if (dx > threshold) {
          onMoveOneStep(vehicle.id, 'right');
        } else if (dx < -threshold) {
          onMoveOneStep(vehicle.id, 'left');
        }
      } else {
        if (dy > threshold) {
          onMoveOneStep(vehicle.id, 'down');
        } else if (dy < -threshold) {
          onMoveOneStep(vehicle.id, 'up');
        }
      }
      return;
    }

    // Otherwise, treat as precise click on the half side
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (isH) {
      if (clickX < rect.width / 2) {
        onMoveOneStep(vehicle.id, 'left');
      } else {
        onMoveOneStep(vehicle.id, 'right');
      }
    } else {
      if (clickY < rect.height / 2) {
        onMoveOneStep(vehicle.id, 'up');
      } else {
        onMoveOneStep(vehicle.id, 'down');
      }
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragStartPos.current = null;
  };

  const isRed = vehicle.isTarget;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${isRed ? 'Target Red Car' : `${vehicle.type} ${vehicle.color}`}, at row ${vehicle.row + 1}, col ${vehicle.col + 1}`}
      draggable={mode === 'SETUP'}
      onDragStart={handleDragStartSetup}
      onDragEnd={handleDragEndSetup}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`absolute select-none pointer-events-auto transition-all duration-200 ease-out z-10 p-[3px] group
        ${mode === 'SETUP' ? 'cursor-grab active:cursor-grabbing hover:z-20' : 'cursor-pointer'}
        ${isExitingWin ? 'translate-x-24 opacity-0 scale-95 transition-all duration-700 ease-in' : ''}
      `}
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        touchAction: mode === 'SETUP' ? 'auto' : 'none',
      }}
    >
      {/* Main Vehicle Body Frame */}
      <div
        className={`w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden shadow-md border
          ${
            isRed
              ? 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700 border-red-400/40 text-white shadow-red-950/40'
              : 'border-white/20 text-white shadow-black/40'
          }
          ${isHintVehicle ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-amber-500/20' : ''}
        `}
        style={{
          backgroundColor: isRed ? undefined : vehicle.color,
          boxShadow: isRed
            ? '0 6px 16px -4px rgba(225, 29, 72, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
            : '0 4px 12px -2px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* Cab / Hood / Roof Structure */}
        {isH ? (
          <div className="w-full h-full flex items-center justify-between px-2.5 relative">
            <div className="w-1.5 h-3/5 rounded-sm bg-black/25 shrink-0" />
            <div className="flex-1 h-3/4 mx-1.5 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-x-2 top-1 h-1 bg-white/20 rounded-full" />
              {vehicle.type === 'truck' ? (
                <div className="flex items-center gap-1.5 opacity-30">
                  <div className="w-0.5 h-6 bg-white" />
                  <div className="w-0.5 h-6 bg-white" />
                  <div className="w-0.5 h-6 bg-white" />
                  <div className="w-0.5 h-6 bg-white" />
                </div>
              ) : isRed ? (
                <div className="flex items-center gap-1">
                  <div className="h-1 w-6 bg-white/40 rounded-full" />
                </div>
              ) : (
                <div className="w-5 h-2 rounded bg-black/20" />
              )}
            </div>
            <div className="w-1.5 h-3/5 rounded-sm bg-black/25 flex flex-col justify-between py-1 shrink-0">
              <div className="w-1 h-1 rounded-full bg-amber-200/90 shadow-sm" />
              <div className="w-1 h-1 rounded-full bg-amber-200/90 shadow-sm" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-between py-2.5 relative">
            <div className="h-1.5 w-3/5 rounded-sm bg-black/25 flex justify-between px-1 shrink-0">
              <div className="w-1 h-1 rounded-full bg-amber-200/90 shadow-sm" />
              <div className="w-1 h-1 rounded-full bg-amber-200/90 shadow-sm" />
            </div>
            <div className="flex-1 w-3/4 my-1.5 rounded-lg bg-black/20 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-y-2 left-1 w-1 bg-white/20 rounded-full" />
              {vehicle.type === 'truck' ? (
                <div className="flex flex-col items-center gap-1.5 opacity-30">
                  <div className="h-0.5 w-6 bg-white" />
                  <div className="h-0.5 w-6 bg-white" />
                  <div className="h-0.5 w-6 bg-white" />
                  <div className="h-0.5 w-6 bg-white" />
                </div>
              ) : (
                <div className="h-5 w-2 rounded bg-black/20" />
              )}
            </div>
            <div className="h-1.5 w-3/5 rounded-sm bg-black/25 shrink-0" />
          </div>
        )}

        {/* Setup Mode Delete Affordance */}
        {mode === 'SETUP' && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove(vehicle.id);
            }}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 cursor-pointer"
            aria-label="Remove vehicle"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Play Mode: Half-side Click Hover Affordance Indicators */}
        {mode === 'PLAY' && (
          <div className="absolute inset-0 pointer-events-none flex">
            {isH ? (
              <>
                <div
                  className={`w-1/2 h-full flex items-center justify-start pl-1 transition-opacity ${
                    hoveredHalf === 'first' ? 'opacity-80' : 'opacity-0'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div
                  className={`w-1/2 h-full flex items-center justify-end pr-1 transition-opacity ${
                    hoveredHalf === 'second' ? 'opacity-80' : 'opacity-0'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div
                  className={`w-full h-1/2 flex items-start justify-center pt-1 transition-opacity ${
                    hoveredHalf === 'first' ? 'opacity-80' : 'opacity-0'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div
                  className={`w-full h-1/2 flex items-end justify-center pb-1 transition-opacity ${
                    hoveredHalf === 'second' ? 'opacity-80' : 'opacity-0'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BFS Shortest Path Hint Arrow in the Center */}
        {isHintVehicle && hintDirection && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/60 ring-2 ring-white animate-pulse">
              {hintDirection === 'left' && <ChevronLeft className="w-5 h-5 stroke-[3] -translate-x-0.5" />}
              {hintDirection === 'right' && <ChevronRight className="w-5 h-5 stroke-[3] translate-x-0.5" />}
              {hintDirection === 'up' && <ChevronUp className="w-5 h-5 stroke-[3] -translate-y-0.5" />}
              {hintDirection === 'down' && <ChevronDown className="w-5 h-5 stroke-[3] translate-y-0.5" />}
            </div>
          </div>
        )}

        {/* Hover Listeners for Left/Right or Top/Bottom half */}
        {mode === 'PLAY' && (
          <div className="absolute inset-0 flex pointer-events-auto">
            {isH ? (
              <>
                <div
                  className="w-1/2 h-full cursor-w-resize"
                  onMouseEnter={() => setHoveredHalf('first')}
                  onMouseLeave={() => setHoveredHalf(null)}
                />
                <div
                  className="w-1/2 h-full cursor-e-resize"
                  onMouseEnter={() => setHoveredHalf('second')}
                  onMouseLeave={() => setHoveredHalf(null)}
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col pointer-events-auto">
                <div
                  className="w-full h-1/2 cursor-n-resize"
                  onMouseEnter={() => setHoveredHalf('first')}
                  onMouseLeave={() => setHoveredHalf(null)}
                />
                <div
                  className="w-full h-1/2 cursor-s-resize"
                  onMouseEnter={() => setHoveredHalf('second')}
                  onMouseLeave={() => setHoveredHalf(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
