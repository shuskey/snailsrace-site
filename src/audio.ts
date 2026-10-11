const names = ['blueo', 'pinko', 'yellowo', 'orangeo', 'greeno', 'redo', 'blueg', 'pinkg', 'yellowg', 'orangeg', 'greeng', 'redg', 'iwings', 'ruleson', 'rulesoff', 'beboop', 'return'];
export class GameAudio {
  enabled = true;
  private volume = 0.8;
  private context?: AudioContext;
  private gain?: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private loading?: Promise<void>;
  private active = new Map<string, AudioBufferSourceNode>();
  constructor(private onError: () => void, private onReady: () => void = () => {}) {}
  setVolume(volume: number) {
    this.volume = volume;
    if (this.gain) this.gain.gain.value = this.enabled ? volume : 0;
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.setVolume(this.volume);
  }
  // Invoked synchronously by a gesture so Safari can unlock the context.
  async unlock() {
    if (!this.enabled) return;
    try {
      // Web Audio's default ambient session follows the iOS Silent switch.
      // Request media playback where supported, retaining the game's mute button.
      try {
        const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
        if (session) session.type = 'playback';
      } catch { /* Optional API; older browsers still use normal Web Audio. */ }
      let created = false;
      if (!this.context) {
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.gain.value = this.enabled ? this.volume : 0;
        this.gain.connect(this.context.destination);
        created = true;
      }
      // Safari can report "interrupted" after locking the device or switching apps.
      // Both resume and the initial source.start must happen before the first await.
      const needsResume = this.context.state !== 'running';
      const resumed = needsResume ? this.context.resume() : Promise.resolve();
      if (created || needsResume) {
        const silent = this.context.createBufferSource();
        silent.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
        silent.connect(this.context.destination);
        silent.onended = () => silent.disconnect();
        silent.start();
      }
      this.loading ??= Promise.all(names.map(async name => {
        if (this.buffers.has(name)) return;
        const response = await fetch(`${import.meta.env?.BASE_URL ?? '/'}assets/audio/${name}.wav`);
        if (!response.ok) throw new Error(`Audio unavailable: ${name}`);
        this.buffers.set(name, await this.context!.decodeAudioData(await response.arrayBuffer()));
      })).then(() => {}).catch(error => {
        this.loading = undefined; // A later tap can retry a temporary network failure.
        throw error;
      });
      await Promise.all([resumed, this.loading]);
      this.onReady();
    } catch {
      this.onError();
    }
  }
  private generation = 0;
  stop() {
    this.generation++;
    for (const source of this.active.values()) source.stop();
    this.active.clear();
  }
  async play(name: string) {
    if (!this.enabled) return;
    const generation = this.generation;
    await this.unlock();
    if (!this.enabled || generation !== this.generation || !this.context || !this.gain || this.active.has(name)) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gain);
      source.onended = () => {
        source.disconnect();
        if (this.active.get(name) === source) this.active.delete(name);
      };
      source.start();
      this.active.set(name, source);
    } catch { this.onError(); }
  }
}
