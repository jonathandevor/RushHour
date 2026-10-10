/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Orientation = 'horizontal' | 'vertical';
export type GameMode = 'SETUP' | 'PLAY';
export type MoveDirection = 'left' | 'right' | 'up' | 'down';

export interface Vehicle {
  id: string;
  length: 2 | 3; // integer values 2 or 3
  orientation: Orientation;
  row: number; // 0-indexed anchor row (0 to 5)
  col: number; // 0-indexed anchor col (0 to 5)
  color: string;
  accentColor?: string;
  name?: string;
}

export interface BoardPosition {
  row: number;
  col: number;
}

export interface SolverStep {
  vehicleId: string;
  direction: MoveDirection;
  distance: number;
}

export interface SolverResult {
  solvable: boolean;
  minMoves: number;
  nextMove: SolverStep | null;
  fullPath?: SolverStep[];
  visitedNodesCount?: number;
}

export interface PuzzlePreset {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  minMoves: number;
  vehicles: Vehicle[];
}

export interface ActiveDragState {
  length: 2 | 3;
  orientation: Orientation;
  offsetX: number;
  offsetY: number;
  vehicleId?: string;
}
