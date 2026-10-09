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
      { id: 'red', isTarget: true, type: 'car', orientation: 'horizontal', row: 2, col: 1, color: '#ef4444', name: 'Escape Red' },
      { id: 'car-a', isTarget: false, type: 'car', orientation: 'horizontal', row: 0, col: 0, color: '#10b981', name: 'Green Coupe' },
      { id: 'truck-b', isTarget: false, type: 'truck', orientation: 'vertical', row: 1, col: 5, color: '#f59e0b', name: 'Yellow Hauler' },
      { id: 'car-c', isTarget: false, type: 'car', orientation: 'horizontal', row: 4, col: 4, color: '#ec4899', name: 'Pink Sedan' },
      { id: 'truck-d', isTarget: false, type: 'truck', orientation: 'horizontal', row: 5, col: 0, color: '#3b82f6', name: 'Blue Carrier' },
      { id: 'car-e', isTarget: false, type: 'car', orientation: 'vertical', row: 1, col: 0, color: '#8b5cf6', name: 'Purple Hatch' },
      { id: 'car-f', isTarget: false, type: 'car', orientation: 'vertical', row: 3, col: 1, color: '#06b6d4', name: 'Cyan Compact' },
      { id: 'car-g', isTarget: false, type: 'car', orientation: 'horizontal', row: 4, col: 2, color: '#84cc16', name: 'Lime Wagon' },
    ],
  },
  {
    id: 'preset-inter-1',
    title: 'Crossroads Snarl',
    difficulty: 'Intermediate',
    minMoves: 16,
    vehicles: [
      { id: 'red', isTarget: true, type: 'car', orientation: 'horizontal', row: 2, col: 1, color: '#ef4444', name: 'Escape Red' },
      { id: 'car-1', isTarget: false, type: 'car', orientation: 'vertical', row: 0, col: 0, color: '#10b981', name: 'Green Sedan' },
      { id: 'truck-1', isTarget: false, type: 'truck', orientation: 'horizontal', row: 0, col: 1, color: '#3b82f6', name: 'Blue Hauler' },
      { id: 'car-2', isTarget: false, type: 'car', orientation: 'vertical', row: 1, col: 3, color: '#8b5cf6', name: 'Purple Coupe' },
      { id: 'truck-2', isTarget: false, type: 'truck', orientation: 'vertical', row: 2, col: 0, color: '#f59e0b', name: 'Amber Rig' },
      { id: 'car-3', isTarget: false, type: 'car', orientation: 'horizontal', row: 3, col: 1, color: '#06b6d4', name: 'Cyan Hatch' },
      { id: 'car-4', isTarget: false, type: 'car', orientation: 'vertical', row: 3, col: 4, color: '#ec4899', name: 'Pink Compact' },
      { id: 'car-5', isTarget: false, type: 'car', orientation: 'horizontal', row: 5, col: 2, color: '#84cc16', name: 'Lime Mini' },
      { id: 'truck-3', isTarget: false, type: 'truck', orientation: 'vertical', row: 1, col: 5, color: '#6366f1', name: 'Indigo Van' },
    ],
  },
  {
    id: 'preset-advanced-1',
    title: 'Highway Bottleneck',
    difficulty: 'Advanced',
    minMoves: 28,
    vehicles: [
      { id: 'red', isTarget: true, type: 'car', orientation: 'horizontal', row: 2, col: 0, color: '#ef4444', name: 'Escape Red' },
      { id: 'truck-1', isTarget: false, type: 'truck', orientation: 'vertical', row: 0, col: 2, color: '#3b82f6', name: 'Blue Hauler' },
      { id: 'truck-2', isTarget: false, type: 'truck', orientation: 'vertical', row: 1, col: 3, color: '#f59e0b', name: 'Amber Rig' },
      { id: 'car-1', isTarget: false, type: 'car', orientation: 'horizontal', row: 0, col: 3, color: '#10b981', name: 'Green Coupe' },
      { id: 'car-2', isTarget: false, type: 'car', orientation: 'vertical', row: 3, col: 0, color: '#8b5cf6', name: 'Purple Hatch' },
      { id: 'car-3', isTarget: false, type: 'car', orientation: 'horizontal', row: 4, col: 1, color: '#06b6d4', name: 'Cyan Sedan' },
      { id: 'car-4', isTarget: false, type: 'car', orientation: 'vertical', row: 4, col: 3, color: '#ec4899', name: 'Pink Van' },
      { id: 'truck-3', isTarget: false, type: 'truck', orientation: 'horizontal', row: 5, col: 0, color: '#14b8a6', name: 'Teal Carrier' },
      { id: 'truck-4', isTarget: false, type: 'truck', orientation: 'vertical', row: 1, col: 5, color: '#a855f7', name: 'Violet Truck' },
    ],
  },
  {
    id: 'preset-expert-1',
    title: 'The Grand Standoff',
    difficulty: 'Expert',
    minMoves: 40,
    vehicles: [
      { id: 'red', isTarget: true, type: 'car', orientation: 'horizontal', row: 2, col: 1, color: '#ef4444', name: 'Escape Red' },
      { id: 'truck-a', isTarget: false, type: 'truck', orientation: 'vertical', row: 0, col: 0, color: '#3b82f6', name: 'Blue Tanker' },
      { id: 'truck-b', isTarget: false, type: 'truck', orientation: 'horizontal', row: 0, col: 1, color: '#f59e0b', name: 'Amber Hauler' },
      { id: 'truck-c', isTarget: false, type: 'truck', orientation: 'vertical', row: 1, col: 3, color: '#10b981', name: 'Emerald Freight' },
      { id: 'car-d', isTarget: false, type: 'car', orientation: 'vertical', row: 0, col: 4, color: '#8b5cf6', name: 'Purple Coupe' },
      { id: 'car-e', isTarget: false, type: 'car', orientation: 'horizontal', row: 3, col: 0, color: '#06b6d4', name: 'Cyan Bug' },
      { id: 'car-f', isTarget: false, type: 'car', orientation: 'vertical', row: 4, col: 0, color: '#ec4899', name: 'Pink Hatch' },
      { id: 'car-g', isTarget: false, type: 'car', orientation: 'horizontal', row: 4, col: 1, color: '#84cc16', name: 'Lime Cruiser' },
      { id: 'car-h', isTarget: false, type: 'car', orientation: 'vertical', row: 3, col: 5, color: '#f97316', name: 'Orange Wagon' },
      { id: 'truck-i', isTarget: false, type: 'truck', orientation: 'vertical', row: 1, col: 4, color: '#6366f1', name: 'Indigo Rig' },
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
