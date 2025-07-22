import * as vscode from 'vscode';
import { WorkflowTreeProvider } from './providers/WorkflowTreeProvider';
import { OutputLogProvider } from './providers/OutputLogProvider';
import { CommandExecutor } from './commands/CommandExecutor';
import { ClaudeCommand } from './types';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 CLAUDE WORKFLOW MANAGER - ACTIVATION STARTED!');
    console.log('📊 Extension Context:', {
        subscriptions: context.subscriptions.length,
        extensionPath: context.extensionPath,
        workspaceState: !!context.workspaceState,
        globalState: !!context.globalState
    });

    // Get workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        console.log('No workspace folder found');
        // Don't return early - still register the tree view so users can see the extension
        // vscode.window.showWarningMessage('Claude Workflow Manager requires an open workspace folder');
        // return;
    }

    const workspaceRoot = workspaceFolder?.uri.fsPath || '';
    
    // Initialize providers
    const treeProvider = new WorkflowTreeProvider(workspaceRoot);
    const outputLogProvider = new OutputLogProvider();
    const commandExecutor = new CommandExecutor();
    
    // Connect CommandExecutor to OutputLogProvider
    commandExecutor.setOutputLogProvider(outputLogProvider);

    // Register tree view
    console.log('🌳 REGISTERING TREE VIEW: claudeWorkflow');
    const treeView = vscode.window.createTreeView('claudeWorkflow', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    console.log('✅ TREE VIEW REGISTERED SUCCESSFULLY!');

    // Register output log view
    console.log('🔧 REGISTERING OUTPUT LOG VIEW: claudeOutput');
    const outputView = vscode.window.createTreeView('claudeOutput', {
        treeDataProvider: outputLogProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    console.log('✅ OUTPUT LOG VIEW REGISTERED SUCCESSFULLY!');
    console.log('📋 Tree View Details:', {
        title: treeView.title,
        visible: treeView.visible,
        selection: treeView.selection.length
    });

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
                console.log('🚀 STARTING PROJECT INITIALIZATION');
                await commandExecutor.executeCommand('/1-project:1-start:1-Init-Project');
                vscode.window.showInformationMessage('Project initialization started');
                console.log('✅ Project initialization command completed, scheduling refresh...');
                
                // Use longer delay and multiple refreshes to ensure state is updated
                setTimeout(() => {
                    console.log('⏰ FIRST REFRESH (5s after init)');
                    treeProvider.refresh();
                }, 5000);
                
                // Backup refresh in case files take longer to be created
                setTimeout(() => {
                    console.log('⏰ BACKUP REFRESH (8s after init)');
                    treeProvider.refresh();
                }, 8000);
            }
        }),

        vscode.commands.registerCommand('claudeWorkflow.selectEpic', async () => {
            console.log('🎯 STARTING EPIC SELECTION');
            await commandExecutor.executeCommand('/2-epic:1-start:1-Select-Stories');
            vscode.window.showInformationMessage('Epic selection started');
            console.log('✅ Epic selection completed, scheduling refresh...');
            setTimeout(() => {
                console.log('⏰ REFRESH after epic selection');
                treeProvider.refresh();
            }, 4000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.startStory', async () => {
            console.log('📝 STARTING STORY');
            await commandExecutor.executeCommand('/3-story:1-manage:1-Start-Story');
            vscode.window.showInformationMessage('Story started');
            console.log('✅ Story start completed, scheduling refresh...');
            setTimeout(() => {
                console.log('⏰ REFRESH after story start');
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
            console.log('📋 STARTING EPIC PLANNING');
            await commandExecutor.executeCommand('/1-project:3-epics:1-Plan-Epics');
            vscode.window.showInformationMessage('Epic planning started');
            console.log('✅ Epic planning completed, scheduling refresh...');
            setTimeout(() => {
                console.log('⏰ REFRESH after epic planning');
                treeProvider.refresh();
            }, 6000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.planStories', async () => {
            console.log('📋 STARTING STORY PLANNING');
            await commandExecutor.executeCommand('/2-epic:1-start:2-Plan-stories');
            vscode.window.showInformationMessage('Story planning started');
            console.log('✅ Story planning completed, scheduling refresh...');
            setTimeout(() => {
                console.log('⏰ REFRESH after story planning');
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
            console.log('🔄 REFRESH OUTPUT PANEL COMMAND');
            outputLogProvider.refresh();
        }),

        vscode.commands.registerCommand('claudeWorkflow.clearOutput', () => {
            console.log('🗑️ CLEAR OUTPUT PANEL COMMAND');
            outputLogProvider.clear();
            vscode.window.showInformationMessage('Output log cleared');
        })
    ];

    // Register all commands for disposal
    console.log(`🔧 REGISTERING ${commands.length} COMMANDS`);
    context.subscriptions.push(...commands);
    context.subscriptions.push(treeView);
    context.subscriptions.push(outputView);
    context.subscriptions.push(commandExecutor);
    console.log('✅ ALL COMMANDS REGISTERED!');

    // Set up status bar item
    console.log('📊 SETTING UP STATUS BAR');
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(tools) Claude Workflow';
    statusBarItem.tooltip = 'Claude Workflow Manager';
    statusBarItem.command = 'claudeWorkflow.showCurrent';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    console.log('✅ STATUS BAR SETUP COMPLETE!');

    // Show welcome message
    console.log('💬 SHOWING WELCOME MESSAGE');
    if (vscode.workspace.getConfiguration('claudeWorkflowManager').get('showWelcome', true)) {
        vscode.window.showInformationMessage(
            '🎉 Claude Workflow Manager is now ACTIVE! Check the Explorer panel for the workflow tree.',
            'Open Explorer', 'Don\'t show again'
        ).then(selection => {
            if (selection === 'Don\'t show again') {
                vscode.workspace.getConfiguration('claudeWorkflowManager').update('showWelcome', false, vscode.ConfigurationTarget.Global);
            } else if (selection === 'Open Explorer') {
                vscode.commands.executeCommand('workbench.view.explorer');
            }
        });
    }
    
    console.log('🎯 CLAUDE WORKFLOW MANAGER ACTIVATION COMPLETE!');
}

export function deactivate() {
    console.log('Claude Workflow Manager extension is deactivated');
}