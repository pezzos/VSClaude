/**
 * Main webview provider for the Traycer-style workflow interface
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { StateEventBus, StateEventType } from './StateEventBus';
import { StateManager } from '../providers/StateManager';
import { CommandExecutor } from '../commands/CommandExecutor';
import { OutputLogProvider } from '../providers/OutputLogProvider';
import { 
    WebviewMessage, 
    MessageType, 
    CommandStatus, 
    SerializableProjectState,
    SerializableLogEntry,
    isExecuteCommandRequest,
    isGetProjectStateRequest,
    isGetCommandHistoryRequest,
    createMessage,
    ProjectStateUpdateMessage,
    CommandStatusUpdateMessage,
    ThemeUpdateMessage,
    CommandHistoryUpdateMessage,
    LogEntryStreamMessage
} from './protocol';
import { ProjectState, ProjectStatus } from '../types';

export class WorkflowWebviewProvider implements vscode.WebviewViewProvider {
    private readonly viewType = 'claudeWorkflowWebview';
    private webviewView: vscode.WebviewView | undefined;
    private disposables: vscode.Disposable[] = [];
    private activeCommands = new Map<string, { command: string; startTime: number }>();
    private logEntryBuffer: SerializableLogEntry[] = [];
    private logStreamTimer: NodeJS.Timeout | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly stateEventBus: StateEventBus,
        private readonly stateManager: StateManager,
        private readonly commandExecutor: CommandExecutor,
        private readonly outputLogProvider: OutputLogProvider
    ) {
        this.setupEventListeners();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _context: vscode.WebviewViewResolveContext<unknown>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webviewView = webviewView;

        // Configure webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'webview-ui')),
                vscode.Uri.file(path.join(this.context.extensionPath, 'webview-ui'))
            ]
        };

        // Set initial HTML content
        webviewView.webview.html = this.getWebviewContent(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            (message: WebviewMessage) => this.handleWebviewMessage(message),
            null,
            this.disposables
        );

        // Handle webview becoming visible/hidden
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.refreshWebview();
            }
        }, null, this.disposables);

        // Send initial state
        this.refreshWebview();
    }

    private setupEventListeners(): void {
        // Listen for project state changes
        this.disposables.push(
            this.stateEventBus.on(StateEventType.PROJECT_STATE_CHANGED, (event) => {
                if (event.type === StateEventType.PROJECT_STATE_CHANGED) {
                    this.sendProjectStateUpdate(event.data as SerializableProjectState);
                }
            })
        );

        // Listen for command events
        this.disposables.push(
            this.stateEventBus.on(StateEventType.COMMAND_STARTED, (event) => {
                if (event.type === StateEventType.COMMAND_STARTED) {
                    const data = event.data as { commandId: string; command: string; args: string[] };
                    const { commandId, command } = data;
                    this.activeCommands.set(commandId, { command, startTime: Date.now() });
                    this.sendCommandStatusUpdate(commandId, command, CommandStatus.RUNNING);
                }
            })
        );

        this.disposables.push(
            this.stateEventBus.on(StateEventType.COMMAND_COMPLETED, (event) => {
                if (event.type === StateEventType.COMMAND_COMPLETED) {
                    const data = event.data as { commandId: string; output?: string; duration: number };
                    const { commandId, output } = data;
                    const commandInfo = this.activeCommands.get(commandId);
                    if (commandInfo) {
                        this.sendCommandStatusUpdate(
                            commandId, 
                            commandInfo.command, 
                            CommandStatus.COMPLETED, 
                            output,
                            undefined,
                            100
                        );
                        this.activeCommands.delete(commandId);
                    }
                }
            })
        );

        this.disposables.push(
            this.stateEventBus.on(StateEventType.COMMAND_FAILED, (event) => {
                if (event.type === StateEventType.COMMAND_FAILED) {
                    const data = event.data as { commandId: string; error: string; duration: number };
                    const { commandId, error } = data;
                    const commandInfo = this.activeCommands.get(commandId);
                    if (commandInfo) {
                        this.sendCommandStatusUpdate(
                            commandId, 
                            commandInfo.command, 
                            CommandStatus.FAILED, 
                            undefined,
                            error,
                            0
                        );
                        this.activeCommands.delete(commandId);
                    }
                }
            })
        );

        // Listen for theme changes
        this.disposables.push(
            this.stateEventBus.on(StateEventType.THEME_CHANGED, (event) => {
                if (event.type === StateEventType.THEME_CHANGED) {
                    const data = event.data as { theme: 'light' | 'dark' | 'high-contrast' };
                    this.sendThemeUpdate(data.theme);
                }
            })
        );

        // Listen for log entries to stream to webview
        this.disposables.push(
            this.stateEventBus.on(StateEventType.LOG_ENTRY_ADDED, (event) => {
                if (event.type === StateEventType.LOG_ENTRY_ADDED) {
                    const logEntry = event.data as SerializableLogEntry;
                    this.handleLogEntryAdded(logEntry);
                }
            })
        );
    }

    private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
        try {
            if (isExecuteCommandRequest(message)) {
                await this.handleExecuteCommand(message);
            } else if (isGetProjectStateRequest(message)) {
                await this.handleGetProjectState(message);
            } else if (isGetCommandHistoryRequest(message)) {
                await this.handleGetCommandHistory(message);
            }
        } catch (error) {
            console.error('Error handling webview message:', error);
            vscode.window.showErrorMessage(`Webview error: ${error}`);
        }
    }

    private async handleExecuteCommand(message: { id: string; command: string; args?: string[] }): Promise<void> {
        const { command, args = [] } = message;
        const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Emit command started event
            this.stateEventBus.emit(StateEventType.COMMAND_STARTED, {
                commandId,
                command,
                args
            });

            // Execute the command
            const result = await this.commandExecutor.executeClaudeCommand(command, args);

            if (result.success) {
                this.stateEventBus.emit(StateEventType.COMMAND_COMPLETED, {
                    commandId,
                    output: result.output || 'Command completed successfully',
                    duration: Date.now() - (this.activeCommands.get(commandId)?.startTime || Date.now())
                });

                // After successful command execution, refresh project state 
                // This is crucial for initialization and other state-changing commands
                await this.refreshProjectStateAfterCommand(command);
            } else {
                throw new Error(result.error || 'Command failed');
            }
        } catch (error) {
            this.stateEventBus.emit(StateEventType.COMMAND_FAILED, {
                commandId,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - (this.activeCommands.get(commandId)?.startTime || Date.now())
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async handleGetProjectState(_message: { id: string }): Promise<void> {
        try {
            const projectState = await this.stateManager.getProjectStateWithPersistence();
            const serializableState = this.convertToSerializableState(projectState);
            this.sendProjectStateUpdate(serializableState);
        } catch (error) {
            console.error('Error getting project state:', error);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async handleGetCommandHistory(_message: { id: string }): Promise<void> {
        try {
            // Get recent command events from the event bus
            const commandEvents = this.stateEventBus.getEventHistory(20);
            const commandHistory = commandEvents
                .filter(event => 
                    event.type === StateEventType.COMMAND_STARTED ||
                    event.type === StateEventType.COMMAND_COMPLETED ||
                    event.type === StateEventType.COMMAND_FAILED
                )
                .map(event => {
                    const data = event.data as Record<string, unknown>;
                    return {
                        id: (data.commandId as string) || 'unknown',
                        command: (data.command as string) || 'Unknown command',
                        args: (data.args as string[]) || [],
                        status: this.mapEventTypeToCommandStatus(event.type),
                        startTime: event.timestamp,
                        endTime: event.type !== StateEventType.COMMAND_STARTED ? event.timestamp : undefined,
                        output: data.output as string,
                        error: data.error as string
                    };
                });

            this.sendMessage(
                createMessage<CommandHistoryUpdateMessage>(MessageType.COMMAND_STATUS_UPDATE, { commandHistory })
            );
        } catch (error) {
            console.error('Error getting command history:', error);
        }
    }

    private sendProjectStateUpdate(state: SerializableProjectState): void {
        this.sendMessage(
            createMessage<ProjectStateUpdateMessage>(MessageType.PROJECT_STATE_UPDATE, { state })
        );
    }

    private sendCommandStatusUpdate(
        commandId: string,
        command: string,
        status: CommandStatus,
        output?: string,
        error?: string,
        progress?: number
    ): void {
        this.sendMessage(
            createMessage<CommandStatusUpdateMessage>(MessageType.COMMAND_STATUS_UPDATE, {
                commandId,
                command,
                status,
                output,
                error,
                progress
            })
        );
    }

    private sendThemeUpdate(theme: 'light' | 'dark' | 'high-contrast'): void {
        this.sendMessage(
            createMessage<ThemeUpdateMessage>(MessageType.THEME_UPDATE, { theme })
        );
    }

    private handleLogEntryAdded(logEntry: SerializableLogEntry): void {
        // Add to buffer
        this.logEntryBuffer.push(logEntry);
        
        // Throttle log streaming to prevent overwhelming the webview
        if (this.logStreamTimer) {
            clearTimeout(this.logStreamTimer);
        }
        
        this.logStreamTimer = setTimeout(() => {
            this.flushLogEntryBuffer();
        }, 50); // 50ms throttle
    }

    private flushLogEntryBuffer(): void {
        if (this.logEntryBuffer.length === 0) return;

        // Send each log entry individually for real-time streaming
        for (const logEntry of this.logEntryBuffer) {
            this.sendLogEntryUpdate(logEntry);
        }

        // Clear the buffer
        this.logEntryBuffer = [];
        this.logStreamTimer = undefined;
    }

    private sendLogEntryUpdate(logEntry: SerializableLogEntry): void {
        // Find the associated command ID from active commands or use default
        let commandId = logEntry.commandId || 'unknown';
        
        // If no command ID is specified, try to associate with the most recent active command
        if (!logEntry.commandId && this.activeCommands.size > 0) {
            const mostRecentCommand = Array.from(this.activeCommands.entries())
                .sort((a, b) => b[1].startTime - a[1].startTime)[0];
            commandId = mostRecentCommand[0];
        }

        this.sendMessage(
            createMessage<LogEntryStreamMessage>(MessageType.LOG_ENTRY_STREAM, {
                logEntry,
                commandId
            })
        );
    }

    private sendMessage(message: WebviewMessage): void {
        if (this.webviewView?.webview) {
            this.webviewView.webview.postMessage(message);
        }
    }

    private async refreshWebview(): Promise<void> {
        if (!this.webviewView) return;

        try {
            const projectState = await this.stateManager.getProjectStateWithPersistence();
            const serializableState = this.convertToSerializableState(projectState);
            this.sendProjectStateUpdate(serializableState);

            // Send current theme
            const theme = this.getCurrentTheme();
            this.sendThemeUpdate(theme);
        } catch (error) {
            console.error('Error refreshing webview:', error);
        }
    }

    private convertToSerializableState(projectState: ProjectState): SerializableProjectState {
        return {
            isInitialized: projectState.initialized,
            status: projectState.initialized ? ProjectStatus.ACTIVE : ProjectStatus.NOT_INITIALIZED,
            currentProjectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null,
            currentEpic: projectState.currentEpic ? {
                id: projectState.currentEpic.id,
                name: projectState.currentEpic.title,
                description: projectState.currentEpic.description || '',
                status: this.mapEpicStatus(projectState.currentEpic.status),
                stories: projectState.currentEpic.stories.map(story => ({
                    id: story.id,
                    name: story.title,
                    description: story.description || '',
                    status: this.mapStoryStatus(story.status),
                    tickets: story.tickets.map(ticket => ({
                        id: ticket.id,
                        name: ticket.title,
                        description: ticket.description || '',
                        status: this.mapTicketStatus(ticket.status),
                        storyId: story.id,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        labels: []
                    })),
                    epicId: projectState.currentEpic!.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    acceptanceCriteria: []
                })),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                priority: 'high',
                tags: []
            } : null,
            currentStory: projectState.currentStory ? {
                id: projectState.currentStory.id,
                name: projectState.currentStory.title,
                description: projectState.currentStory.description || '',
                status: this.mapStoryStatus(projectState.currentStory.status),
                tickets: projectState.currentStory.tickets.map(ticket => ({
                    id: ticket.id,
                    name: ticket.title,
                    description: ticket.description || '',
                    status: this.mapTicketStatus(ticket.status),
                    storyId: projectState.currentStory!.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    labels: []
                })),
                epicId: projectState.currentStory.epicId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                acceptanceCriteria: []
            } : null,
            epics: projectState.epics.map(epic => ({
                id: epic.id,
                name: epic.title,
                description: epic.description || '',
                status: this.mapEpicStatus(epic.status),
                stories: epic.stories.map(story => ({
                    id: story.id,
                    name: story.title,
                    description: story.description || '',
                    status: this.mapStoryStatus(story.status),
                    tickets: story.tickets.map(ticket => ({
                        id: ticket.id,
                        name: ticket.title,
                        description: ticket.description || '',
                        status: this.mapTicketStatus(ticket.status),
                        storyId: story.id,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        labels: []
                    })),
                    epicId: epic.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    acceptanceCriteria: []
                })),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                priority: 'medium',
                tags: []
            })),
            recentCommands: [],
            lastUpdated: Date.now(),
            // Additional state from ProjectState for button logic
            hasFeedback: projectState.hasFeedback || false,
            hasChallenge: projectState.hasChallenge || false,
            hasStatus: projectState.hasStatus || false
        };
    }

    private mapEpicStatus(status: string): 'planning' | 'in-progress' | 'completed' {
        switch (status) {
            case 'active': return 'in-progress';
            case 'completed': return 'completed';
            default: return 'planning';
        }
    }

    private mapStoryStatus(status: string): 'todo' | 'in-progress' | 'completed' {
        switch (status) {
            case 'active': return 'in-progress';
            case 'completed': return 'completed';
            default: return 'todo';
        }
    }

    private mapTicketStatus(status: string): 'todo' | 'in-progress' | 'completed' {
        switch (status) {
            case 'in_progress': return 'in-progress';
            case 'completed': return 'completed';
            default: return 'todo';
        }
    }

    private mapEventTypeToCommandStatus(eventType: StateEventType): CommandStatus {
        switch (eventType) {
            case StateEventType.COMMAND_STARTED: return CommandStatus.RUNNING;
            case StateEventType.COMMAND_COMPLETED: return CommandStatus.COMPLETED;
            case StateEventType.COMMAND_FAILED: return CommandStatus.FAILED;
            default: return CommandStatus.PENDING;
        }
    }

    private getCurrentTheme(): 'light' | 'dark' | 'high-contrast' {
        const theme = vscode.window.activeColorTheme;
        switch (theme.kind) {
            case vscode.ColorThemeKind.Light: return 'light';
            case vscode.ColorThemeKind.Dark: return 'dark';
            case vscode.ColorThemeKind.HighContrast: return 'high-contrast';
            default: return 'dark';
        }
    }

    private getWebviewContent(webview: vscode.Webview): string {
        // Dynamically discover asset filenames
        const assetsPath = path.join(this.context.extensionPath, 'out', 'webview-ui', 'assets');
        let jsFile = 'index.js';
        let cssFile = 'index.css';
        
        try {
            const files = fs.readdirSync(assetsPath);
            
            // Find JS file (main-*.js or index-*.js)
            const jsFiles = files.filter((f: string) => f.endsWith('.js') && (f.startsWith('main-') || f.startsWith('index-')));
            if (jsFiles.length > 0) {
                jsFile = jsFiles[0];
            }
            
            // Find CSS file (index-*.css)
            const cssFiles = files.filter((f: string) => f.endsWith('.css') && f.startsWith('index-'));
            if (cssFiles.length > 0) {
                cssFile = cssFiles[0];
            }
        } catch (error) {
            console.warn('Could not read assets directory, using default filenames:', error);
        }

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(assetsPath, jsFile))
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(assetsPath, cssFile))
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:;">
    <link href="${styleUri}" rel="stylesheet">
    <title>Claude Workflow Manager</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }

    /**
     * Refresh project state after command execution
     * This ensures the webview reflects any changes made by commands like initialization
     */
    private async refreshProjectStateAfterCommand(command: string): Promise<void> {
        try {
            // Commands that may change project state
            const stateChangingCommands = [
                '/1-project:1-start:1-Init-Project',
                '/1-project:3-epics:1-Plan-Epics', 
                '/2-epic:1-start:2-Plan-stories',
                '/4-ticket:2-execute:3-Implement',
                '/4-ticket:2-execute:1-Plan-Ticket'
            ];

            // Check if this command might have changed the project state
            const shouldRefresh = stateChangingCommands.some(stateCmd => 
                command.includes(stateCmd) || stateCmd.includes(command)
            );

            if (shouldRefresh) {
                console.log(`🔄 Refreshing project state after command: ${command}`);
                
                // Add a small delay to ensure file system operations are complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Get updated project state with persistence
                const projectState = await this.stateManager.getProjectStateWithPersistence();
                const serializableState = this.convertToSerializableState(projectState);
                
                // Save state persistence after successful commands
                await this.stateManager.savePersistedState(projectState);
                
                // Send updated state to webview
                this.sendProjectStateUpdate(serializableState);
                
                console.log(`✅ Project state refreshed. Initialized: ${serializableState.isInitialized}`);
            }
        } catch (error) {
            console.error('Error refreshing project state after command:', error);
        }
    }

    public dispose(): void {
        // Clear any pending log stream timer
        if (this.logStreamTimer) {
            clearTimeout(this.logStreamTimer);
        }
        
        this.disposables.forEach(d => d.dispose());
    }
}