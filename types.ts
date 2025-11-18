import { Difficulty } from './App';

export interface Vector2D {
  x: number;
  y: number;
}

export interface HighScore {
  name: string;
  score: number;
  difficulty: Difficulty;
}

// Types for Online Multiplayer (from server spec)
export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball {
  position: Vector2D;
  velocity: Vector2D;
}

export interface Player {
  id: string; // Socket ID
  playerNumber: 1 | 2;
  ball: Ball;
  score: number;
}

export interface GameState {
  gameId: string;
  players: [Player, Player];
  holePosition: Vector2D;
  obstacles: Obstacle[];
  timeLeft: number; // in seconds
  status: 'waiting' | 'active' | 'finished';
  winner?: 1 | 2 | 'tie';
}