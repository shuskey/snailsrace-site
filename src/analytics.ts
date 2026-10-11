// Match DynaDraw's production-only, once-per-page-load feature analytics.
// Fixed names only; never attach player information, recordings, or game state.
export const PRODUCTION_HOSTNAME = 'snails-race.chummy-bard-6128.chatgpt.site';
export const firstPlaceEvents = {
  blue: 'Blue first place', pink: 'Pink first place', yellow: 'Yellow first place',
  orange: 'Orange first place', green: 'Green first place', red: 'Red first place',
} as const;
export const analyticsEvents = [
  ...Object.values(firstPlaceEvents),
  'Started playing', 'Finished race', 'Restarted game',
  'Used auto roll', 'Used auto move', 'Used demo mode',
  'Selected Classic', 'Selected Original', 'Selected Neon',
  'Disabled rules', 'Muted sound', 'Audio failed',
] as const;
export type AnalyticsEvent = typeof analyticsEvents[number];
type Plausible = (name: AnalyticsEvent) => void;

export function createTracker(hostname: () => string, transport: () => Plausible | undefined) {
  const sent = new Set<AnalyticsEvent>();
  return (event: AnalyticsEvent) => {
    try {
      if (hostname() !== PRODUCTION_HOSTNAME || !analyticsEvents.includes(event)) return;
      // Winner events count races, including repeated wins without a page reload.
      const perRace = Object.values(firstPlaceEvents).some(winner => winner === event);
      if (!perRace && sent.has(event)) return;
      const plausible = transport();
      if (!plausible) return;
      plausible(event);
      sent.add(event);
    } catch { /* Analytics must never interrupt the game. */ }
  };
}
export const track = createTracker(
  () => window.location.hostname,
  () => (window as Window & { plausible?: Plausible }).plausible,
);
