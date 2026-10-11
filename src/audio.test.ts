import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from './audio';

function setup(t: TestContext) {
  const calls: string[] = [];
  let state = 'suspended';
  let fetchFails = false;
  const session = { type: 'auto' };
  class Context {
    get state() { return state; }
    sampleRate = 44100;
    destination = {};
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    createBuffer() { return { silent: true }; }
    createBufferSource() {
      return {
        buffer: undefined as { silent?: boolean } | undefined,
        connect() {}, disconnect() {}, stop() {}, onended: undefined,
        start() { calls.push(this.buffer?.silent ? 'prime' : 'sound'); },
      };
    }
    resume() { calls.push('resume'); state = 'running'; return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({}); }
  }
  const originalContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: Context });
  const originalSession = Object.getOwnPropertyDescriptor(navigator, 'audioSession');
  Object.defineProperty(navigator, 'audioSession', { configurable: true, value: session });
  t.after(() => {
    if (originalContext) Object.defineProperty(globalThis, 'AudioContext', originalContext);
    else Reflect.deleteProperty(globalThis, 'AudioContext');
    if (originalSession) Object.defineProperty(navigator, 'audioSession', originalSession);
    else Reflect.deleteProperty(navigator, 'audioSession');
  });
  t.mock.method(globalThis, 'fetch', async () => {
    calls.push('fetch');
    return { ok: !fetchFails, arrayBuffer: async () => new ArrayBuffer(0) };
  });
  let errors = 0;
  const audio = new GameAudio(() => errors++);
  return { audio, calls, session, interrupt: () => { state = 'interrupted'; }, failFetch: (fail: boolean) => { fetchFails = fail; }, errors: () => errors };
}

test('mobile startup requests playback and primes/resumes synchronously before downloads', async t => {
  const { audio, calls, session, errors } = setup(t);
  const playing = audio.play('blueo');
  assert.equal(session.type, 'playback');
  assert.deepEqual(calls.slice(0, 3), ['resume', 'prime', 'fetch']);
  await playing;
  assert.equal(calls.filter(call => call === 'sound').length, 1);
  assert.equal(errors(), 0);
});

test('interrupted Safari audio resumes on the next gesture and mute prevents playback', async t => {
  const { audio, calls, interrupt } = setup(t);
  await audio.unlock();
  interrupt();
  await audio.play('pinko');
  assert.equal(calls.filter(call => call === 'resume').length, 2);
  audio.setEnabled(false);
  const count = calls.length;
  await audio.unlock();
  await audio.play('redo');
  assert.equal(calls.length, count);
});

test('temporary audio download failure can recover on a later tap', async t => {
  const { audio, calls, failFetch, errors } = setup(t);
  failFetch(true);
  await audio.play('blueo');
  assert.equal(errors(), 1);
  assert.equal(calls.includes('sound'), false);
  failFetch(false);
  await audio.play('blueo');
  assert.equal(calls.filter(call => call === 'sound').length, 1);
});
