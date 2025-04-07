/**
 * Debug logging utility for E2E tests
 * 
 * Logging levels:
 * - 0: No logging (silent)
 * - 1: Errors only
 * - 2: Warnings and errors
 * - 3: Info, warnings, and errors
 * - 4: Debug (verbose) - includes all messages
 */

// Default log level can be overridden by setting process.env.E2E_LOG_LEVEL
// For example: E2E_LOG_LEVEL=4 npm run test:e2e:fast
const DEFAULT_LOG_LEVEL = 3;

type LogLevel = 0 | 1 | 2 | 3 | 4;
type LogType = 'error' | 'warn' | 'info' | 'debug';

/**
 * Get current log level from environment or use default
 */
export function getLogLevel(): LogLevel {
  const envLogLevel = process.env.E2E_LOG_LEVEL;
  if (envLogLevel && !isNaN(Number(envLogLevel))) {
    const level = Number(envLogLevel);
    if (level >= 0 && level <= 4) {
      return level as LogLevel;
    }
  }
  return DEFAULT_LOG_LEVEL;
}

/**
 * Debug logging function that only outputs if the current log level is high enough
 * 
 * @param message The message or object to log
 * @param type The type of log message (affects minimum level required to show)
 * @param forceLog Whether to force logging regardless of log level
 */
export function debugLog(
  message: string | Error | unknown,
  type: LogType = 'info',
  forceLog = false
): void {
  const currentLevel = getLogLevel();
  if (forceLog || shouldLog(currentLevel, type)) {
    const prefix = getPrefix(type);
    
    if (message instanceof Error) {
      console[type === 'error' ? 'error' : 'log'](
        `${prefix} ${message.message}\n${message.stack}`
      );
    } else if (typeof message === 'object' && message !== null) {
      console[type === 'error' ? 'error' : 'log'](
        `${prefix}`,
        message
      );
    } else {
      console[type === 'error' ? 'error' : 'log'](
        `${prefix} ${message}`
      );
    }
  }
}

/**
 * Determine if a message should be logged based on its type and current log level
 */
function shouldLog(currentLevel: LogLevel, type: LogType): boolean {
  switch (type) {
    case 'error': return currentLevel >= 1;
    case 'warn': return currentLevel >= 2;
    case 'info': return currentLevel >= 3;
    case 'debug': return currentLevel >= 4;
    default: return false;
  }
}

/**
 * Get prefix for log message based on type
 */
function getPrefix(type: LogType): string {
  const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  switch (type) {
    case 'error': return `[${timestamp}] 🔴 ERROR:`;
    case 'warn': return `[${timestamp}] 🟠 WARN:`;
    case 'info': return `[${timestamp}] 🔵 INFO:`;
    case 'debug': return `[${timestamp}] 🟣 DEBUG:`;
    default: return `[${timestamp}]`;
  }
}

// Convenience methods for different log types
export const errorLog = (message: string | Error | unknown, forceLog = false) => 
  debugLog(message, 'error', forceLog);

export const warnLog = (message: string | Error | unknown, forceLog = false) => 
  debugLog(message, 'warn', forceLog);

export const infoLog = (message: string | Error | unknown, forceLog = false) => 
  debugLog(message, 'info', forceLog);

export const verboseLog = (message: string | Error | unknown, forceLog = false) => 
  debugLog(message, 'debug', forceLog);