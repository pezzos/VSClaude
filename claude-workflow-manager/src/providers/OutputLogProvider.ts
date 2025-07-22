import * as vscode from 'vscode';
import { OutputLogItem } from '../types';

export class OutputLogProvider implements vscode.TreeDataProvider<OutputLogItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<OutputLogItem | undefined | null | void> = new vscode.EventEmitter<OutputLogItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OutputLogItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private outputLogs: OutputLogItem[] = [];
    private maxLogEntries = 20; // Keep last 20 command executions

    constructor() {
        console.log('🔧 OutputLogProvider CONSTRUCTOR');
    }

    refresh(): void {
        console.log('🔄 REFRESH OUTPUT LOG PANEL');
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        console.log('🗑️ CLEAR OUTPUT LOG PANEL');
        this.outputLogs = [];
        this.refresh();
    }

    addCommand(command: string): string {
        const id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logItem: OutputLogItem = {
            id,
            commandText: command,
            startTime: new Date(),
            status: 'running',
            stdout: '',
            stderr: '',
            itemType: 'command',
            label: `🔄 ${command}`,
            tooltip: `Started at ${new Date().toLocaleTimeString()}`,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'runningCommand',
            iconPath: new vscode.ThemeIcon('loading~spin')
        };

        // Add to beginning of array (newest first)
        this.outputLogs.unshift(logItem);

        // Keep only last maxLogEntries
        if (this.outputLogs.length > this.maxLogEntries) {
            this.outputLogs = this.outputLogs.slice(0, this.maxLogEntries);
        }

        this.refresh();
        return id;
    }

    updateCommand(id: string, updates: Partial<OutputLogItem>): void {
        const logItem = this.outputLogs.find(item => item.id === id);
        if (!logItem) return;

        Object.assign(logItem, updates);

        // Update visual representation based on status
        if (logItem.status === 'completed') {
            logItem.label = `✅ ${logItem.commandText}`;
            logItem.iconPath = new vscode.ThemeIcon('check');
            logItem.contextValue = 'completedCommand';
            if (logItem.endTime) {
                logItem.duration = logItem.endTime.getTime() - logItem.startTime.getTime();
                logItem.tooltip = `Completed in ${logItem.duration}ms at ${logItem.endTime.toLocaleTimeString()}`;
            }
        } else if (logItem.status === 'failed') {
            logItem.label = `❌ ${logItem.commandText}`;
            logItem.iconPath = new vscode.ThemeIcon('error');
            logItem.contextValue = 'failedCommand';
            if (logItem.endTime) {
                logItem.duration = logItem.endTime.getTime() - logItem.startTime.getTime();
                logItem.tooltip = `Failed after ${logItem.duration}ms at ${logItem.endTime.toLocaleTimeString()}`;
            }
        } else if (logItem.status === 'cancelled') {
            logItem.label = `⏹️ ${logItem.commandText}`;
            logItem.iconPath = new vscode.ThemeIcon('stop');
            logItem.contextValue = 'cancelledCommand';
            if (logItem.endTime) {
                logItem.duration = logItem.endTime.getTime() - logItem.startTime.getTime();
                logItem.tooltip = `Cancelled after ${logItem.duration}ms at ${logItem.endTime.toLocaleTimeString()}`;
            }
        }

        this.refresh();
    }

    appendOutput(id: string, output: string, isError: boolean = false): void {
        const logItem = this.outputLogs.find(item => item.id === id);
        if (!logItem) return;

        if (isError) {
            logItem.stderr += output;
        } else {
            logItem.stdout += output;
        }

        // Don't refresh on every output append to avoid performance issues
        // Only refresh when command status changes
    }

    getTreeItem(element: OutputLogItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: OutputLogItem): Promise<OutputLogItem[]> {
        try {
            if (!element) {
                // Root level - show recent commands
                if (this.outputLogs.length === 0) {
                    return [{
                        id: 'no-commands',
                        commandText: '',
                        startTime: new Date(),
                        status: 'completed',
                        stdout: '',
                        stderr: '',
                        itemType: 'command',
                        label: '📝 No commands executed yet',
                        tooltip: 'Commands will appear here when executed',
                        collapsibleState: vscode.TreeItemCollapsibleState.None,
                        contextValue: 'placeholder',
                        iconPath: new vscode.ThemeIcon('info')
                    }];
                }
                return this.outputLogs;
            }

            // Show command details when expanded
            if (element.itemType === 'command') {
                const children: OutputLogItem[] = [];

                // Add execution details
                children.push({
                    id: `${element.id}-details`,
                    commandText: element.commandText,
                    startTime: element.startTime,
                    endTime: element.endTime,
                    status: element.status,
                    stdout: '',
                    stderr: '',
                    itemType: 'output',
                    label: `⏱️ Started: ${element.startTime.toLocaleTimeString()}`,
                    tooltip: `Command started at ${element.startTime.toLocaleString()}`,
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    contextValue: 'commandDetail'
                });

                if (element.endTime) {
                    children.push({
                        id: `${element.id}-duration`,
                        commandText: element.commandText,
                        startTime: element.startTime,
                        endTime: element.endTime,
                        status: element.status,
                        stdout: '',
                        stderr: '',
                        duration: element.duration,
                        itemType: 'output',
                        label: `⏱️ Duration: ${element.duration}ms`,
                        tooltip: `Command took ${element.duration} milliseconds`,
                        collapsibleState: vscode.TreeItemCollapsibleState.None,
                        contextValue: 'commandDetail'
                    });
                }

                if (element.exitCode !== undefined) {
                    children.push({
                        id: `${element.id}-exitcode`,
                        commandText: element.commandText,
                        startTime: element.startTime,
                        endTime: element.endTime,
                        status: element.status,
                        stdout: '',
                        stderr: '',
                        exitCode: element.exitCode,
                        itemType: 'output',
                        label: `🔢 Exit Code: ${element.exitCode}`,
                        tooltip: `Command exited with code ${element.exitCode}`,
                        collapsibleState: vscode.TreeItemCollapsibleState.None,
                        contextValue: 'commandDetail'
                    });
                }

                // Add stdout output if present
                if (element.stdout.trim()) {
                    const stdoutLines = element.stdout.trim().split('\n');
                    const preview = stdoutLines.length > 3 
                        ? `${stdoutLines.slice(0, 3).join(' ')}... (${stdoutLines.length} lines)`
                        : element.stdout.trim();
                    
                    children.push({
                        id: `${element.id}-stdout`,
                        commandText: element.commandText,
                        startTime: element.startTime,
                        status: element.status,
                        stdout: element.stdout,
                        stderr: '',
                        itemType: 'output',
                        label: `📤 Output: ${preview}`,
                        tooltip: `Command output:\n${element.stdout}`,
                        collapsibleState: vscode.TreeItemCollapsibleState.None,
                        contextValue: 'commandOutput',
                        iconPath: new vscode.ThemeIcon('output')
                    });
                }

                // Add stderr output if present
                if (element.stderr.trim()) {
                    const stderrLines = element.stderr.trim().split('\n');
                    const preview = stderrLines.length > 3 
                        ? `${stderrLines.slice(0, 3).join(' ')}... (${stderrLines.length} lines)`
                        : element.stderr.trim();
                    
                    children.push({
                        id: `${element.id}-stderr`,
                        commandText: element.commandText,
                        startTime: element.startTime,
                        status: element.status,
                        stdout: '',
                        stderr: element.stderr,
                        itemType: 'error',
                        label: `❌ Error: ${preview}`,
                        tooltip: `Command error output:\n${element.stderr}`,
                        collapsibleState: vscode.TreeItemCollapsibleState.None,
                        contextValue: 'commandError',
                        iconPath: new vscode.ThemeIcon('error')
                    });
                }

                return children;
            }

            return [];
        } catch (error) {
            console.error('❌ ERROR in OutputLogProvider.getChildren:', error);
            return [{
                id: 'error',
                commandText: '',
                startTime: new Date(),
                status: 'failed',
                stdout: '',
                stderr: '',
                itemType: 'error',
                label: '❌ Error loading output logs',
                tooltip: 'Check console for details',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: 'error',
                iconPath: new vscode.ThemeIcon('error')
            }];
        }
    }

    getCommandHistory(): OutputLogItem[] {
        return [...this.outputLogs];
    }
}