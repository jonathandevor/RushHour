/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Vehicle, GameMode, MoveDirection, SolverResult, PuzzlePreset, VehicleType, Orientation, ActiveDragState } from './types/game';
import { CLASSIC_PRESETS, VEHICLE_COLOR_PALETTE } from './data/presets';
import { solveBoardBFS, canMoveOneStep, isValidPlacement } from './utils/solver';
import { soundManager } from './utils/audio';
import { Navbar } from './components/Navbar';
import { Board } from './components/Board';
import { SetupPalette } from './components/SetupPalette';
import { WinModal } from './components/WinModal';
import { RulesModal } from './components/RulesModal';
import {
  RotateCcw,
  Undo2,
  Settings2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  // Game State: Always starts in 'SETUP' (Board Builder) mode with no vehicles on the board
  const [mode, setMode] = useState<GameMode>('SETUP');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<Vehicle[]>([]);
  const [moveHistory, setMoveHistory] = useState<Vehicle[][]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<PuzzlePreset | null>(null);

  // Active dragging state for aligning preview squares with cursor and vehicle dimensions
  const [activeDragState, setActiveDragState] = useState<ActiveDragState | null>(null);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [isWinningSequence, setIsWinningSequence] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(true);

  // Next color index counter for newly dragged vehicles
  const [colorCounter, setColorCounter] = useState<number>(0);

  // Background BFS Solver computation
  const solverResult: SolverResult = useMemo(() => {
    return solveBoardBFS(vehicles);
  }, [vehicles]);

  // Initial optimal moves computed when entering Play mode
  const [startingOptimalMoves, setStartingOptimalMoves] = useState<number>(0);

  // Check if target Red Car exists on row 2
  const hasRedCar = useMemo(() => {
    return vehicles.some((v) => v.isTarget && v.row === 2 && v.orientation === 'horizontal');
  }, [vehicles]);

  // Handle entering PLAY mode when Done is pressed
  const handleDoneSetup = () => {
    soundManager.playClickSound();

    // The state of the board in Play mode is exactly the state set up in board builder mode, with no additional vehicles
    const activeVehicles = vehicles.map((v) => ({ ...v }));

    setVehicles(activeVehicles);
    setInitialSnapshot(JSON.parse(JSON.stringify(activeVehicles)));
    setMoveHistory([]);
    setMoveCount(0);
    setIsWinningSequence(false);
    setShowWinModal(false);

    const sol = solveBoardBFS(activeVehicles);
    setStartingOptimalMoves(sol.minMoves);
    setMode('PLAY');
  };

  // Return to SETUP mode
  const handleEnterSetup = () => {
    soundManager.playClickSound();
    setMode('SETUP');
    setIsWinningSequence(false);
    setShowWinModal(false);
  };

  // Place a new vehicle from palette onto board
  const handlePlaceVehicle = (newVeh: {
    type: VehicleType;
    orientation: Orientation;
    row: number;
    col: number;
  }) => {
    // If placing a horizontal car on row 2 and there is no target red car on board yet:
    const hasTarget = vehicles.some((v) => v.isTarget);
    const isTargetPlacement = !hasTarget && newVeh.orientation === 'horizontal' && newVeh.row === 2 && newVeh.type === 'car';

    const nextColor = isTargetPlacement
      ? '#ef4444'
      : VEHICLE_COLOR_PALETTE[colorCounter % VEHICLE_COLOR_PALETTE.length];
    setColorCounter((prev) => prev + 1);

    const vehicleId = isTargetPlacement ? 'red' : `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const created: Vehicle = {
      id: vehicleId,
      isTarget: isTargetPlacement,
      type: newVeh.type,
      orientation: newVeh.orientation,
      row: newVeh.row,
      col: newVeh.col,
      color: nextColor,
      name: isTargetPlacement ? 'Target Red Car' : undefined,
    };

    setVehicles((prev) => [...prev, created]);
    setActivePreset(null);
  };

  // Relocate an existing vehicle to a new position on the board
  const handleRelocateVehicle = (vehicleId: string, newRow: number, newCol: number) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, row: newRow, col: newCol } : v))
    );
    setActivePreset(null);
  };

  // Remove vehicle (Setup mode)
  const handleRemoveVehicle = (vehicleId: string) => {
    soundManager.playClickSound();
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setActivePreset(null);
  };

  // Clear board of ALL vehicles as requested
  const handleClearBoard = () => {
    soundManager.playClickSound();
    setVehicles([]);
    setActivePreset(null);
  };

  // Load preset
  const handleSelectPreset = (preset: PuzzlePreset) => {
    soundManager.playClickSound();
    setActivePreset(preset);
    setVehicles(JSON.parse(JSON.stringify(preset.vehicles)));
  };

  // Execute a 1-step move for a vehicle
  const handleMoveOneStep = useCallback(
    (vehicleId: string, direction: MoveDirection): boolean => {
      const targetVehicle = vehicles.find((v) => v.id === vehicleId);
      if (!targetVehicle) return false;

      // Validate legality of this 1-step move
      if (!canMoveOneStep(targetVehicle, direction, vehicles)) {
        soundManager.playBlockedSound();
        return false;
      }

      // Check win move for Red Car exiting through row 2, col 5
      if (
        targetVehicle.isTarget &&
        direction === 'right' &&
        targetVehicle.row === 2 &&
        targetVehicle.col === 4
      ) {
        soundManager.playSlideSound();
        setMoveHistory((prev) => [...prev, vehicles]);
        setMoveCount((prev) => prev + 1);
        setIsWinningSequence(true);

        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? { ...v, col: v.col + 1 } : v))
        );

        setTimeout(() => {
          setShowWinModal(true);
        }, 500);
        return true;
      }

      // Normal movement calculation
      let newRow = targetVehicle.row;
      let newCol = targetVehicle.col;

      if (direction === 'left') newCol -= 1;
      if (direction === 'right') newCol += 1;
      if (direction === 'up') newRow -= 1;
      if (direction === 'down') newRow += 1;

      // Save previous state for undo
      setMoveHistory((prev) => [...prev, vehicles]);
      setMoveCount((prev) => prev + 1);
      soundManager.playSlideSound();

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, row: newRow, col: newCol } : v))
      );

      // Check if this move directly won (Red Car col >= 5)
      if (targetVehicle.isTarget && newCol >= 5) {
        setIsWinningSequence(true);
        setTimeout(() => {
          setShowWinModal(true);
        }, 500);
      }

      return true;
    },
    [vehicles]
  );

  // Undo move
  const handleUndoMove = () => {
    if (moveHistory.length === 0) return;
    soundManager.playClickSound();
    const previousState = moveHistory[moveHistory.length - 1];
    setMoveHistory((prev) => prev.slice(0, prev.length - 1));
    setVehicles(previousState);
    setMoveCount((prev) => Math.max(0, prev - 1));
    setIsWinningSequence(false);
    setShowWinModal(false);
  };

  // Restart puzzle back to snapshot
  const handleRestartPuzzle = () => {
    soundManager.playClickSound();
    setVehicles(JSON.parse(JSON.stringify(initialSnapshot)));
    setMoveHistory([]);
    setMoveCount(0);
    setIsWinningSequence(false);
    setShowWinModal(false);
  };

  // Next puzzle preset
  const handleNextPreset = () => {
    soundManager.playClickSound();
    const currentIndex = CLASSIC_PRESETS.findIndex((p) => p.id === activePreset?.id);
    const nextIndex = (currentIndex + 1) % CLASSIC_PRESETS.length;
    const nextP = CLASSIC_PRESETS[nextIndex];
    handleSelectPreset(nextP);
    setInitialSnapshot(JSON.parse(JSON.stringify(nextP.vehicles)));
    setMoveHistory([]);
    setMoveCount(0);
    setIsWinningSequence(false);
    setShowWinModal(false);
    const sol = solveBoardBFS(nextP.vehicles);
    setStartingOptimalMoves(sol.minMoves);
  };

  // Toggle mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenRules={() => setShowRulesModal(true)}
        mode={mode}
      />

      {/* Main Game Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start pt-4 sm:pt-6">
        {/* Board and Left Panels Workspace - Perfectly identical coordinates in both modes */}
        <div className="w-full flex items-center justify-center relative">
          <div className="relative flex flex-col items-center">
            {/* SETUP MODE: Setup Palette (Positioned to the left of the board, vertically centered) */}
            {mode === 'SETUP' && (
              <div className="absolute right-[calc(100%+24px)] top-1/2 -translate-y-1/2">
                <SetupPalette
                  onDone={handleDoneSetup}
                  onClearBoard={handleClearBoard}
                  hasRedCar={hasRedCar}
                  onDragStartTemplate={setActiveDragState}
                  onDragEndTemplate={() => setActiveDragState(null)}
                />
              </div>
            )}

            {/* PLAY MODE: Vertical rectangle with the remaining labels to the left of the board */}
            {mode === 'PLAY' && (
              <div className="absolute right-[calc(100%+24px)] top-0">
                <aside
                  aria-label="Game Controls"
                  className="w-64 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-sm shrink-0 select-none"
                >
                  {/* Moves & Telemetry */}
                  <div className="flex flex-col gap-3">
                    {/* Moves Counter Card */}
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Moves
                      </span>
                      <span className="font-mono text-3xl font-extrabold text-white tabular-nums mt-1">
                        {moveCount}
                      </span>
                    </div>

                    {/* Solver Status Card */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3 flex items-center justify-center text-center">
                      {solverResult.solvable ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {solverResult.minMoves === 0 ? (
                              'Escaped!'
                            ) : (
                              <>
                                <strong className="font-mono font-bold tabular-nums">
                                  {solverResult.minMoves}
                                </strong>{' '}
                                moves to solve
                              </>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Unsolvable board</span>
                        </div>
                      )}
                    </div>

                    {/* Preset Info if active */}
                    {activePreset && (
                      <div className="px-1 text-center text-xs text-slate-400">
                        Preset:{' '}
                        <span className="text-slate-200 font-medium">
                          {activePreset.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        showHints
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      <span>Hints {showHints ? 'On' : 'Off'}</span>
                    </button>

                    <button
                      onClick={handleUndoMove}
                      disabled={moveHistory.length === 0}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Undo2 className="w-4 h-4 shrink-0" />
                      <span>Undo</span>
                    </button>

                    <button
                      onClick={handleRestartPuzzle}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Restart</span>
                    </button>

                    <button
                      onClick={handleEnterSetup}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Board Builder</span>
                    </button>
                  </div>
                </aside>
              </div>
            )}

            {/* The 6x6 Game Board with Straight Brown Line Overlay */}
            <Board
              vehicles={vehicles}
              mode={mode}
              nextMove={showHints ? solverResult.nextMove : null}
              onMoveOneStep={handleMoveOneStep}
              onPlaceVehicle={handlePlaceVehicle}
              onRelocateVehicle={handleRelocateVehicle}
              onRemoveVehicle={handleRemoveVehicle}
              isWinningSequence={isWinningSequence}
              activeDragState={activeDragState}
              onDragStartExisting={setActiveDragState}
              onDragEndExisting={() => setActiveDragState(null)}
            />
          </div>
        </div>
      </main>

      {/* Win Celebration Overlay */}
      <WinModal
        isOpen={showWinModal}
        totalMoves={moveCount}
        optimalMoves={startingOptimalMoves}
        puzzleTitle={activePreset?.title}
        onPlayAgain={handleRestartPuzzle}
        onNextPuzzle={handleNextPreset}
        onEditSetup={handleEnterSetup}
      />

      {/* Rules & Help Modal */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
}
