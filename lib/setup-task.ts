import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface SetupTaskStatus {
    taskId: string;
    status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
    logs: string[];
    error?: string;
    startTime: string;
    endTime?: string;
}

const STATUS_FILE = path.join(os.tmpdir(), 'vaultcred_setup_progress.json');

export async function getTaskStatus(): Promise<SetupTaskStatus> {
    try {
        const content = await fs.readFile(STATUS_FILE, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return {
            taskId: 'default',
            status: 'IDLE',
            logs: [],
            startTime: new Date().toISOString()
        };
    }
}

export async function updateTaskStatus(update: Partial<SetupTaskStatus>) {
    const current = await getTaskStatus();
    const next = { ...current, ...update };
    try {
        await fs.writeFile(STATUS_FILE, JSON.stringify(next), 'utf8');
    } catch (e) {
        // Failed to write status file
    }
}

export async function appendTaskLog(log: string) {
    const current = await getTaskStatus();
    current.logs.push(`[${new Date().toLocaleTimeString()}] ${log}`);
    // Keep only last 100 logs to prevent file bloat
    if (current.logs.length > 100) current.logs.shift();
    await updateTaskStatus({ logs: current.logs });
}

export async function clearTaskStatus() {
    try {
        await fs.unlink(STATUS_FILE);
    } catch (e) {
        // Ignore if file doesn't exist
    }
}
