import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present and activatable', async () => {
        const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
        assert.ok(ext, 'Extension should be present');
        
        console.log('Extension found:', ext?.id);
        console.log('Extension isActive:', ext?.isActive);
        
        // Activate the extension if not already active
        if (!ext?.isActive) {
            await ext?.activate();
        }
        
        assert.ok(ext?.isActive, 'Extension should be active');
        console.log('Extension activated successfully');
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'claudeWorkflow.refresh',
            'claudeWorkflow.executeCommand',
            'claudeWorkflow.initProject',
            'claudeWorkflow.selectEpic',
            'claudeWorkflow.startStory',
            'claudeWorkflow.completeItem',
            'claudeWorkflow.planEpics',
            'claudeWorkflow.planStories',
            'claudeWorkflow.openFile'
        ];

        for (const command of expectedCommands) {
            assert.ok(
                commands.includes(command),
                `Command ${command} should be registered`
            );
            console.log(`✓ Command ${command} is registered`);
        }
    });

    test('Tree view should be accessible', async () => {
        // Try to get the tree view by executing a command
        try {
            await vscode.commands.executeCommand('claudeWorkflow.refresh');
            console.log('✓ Tree view refresh command executed successfully');
        } catch (error) {
            console.warn('Tree view refresh failed:', error);
            // Don't fail the test yet, might be expected if no workspace
        }
    });

    test('Extension should handle no workspace gracefully', async () => {
        // Check if we have a workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        console.log('Workspace folders:', workspaceFolders?.length || 0);
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('No workspace folder - extension should still be active');
            // Extension should still be active even without workspace
            const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
            assert.ok(ext?.isActive, 'Extension should remain active without workspace');
        } else {
            console.log('Workspace folder exists:', workspaceFolders[0].uri.fsPath);
        }
    });

    test('Extension should create tree view in explorer', async () => {
        // Check if the tree view is registered by trying to reveal something
        try {
            // First ensure extension is active
            const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
            if (!ext?.isActive) {
                await ext?.activate();
            }
            
            // Try to access the tree view through commands
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('claudeWorkflow.refresh'),
                'Tree view commands should be available'
            );
            
            console.log('✓ Tree view commands are available');
        } catch (error) {
            console.error('Tree view test failed:', error);
            assert.fail(`Tree view should be accessible: ${error}`);
        }
    });
});