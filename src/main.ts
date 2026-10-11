import './style.css';
import { colors, createGame, FINISH, move, restart, roll } from './game';
import { GameAudio } from './audio';
import { AutoPlay } from './autoplay';
import { track, type AnalyticsEvent } from './analytics';
const state = createGame();
const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const board = get('board');
const status = get('status');
const rollButton = get<HTMLButtonElement>('roll');
const rulesButton = get<HTMLButtonElement>('rules');
const soundButton = get<HTMLButtonElement>('sound');
const autoRoll = get<HTMLInputElement>('auto-roll');
const autoMove = get<HTMLInputElement>('auto-move');
const boardTheme = get<HTMLSelectElement>('board-theme');
const autoplay = new AutoPlay(() => state, () => ({ roll: autoRoll.checked, move: autoMove.checked }), rollDie, () => moveSnail(state.die));
const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const themeAsset = (color: string, kind: 'snail' | 'dice') => {
  if (boardTheme.value === 'neon') return asset(`neon/${color}${kind}.${kind === 'snail' ? 'png' : 'svg'}`);
  if (boardTheme.value === 'original') return asset(`original/${color}${kind}.svg`);
  return asset(`${color}${kind}.gif`);
};
let audioFailed = false;
const audio = new GameAudio(() => {
  if (!audioFailed) {
    audioFailed = true;
    track('Audio failed');
    soundButton.textContent = 'Sound unavailable';
    soundButton.title = 'Audio could not load. The game still works; reload to retry.';
  }
});
const snails = colors.map((color, index) => {
  const lane = document.createElement('div');
  lane.className = `lane lane-${color}`;
  lane.style.setProperty('--lane-color', ['#1659b5', '#e62e85', '#f3cf16', '#ee8818', '#209749', '#ce3028'][index]);
  for (let cell = 0; cell <= FINISH; cell++) {
    const tile = document.createElement('span');
    tile.className = `tile${cell === FINISH ? ' finish-tile' : ''}`;
    tile.setAttribute('aria-hidden', 'true');
    lane.append(tile);
  }
  const snail = document.createElement('button');
  snail.className = 'snail';
  snail.innerHTML = `<img src="${themeAsset(color, 'snail')}" alt="" draggable="false" /><span class="snail-number" aria-hidden="true">${index + 1}</span><span class="finish-badge" aria-hidden="true"></span>`;
  snail.addEventListener('click', () => moveSnail(index));
  lane.append(snail);
  board.append(lane);
  return snail;
});
function render(message?: string) {
  get<HTMLImageElement>('die').src = themeAsset(colors[state.die], 'dice');
  get<HTMLImageElement>('die').alt = capitalize(colors[state.die]);
  rulesButton.setAttribute('aria-pressed', String(state.rules));
  rulesButton.querySelector('span')!.textContent = `Rules ${state.rules ? 'on' : 'off'}`;
  get<HTMLImageElement>('rules-icon').src = asset(`rules${state.rules ? 'on' : 'off'}.gif`);
  rollButton.setAttribute('aria-disabled', String(state.rules && state.phase === 'move'));
  snails.forEach((snail, index) => {
    const finished = state.positions[index] === FINISH;
    snail.style.setProperty('--position', String(state.positions[index]));
    snail.classList.toggle('expected', state.rules && state.phase === 'move' && state.die === index);
    snail.classList.toggle('finished', finished);
    snail.setAttribute('aria-label', `${capitalize(colors[index])} snail, ${finished ? 'finished' : `step ${state.positions[index]} of ${FINISH}`}. Move with ${index + 1}.`);
    snail.querySelector('.finish-badge')!.textContent = finished ? String(state.finishOrder.indexOf(index) + 1) : '';
  });
  get('finish-count').textContent = `${state.finishOrder.length} / 6 home`;
  status.textContent = message ?? (state.rules ? 'Roll the die to start the race.' : 'Free play: roll or move any snail.');
  autoplay.schedule();
}
function applyTheme() {
  document.documentElement.dataset.boardTheme = boardTheme.value;
  snails.forEach((snail, index) => {
    snail.querySelector('img')!.src = themeAsset(colors[index], 'snail');
    snail.parentElement!.style.setProperty('--lane-color', (boardTheme.value === 'neon'
      ? ['#2589ff', '#ff48c4', '#ffec32', '#ff941f', '#55ff53', '#ff3939']
      : ['#1659b5', '#e62e85', '#f3cf16', '#ee8818', '#209749', '#ce3028'])[index]);
  });
  get<HTMLImageElement>('die').src = themeAsset(colors[state.die], 'dice');
  get<HTMLImageElement>('mascot').src = themeAsset('green', 'snail');
  get<HTMLImageElement>('auto-roll-icon').src = themeAsset('blue', 'dice');
  get<HTMLImageElement>('auto-move-icon').src = themeAsset('green', 'snail');
}
boardTheme.addEventListener('change', () => {
  applyTheme();
  const events: Record<string, AnalyticsEvent> = { classic: 'Selected Classic', original: 'Selected Original', neon: 'Selected Neon' };
  track(events[boardTheme.value]);
});
function rollDie() {
  if (roll(state)) {
    track('Started playing');
    void audio.play(`${colors[state.die]}o`);
    render(`${capitalize(colors[state.die])}! ${state.positions[state.die] === FINISH ? 'Tap its finished snail to complete the turn.' : 'Move the matching snail.'}`);
  } else {
    void audio.play('beboop');
    render(`Move the ${colors[state.die]} snail before rolling again.`);
  }
}
function moveSnail(index: number) {
  const result = move(state, index);
  if (result === 'blocked') {
    void audio.play('beboop');
    render(state.phase === 'roll' ? 'Roll the die before moving a snail.' : `The die is ${colors[state.die]}. Move that snail.`);
    return;
  }
  track('Started playing');
  void audio.play(result === 'won' ? 'iwings' : `${colors[index]}g`);
  if (state.finishOrder.length === colors.length) {
    if (result === 'won') track('Finished race');
    render('Everyone made it! Start a new game to race again.');
  } else if (result === 'won') {
    render(`${capitalize(colors[index])} finished ${state.finishOrder.length === 1 ? 'first' : `in place ${state.finishOrder.length}`}! Keep racing — roll again.`);
  } else {
    render(`${capitalize(colors[index])}${result === 'finished' ? ' is already home' : ' moved one step'}. ${state.rules ? 'Roll again!' : 'Keep playing!'} `);
  }
}
rollButton.addEventListener('click', rollDie);
rulesButton.addEventListener('click', () => {
  state.rules = !state.rules;
  if (!state.rules) track('Disabled rules');
  void audio.play(state.rules ? 'ruleson' : 'rulesoff');
  render(state.rules ? (state.phase === 'move' ? `Rules on. Move the ${colors[state.die]} snail, then roll again.` : 'Rules on. Roll the die, then move the matching snail.') : 'Free play: roll or move any snail.');
});
get('restart').addEventListener('click', () => {
  track('Restarted game');
  autoplay.cancel();
  audio.stop();
  restart(state);
  void audio.play('return');
  render();
});
for (const control of [autoRoll, autoMove]) {
  control.addEventListener('change', () => {
    if (control.checked) track(control === autoRoll ? 'Used auto roll' : 'Used auto move');
    if (autoRoll.checked && autoMove.checked) track('Used demo mode');
    if (audio.enabled && (autoRoll.checked || autoMove.checked)) void audio.unlock();
    autoplay.schedule();
  });
}
soundButton.addEventListener('click', () => {
  audio.setEnabled(!audio.enabled);
  if (!audio.enabled) track('Muted sound');
  if (audio.enabled) void audio.unlock();
  else audio.stop();
  soundButton.textContent = audio.enabled ? (audioFailed ? 'Sound unavailable' : 'Sound on') : 'Sound off';
  soundButton.setAttribute('aria-pressed', String(audio.enabled));
});
get<HTMLInputElement>('volume').addEventListener('input', event => {
  audio.setVolume(Number((event.target as HTMLInputElement).value) / 100);
});
document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || target.matches('input, textarea, select, [contenteditable="true"]')) return;
  // Keep Space available after a snail click, which leaves that button focused.
  // Other controls retain their normal Space activation (mute, reset, etc.).
  if (event.code === 'Space' && !target.closest('button:not(.snail):not(#roll), summary')) {
    event.preventDefault();
    rollDie();
  } else if (/^[1-6]$/.test(event.key)) {
    event.preventDefault();
    const index = Number(event.key) - 1;
    snails[index].focus();
    moveSnail(index);
  }
});
applyTheme();
render();
