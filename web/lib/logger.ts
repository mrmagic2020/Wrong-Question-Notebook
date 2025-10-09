/**
 * Centralized logging utility for the application
 * Provides structured logging with different severity levels
 * In production, this can be extended to send logs to external services
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    
    if (this.isDevelopment) {
      // Simple format for development
      const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
      const errorStr = error ? `\n${error.stack}` : '';
      return `[${timestamp}] ${level}: ${message}${contextStr}${errorStr}`;
    }
    
    // Structured JSON format for production (easier to parse by log aggregators)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      }),
    });
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    // In development, use console methods for better formatting
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
      }
      return;
    }

    // In production, use console.log for all levels
    // External log aggregators will parse the JSON and handle severity
    console.log(formattedLog);
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error 
      ? error 
      : error 
        ? new Error(String(error))
        : undefined;
    
    this.log(LogLevel.ERROR, message, context, errorObj);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, userId?: string): void {
    this.info(`API Request: ${method} ${path}`, {
      component: 'API',
      action: 'request',
      userId,
    });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, durationMs?: number): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${path} - ${status}`, {
      component: 'API',
      action: 'response',
      status,
      ...(durationMs && { durationMs }),
    });
  }

  /**
   * Log database query
   */
  dbQuery(query: string, durationMs?: number, error?: Error): void {
    if (error) {
      this.error(`Database query failed: ${query}`, error, {
        component: 'Database',
        action: 'query',
        ...(durationMs && { durationMs }),
      });
    } else {
      this.debug(`Database query: ${query}`, {
        component: 'Database',
        action: 'query',
        ...(durationMs && { durationMs }),
      });
    }
  }

  /**
   * Log security event
   */
  security(message: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Security: ${message}`, {
      component: 'Security',
      severity,
      ...context,
    });
  }

  /**
   * Log user activity
   */
  userActivity(action: string, userId: string, details?: LogContext): void {
    this.info(`User activity: ${action}`, {
      component: 'UserActivity',
      userId,
      action,
      ...details,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
