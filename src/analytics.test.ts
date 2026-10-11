import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTracker, PRODUCTION_HOSTNAME, type AnalyticsEvent } from './analytics';

test('localhost, previews, and the DynaDraw hostname never send game analytics', () => {
  for (const host of ['localhost', '127.0.0.1', 'preview.chatgpt.site', 'dynadraw-studio.chummy-bard-6128.chatgpt.site']) {
    const track = createTracker(() => host, () => { throw new Error('Transport must not be accessed'); });
    assert.doesNotThrow(() => track('Started playing'));
  }
});
test('production sends each fixed event once without additional data', () => {
  const calls: unknown[][] = [];
  const track = createTracker(() => PRODUCTION_HOSTNAME, () => (...args) => calls.push(args));
  track('Started playing');
  track('Started playing');
  track('Used demo mode');
  track('Used demo mode');
  track('arbitrary user content' as AnalyticsEvent);
  assert.deepEqual(calls, [['Started playing'], ['Used demo mode']]);
});
test('missing or failed analytics never block the game and do not mark an event sent', () => {
  let available = false;
  let fails = true;
  const calls: string[] = [];
  const track = createTracker(() => PRODUCTION_HOSTNAME, () => available ? event => {
    if (fails) throw new Error('Blocked script');
    calls.push(event);
  } : undefined);
  assert.doesNotThrow(() => track('Finished race'));
  available = true;
  assert.doesNotThrow(() => track('Finished race'));
  fails = false;
  track('Finished race');
  track('Finished race');
  assert.deepEqual(calls, ['Finished race']);
});
