import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring — sample 20% of transactions
  tracesSampleRate: 0.2,

  // Session replay — capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Don't send PII
  sendDefaultPii: false,

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /ResizeObserver loop/,
    /Non-Error promise rejection/,
    // Network errors users can't control
    /Failed to fetch/,
    /NetworkError/,
    /Load failed/,
    // Camera permission errors (expected)
    /NotAllowedError/,
    /Permission denied/,
  ],

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== "production") return null;
    return event;
  },
});
