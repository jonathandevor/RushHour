/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PuzzlePreset } from '../types/game';

export const CLASSIC_PRESETS: PuzzlePreset[] = [
  {
    id: 'preset-beginner-1',
    title: 'Warmup Rush',
    difficulty: 'Beginner',
    minMoves: 8,
    vehicles: [
      { id: '1', length: 2, orientation: 'horizontal', row: 2, col: 1, color: '#ef4444', name: 'Escape Red' },
      { id: '2', length: 2, orientation: 'horizontal', row: 0, col: 0, color: '#10b981', name: 'Green Coupe' },
      { id: '3', length: 3, orientation: 'vertical', row: 1, col: 5, color: '#f59e0b', name: 'Yellow Hauler' },
      { id: '4', length: 2, orientation: 'horizontal', row: 4, col: 4, color: '#ec4899', name: 'Pink Sedan' },
      { id: '5', length: 3, orientation: 'horizontal', row: 5, col: 0, color: '#3b82f6', name: 'Blue Carrier' },
      { id: '6', length: 2, orientation: 'vertical', row: 1, col: 0, color: '#8b5cf6', name: 'Purple Hatch' },
      { id: '7', length: 2, orientation: 'vertical', row: 3, col: 1, color: '#06b6d4', name: 'Cyan Compact' },
      { id: '8', length: 2, orientation: 'horizontal', row: 4, col: 2, color: '#84cc16', name: 'Lime Wagon' },
    ],
  },
  {
    id: 'preset-inter-1',
    title: 'Crossroads Snarl',
    difficulty: 'Intermediate',
    minMoves: 16,
    vehicles: [
      { id: '1', length: 2, orientation: 'horizontal', row: 2, col: 1, color: '#ef4444', name: 'Escape Red' },
      { id: '2', length: 2, orientation: 'vertical', row: 0, col: 0, color: '#10b981', name: 'Green Sedan' },
      { id: '3', length: 3, orientation: 'horizontal', row: 0, col: 1, color: '#3b82f6', name: 'Blue Hauler' },
      { id: '4', length: 2, orientation: 'vertical', row: 1, col: 3, color: '#8b5cf6', name: 'Purple Coupe' },
      { id: '5', length: 3, orientation: 'vertical', row: 2, col: 0, color: '#f59e0b', name: 'Amber Rig' },
      { id: '6', length: 2, orientation: 'horizontal', row: 3, col: 1, color: '#06b6d4', name: 'Cyan Hatch' },
      { id: '7', length: 2, orientation: 'vertical', row: 3, col: 4, color: '#ec4899', name: 'Pink Compact' },
      { id: '8', length: 2, orientation: 'horizontal', row: 5, col: 2, color: '#84cc16', name: 'Lime Mini' },
      { id: '9', length: 3, orientation: 'vertical', row: 1, col: 5, color: '#6366f1', name: 'Indigo Van' },
    ],
  },
  {
    id: 'preset-advanced-1',
    title: 'Highway Bottleneck',
    difficulty: 'Advanced',
    minMoves: 28,
    vehicles: [
      { id: '1', length: 2, orientation: 'horizontal', row: 2, col: 0, color: '#ef4444', name: 'Escape Red' },
      { id: '2', length: 3, orientation: 'vertical', row: 0, col: 2, color: '#3b82f6', name: 'Blue Hauler' },
      { id: '3', length: 3, orientation: 'vertical', row: 1, col: 3, color: '#f59e0b', name: 'Amber Rig' },
      { id: '4', length: 2, orientation: 'horizontal', row: 0, col: 3, color: '#10b981', name: 'Green Coupe' },
      { id: '5', length: 2, orientation: 'vertical', row: 3, col: 0, color: '#8b5cf6', name: 'Purple Hatch' },
      { id: '6', length: 2, orientation: 'horizontal', row: 4, col: 1, color: '#06b6d4', name: 'Cyan Sedan' },
      { id: '7', length: 2, orientation: 'vertical', row: 4, col: 3, color: '#ec4899', name: 'Pink Van' },
      { id: '8', length: 3, orientation: 'horizontal', row: 5, col: 0, color: '#14b8a6', name: 'Teal Carrier' },
      { id: '9', length: 3, orientation: 'vertical', row: 1, col: 5, color: '#a855f7', name: 'Violet Truck' },
    ],
  },
  {
    id: 'preset-expert-1',
    title: 'The Grand Standoff',
    difficulty: 'Expert',
    minMoves: 40,
    vehicles: [
      { id: '1', length: 2, orientation: 'horizontal', row: 2, col: 1, color: '#ef4444', name: 'Escape Red' },
      { id: '2', length: 3, orientation: 'vertical', row: 0, col: 0, color: '#3b82f6', name: 'Blue Tanker' },
      { id: '3', length: 3, orientation: 'horizontal', row: 0, col: 1, color: '#f59e0b', name: 'Amber Hauler' },
      { id: '4', length: 3, orientation: 'vertical', row: 1, col: 3, color: '#10b981', name: 'Emerald Freight' },
      { id: '5', length: 2, orientation: 'vertical', row: 0, col: 4, color: '#8b5cf6', name: 'Purple Coupe' },
      { id: '6', length: 2, orientation: 'horizontal', row: 3, col: 0, color: '#06b6d4', name: 'Cyan Bug' },
      { id: '7', length: 2, orientation: 'vertical', row: 4, col: 0, color: '#ec4899', name: 'Pink Hatch' },
      { id: '8', length: 2, orientation: 'horizontal', row: 4, col: 1, color: '#84cc16', name: 'Lime Cruiser' },
      { id: '9', length: 2, orientation: 'vertical', row: 3, col: 5, color: '#f97316', name: 'Orange Wagon' },
      { id: '10', length: 3, orientation: 'vertical', row: 1, col: 4, color: '#6366f1', name: 'Indigo Rig' },
    ],
  },
];

// Pre-defined palette of distinct colors for custom added vehicles
export const VEHICLE_COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#d946ef', // Fuchsia
];
