import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for React error tracking
 * Only active if VITE_SENTRY_DSN is configured
 */
export const initSentry = () => {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

    if (!sentryDsn || sentryDsn.trim() === "") {
        console.log("⚠️  Sentry not configured (VITE_SENTRY_DSN not set)");
        return;
    }

    Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE || "development",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // Filter sensitive data
        beforeSend(event, hint) {
            // Remove sensitive data from breadcrumbs
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
                    if (breadcrumb.data?.token) {
                        breadcrumb.data.token = "[FILTERED]";
                    }
                    if (breadcrumb.data?.password) {
                        breadcrumb.data.password = "[FILTERED]";
                    }
                    return breadcrumb;
                });
            }
            return event;
        },
    });

    console.log("✅ Sentry initialized for error tracking");
};

export default { initSentry };
