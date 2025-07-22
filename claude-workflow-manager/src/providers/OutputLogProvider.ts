import * as vscode from 'vscode';
import { OutputLogItem } from '../types';
import { StateEventBus, StateEventType } from '../webview/StateEventBus';
import { SerializableLogEntry } from '../webview/protocol';

export class OutputLogProvider implements vscode.TreeDataProvider<OutputLogItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<OutputLogItem | undefined | null | void> = new vscode.EventEmitter<OutputLogItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OutputLogItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private outputLogs: OutputLogItem[] = [];
    private maxLogEntries = 20; // Keep last 20 command executions
    private refreshTimeouts = new Map<string, NodeJS.Timeout>(); // Throttling for real-time updates
    private outputChannel: vscode.OutputChannel;

    constructor(private stateEventBus?: StateEventBus) {
        this.outputChannel = vscode.window.createOutputChannel('Claude Workflow Manager - Output');
        // OutputLogProvider initialized - logs only go to extension's output panel
    }

    /**
     * Central logging method that writes to extension's OutputChannel
     */
    private log(message: string, data?: unknown, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
        const formattedMessage = data 
            ? `[${timestamp}] ${prefix} ${message} ${JSON.stringify(data)}`
            : `[${timestamp}] ${prefix} ${message}`;
        
        this.outputChannel.appendLine(formattedMessage);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        // Clear all pending refresh timeouts
        for (const [, timeout] of this.refreshTimeouts) {
            clearTimeout(timeout);
        }
        this.refreshTimeouts.clear();
        
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

        // Clear any pending refresh timeout for this command since we're doing a final update
        if (this.refreshTimeouts.has(id)) {
            clearTimeout(this.refreshTimeouts.get(id)!);
            this.refreshTimeouts.delete(id);
        }

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
            this.log(`❌ STDERR for ${id}: ${output.trim()}`, undefined, 'error');
        } else {
            logItem.stdout += output;
            this.log(`📤 STDOUT for ${id}: ${output.trim()}`);
        }

        // Emit log entry event for real-time streaming to webview
        if (this.stateEventBus) {
            const logEntry: SerializableLogEntry = {
                id: `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                level: isError ? 'error' : 'info',
                message: output.trim(),
                source: 'CommandExecutor',
                commandId: id,
                streamIndex: 0
            };

            this.stateEventBus.emit(StateEventType.LOG_ENTRY_ADDED, logEntry);
        }

        // Throttled refresh for real-time streaming - max 1 refresh per 200ms per command
        if (this.refreshTimeouts.has(id)) {
            clearTimeout(this.refreshTimeouts.get(id)!);
        }
        
        const timeout = setTimeout(() => {
            this.log(`🔄 Refreshing UI for command ${id} due to new output`);
            this.refresh();
            this.refreshTimeouts.delete(id);
        }, 200); // 200ms throttle
        
        this.refreshTimeouts.set(id, timeout);
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
                    const outputBlocks = this.parseOutputContent(element.stdout);
                    
                    if (outputBlocks.length > 0) {
                        const mainOutputItem: OutputLogItem = {
                            id: `${element.id}-stdout`,
                            commandText: element.commandText,
                            startTime: element.startTime,
                            status: element.status,
                            stdout: element.stdout,
                            stderr: '',
                            itemType: 'output' as const,
                            label: `📤 Output (${outputBlocks.length} blocks)`,
                            tooltip: '',
                            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                            contextValue: 'commandOutput',
                            iconPath: new vscode.ThemeIcon('output')
                        };
                        children.push(mainOutputItem);
                    }
                }

                // Add stderr output if present
                if (element.stderr.trim()) {
                    const errorBlocks = this.parseOutputContent(element.stderr);
                    
                    if (errorBlocks.length > 0) {
                        const mainErrorItem: OutputLogItem = {
                            id: `${element.id}-stderr`,
                            commandText: element.commandText,
                            startTime: element.startTime,
                            status: element.status,
                            stdout: '',
                            stderr: element.stderr,
                            itemType: 'error' as const,
                            label: `❌ Error (${errorBlocks.length} blocks)`,
                            tooltip: '',
                            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                            contextValue: 'commandError',
                            iconPath: new vscode.ThemeIcon('error')
                        };
                        children.push(mainErrorItem);
                    }
                }

                return children;
            }

            // Handle expandable output/error blocks
            if (element.itemType === 'output' && element.stdout.trim()) {
                return this.getOutputBlocks(element, element.stdout, 'output');
            }
            
            if (element.itemType === 'error' && element.stderr.trim()) {
                return this.getOutputBlocks(element, element.stderr, 'error');
            }
            
            return [];
        } catch (error) {
            this.log('❌ ERROR in OutputLogProvider.getChildren:', error, 'error');
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

    private parseOutputContent(content: string): Array<{type: string, content: string, preview: string}> {
        const blocks: Array<{type: string, content: string, preview: string}> = [];
        const lines = content.trim().split('\n');
        
        let currentBlock = '';
        let currentType = 'text';
        
        for (const line of lines) {
            try {
                // Try to parse as JSON
                const jsonData = JSON.parse(line);
                
                // If we have accumulated non-JSON text, save it first
                if (currentBlock.trim() && currentType === 'text') {
                    blocks.push({
                        type: 'text',
                        content: currentBlock.trim(),
                        preview: this.getTextPreview(currentBlock.trim())
                    });
                    currentBlock = '';
                }
                
                // Handle JSON content based on structure
                if (jsonData.message && jsonData.message.content) {
                    const messageContent = jsonData.message.content;
                    if (Array.isArray(messageContent)) {
                        // Handle content array (like Claude responses)
                        for (const contentItem of messageContent) {
                            if (contentItem.type === 'text' && contentItem.text) {
                                blocks.push({
                                    type: 'message_text',
                                    content: contentItem.text,
                                    preview: this.getTextPreview(contentItem.text)
                                });
                            } else if (contentItem.type === 'tool_result' && contentItem.content) {
                                blocks.push({
                                    type: 'tool_result',
                                    content: contentItem.content,
                                    preview: this.getTextPreview(contentItem.content)
                                });
                            }
                        }
                    } else if (typeof messageContent === 'string') {
                        blocks.push({
                            type: 'message_text',
                            content: messageContent,
                            preview: this.getTextPreview(messageContent)
                        });
                    }
                } else {
                    // Generic JSON content
                    blocks.push({
                        type: 'json',
                        content: JSON.stringify(jsonData, null, 2),
                        preview: `JSON: ${Object.keys(jsonData).join(', ')}`
                    });
                }
                
                currentType = 'json';
            } catch {
                // Not JSON, accumulate as text
                currentBlock += (currentBlock ? '\n' : '') + line;
                currentType = 'text';
            }
        }
        
        // Add any remaining text block
        if (currentBlock.trim()) {
            blocks.push({
                type: 'text',
                content: currentBlock.trim(),
                preview: this.getTextPreview(currentBlock.trim())
            });
        }
        
        return blocks;
    }
    
    private getTextPreview(text: string): string {
        const lines = text.split('\n');
        const previewLines = lines.slice(0, 2);
        const preview = previewLines.join(' ').substring(0, 100);
        const suffix = lines.length > 2 || preview.length < text.length ? '...' : '';
        return preview + suffix;
    }
    
    private getOutputBlocks(parentElement: OutputLogItem, content: string, type: 'output' | 'error'): OutputLogItem[] {
        const blocks = this.parseOutputContent(content);
        const children: OutputLogItem[] = [];
        
        blocks.forEach((block, index) => {
            const icon = this.getBlockIcon(block.type);
            const label = this.getBlockLabel(block.type, block.preview);
            
            const blockItem: OutputLogItem = {
                id: `${parentElement.id}-${type}-block-${index}`,
                commandText: parentElement.commandText,
                startTime: parentElement.startTime,
                status: parentElement.status,
                stdout: type === 'output' ? block.content : '',
                stderr: type === 'error' ? block.content : '',
                itemType: type === 'output' ? ('output_block' as const) : ('error_block' as const),
                label: label,
                tooltip: block.content,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: `${type}Block`,
                iconPath: new vscode.ThemeIcon(icon)
            };
            children.push(blockItem);
        });
        
        return children;
    }
    
    private getBlockIcon(type: string): string {
        switch (type) {
            case 'message_text': return 'comment';
            case 'tool_result': return 'tools';
            case 'json': return 'json';
            case 'text': 
            default: return 'note';
        }
    }
    
    private getBlockLabel(type: string, preview: string): string {
        const typeLabels = {
            'message_text': '💬 Message',
            'tool_result': '🔧 Tool Result',
            'json': '📋 JSON',
            'text': '📝 Text'
        };
        
        const typeLabel = typeLabels[type as keyof typeof typeLabels] || '📝 Text';
        return `${typeLabel}: ${preview}`;
    }

    getCommandHistory(): OutputLogItem[] {
        return [...this.outputLogs];
    }
}