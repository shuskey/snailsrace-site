import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTracker, firstPlaceEvents, PRODUCTION_HOSTNAME, type AnalyticsEvent } from './analytics';

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

test('all six first-place events count repeated races while feature events stay deduplicated', () => {
  const calls: string[] = [];
  const track = createTracker(() => PRODUCTION_HOSTNAME, () => event => calls.push(event));
  for (let race = 0; race < 2; race++) {
    for (const event of Object.values(firstPlaceEvents)) track(event);
    track('Started playing');
  }
  for (const event of Object.values(firstPlaceEvents)) {
    assert.equal(calls.filter(call => call === event).length, 2);
  }
  assert.equal(calls.filter(call => call === 'Started playing').length, 1);
  const localTrack = createTracker(() => 'localhost', () => event => calls.push(event));
  localTrack('Blue first place');
  assert.equal(calls.length, 13);
});
