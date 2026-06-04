import * as http from 'http';
import { CDP_PORTS } from './cdpPorts';

/**
 * Check whether a single CDP debug port responds with a valid /json/list payload.
 */
export function isCdpPortResponding(port: number, timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(Array.isArray(parsed));
                } catch {
                    resolve(false);
                }
            });
        });
        req.on('error', () => resolve(false));
        req.setTimeout(timeoutMs, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Returns true if any Antigravity CDP port in the standard scan list is responding.
 */
export async function isAnyCdpPortResponding(timeoutMs = 2000): Promise<boolean> {
    for (const port of CDP_PORTS) {
        if (await isCdpPortResponding(port, timeoutMs)) {
            return true;
        }
    }
    return false;
}
