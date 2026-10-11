const names = ['blueo', 'pinko', 'yellowo', 'orangeo', 'greeno', 'redo', 'blueg', 'pinkg', 'yellowg', 'orangeg', 'greeng', 'redg', 'iwings', 'ruleson', 'rulesoff', 'beboop', 'return'];
export class GameAudio {
  enabled = true;
  private volume = 0.8;
  private context?: AudioContext;
  private gain?: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private loading?: Promise<void>;
  private active = new Map<string, AudioBufferSourceNode>();
  constructor(private onError: () => void) {}
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
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.gain.value = this.enabled ? this.volume : 0;
        this.gain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      this.loading ??= Promise.all(names.map(async name => {
        const response = await fetch(`${import.meta.env.BASE_URL}assets/audio/${name}.wav`);
        if (!response.ok) throw new Error(`Audio unavailable: ${name}`);
        this.buffers.set(name, await this.context!.decodeAudioData(await response.arrayBuffer()));
      })).then(() => {});
      await this.loading;
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
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    this.active.set(name, source);
    source.onended = () => { if (this.active.get(name) === source) this.active.delete(name); };
    source.start();
  }
}
