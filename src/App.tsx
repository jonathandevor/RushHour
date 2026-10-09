/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Vehicle, GameMode, MoveDirection, SolverResult, PuzzlePreset, VehicleType, Orientation } from './types/game';
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
  Play,
  Trash2,
} from 'lucide-react';

const INITIAL_RED_CAR: Vehicle = {
  id: 'red',
  isTarget: true,
  type: 'car',
  orientation: 'horizontal',
  row: 2, // 3rd row (0-indexed 2)
  col: 1,
  color: '#ef4444',
  name: 'Target Red Car',
};

export default function App() {
  // Game State: Starts in 'SETUP' mode as required
  const [mode, setMode] = useState<GameMode>('SETUP');
  const [vehicles, setVehicles] = useState<Vehicle[]>([INITIAL_RED_CAR]);
  const [initialSnapshot, setInitialSnapshot] = useState<Vehicle[]>([INITIAL_RED_CAR]);
  const [moveHistory, setMoveHistory] = useState<Vehicle[][]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<PuzzlePreset | null>(null);

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

    let activeVehicles = [...vehicles];
    // If no Red Car exists on row 2:
    const redOnRow2 = activeVehicles.find((v) => v.isTarget && v.row === 2 && v.orientation === 'horizontal');
    if (!redOnRow2) {
      // Check if there's any horizontal car on row 2 that can be designated as the red car
      const horizCarOnRow2 = activeVehicles.find((v) => v.orientation === 'horizontal' && v.row === 2 && v.type === 'car');
      if (horizCarOnRow2) {
        activeVehicles = activeVehicles.map((v) =>
          v.id === horizCarOnRow2.id ? { ...v, id: 'red', isTarget: true, color: '#ef4444', name: 'Target Red Car' } : v
        );
      } else {
        // Place the Red Car in the first available slot on row 2
        let placedCol = -1;
        for (let c = 0; c <= 4; c++) {
          if (isValidPlacement({ row: 2, col: c, orientation: 'horizontal', type: 'car' }, activeVehicles)) {
            placedCol = c;
            break;
          }
        }
        if (placedCol !== -1) {
          activeVehicles.push({
            id: 'red',
            isTarget: true,
            type: 'car',
            orientation: 'horizontal',
            row: 2,
            col: placedCol,
            color: '#ef4444',
            name: 'Target Red Car',
          });
        } else {
          // If row 2 has no space, clear whatever is on row 2 cols 0-1 and place red car
          activeVehicles = activeVehicles.filter((v) => !(v.row === 2 && (v.col === 0 || v.col === 1)));
          activeVehicles.push({
            id: 'red',
            isTarget: true,
            type: 'car',
            orientation: 'horizontal',
            row: 2,
            col: 0,
            color: '#ef4444',
            name: 'Target Red Car',
          });
        }
      }
    }

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
        onOpenPresets={() => {
          setMode('SETUP');
        }}
        onEnterSetup={handleEnterSetup}
        mode={mode}
      />

      {/* Main Game Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        {/* Top Play HUD / Status Banner */}
        <div className="w-full max-w-4xl mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 sm:px-6 py-3 shadow-lg">
          {/* Mode Pill */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg tracking-wider uppercase ${
                mode === 'SETUP'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {mode === 'SETUP' ? 'Board Builder' : 'Play Mode'}
            </span>

            {activePreset && mode === 'PLAY' && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                Preset: <strong className="text-white font-medium">{activePreset.title}</strong>
              </span>
            )}
          </div>

          {/* Play Mode Counters & Solver Telemetry */}
          {mode === 'PLAY' ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Moves:</span>
                <span className="font-mono text-base font-bold text-white tabular-nums">
                  {moveCount}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {solverResult.solvable ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
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
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Unsolvable board</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearBoard}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear all vehicles from board"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Board</span>
              </button>
            </div>
          )}

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            {mode === 'PLAY' && (
              <>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showHints
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={showHints ? 'Hints enabled (showing arrow)' : 'Hints hidden'}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hints {showHints ? 'On' : 'Off'}</span>
                </button>

                <button
                  onClick={handleUndoMove}
                  disabled={moveHistory.length === 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                  title="Undo last move"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Undo</span>
                </button>

                <button
                  onClick={handleRestartPuzzle}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                  title="Restart from initial puzzle state"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restart</span>
                </button>

                <button
                  onClick={handleEnterSetup}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Return to Board Builder"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Board Builder</span>
                </button>
              </>
            )}

            {mode === 'SETUP' && (
              <button
                onClick={handleDoneSetup}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </button>
            )}
          </div>
        </div>

        {/* Board and Palette Workspace */}
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
          {/* Setup Palette (Shown on the left in SETUP mode) */}
          {mode === 'SETUP' ? (
            <SetupPalette
              onDone={handleDoneSetup}
              onClearBoard={handleClearBoard}
              hasRedCar={hasRedCar}
            />
          ) : (
            // Play Mode Side Card: Solver AI Info & Live Hint Card
            <div className="w-full lg:w-72 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-sm shrink-0">
              <div>
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Real-time AI Hint</span>
                </span>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Optimal Move Guide
                </h3>
              </div>

              {solverResult.solvable && solverResult.nextMove ? (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Next Step:</span>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Slide {solverResult.nextMove.direction}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Look for the <strong>pulsing arrow</strong> inside the highlighted vehicle.
                  </p>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Remaining moves:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {solverResult.minMoves} steps
                    </span>
                  </div>
                </div>
              ) : solverResult.minMoves === 0 ? (
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3.5 text-xs text-emerald-300">
                  Escape path is clear! Slide the Red Car right to exit.
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3.5 text-xs text-rose-300">
                  Current vehicle placement has no solution. Tap &quot;Board Builder&quot; to adjust vehicles.
                </div>
              )}

              {/* Controls guide */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex flex-col gap-1.5">
                <span className="font-semibold text-slate-300">How to Move:</span>
                <span>• Click left/right half of horizontal vehicles</span>
                <span>• Click top/bottom half of vertical vehicles</span>
                <span>• Or click & drag smoothly along axis</span>
              </div>

              {/* Switch to Setup */}
              <button
                onClick={handleEnterSetup}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Return to Board Builder</span>
              </button>
            </div>
          )}

          {/* The 6x6 Game Board with Straight Brown Line Overlay */}
          <div className="flex flex-col items-center">
            <Board
              vehicles={vehicles}
              mode={mode}
              nextMove={showHints ? solverResult.nextMove : null}
              onMoveOneStep={handleMoveOneStep}
              onPlaceVehicle={handlePlaceVehicle}
              onRemoveVehicle={handleRemoveVehicle}
              isWinningSequence={isWinningSequence}
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
