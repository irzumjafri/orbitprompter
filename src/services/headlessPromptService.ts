import { CdpService } from './cdpService';
import { RESPONSE_SELECTORS } from './responseMonitor';
import { isAnyCdpPortResponding } from '../utils/cdpAvailability';
import { acquirePromptLock } from '../utils/promptLock';

export type PromptExitCode = 0 | 1 | 2 | 3 | 4;

export interface HeadlessPromptRequest {
    text: string;
    model?: string;
    timeoutMs: number;
}

export interface HeadlessPromptResult {
    ok: boolean;
    exitCode: PromptExitCode;
    message?: string;
    workspace?: string;
}

export interface HeadlessPromptDeps {
    isCdpAvailable?: () => Promise<boolean>;
    createCdpService?: () => CdpService;
    acquireLock?: () => ReturnType<typeof acquirePromptLock>;
}

function fail(exitCode: PromptExitCode, message: string): HeadlessPromptResult {
    return { ok: false, exitCode, message };
}

function succeed(workspace: string | null): HeadlessPromptResult {
    return {
        ok: true,
        exitCode: 0,
        workspace: workspace ?? undefined,
    };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

/**
 * Returns true when the Antigravity agent is actively generating (stop button visible).
 */
export async function isAgentGenerating(cdp: CdpService): Promise<boolean> {
    const contexts = cdp.getContexts();
    for (const ctx of contexts) {
        try {
            const res = await cdp.call('Runtime.evaluate', {
                expression: RESPONSE_SELECTORS.STOP_BUTTON,
                returnByValue: true,
                contextId: ctx.id,
            });
            if (res?.result?.value?.isGenerating) {
                return true;
            }
        } catch {
            /* try next context */
        }
    }
    return false;
}

/**
 * Submit a prompt to Antigravity via CDP without the Telegram bot.
 */
export async function submitHeadlessPrompt(
    request: HeadlessPromptRequest,
    deps: HeadlessPromptDeps = {},
): Promise<HeadlessPromptResult> {
    const isCdpAvailable = deps.isCdpAvailable ?? (() => isAnyCdpPortResponding());
    const createCdpService = deps.createCdpService ?? (() =>
        new CdpService({ cdpCallTimeout: 15000, maxReconnectAttempts: 0 }));
    const acquireLock = deps.acquireLock ?? acquirePromptLock;

    if (!request.text.trim()) {
        return fail(1, 'Prompt text must not be empty.');
    }

    if (!(await isCdpAvailable())) {
        return fail(2, 'CDP not available. Ignite Antigravity first (or run orbitprompter open).');
    }

    const lock = acquireLock();
    if (!lock) {
        return fail(1, 'Another prompt submission is in progress.');
    }

    const cdp = createCdpService();
    try {
        try {
            await withTimeout(
                (async () => {
                    await cdp.discoverTarget();
                    await cdp.connect();
                })(),
                request.timeoutMs,
                'CDP connect',
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('CDP target not found')) {
                return fail(3, 'Antigravity workbench not found.');
            }
            if (msg.includes('timed out')) {
                return fail(4, `Submit failed: ${msg}`);
            }
            return fail(3, `Antigravity UI not ready: ${msg}`);
        }

        if (await isAgentGenerating(cdp)) {
            return fail(1, 'Workspace busy: agent is already generating.');
        }

        if (request.model) {
            let modelResult;
            try {
                modelResult = await withTimeout(
                    cdp.setUiModel(request.model),
                    request.timeoutMs,
                    'Model switch',
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return fail(4, `Submit failed: model switch ${msg}`);
            }
            if (!modelResult.ok) {
                return fail(4, `Submit failed: ${modelResult.error ?? 'model switch failed'}`);
            }
        }

        let injectResult;
        try {
            injectResult = await withTimeout(
                cdp.injectMessage(request.text),
                request.timeoutMs,
                'Prompt inject',
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return fail(4, `Submit failed: ${msg}`);
        }

        if (!injectResult.ok) {
            return fail(4, `Submit failed: ${injectResult.error ?? 'message injection failed'}`);
        }

        return succeed(cdp.getCurrentWorkspaceName());
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return fail(1, msg);
    } finally {
        await cdp.disconnect().catch(() => {});
        lock.release();
    }
}
