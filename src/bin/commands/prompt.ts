import { submitHeadlessPrompt } from '../../services/headlessPromptService';
import { ConfigLoader } from '../../utils/configLoader';

export interface PromptCommandOptions {
    text: string;
    model?: string;
    timeoutMinutes: string;
}

function normalizeModel(model: string | undefined): string | undefined {
    if (!model || model.trim().length === 0) return undefined;
    if (model.trim().toLowerCase() === 'auto') return undefined;
    return model.trim();
}

function parseTimeoutMinutes(raw: string): number {
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 3;
    }
    return parsed;
}

export async function promptAction(opts: PromptCommandOptions): Promise<void> {
    // Load optional workspace config (no Telegram required)
    try {
        ConfigLoader.loadCdpOnly();
    } catch {
        /* workspace base dir has sensible defaults */
    }

    const text = opts.text?.trim() ?? '';
    const model = normalizeModel(opts.model);
    const timeoutMs = Math.round(parseTimeoutMinutes(opts.timeoutMinutes) * 60 * 1000);

    const result = await submitHeadlessPrompt({ text, model, timeoutMs });

    if (result.ok) {
        console.log(JSON.stringify({
            ok: true,
            workspace: result.workspace ?? null,
        }));
        process.exitCode = 0;
        return;
    }

    if (result.message) {
        console.error(result.message);
    }
    process.exitCode = result.exitCode;
}
