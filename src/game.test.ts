import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, FINISH, move, restart, roll } from './game';

test('rules require rolling, matching the color, then rolling again', () => {
  const state = createGame(() => 0);
  assert.equal(move(state, 0), 'blocked');
  assert.equal(roll(state, () => 0.4), true);
  assert.equal(state.die, 2);
  assert.equal(roll(state), false);
  assert.equal(move(state, 1), 'blocked');
  assert.equal(state.phase, 'move');
  assert.equal(move(state, 2), 'moved');
  assert.deepEqual(state.positions, [0, 0, 1, 0, 0, 0]);
  assert.equal(move(state, 2), 'blocked');
  assert.equal(roll(state), true);
});

test('free play allows any snail and repeated rolls', () => {
  const state = createGame();
  state.rules = false;
  assert.equal(move(state, 4), 'moved');
  assert.equal(move(state, 0), 'moved');
  assert.equal(roll(state), true);
  assert.equal(roll(state), true);
  assert.equal(move(state, 5), 'moved');
});

test('each snail finishes once, further finish clicks consume a turn, others keep racing', () => {
  const state = createGame();
  for (let step = 0; step < FINISH; step++) {
    roll(state, () => 0);
    assert.equal(move(state, 0), step === FINISH - 1 ? 'won' : 'moved');
  }
  assert.deepEqual(state.finishOrder, [0]);
  assert.equal(state.wins[0], 1);
  roll(state, () => 0);
  assert.equal(move(state, 0), 'finished');
  assert.equal(state.phase, 'roll');
  assert.equal(state.positions[0], FINISH);
  assert.equal(state.wins[0], 1);
  for (let step = 0; step < FINISH; step++) {
    roll(state, () => 0.2);
    move(state, 1);
  }
  assert.deepEqual(state.finishOrder, [0, 1]);
});

test('restart resets the board and turn while preserving rules and cumulative wins', () => {
  const state = createGame();
  state.rules = false;
  for (let step = 0; step < FINISH; step++) move(state, 3);
  restart(state, () => 0.9);
  assert.deepEqual(state.positions, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(state.finishOrder, []);
  assert.equal(state.die, 5);
  assert.equal(state.phase, 'roll');
  assert.equal(state.rules, false);
  assert.equal(state.wins[3], 1);
});

test('enabling rules in free play preserves the current roll/move phase', () => {
  const state = createGame();
  state.rules = false;
  roll(state, () => 0.7);
  state.rules = true;
  assert.equal(move(state, 0), 'blocked');
  assert.equal(move(state, 4), 'moved');
});
