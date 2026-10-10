/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, SolverResult, SolverStep, MoveDirection } from '../types/game';

export interface GridOccupancy {
  occupied: boolean[][]; // 6x6
}

/**
 * Builds a 6x6 boolean matrix of occupied cells.
 * Returns null if any vehicle goes out of bounds or overlaps another.
 */
export function buildOccupancyGrid(vehicles: Vehicle[]): boolean[][] | null {
  const grid: boolean[][] = Array.from({ length: 6 }, () => Array(6).fill(false));

  for (const v of vehicles) {
    const len = v.length;
    for (let i = 0; i < len; i++) {
      const r = v.orientation === 'vertical' ? v.row + i : v.row;
      const c = v.orientation === 'horizontal' ? v.col + i : v.col;

      if (r < 0 || r >= 6 || c < 0 || c >= 6) {
        return null; // Out of bounds
      }
      if (grid[r][c]) {
        return null; // Overlap collision
      }
      grid[r][c] = true;
    }
  }

  return grid;
}

/**
 * Validates if a proposed vehicle position is legal on the current board
 * (within 6x6 grid, no overlaps with other vehicles).
 */
export function isValidPlacement(
  candidate: { row: number; col: number; orientation: 'horizontal' | 'vertical'; length: 2 | 3 },
  existingVehicles: Vehicle[],
  ignoreId?: string
): boolean {
  const len = candidate.length;

  // Check board boundary
  if (candidate.orientation === 'horizontal') {
    if (candidate.row < 0 || candidate.row >= 6) return false;
    if (candidate.col < 0 || candidate.col + len > 6) return false;
  } else {
    if (candidate.col < 0 || candidate.col >= 6) return false;
    if (candidate.row < 0 || candidate.row + len > 6) return false;
  }

  // Check collision with existing
  for (const existing of existingVehicles) {
    if (ignoreId && existing.id === ignoreId) continue;
    const exLen = existing.length;

    // Check every cell of candidate against every cell of existing
    for (let ci = 0; ci < len; ci++) {
      const cr = candidate.orientation === 'vertical' ? candidate.row + ci : candidate.row;
      const cc = candidate.orientation === 'horizontal' ? candidate.col + ci : candidate.col;

      for (let ei = 0; ei < exLen; ei++) {
        const er = existing.orientation === 'vertical' ? existing.row + ei : existing.row;
        const ec = existing.orientation === 'horizontal' ? existing.col + ei : existing.col;

        if (cr === er && cc === ec) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Checks if a specific move (1 step in direction) is legal for a vehicle
 */
export function canMoveOneStep(
  vehicle: Vehicle,
  direction: MoveDirection,
  vehicles: Vehicle[]
): boolean {
  const len = vehicle.length;

  if (vehicle.orientation === 'horizontal') {
    if (direction === 'left') {
      const targetCol = vehicle.col - 1;
      if (targetCol < 0) return false;
      return !isCellOccupied(vehicle.row, targetCol, vehicles, vehicle.id);
    }
    if (direction === 'right') {
      const targetCol = vehicle.col + len;
      const winningCol = 6 - len;
      // If any vehicle (car or truck) is exiting through row 2
      if (vehicle.row === 2 && vehicle.orientation === 'horizontal' && vehicle.col === winningCol) {
        return true; // Exiting move is legal
      }
      if (targetCol >= 6) return false;
      return !isCellOccupied(vehicle.row, targetCol, vehicles, vehicle.id);
    }
    return false;
  } else {
    // Vertical
    if (direction === 'up') {
      const targetRow = vehicle.row - 1;
      if (targetRow < 0) return false;
      return !isCellOccupied(targetRow, vehicle.col, vehicles, vehicle.id);
    }
    if (direction === 'down') {
      const targetRow = vehicle.row + len;
      if (targetRow >= 6) return false;
      return !isCellOccupied(targetRow, vehicle.col, vehicles, vehicle.id);
    }
    return false;
  }
}

function isCellOccupied(row: number, col: number, vehicles: Vehicle[], ignoreVehicleId?: string): boolean {
  for (const v of vehicles) {
    if (ignoreVehicleId && v.id === ignoreVehicleId) continue;
    const len = v.length;
    for (let i = 0; i < len; i++) {
      const r = v.orientation === 'vertical' ? v.row + i : v.row;
      const c = v.orientation === 'horizontal' ? v.col + i : v.col;
      if (r === row && c === col) return true;
    }
  }
  return false;
}

/**
 * Breadth-First Search (BFS) Solver
 * Computes the minimum 1-step moves to solve the board and identifies
 * the exact first move for the optimal path. Any horizontal vehicle on row 2 can exit.
 */
export function solveBoardBFS(vehicles: Vehicle[]): SolverResult {
  const numVehicles = vehicles.length;
  const isHorizontal: boolean[] = [];
  const lengths: number[] = [];
  const fixedCoords: number[] = [];
  const initialPositions: number[] = [];
  const ids: string[] = [];
  const exitVehicleIndices: number[] = [];

  for (let i = 0; i < numVehicles; i++) {
    const v = vehicles[i];
    const isH = v.orientation === 'horizontal';
    isHorizontal.push(isH);
    const len = v.length;
    lengths.push(len);
    const fixed = isH ? v.row : v.col;
    fixedCoords.push(fixed);
    const pos = isH ? v.col : v.row;
    initialPositions.push(pos);
    ids.push(v.id);

    if (isH && v.row === 2) {
      exitVehicleIndices.push(i);
    }
  }

  if (exitVehicleIndices.length === 0) {
    return { solvable: false, minMoves: 0, nextMove: null };
  }

  // Helper to pack state into a string
  const encodeState = (pos: number[]) => pos.join(',');

  // Helper to construct a 6x6 grid occupancy array from a position array
  const getGridFromPositions = (pos: number[]) => {
    const grid: number[][] = [
      [-1, -1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1, -1],
    ];

    for (let i = 0; i < numVehicles; i++) {
      const p = pos[i];
      const len = lengths[i];
      const isH = isHorizontal[i];
      const fixed = fixedCoords[i];

      for (let s = 0; s < len; s++) {
        const r = isH ? fixed : p + s;
        const c = isH ? p + s : fixed;
        if (r >= 0 && r < 6 && c >= 0 && c < 6) {
          grid[r][c] = i;
        }
      }
    }
    return grid;
  };

  const startStateStr = encodeState(initialPositions);

  // If already winning:
  for (const idx of exitVehicleIndices) {
    const winningCol = 6 - lengths[idx];
    if (initialPositions[idx] >= winningCol) {
      return {
        solvable: true,
        minMoves: 0,
        nextMove: { vehicleId: ids[idx], direction: 'right', distance: 1 },
        fullPath: [],
        visitedNodesCount: 1,
      };
    }
  }

  // BFS Queue: store state key and step to reach it
  interface ParentEntry {
    prevStateKey: string | null;
    step: SolverStep | null;
  }

  const visitedMap = new Map<string, ParentEntry>();
  visitedMap.set(startStateStr, { prevStateKey: null, step: null });

  const queue: Array<{ positions: number[]; key: string }> = [
    { positions: initialPositions.slice(), key: startStateStr },
  ];

  let winningKey: string | null = null;
  let exitFinalStep: SolverStep | null = null;
  const maxStatesToExplore = 120000;
  let exploredCount = 0;

  while (queue.length > 0 && exploredCount < maxStatesToExplore) {
    exploredCount++;
    const current = queue.shift()!;
    const curPos = current.positions;
    const curKey = current.key;

    // Check if goal reached in this state:
    let matchedExitIdx = -1;
    for (const idx of exitVehicleIndices) {
      const winningCol = 6 - lengths[idx];
      if (curPos[idx] === winningCol) {
        matchedExitIdx = idx;
        break;
      }
    }
    if (matchedExitIdx !== -1) {
      winningKey = curKey;
      exitFinalStep = { vehicleId: ids[matchedExitIdx], direction: 'right', distance: 1 };
      break;
    }

    const grid = getGridFromPositions(curPos);

    // Generate all legal 1-step moves for all vehicles
    for (let i = 0; i < numVehicles; i++) {
      const p = curPos[i];
      const len = lengths[i];
      const isH = isHorizontal[i];
      const fixed = fixedCoords[i];

      // Move Backward (Left or Up)
      if (p > 0) {
        const checkR = isH ? fixed : p - 1;
        const checkC = isH ? p - 1 : fixed;
        if (grid[checkR][checkC] === -1) {
          const nextPos = curPos.slice();
          nextPos[i] = p - 1;
          const nextKey = encodeState(nextPos);

          if (!visitedMap.has(nextKey)) {
            const step: SolverStep = {
              vehicleId: ids[i],
              direction: isH ? 'left' : 'up',
              distance: 1,
            };
            visitedMap.set(nextKey, { prevStateKey: curKey, step });
            queue.push({ positions: nextPos, key: nextKey });
          }
        }
      }

      // Move Forward (Right or Down)
      if (p + len < 6) {
        const checkR = isH ? fixed : p + len;
        const checkC = isH ? p + len : fixed;
        if (grid[checkR][checkC] === -1) {
          const nextPos = curPos.slice();
          nextPos[i] = p + 1;
          const nextKey = encodeState(nextPos);

          if (!visitedMap.has(nextKey)) {
            const step: SolverStep = {
              vehicleId: ids[i],
              direction: isH ? 'right' : 'down',
              distance: 1,
            };
            visitedMap.set(nextKey, { prevStateKey: curKey, step });

            // Quick goal check if vehicle reached winningCol
            const winningCol = 6 - len;
            if (exitVehicleIndices.includes(i) && nextPos[i] === winningCol) {
              winningKey = nextKey;
              exitFinalStep = { vehicleId: ids[i], direction: 'right', distance: 1 };
              break;
            }

            queue.push({ positions: nextPos, key: nextKey });
          }
        }
      }
    }

    if (winningKey) break;
  }

  if (!winningKey) {
    return {
      solvable: false,
      minMoves: 0,
      nextMove: null,
      visitedNodesCount: exploredCount,
    };
  }

  // Reconstruct path by tracing back through visitedMap
  const fullPath: SolverStep[] = [];
  if (exitFinalStep) {
    fullPath.push(exitFinalStep);
  }

  let currKey: string | null = winningKey;
  while (currKey && currKey !== startStateStr) {
    const entry = visitedMap.get(currKey);
    if (!entry || !entry.step) break;
    fullPath.unshift(entry.step);
    currKey = entry.prevStateKey;
  }

  return {
    solvable: true,
    minMoves: fullPath.length,
    nextMove: fullPath.length > 0 ? fullPath[0] : null,
    fullPath,
    visitedNodesCount: exploredCount,
  };
}
