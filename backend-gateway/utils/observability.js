import logger from "./logger.js";

export const initObservability = () => {
    if (process.env.SENTRY_DSN) {
        logger.info("[Observability] Sentry DSN detected. Sentry SDK initialization placeholder.");
    }
};

export const timingMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            logger.warn(`[SlowRequest] ${req.method} ${req.originalUrl} took ${duration}ms`);
        }
    });
    next();
};

export const captureException = (err, context = {}) => {
    logger.error(`[ExceptionCaptured] ${err.message}`, { stack: err.stack, ...context });
    if (process.env.SENTRY_DSN) {
        // Placeholder for Sentry.captureException(err)
    }
};
