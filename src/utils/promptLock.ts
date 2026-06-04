import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const PROMPT_LOCK_FILE = path.join(os.homedir(), '.remoat', '.prompt.lock');

function isProcessRunning(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

export interface PromptLockHandle {
    release: () => void;
}

/**
 * Acquire a cross-process lock for headless prompt submission.
 * Fails fast if another live process holds the lock (does not kill the holder).
 */
export function acquirePromptLock(): PromptLockHandle | null {
    fs.mkdirSync(path.dirname(PROMPT_LOCK_FILE), { recursive: true });

    if (fs.existsSync(PROMPT_LOCK_FILE)) {
        const content = fs.readFileSync(PROMPT_LOCK_FILE, 'utf-8').trim();
        const existingPid = parseInt(content, 10);
        if (!isNaN(existingPid) && existingPid !== process.pid && isProcessRunning(existingPid)) {
            return null;
        }
        try {
            fs.unlinkSync(PROMPT_LOCK_FILE);
        } catch {
            /* ignore stale lock cleanup failure */
        }
    }

    fs.writeFileSync(PROMPT_LOCK_FILE, String(process.pid), 'utf-8');

    const release = (): void => {
        try {
            if (fs.existsSync(PROMPT_LOCK_FILE)) {
                const content = fs.readFileSync(PROMPT_LOCK_FILE, 'utf-8').trim();
                if (content === String(process.pid)) {
                    fs.unlinkSync(PROMPT_LOCK_FILE);
                }
            }
        } catch {
            /* ignore release errors */
        }
    };

    return { release };
}

/** @internal Test helper */
export function getPromptLockFilePath(): string {
    return PROMPT_LOCK_FILE;
}
