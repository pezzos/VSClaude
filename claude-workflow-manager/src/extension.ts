import * as vscode from 'vscode';
import { WorkflowTreeProvider } from './providers/WorkflowTreeProvider';
import { WorkflowWebviewProvider } from './webview/WorkflowWebviewProvider';
import { StateEventBus } from './webview/StateEventBus';
import { StateManager } from './providers/StateManager';
import { OutputLogProvider } from './providers/OutputLogProvider';
import { CommandExecutor } from './commands/CommandExecutor';
import { ClaudeCommand } from './types';

// Create global OutputChannel for extension logs
let extensionOutputChannel: vscode.OutputChannel;

function logExtension(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    const formattedMessage = `[${timestamp}] ${prefix} ${message}`;
    
    // Only write to extension's OutputChannel, not VSCode console
    extensionOutputChannel.appendLine(formattedMessage);
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize extension logging
    extensionOutputChannel = vscode.window.createOutputChannel('Claude Workflow Manager - Extension');
    
    logExtension('🚀 CLAUDE WORKFLOW MANAGER - ACTIVATION STARTED!');
    logExtension('📊 Extension Context: ' + JSON.stringify({
        subscriptions: context.subscriptions.length,
        extensionPath: context.extensionPath,
        workspaceState: !!context.workspaceState,
        globalState: !!context.globalState
    }));

    // Get workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        logExtension('No workspace folder found', 'warn');
        // Don't return early - still register the tree view so users can see the extension
        // vscode.window.showWarningMessage('Claude Workflow Manager requires an open workspace folder');
        // return;
    }

    const workspaceRoot = workspaceFolder?.uri.fsPath || '';
    
    // Initialize core services
    const stateEventBus = new StateEventBus();
    const stateManager = new StateManager(workspaceRoot);
    const outputLogProvider = new OutputLogProvider(stateEventBus);
    const commandExecutor = new CommandExecutor();
    
    // Initialize providers
    const treeProvider = new WorkflowTreeProvider(workspaceRoot, stateEventBus);
    const webviewProvider = new WorkflowWebviewProvider(
        context,
        stateEventBus,
        stateManager,
        commandExecutor,
        outputLogProvider
    );
    
    // Connect CommandExecutor to OutputLogProvider
    commandExecutor.setOutputLogProvider(outputLogProvider);

    // Register tree view
    logExtension('🌳 REGISTERING TREE VIEW: claudeWorkflow');
    const treeView = vscode.window.createTreeView('claudeWorkflow', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    logExtension('✅ TREE VIEW REGISTERED SUCCESSFULLY!');

    // Register webview provider
    logExtension('🖥️ REGISTERING WEBVIEW PROVIDER: claudeWorkflowWebview');
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('claudeWorkflowWebview', webviewProvider, {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        })
    );
    logExtension('✅ WEBVIEW PROVIDER REGISTERED SUCCESSFULLY!');

    // Register output log view
    logExtension('🔧 REGISTERING OUTPUT LOG VIEW: claudeOutput');
    const outputView = vscode.window.createTreeView('claudeOutput', {
        treeDataProvider: outputLogProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    logExtension('✅ OUTPUT LOG VIEW REGISTERED SUCCESSFULLY!');
    logExtension('📋 Tree View Details: ' + JSON.stringify({
        title: treeView.title,
        visible: treeView.visible,
        selection: treeView.selection.length
    }));

    // Register commands
    const commands = [
        vscode.commands.registerCommand('claudeWorkflow.refresh', () => {
            treeProvider.refresh();
        }),

        vscode.commands.registerCommand('claudeWorkflow.executeCommand', async (command: ClaudeCommand) => {
            if (!command || !command.command) {
                vscode.window.showErrorMessage('Invalid command');
                return;
            }

            try {
                const success = await commandExecutor.executeClaudeCommand(command);
                if (success) {
                    vscode.window.showInformationMessage(`Command "${command.title}" executed successfully`);
                    // Refresh tree after command execution
                    setTimeout(() => treeProvider.refresh(), 2000);
                } else {
                    vscode.window.showWarningMessage(`Command "${command.title}" was cancelled or failed`);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Failed to execute command: ${message}`);
            }
        }),

        vscode.commands.registerCommand('claudeWorkflow.initProject', async () => {
            const result = await vscode.window.showWarningMessage(
                'This will initialize a new Claude workflow project. Continue?',
                { modal: true },
                'Yes', 'No'
            );

            if (result === 'Yes') {
                logExtension('🚀 STARTING PROJECT INITIALIZATION');
                
                // Execute initialization command
                const success = await commandExecutor.executeCommand('/1-project:1-start:1-Init-Project');
                
                if (success) {
                    vscode.window.showInformationMessage('Project initialization started - waiting for completion...');
                    logExtension('✅ Project initialization command completed, starting intelligent polling...');
                    
                    // Use intelligent polling with comprehensive validation
                    const result = await treeProvider.waitForInitializationWithValidation(300000); // 5 minutes timeout
                    
                    if (result.success) {
                        logExtension('🎉 Initialization completed with full validation! Refreshing tree...');
                        treeProvider.refresh();
                        vscode.window.showInformationMessage('🎉 Project initialization completed successfully!');
                    } else {
                        logExtension('⚠️ Initialization incomplete or validation failed', 'warn');
                        treeProvider.refresh(); // Refresh anyway to show current state
                        
                        if (result.validation) {
                            const { missingFiles, invalidFiles } = result.validation;
                            let message = 'Initialization validation failed. ';
                            if (missingFiles.length > 0) {
                                message += `Missing files: ${missingFiles.join(', ')}. `;
                            }
                            if (invalidFiles.length > 0) {
                                message += `Invalid files: ${invalidFiles.join(', ')}. `;
                            }
                            vscode.window.showWarningMessage(message + 'Check the Claude Workflow Manager output channel for details.');
                        } else {
                            vscode.window.showWarningMessage('Initialization timeout. Check the Claude Workflow Manager output channel for details.');
                        }
                    }
                } else {
                    vscode.window.showErrorMessage('Project initialization command failed');
                }
            }
        }),

        vscode.commands.registerCommand('claudeWorkflow.selectEpic', async () => {
            logExtension('🎯 STARTING EPIC SELECTION');
            await commandExecutor.executeCommand('/2-epic:1-start:1-Select-Stories');
            vscode.window.showInformationMessage('Epic selection started');
            logExtension('✅ Epic selection completed, scheduling refresh...');
            setTimeout(() => {
                logExtension('⏰ REFRESH after epic selection');
                treeProvider.refresh();
            }, 4000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.startStory', async () => {
            logExtension('📝 STARTING STORY');
            await commandExecutor.executeCommand('/3-story:1-manage:1-Start-Story');
            vscode.window.showInformationMessage('Story started');
            logExtension('✅ Story start completed, scheduling refresh...');
            setTimeout(() => {
                logExtension('⏰ REFRESH after story start');
                treeProvider.refresh();
            }, 3000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.completeItem', async (item: { itemType?: string }) => {
            let command = '';
            let message = '';

            if (item?.itemType === 'story') {
                command = '/3-story:1-manage:2-Complete-Story';
                message = 'Story completion started';
            } else if (item?.itemType === 'epic') {
                command = '/2-epic:2-manage:1-Complete-Epic';
                message = 'Epic completion started';
            } else {
                vscode.window.showWarningMessage('Cannot complete this item type');
                return;
            }

            await commandExecutor.executeCommand(command);
            vscode.window.showInformationMessage(message);
            setTimeout(() => treeProvider.refresh(), 3000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.planEpics', async () => {
            logExtension('📋 STARTING EPIC PLANNING');
            const success = await commandExecutor.executeCommand('/1-project:3-epics:1-Plan-Epics');
            if (success) {
                // Mark command as executed for state tracking
                await stateManager.markCommandExecuted('/1-project:3-epics:1-Plan-Epics');
                logExtension('✅ Plan Epics command marked as executed');
            }
            vscode.window.showInformationMessage('Epic planning started');
            logExtension('✅ Epic planning completed, scheduling refresh...');
            setTimeout(() => {
                logExtension('⏰ REFRESH after epic planning');
                treeProvider.refresh();
            }, 6000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.planStories', async () => {
            logExtension('📋 STARTING STORY PLANNING');
            await commandExecutor.executeCommand('/2-epic:1-start:2-Plan-stories');
            vscode.window.showInformationMessage('Story planning started');
            logExtension('✅ Story planning completed, scheduling refresh...');
            setTimeout(() => {
                logExtension('⏰ REFRESH after story planning');
                treeProvider.refresh();
            }, 5000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.openFile', async (item: { itemType?: string; label?: string }) => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) return;

            let filePath = '';

            switch (item?.itemType) {
                case 'project':
                    filePath = 'README.md';
                    break;
                case 'epic':
                    filePath = 'docs/2-current-epic/PRD.md';
                    break;
                case 'story':
                    filePath = 'docs/2-current-epic/STORIES.md';
                    break;
                default:
                    return;
            }

            try {
                const fullPath = vscode.Uri.file(`${workspaceRoot}/${filePath}`);
                const document = await vscode.workspace.openTextDocument(fullPath);
                await vscode.window.showTextDocument(document);
            } catch {
                vscode.window.showWarningMessage(`Could not open file: ${filePath}`);
            }
        }),

        vscode.commands.registerCommand('claudeWorkflow.showCurrent', () => {
            // This would show current status in status bar
            vscode.window.showInformationMessage('Current status functionality not yet implemented');
        }),

        vscode.commands.registerCommand('claudeWorkflow.clearContext', async () => {
            await commandExecutor.executeCommand('/clear');
            vscode.window.showInformationMessage('Context cleared');
        }),

        // Output panel commands
        vscode.commands.registerCommand('claudeWorkflow.refreshOutput', () => {
            logExtension('🔄 REFRESH OUTPUT PANEL COMMAND');
            outputLogProvider.refresh();
        }),

        vscode.commands.registerCommand('claudeWorkflow.clearOutput', () => {
            logExtension('🗑️ CLEAR OUTPUT PANEL COMMAND');
            outputLogProvider.clear();
            vscode.window.showInformationMessage('Output log cleared');
        })
    ];

    // Register all commands for disposal
    logExtension(`🔧 REGISTERING ${commands.length} COMMANDS`);
    context.subscriptions.push(...commands);
    context.subscriptions.push(treeView);
    context.subscriptions.push(outputView);
    context.subscriptions.push(commandExecutor);
    context.subscriptions.push(stateEventBus);
    context.subscriptions.push(webviewProvider);
    logExtension('✅ ALL COMMANDS REGISTERED!');

    // Set up status bar item
    logExtension('📊 SETTING UP STATUS BAR');
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(tools) Claude Workflow';
    statusBarItem.tooltip = 'Claude Workflow Manager';
    statusBarItem.command = 'claudeWorkflow.showCurrent';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    logExtension('✅ STATUS BAR SETUP COMPLETE!');

    // Show welcome message
    logExtension('💬 SHOWING WELCOME MESSAGE');
    if (vscode.workspace.getConfiguration('claudeWorkflowManager').get('showWelcome', true)) {
        vscode.window.showInformationMessage(
            '🎉 Claude Workflow Manager is now ACTIVE! Find it in the Activity Bar on the left.',
            'Open Claude Workflow', 'Don\'t show again'
        ).then(selection => {
            if (selection === 'Don\'t show again') {
                vscode.workspace.getConfiguration('claudeWorkflowManager').update('showWelcome', false, vscode.ConfigurationTarget.Global);
            } else if (selection === 'Open Claude Workflow') {
                vscode.commands.executeCommand('claudeWorkflow.focus');
            }
        });
    }
    
    logExtension('🎯 CLAUDE WORKFLOW MANAGER ACTIVATION COMPLETE!');
}

export function deactivate() {
    logExtension('Claude Workflow Manager extension is deactivated');
}