type AnalyticsEventName =
  | 'translation_started'
  | 'translation_corpus_loaded'
  | 'translation_exact_match'
  | 'translation_json_match'
  | 'translation_no_match'
  | 'translation_completed'
  | 'translation_error'
  | 'translation_feedback_opened'
  | 'translation_feedback_submitted'
  | 'voice_input_started'
  | 'voice_input_completed'
  | 'voice_input_failed';

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined | null;
}

function emitToConsole(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window !== 'undefined') {
    const analyticsWindow = window as Window & { __tmAnalytics?: Array<{ eventName: AnalyticsEventName; properties: AnalyticsProperties }> };
    const existing = analyticsWindow.__tmAnalytics;
    if (!existing) {
      analyticsWindow.__tmAnalytics = [];
    }
    analyticsWindow.__tmAnalytics?.push({ eventName, properties });
  }
  console.info(`[analytics] ${eventName}`, properties);
}

export function trackTranslationEvent(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  emitToConsole(eventName, properties);
}
