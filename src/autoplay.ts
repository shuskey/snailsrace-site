import { colors, type GameState } from './game';

export interface AutoOptions { roll: boolean; move: boolean }
interface Timer {
  set(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
  clear(id: ReturnType<typeof setTimeout>): void;
}
const defaultTimer: Timer = {
  set: (callback, delay) => setTimeout(callback, delay),
  clear: id => clearTimeout(id),
};

export class AutoPlay {
  private pending?: ReturnType<typeof setTimeout>;
  constructor(
    private state: () => GameState,
    private options: () => AutoOptions,
    private roll: () => void,
    private move: () => void,
    private timer: Timer = defaultTimer,
  ) {}
  cancel() {
    if (this.pending !== undefined) this.timer.clear(this.pending);
    this.pending = undefined;
  }
  schedule() {
    this.cancel();
    const state = this.state();
    const options = this.options();
    if (state.finishOrder.length === colors.length) return;
    const action = state.phase === 'roll' ? 'roll' : 'move';
    if (!options[action]) return;
    // A complete demo turn takes 250 ms; individual assisted actions take 250 ms.
    this.pending = this.timer.set(() => {
      this.pending = undefined;
      if (action === 'roll') this.roll();
      else this.move();
    }, options.roll && options.move ? 125 : 250);
  }
}
