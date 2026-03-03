/**
 * Minimal structured JSON logging utility for SOC 2 / SIEM compliance.
 * All logging is silenced in production to prevent console output.
 * To enable logging, set LOG_LEVEL=debug in the environment.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

interface LogPayload {
    event: string;
    message?: string;
    [key: string]: any;
}

function isLoggingEnabled(): boolean {
    return process.env.LOG_LEVEL === 'debug';
}

function formatLog(level: LogLevel, payload: LogPayload) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        ...payload
    };
    return JSON.stringify(logEntry);
}

export const logger = {
    info: (payload: LogPayload) => {
        if (isLoggingEnabled()) console.log(formatLog('INFO', payload));
    },
    warn: (payload: LogPayload) => {
        if (isLoggingEnabled()) console.warn(formatLog('WARN', payload));
    },
    error: (payload: LogPayload) => {
        if (isLoggingEnabled()) console.error(formatLog('ERROR', payload));
    },
    audit: (payload: LogPayload) => {
        if (isLoggingEnabled()) console.log(formatLog('AUDIT', payload));
    }
};
