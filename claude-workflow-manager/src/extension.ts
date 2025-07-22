import * as vscode from 'vscode';
import { WorkflowTreeProvider } from './providers/WorkflowTreeProvider';
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
    const commandExecutor = new CommandExecutor();

    // Register tree view
    console.log('🌳 REGISTERING TREE VIEW: claudeWorkflow');
    const treeView = vscode.window.createTreeView('claudeWorkflow', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
        canSelectMany: false
    });
    console.log('✅ TREE VIEW REGISTERED SUCCESSFULLY!');
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
                await commandExecutor.executeCommand('/1-Init');
                vscode.window.showInformationMessage('Project initialization started');
                setTimeout(() => treeProvider.refresh(), 3000);
            }
        }),

        vscode.commands.registerCommand('claudeWorkflow.selectEpic', async () => {
            await commandExecutor.executeCommand('/4-Epic select');
            vscode.window.showInformationMessage('Epic selection started');
            setTimeout(() => treeProvider.refresh(), 3000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.startStory', async () => {
            await commandExecutor.executeCommand('/6-Story start');
            vscode.window.showInformationMessage('Story started');
            setTimeout(() => treeProvider.refresh(), 3000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.completeItem', async (item: { itemType?: string }) => {
            let command = '';
            let message = '';

            if (item?.itemType === 'story') {
                command = '/6-Story complete';
                message = 'Story completion started';
            } else if (item?.itemType === 'epic') {
                command = '/4-Epic complete';
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
            await commandExecutor.executeCommand('/3-Epic plan');
            vscode.window.showInformationMessage('Epic planning started');
            setTimeout(() => treeProvider.refresh(), 5000);
        }),

        vscode.commands.registerCommand('claudeWorkflow.planStories', async () => {
            await commandExecutor.executeCommand('/5-Story plan');
            vscode.window.showInformationMessage('Story planning started');
            setTimeout(() => treeProvider.refresh(), 5000);
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
        })
    ];

    // Register all commands for disposal
    console.log(`🔧 REGISTERING ${commands.length} COMMANDS`);
    context.subscriptions.push(...commands);
    context.subscriptions.push(treeView);
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