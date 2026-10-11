import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AutoPlay, type AutoOptions } from './autoplay';
import { createGame, move, restart, roll } from './game';

function fixture() {
  const state = createGame(() => 0);
  const options: AutoOptions = { roll: false, move: false };
  let pending: (() => void) | undefined;
  let delay: number | undefined;
  const timer = {
    set(callback: () => void, ms: number) {
      pending = callback;
      delay = ms;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    },
    clear() { pending = undefined; },
  };
  const auto = new AutoPlay(() => state, () => options,
    () => { roll(state, () => 0); auto.schedule(); },
    () => { move(state, state.die); auto.schedule(); }, timer);
  return { state, options, auto, hasPending: () => Boolean(pending), delay: () => delay,
    tick() { const callback = pending; pending = undefined; callback?.(); } };
}

test('manual mode never schedules actions', () => {
  const f = fixture();
  f.auto.schedule();
  assert.equal(f.hasPending(), false);
  roll(f.state);
  f.auto.schedule();
  assert.equal(f.hasPending(), false);
});

test('auto move moves once after a manual roll, then waits', () => {
  const f = fixture();
  f.options.move = true;
  f.auto.schedule();
  assert.equal(f.hasPending(), false);
  roll(f.state, () => 0);
  f.auto.schedule();
  assert.equal(f.delay(), 250);
  f.tick();
  assert.equal(f.state.positions[0], 1);
  assert.equal(f.hasPending(), false);
});

test('auto roll rolls once, waits for manual move, then rolls again even in free play', () => {
  const f = fixture();
  f.options.roll = true;
  f.state.rules = false;
  f.auto.schedule();
  f.tick();
  assert.equal(f.state.phase, 'move');
  assert.equal(f.hasPending(), false);
  move(f.state, 0);
  f.auto.schedule();
  assert.equal(f.delay(), 250);
  f.tick();
  assert.equal(f.state.phase, 'move');
});

test('demo alternates roll and move with a 250 ms total turn', () => {
  const f = fixture();
  f.options.roll = f.options.move = true;
  f.auto.schedule();
  assert.equal(f.delay(), 125);
  f.tick();
  assert.equal(f.state.phase, 'move');
  assert.equal(f.delay(), 125);
  f.tick();
  assert.equal(f.state.positions[0], 1);
  assert.equal(f.state.phase, 'roll');
  assert.equal(f.hasPending(), true);
});

test('unchecking cancels a pending action; restart replaces the pending turn', () => {
  const f = fixture();
  f.options.move = true;
  roll(f.state, () => 0);
  f.auto.schedule();
  f.options.move = false;
  f.auto.schedule();
  f.tick();
  assert.equal(f.state.positions[0], 0);
  f.options.move = true;
  f.auto.schedule();
  restart(f.state);
  f.auto.schedule();
  f.tick();
  assert.equal(f.state.positions[0], 0);
  assert.equal(f.state.phase, 'roll');
});

test('demo stops after everyone finishes and can restart', () => {
  const f = fixture();
  f.options.roll = f.options.move = true;
  f.state.finishOrder = [0, 1, 2, 3, 4, 5];
  f.auto.schedule();
  assert.equal(f.hasPending(), false);
  restart(f.state);
  f.auto.schedule();
  assert.equal(f.hasPending(), true);
});

test('the browser timer is used when no test timer is supplied', () => {
  const state = createGame();
  const auto = new AutoPlay(() => state, () => ({ roll: true, move: false }), () => {}, () => {});
  auto.schedule();
  auto.cancel();
});
