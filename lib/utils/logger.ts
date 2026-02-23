/**
 * Minimal structured JSON logging utility for SOC 2 / SIEM compliance.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

interface LogPayload {
    event: string;
    message?: string;
    [key: string]: any;
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
        console.log(formatLog('INFO', payload));
    },
    warn: (payload: LogPayload) => {
        console.warn(formatLog('WARN', payload));
    },
    error: (payload: LogPayload) => {
        console.error(formatLog('ERROR', payload));
    },
    audit: (payload: LogPayload) => {
        // Audit logs usually map to info level in standard streams, but are tagged as 'AUDIT'
        console.log(formatLog('AUDIT', payload));
    }
};
