/**
 * Structured Logging with Request ID
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private formatLog(level: string, message: string, context?: LogContext, error?: Error): string {
    const logEntry: any = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return JSON.stringify(logEntry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    console.warn(this.formatLog('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    console.error(this.formatLog('error', message, context, error));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();

