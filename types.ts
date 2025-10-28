import { Difficulty } from './App';

// Fix: Define and export the Vector2D interface, which was previously imported but not exported.
export interface Vector2D {
  x: number;
  y: number;
}

export interface HighScore {
  name: string;
  score: number;
  difficulty: Difficulty;
}