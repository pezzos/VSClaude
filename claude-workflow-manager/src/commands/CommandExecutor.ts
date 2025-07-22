import * as vscode from 'vscode';
import * as cp from 'child_process';
import { ClaudeCommand } from '../types';
import { OutputLogProvider } from '../providers/OutputLogProvider';

export class CommandExecutor {
    private outputLogProvider: OutputLogProvider | undefined;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        // Create dedicated OutputChannel for Claude Workflow Manager logs
        this.outputChannel = vscode.window.createOutputChannel('Claude Workflow Manager');
        console.log('🔧 CommandExecutor: OutputChannel created for real-time logging');
    }

    setOutputLogProvider(provider: OutputLogProvider): void {
        this.outputLogProvider = provider;
    }

    private getTimeoutForCommand(command: string): number {
        console.log(`🕒 Determining timeout for command: ${command}`);
        
        // Commands that require very long timeouts (10 minutes)
        const longCommands = [
            'Init-Project',
            'Plan-Epics', 
            'Plan-stories',
            'Implement',
            'Plan-Ticket'
        ];
        
        // Commands that require medium timeouts (5 minutes)
        const mediumCommands = [
            'Select-Stories',
            'Start-Story',
            'Complete-Story',
            'Complete-Epic',
            'Test-design',
            'Validate-Ticket',
            'Review-Ticket'
        ];
        
        if (longCommands.some(cmd => command.includes(cmd))) {
            console.log(`⏱️ Using LONG timeout (10 minutes) for: ${command}`);
            return 600000; // 10 minutes
        }
        
        if (mediumCommands.some(cmd => command.includes(cmd))) {
            console.log(`⏱️ Using MEDIUM timeout (5 minutes) for: ${command}`);
            return 300000; // 5 minutes
        }
        
        console.log(`⏱️ Using DEFAULT timeout (3 minutes) for: ${command}`);
        return 180000; // 3 minutes (increased from 60s default)
    }

    async executeCommand(command: string, showProgress: boolean = true, maxRetries: number = 2): Promise<boolean> {
        let lastError: Error | undefined;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!workspaceRoot) {
                    vscode.window.showErrorMessage('No workspace folder open');
                    return false;
                }

                // Add command to output log
                const logId = this.outputLogProvider?.addCommand(command);

                const progressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: `Executing: ${command}${attempt > 1 ? ` (Retry ${attempt - 1}/${maxRetries - 1})` : ''}`,
                    cancellable: true
                };

                let result: boolean;
                if (!showProgress) {
                    // Execute without progress notification
                    result = await this.executeClaudeProcess(command, workspaceRoot, logId);
                } else {
                    // Show progress notification
                    result = await vscode.window.withProgress(progressOptions, async (progress, token) => {
                        return this.executeClaudeProcess(command, workspaceRoot, logId, token);
                    });
                }

                if (result) {
                    if (attempt > 1) {
                        this.outputChannel.appendLine(`✅ Command succeeded on retry ${attempt - 1}`);
                        console.log(`✅ Command succeeded on retry ${attempt - 1}`);
                    }
                    return true;
                }

                // If command failed and we have retries left
                if (attempt < maxRetries) {
                    const retryDelay = Math.min(2000 * attempt, 10000); // Progressive delay, max 10s
                    this.outputChannel.appendLine(`⚠️ Command failed, retrying in ${retryDelay/1000}s... (Attempt ${attempt}/${maxRetries})`);
                    console.log(`⚠️ Command failed, retrying in ${retryDelay/1000}s... (Attempt ${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.outputChannel.appendLine(`❌ Error on attempt ${attempt}: ${lastError.message}`);
                console.error(`❌ Error on attempt ${attempt}:`, lastError);
                
                if (attempt < maxRetries) {
                    const retryDelay = Math.min(2000 * attempt, 10000);
                    this.outputChannel.appendLine(`🔄 Retrying in ${retryDelay/1000}s due to error...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        // All retries exhausted
        const message = lastError?.message || 'Command failed after all retries';
        this.outputChannel.appendLine(`❌ Command failed after ${maxRetries} attempts: ${message}`);
        vscode.window.showErrorMessage(`Failed to execute command after ${maxRetries} attempts: ${message}`);
        return false;
    }

    private async executeClaudeProcess(
        command: string, 
        workspaceRoot: string, 
        logId?: string,
        cancellationToken?: vscode.CancellationToken
    ): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const fullCommand = `claude -p "${command}"`;
            const commandTimeout = this.getTimeoutForCommand(command);
            const timeoutSeconds = Math.round(commandTimeout / 1000);
            
            console.log(`🚀 Executing command: ${fullCommand}`);
            console.log(`📁 Working directory: ${workspaceRoot}`);
            console.log(`⏰ Timeout set to: ${timeoutSeconds} seconds`);
            
            // Show OutputChannel for long-running commands
            this.outputChannel.show(true);
            this.outputChannel.appendLine(`🚀 Starting: ${command}`);
            this.outputChannel.appendLine(`📁 Working in: ${workspaceRoot}`);
            this.outputChannel.appendLine(`⏰ Timeout: ${timeoutSeconds}s`);
            this.outputChannel.appendLine('─'.repeat(50));

            // Spawn child process with captured stdio and anti-buffering environment
            const child = cp.spawn('claude', ['-p', command], {
                cwd: workspaceRoot,
                stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout and stderr captured
                shell: true,
                env: {
                    ...process.env,
                    // Enhanced anti-buffering environment
                    PYTHONUNBUFFERED: '1',        // Disable Python buffering
                    PYTHONIOENCODING: 'utf-8',    // Force UTF-8 encoding
                    NODE_NO_READLINE: '1',        // Disable Node.js readline buffering
                    RUST_LOG_STYLE: 'never',      // Disable Rust formatting
                    FORCE_COLOR: '0',             // Disable ANSI colors
                    NO_COLOR: '1',                // Another way to disable colors
                    TERM: 'dumb',                 // Simple terminal to avoid formatting
                    COLUMNS: '120',               // Fixed column width
                    LINES: '24',                  // Fixed line height
                    DEBIAN_FRONTEND: 'noninteractive'  // Non-interactive mode
                }
            });

            // Disable buffering on streams and set encoding
            child.stdout?.setEncoding('utf8');
            child.stderr?.setEncoding('utf8');

            let stdout = '';
            let stderr = '';

            console.log(`🔢 Process PID: ${child.pid}`);

            // Capture stdout with real-time OutputChannel logging
            child.stdout?.on('data', (data: Buffer) => {
                const output = data.toString();
                stdout += output;
                console.log(`📤 STDOUT: ${output}`);
                
                // Real-time logging to VSCode OutputChannel
                this.outputChannel.append(output);
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.appendOutput(logId, output, false);
                }
            });

            // Capture stderr with real-time OutputChannel logging
            child.stderr?.on('data', (data: Buffer) => {
                const output = data.toString();
                stderr += output;
                console.log(`❌ STDERR: ${output}`);
                
                // Real-time logging to VSCode OutputChannel with error prefix
                this.outputChannel.append(`[ERROR] ${output}`);
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.appendOutput(logId, output, true);
                }
            });

            // Handle cancellation
            cancellationToken?.onCancellationRequested(() => {
                console.log('⏹️ Command cancelled by user');
                child.kill('SIGTERM');
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.updateCommand(logId, {
                        status: 'cancelled',
                        endTime: new Date(),
                        exitCode: -1
                    });
                }
                resolve(false);
            });

            // Handle process completion
            child.on('close', (code, signal) => {
                const endTime = new Date();
                console.log(`✅ Command finished with code: ${code}, signal: ${signal}`);
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.updateCommand(logId, {
                        status: code === 0 ? 'completed' : 'failed',
                        endTime,
                        exitCode: code || undefined,
                        stdout,
                        stderr
                    });
                }

                if (code === 0) {
                    resolve(true);
                } else {
                    console.error(`❌ Command failed with exit code: ${code}`);
                    resolve(false);
                }
            });

            // Handle process errors
            child.on('error', (error) => {
                const endTime = new Date();
                console.error(`❌ Command error: ${error.message}`);
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.updateCommand(logId, {
                        status: 'failed',
                        endTime,
                        stderr: stderr + `\nProcess error: ${error.message}`
                    });
                }
                
                resolve(false);
            });

            // Set dynamic timeout based on command type (already calculated above)
            const timeoutHandle = setTimeout(() => {
                console.log(`⏰ Command timeout after ${timeoutSeconds} seconds (${commandTimeout}ms) - killing PID ${child.pid}`);
                child.kill('SIGTERM');
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.updateCommand(logId, {
                        status: 'failed',
                        endTime: new Date(),
                        stderr: stderr + `\nCommand timed out after ${timeoutSeconds} seconds`
                    });
                }
                
                resolve(false);
            }, commandTimeout);

            // Clear timeout when process completes
            child.on('close', () => {
                clearTimeout(timeoutHandle);
            });
        });
    }

    async executeClaudeCommand(claudeCommand: ClaudeCommand): Promise<boolean> {
        return this.executeCommand(claudeCommand.command);
    }

    dispose(): void {
        // Clean up OutputChannel
        this.outputChannel.dispose();
        console.log('🧹 CommandExecutor disposed');
    }
}