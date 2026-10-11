export const colors = ['blue', 'pink', 'yellow', 'orange', 'green', 'red'] as const;
export type Color = typeof colors[number];
export type Phase = 'roll' | 'move';
export interface GameState {
  positions: number[];
  die: number;
  rules: boolean;
  phase: Phase;
  finishOrder: number[];
  wins: number[];
}
export const FINISH = 9;
export function createGame(random = Math.random): GameState {
  return { positions: colors.map(() => 0), die: Math.floor(random() * colors.length), rules: true, phase: 'roll', finishOrder: [], wins: colors.map(() => 0) };
}
export function roll(state: GameState, random = Math.random): boolean {
  if (state.rules && state.phase !== 'roll') return false;
  state.die = Math.floor(random() * colors.length);
  state.phase = 'move';
  return true;
}
export type MoveResult = 'blocked' | 'moved' | 'won' | 'finished';
export function move(state: GameState, color: number): MoveResult {
  if (!Number.isInteger(color) || color < 0 || color >= colors.length) return 'blocked';
  if (state.rules && (state.phase !== 'move' || color !== state.die)) return 'blocked';
  state.phase = 'roll';
  if (state.positions[color] === FINISH) return 'finished';
  state.positions[color]++;
  if (state.positions[color] === FINISH) {
    state.finishOrder.push(color);
    state.wins[color]++;
    return 'won';
  }
  return 'moved';
}
export function restart(state: GameState, random = Math.random): void {
  state.positions.fill(0);
  state.die = Math.floor(random() * colors.length);
  state.phase = 'roll';
  state.finishOrder = [];
}
