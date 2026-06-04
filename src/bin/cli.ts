#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { version } from '../../package.json';
import { startAction } from './commands/start';
import { doctorAction } from './commands/doctor';
import { setupAction } from './commands/setup';
import { openAction } from './commands/open';
import { promptAction } from './commands/prompt';
import { ConfigLoader } from '../utils/configLoader';
import { printWelcome } from './welcome';

const program = new Command()
    .name('orbitprompter')
    .description('Control your AI coding assistant from Telegram')
    .version(version)
    .option('--verbose', 'Show debug-level logs')
    .option('--quiet', 'Only show errors');

// Default action: no subcommand → start or setup
program.action(async () => {
    const hasConfig = ConfigLoader.configExists();
    const hasEnv = fs.existsSync(path.resolve(process.cwd(), '.env'));

    if (!hasConfig && !hasEnv) {
        printWelcome();
        return setupAction();
    } else {
        return startAction(program.opts(), program);
    }
});

program
    .command('start')
    .description('Start the Telegram bot')
    .action((_opts, cmd) => startAction(cmd.parent.opts(), cmd.parent));

program
    .command('doctor')
    .description('Check environment and dependencies')
    .option('--prompt-ready', 'Check CDP connectivity and chat input readiness (no Telegram config required)')
    .action((opts) => doctorAction(opts));

program
    .command('setup')
    .description('Interactive setup wizard')
    .action(setupAction);

program
    .command('open')
    .description('Open Antigravity with CDP enabled (auto-selects available port)')
    .action(openAction);

program
    .command('prompt')
    .description('Submit a prompt to Antigravity via CDP (headless, no bot)')
    .requiredOption('--text <string>', 'Prompt body to inject')
    .option('--model <modelId>', 'Switch Antigravity model before submit (omit for Auto)')
    .option('--timeout-minutes <N>', 'Max minutes for connect + submit', '3')
    .action((opts) => promptAction(opts));

program.parse();
