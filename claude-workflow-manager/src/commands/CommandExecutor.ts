import * as vscode from 'vscode';
import { ClaudeCommand } from '../types';

export class CommandExecutor {
    private static readonly TERMINAL_NAME = 'Claude Workflow';
    private terminal: vscode.Terminal | undefined;

    async executeCommand(command: string, showTerminal: boolean = true): Promise<boolean> {
        try {
            this.ensureTerminal();
            
            if (!this.terminal) {
                vscode.window.showErrorMessage('Failed to create terminal');
                return false;
            }

            // Show progress notification
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing Claude command...`,
                cancellable: true
            }, async (progress, token) => {
                this.terminal!.sendText(`claude -p "${command}"`);
                
                if (showTerminal) {
                    this.terminal!.show();
                }

                // Wait for command completion (simplified approach)
                return new Promise<boolean>((resolve) => {
                    // For now, we'll assume success after a timeout
                    // In a real implementation, you might want to capture terminal output
                    const timeout = vscode.workspace.getConfiguration('claudeWorkflowManager').get<number>('commandTimeout', 60) * 1000;
                    
                    const timer = setTimeout(() => {
                        resolve(true);
                    }, timeout);

                    token.onCancellationRequested(() => {
                        clearTimeout(timer);
                        this.terminal?.sendText('\x03'); // Send Ctrl+C
                        resolve(false);
                    });
                });
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to execute command: ${message}`);
            return false;
        }
    }

    async executeClaudeCommand(claudeCommand: ClaudeCommand): Promise<boolean> {
        return this.executeCommand(claudeCommand.command);
    }

    private ensureTerminal(): void {
        if (!this.terminal || this.terminal.exitStatus !== undefined) {
            this.terminal = vscode.window.createTerminal({
                name: CommandExecutor.TERMINAL_NAME,
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            });
        }
    }

    dispose(): void {
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
}