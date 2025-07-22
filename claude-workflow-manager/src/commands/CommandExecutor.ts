import * as vscode from 'vscode';
import * as cp from 'child_process';
import { ClaudeCommand } from '../types';
import { OutputLogProvider } from '../providers/OutputLogProvider';

export class CommandExecutor {
    private outputLogProvider: OutputLogProvider | undefined;

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

    async executeCommand(command: string, showProgress: boolean = true): Promise<boolean> {
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
                title: `Executing: ${command}`,
                cancellable: true
            };

            if (!showProgress) {
                // Execute without progress notification
                return this.executeClaudeProcess(command, workspaceRoot, logId);
            }

            // Show progress notification
            return vscode.window.withProgress(progressOptions, async (progress, token) => {
                return this.executeClaudeProcess(command, workspaceRoot, logId, token);
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to execute command: ${message}`);
            return false;
        }
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

            // Spawn child process with captured stdio and anti-buffering environment
            const child = cp.spawn('claude', ['-p', command], {
                cwd: workspaceRoot,
                stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout and stderr captured
                shell: true,
                env: {
                    ...process.env,
                    PYTHONUNBUFFERED: '1',        // Disable Python buffering
                    NODE_NO_READLINE: '1',        // Disable Node.js readline buffering
                    FORCE_COLOR: '0',             // Disable ANSI colors
                    NO_COLOR: '1',                // Another way to disable colors
                    TERM: 'dumb'                  // Simple terminal to avoid formatting
                }
            });

            // Disable buffering on streams and set encoding
            child.stdout?.setEncoding('utf8');
            child.stderr?.setEncoding('utf8');

            let stdout = '';
            let stderr = '';

            console.log(`🔢 Process PID: ${child.pid}`);

            // Capture stdout
            child.stdout?.on('data', (data: Buffer) => {
                const output = data.toString();
                stdout += output;
                console.log(`📤 STDOUT: ${output}`);
                
                if (logId && this.outputLogProvider) {
                    this.outputLogProvider.appendOutput(logId, output, false);
                }
            });

            // Capture stderr
            child.stderr?.on('data', (data: Buffer) => {
                const output = data.toString();
                stderr += output;
                console.log(`❌ STDERR: ${output}`);
                
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
        // No resources to clean up in the new implementation
        console.log('🧹 CommandExecutor disposed');
    }
}