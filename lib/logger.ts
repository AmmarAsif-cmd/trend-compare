/**
 * Production-safe logger
 * Only logs in development, errors always logged
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  log(...args: any[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (isDevelopment) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    // Warnings are logged in production for debugging
    if (isDevelopment) {
      console.warn(...args);
    } else {
      // In production, only log warnings to error tracking (if configured)
      // For now, we'll suppress them but you can integrate with Sentry/etc here
    }
  }

  error(...args: any[]): void {
    // Errors are always logged, even in production
    console.error(...args);
  }

  debug(...args: any[]): void {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
}

export const logger = new Logger();

// Export individual methods for convenience
export const log = logger.log.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const debug = logger.debug.bind(logger);

