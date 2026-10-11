// Match DynaDraw's production-only, once-per-page-load feature analytics.
// Fixed names only; never attach player information, recordings, or game state.
export const PRODUCTION_HOSTNAME = 'snails-race.chummy-bard-6128.chatgpt.site';
export const analyticsEvents = [
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
      if (hostname() !== PRODUCTION_HOSTNAME || sent.has(event) || !analyticsEvents.includes(event)) return;
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
