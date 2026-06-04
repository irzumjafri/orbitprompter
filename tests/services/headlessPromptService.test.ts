import {
    submitHeadlessPrompt,
    isAgentGenerating,
    HeadlessPromptDeps,
} from '../../src/services/headlessPromptService';
import { CdpService } from '../../src/services/cdpService';

function createMockCdp(overrides: Partial<CdpService> = {}): CdpService {
    return {
        discoverTarget: jest.fn().mockResolvedValue('ws://test'),
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getCurrentWorkspaceName: jest.fn().mockReturnValue('my-project'),
        getContexts: jest.fn().mockReturnValue([{ id: 1, name: 'top', origin: '' }]),
        call: jest.fn().mockResolvedValue({ result: { value: { isGenerating: false } } }),
        setUiModel: jest.fn().mockResolvedValue({ ok: true, model: 'gemini-3-flash' }),
        injectMessage: jest.fn().mockResolvedValue({ ok: true, method: 'enter' }),
        ...overrides,
    } as unknown as CdpService;
}

function depsWithMockCdp(cdp: CdpService): HeadlessPromptDeps {
    return {
        isCdpAvailable: async () => true,
        acquireLock: () => ({ release: jest.fn() }),
        createCdpService: () => cdp,
    };
}

describe('headlessPromptService', () => {
    describe('submitHeadlessPrompt', () => {
        it('returns exit 2 when CDP is not available', async () => {
            const result = await submitHeadlessPrompt(
                { text: 'hello', timeoutMs: 5000 },
                { isCdpAvailable: async () => false },
            );
            expect(result).toEqual({
                ok: false,
                exitCode: 2,
                message: 'CDP not available. Ignite Antigravity first (or run orbitprompter open).',
            });
        });

        it('returns exit 1 when lock cannot be acquired', async () => {
            const result = await submitHeadlessPrompt(
                { text: 'hello', timeoutMs: 5000 },
                {
                    isCdpAvailable: async () => true,
                    acquireLock: () => null,
                },
            );
            expect(result.exitCode).toBe(1);
            expect(result.message).toContain('Another prompt submission is in progress');
        });

        it('returns exit 1 for empty text', async () => {
            const result = await submitHeadlessPrompt({ text: '   ', timeoutMs: 5000 });
            expect(result.exitCode).toBe(1);
            expect(result.message).toContain('empty');
        });

        it('returns exit 3 when workbench target is not found', async () => {
            const cdp = createMockCdp({
                discoverTarget: jest.fn().mockRejectedValue(new Error('CDP target not found on any port.')),
            });
            const result = await submitHeadlessPrompt(
                { text: 'hello', timeoutMs: 5000 },
                depsWithMockCdp(cdp),
            );
            expect(result.exitCode).toBe(3);
            expect(result.message).toBe('Antigravity workbench not found.');
            expect(cdp.disconnect).toHaveBeenCalled();
        });

        it('returns exit 1 when agent is already generating', async () => {
            const cdp = createMockCdp({
                call: jest.fn().mockResolvedValue({ result: { value: { isGenerating: true } } }),
            });
            const result = await submitHeadlessPrompt(
                { text: 'hello', timeoutMs: 5000 },
                depsWithMockCdp(cdp),
            );
            expect(result.exitCode).toBe(1);
            expect(result.message).toContain('Workspace busy');
        });

        it('returns exit 4 when model switch fails', async () => {
            const cdp = createMockCdp({
                setUiModel: jest.fn().mockResolvedValue({ ok: false, error: 'Model not found' }),
            });
            const result = await submitHeadlessPrompt(
                { text: 'hello', model: 'gemini-3-flash', timeoutMs: 5000 },
                depsWithMockCdp(cdp),
            );
            expect(result.exitCode).toBe(4);
            expect(result.message).toContain('Model not found');
        });

        it('returns exit 4 when inject fails', async () => {
            const cdp = createMockCdp({
                injectMessage: jest.fn().mockResolvedValue({ ok: false, error: 'Chat input field not found' }),
            });
            const result = await submitHeadlessPrompt(
                { text: 'hello', timeoutMs: 5000 },
                depsWithMockCdp(cdp),
            );
            expect(result.exitCode).toBe(4);
            expect(result.message).toContain('Chat input field not found');
        });

        it('returns exit 0 on successful inject', async () => {
            const cdp = createMockCdp();
            const release = jest.fn();
            const result = await submitHeadlessPrompt(
                { text: 'Say hello', timeoutMs: 5000 },
                {
                    ...depsWithMockCdp(cdp),
                    acquireLock: () => ({ release }),
                },
            );
            expect(result).toEqual({ ok: true, exitCode: 0, workspace: 'my-project' });
            expect(cdp.injectMessage).toHaveBeenCalledWith('Say hello');
            expect(cdp.disconnect).toHaveBeenCalled();
            expect(release).toHaveBeenCalled();
        });

        it('skips setUiModel when model is omitted', async () => {
            const cdp = createMockCdp();
            await submitHeadlessPrompt(
                { text: 'hello', timeoutMs: 5000 },
                depsWithMockCdp(cdp),
            );
            expect(cdp.setUiModel).not.toHaveBeenCalled();
        });

        it('calls setUiModel when model is provided', async () => {
            const cdp = createMockCdp();
            await submitHeadlessPrompt(
                { text: 'hello', model: 'claude-opus-4.6-thinking', timeoutMs: 5000 },
                depsWithMockCdp(cdp),
            );
            expect(cdp.setUiModel).toHaveBeenCalledWith('claude-opus-4.6-thinking');
        });
    });

    describe('isAgentGenerating', () => {
        it('returns true when stop button script reports generating', async () => {
            const cdp = createMockCdp({
                call: jest.fn().mockResolvedValue({ result: { value: { isGenerating: true } } }),
            });
            expect(await isAgentGenerating(cdp)).toBe(true);
        });

        it('returns false when stop button script reports idle', async () => {
            const cdp = createMockCdp();
            expect(await isAgentGenerating(cdp)).toBe(false);
        });
    });
});
