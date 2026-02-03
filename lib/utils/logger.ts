/**
 * Logger utility that only logs in development mode
 * Use this instead of raw console.log/warn statements
 *
 * console.error is NOT wrapped because error logging is important
 * for crash reporting services even in production
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Log debug information (only in development)
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log info (only in development)
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log debug with a prefix (only in development)
   */
  debug: (prefix: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[${prefix}]`, ...args);
    }
  },

  /**
   * Log errors - ALWAYS logs, even in production
   * Important for crash reporting and debugging production issues
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

export default logger;
