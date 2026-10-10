/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Vehicle, GameMode, MoveDirection, SolverResult, PuzzlePreset, Orientation, ActiveDragState } from './types/game';
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
  Save,
  FolderOpen,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSaveBoard = () => {
    soundManager.playClickSound();
    try {
      const data = JSON.stringify({
        version: 1,
        vehicles: vehicles,
      }, null, 2);

      const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const filename = `rushour${yy}${mm}${dd}_${hh}${min}${ss}.txt`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
    } catch {
      // Handled safely without exposing internal exceptions
    }
  };

  const handleLoadClick = () => {
    try {
      soundManager.playClickSound();
    } catch {}
    setLoadError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e?.target;
    try {
      if (!input || !input.files || input.files.length === 0) {
        return;
      }
      const file = input.files[0];
      if (!file) {
        return;
      }

      // 1. First verify that the file exists and is valid
      const fileSize = typeof file.size === 'number' ? file.size : (file as any).size ? Number((file as any).size) : 1;
      if (fileSize === 0) {
        setLoadError('Incorrect file format');
        try { if (input) input.value = ''; } catch {}
        return;
      }

      const reader = new FileReader();

      reader.onerror = () => {
        setLoadError('Incorrect file format');
        try { if (input) input.value = ''; } catch {}
      };

      reader.onload = (event) => {
        try {
          const content = event?.target?.result;
          if (typeof content !== 'string' || !content.trim()) {
            setLoadError('Incorrect file format');
            return;
          }

          // 2. Wrap the JSON loader so that any load/parse errors are caught cleanly
          let parsed: any;
          try {
            parsed = JSON.parse(content);
          } catch {
            setLoadError('Incorrect file format');
            return;
          }

          // 3. Make sure that the JSON structure is as expected
          if (!parsed || typeof parsed !== 'object') {
            setLoadError('Incorrect file format');
            return;
          }

          let loadedVehicles: any[] | null = null;
          if (Array.isArray(parsed)) {
            loadedVehicles = parsed;
          } else if (Array.isArray(parsed.vehicles)) {
            loadedVehicles = parsed.vehicles;
          }

          if (!loadedVehicles) {
            setLoadError('Incorrect file format');
            return;
          }

          // Verify every vehicle in the array meets requirements
          const validatedVehicles: Vehicle[] = [];
          const occupiedCells = new Set<string>();

          for (let i = 0; i < loadedVehicles.length; i++) {
            const v = loadedVehicles[i];
            if (!v || typeof v !== 'object') {
              setLoadError('Incorrect file format');
              return;
            }

            // Length must be 2 or 3 (backward compatible with type: 'car' | 'truck')
            let resolvedLen: 2 | 3;
            if (v.length === 2 || v.length === 3) {
              resolvedLen = v.length;
            } else if (v.type === 'car') {
              resolvedLen = 2;
            } else if (v.type === 'truck') {
              resolvedLen = 3;
            } else {
              setLoadError('Incorrect file format');
              return;
            }

            // Orientation must be 'horizontal' or 'vertical'
            if (v.orientation !== 'horizontal' && v.orientation !== 'vertical') {
              setLoadError('Incorrect file format');
              return;
            }

            // Position row and col must be integers between 0 and 5
            if (
              typeof v.row !== 'number' ||
              typeof v.col !== 'number' ||
              !Number.isInteger(v.row) ||
              !Number.isInteger(v.col) ||
              v.row < 0 ||
              v.row > 5 ||
              v.col < 0 ||
              v.col > 5
            ) {
              setLoadError('Incorrect file format');
              return;
            }

            // Must fit within 6x6 board
            if (v.orientation === 'horizontal' && v.col + resolvedLen > 6) {
              setLoadError('Incorrect file format');
              return;
            }
            if (v.orientation === 'vertical' && v.row + resolvedLen > 6) {
              setLoadError('Incorrect file format');
              return;
            }

            // Check for overlaps
            for (let s = 0; s < resolvedLen; s++) {
              const r = v.orientation === 'vertical' ? v.row + s : v.row;
              const c = v.orientation === 'horizontal' ? v.col + s : v.col;
              const cellKey = `${r},${c}`;
              if (occupiedCells.has(cellKey)) {
                setLoadError('Incorrect file format');
                return;
              }
              occupiedCells.add(cellKey);
            }

            validatedVehicles.push({
              id: String(v.id || `veh-${i + 1}`),
              length: resolvedLen,
              orientation: v.orientation,
              row: v.row,
              col: v.col,
              color: typeof v.color === 'string' && v.color ? v.color : VEHICLE_COLOR_PALETTE[i % VEHICLE_COLOR_PALETTE.length],
              name: typeof v.name === 'string' ? v.name : undefined,
            });
          }

          // 4. Only then should you read and apply the board state itself
          setVehicles(validatedVehicles);
          setActivePreset(null);
          setLoadError(null);
          try {
            soundManager.playClickSound();
          } catch {}
        } catch {
          setLoadError('Incorrect file format');
        } finally {
          try {
            if (input) input.value = '';
          } catch {}
        }
      };

      reader.readAsText(file);
    } catch {
      setLoadError('Incorrect file format');
      try {
        if (input) input.value = '';
      } catch {}
    }
  };

  // Background BFS Solver computation
  const solverResult: SolverResult = useMemo(() => {
    return solveBoardBFS(vehicles);
  }, [vehicles]);

  // Initial optimal moves computed when entering Play mode
  const [startingOptimalMoves, setStartingOptimalMoves] = useState<number>(0);

  // Check if any vehicle exists on row 2 horizontally
  const hasRedCar = useMemo(() => {
    return vehicles.some((v) => v.row === 2 && v.orientation === 'horizontal');
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

  // Return to SETUP mode from win screen and restart board to start of play state
  const handleEditSetupFromWin = () => {
    soundManager.playClickSound();
    if (initialSnapshot.length > 0) {
      setVehicles(JSON.parse(JSON.stringify(initialSnapshot)));
    }
    setMoveHistory([]);
    setMoveCount(0);
    setMode('SETUP');
    setIsWinningSequence(false);
    setShowWinModal(false);
  };

  // Place a new vehicle from palette onto board
  const handlePlaceVehicle = (newVeh: {
    length: 2 | 3;
    orientation: Orientation;
    row: number;
    col: number;
  }) => {
    const nextColor = VEHICLE_COLOR_PALETTE[colorCounter % VEHICLE_COLOR_PALETTE.length];
    setColorCounter((prev) => prev + 1);

    const maxIdNum = vehicles.reduce((max, v) => {
      const num = parseInt(v.id, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const vehicleId = String(maxIdNum + 1);

    const created: Vehicle = {
      id: vehicleId,
      length: newVeh.length,
      orientation: newVeh.orientation,
      row: newVeh.row,
      col: newVeh.col,
      color: nextColor,
    };

    setVehicles((prev) => [...prev, created]);
    setActivePreset(null);
  };

  // Relocate an existing vehicle to a new position on the board
  const handleRelocateVehicle = (vehicleId: string, newRow: number, newCol: number) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          return { ...v, row: newRow, col: newCol };
        }
        return v;
      })
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
    setLoadError(null);
  };

  // Randomly generate a valid and solvable puzzle in board builder mode
  const handleRandomPuzzle = () => {
    soundManager.playClickSound();

    let currentVehicles: Vehicle[] = [];

    // 1. First place a horizontal vehicle in the exit row (row 2) at least 2 spaces from exit (col + len <= 4)
    const firstLength: 2 | 3 = Math.random() < 0.6 ? 2 : 3;
    const maxCol = 4 - firstLength; // ensures col + len <= 4 (at least 2 spaces from exit at col 6)
    const firstCol = Math.floor(Math.random() * (maxCol + 1));

    const firstVehicle: Vehicle = {
      id: '1',
      length: firstLength,
      orientation: 'horizontal',
      row: 2,
      col: firstCol,
      color: '#ef4444',
    };

    currentVehicles.push(firstVehicle);

    let lastSolvableVehicles: Vehicle[] = JSON.parse(JSON.stringify(currentVehicles));

    // 2. Add random vehicles one by one, checking validity and solvability
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      attempts++;
      const randLength: 2 | 3 = Math.random() < 0.6 ? 2 : 3;
      const randOrientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const randRow = Math.floor(Math.random() * 6);
      const randCol = Math.floor(Math.random() * 6);
      const randColor = VEHICLE_COLOR_PALETTE[Math.floor(Math.random() * VEHICLE_COLOR_PALETTE.length)];

      const candidate = {
        length: randLength,
        orientation: randOrientation,
        row: randRow,
        col: randCol,
      };

      // Check if placement is valid (entirely on board, no overlap)
      if (isValidPlacement(candidate, currentVehicles)) {
        const candidateVehicle: Vehicle = {
          id: String(currentVehicles.length + 1),
          length: randLength,
          orientation: randOrientation,
          row: randRow,
          col: randCol,
          color: randColor,
        };

        currentVehicles.push(candidateVehicle);

        // Check if solvable
        const solverRes = solveBoardBFS(currentVehicles);
        if (solverRes.solvable) {
          lastSolvableVehicles = JSON.parse(JSON.stringify(currentVehicles));
        } else {
          // Not solvable! Back off (remove candidate) and stop adding more vehicles
          currentVehicles.pop();
          break;
        }
      }
    }

    const numberedVehicles = lastSolvableVehicles.map((v, idx) => ({
      ...v,
      id: String(idx + 1),
    }));

    setVehicles(numberedVehicles);
    setActivePreset(null);
  };

  // Load preset
  const handleSelectPreset = (preset: PuzzlePreset) => {
    soundManager.playClickSound();
    setActivePreset(preset);
    const numbered = preset.vehicles.map((v, idx) => ({
      ...v,
      id: String(idx + 1),
    }));
    setVehicles(JSON.parse(JSON.stringify(numbered)));
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

      // Check win move for any vehicle exiting through row 2
      const exitingLen = targetVehicle.length;
      const winningCol = 6 - exitingLen;
      const isExitingVehicle = targetVehicle.row === 2 && targetVehicle.orientation === 'horizontal';
      if (
        isExitingVehicle &&
        direction === 'right' &&
        targetVehicle.col === winningCol
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

      // Check if this move directly won (Vehicle exiting)
      if (isExitingVehicle && newCol >= winningCol + 1) {
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
              <>
                <div className="absolute right-[calc(100%+24px)] top-1/2 -translate-y-1/2">
                  <SetupPalette
                    onDone={handleDoneSetup}
                    onClearBoard={handleClearBoard}
                    onRandom={handleRandomPuzzle}
                    hasRedCar={hasRedCar}
                    onDragStartTemplate={setActiveDragState}
                    onDragEndTemplate={() => setActiveDragState(null)}
                  />
                </div>

                {/* SETUP MODE: Solver status & Save/Load controls to the right of the board */}
                <div className="absolute left-[calc(100%+24px)] top-0 flex flex-col gap-4 w-64">
                  {vehicles.length > 0 && (
                    <aside
                      aria-label="Board Solver Status"
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-sm shrink-0 select-none"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                        Board Status
                      </span>
                      <div className="text-center">
                        {solverResult.solvable ? (
                          <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-semibold">
                              {solverResult.minMoves === 0 ? (
                                'Already Solved'
                              ) : (
                                <>
                                  Solvable in{' '}
                                  <strong className="font-mono font-bold text-white text-base tabular-nums">
                                    {solverResult.minMoves}
                                  </strong>{' '}
                                  {solverResult.minMoves === 1 ? 'step' : 'steps'}
                                </>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-rose-400">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-semibold">Unsolvable board</span>
                          </div>
                        )}
                      </div>
                    </aside>
                  )}

                  <aside
                    aria-label="Board Storage Controls"
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-2xl backdrop-blur-sm shrink-0 select-none"
                  >

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleSaveBoard}
                        className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-blue-400" />
                        <span>Save Board State</span>
                      </button>

                      <button
                        onClick={handleLoadClick}
                        className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Load Board State</span>
                      </button>
                    </div>

                    {loadError && (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex flex-col gap-1.5 text-rose-300 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Load Error</span>
                        </div>
                        <p className="text-rose-300/90 leading-relaxed">{loadError}</p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelected}
                      accept=".txt,text/plain"
                      className="hidden"
                    />
                  </aside>
                </div>
              </>
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
        onEditSetup={handleEditSetupFromWin}
      />

      {/* Rules & Help Modal */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
}
