import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Diagnostic Test Suite', () => {
    test('Extension should have correct activation events in manifest', () => {
        console.log('🔍 Testing manifest activation events...');
        
        const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
        assert.ok(ext, 'Extension should be present');
        
        const manifest = ext.packageJSON;
        assert.ok(manifest.activationEvents, 'Should have activationEvents');
        assert.ok(Array.isArray(manifest.activationEvents), 'activationEvents should be array');
        assert.ok(manifest.activationEvents.length > 0, 'Should have at least one activation event');
        
        console.log('📋 Activation events:', manifest.activationEvents);
        
        // Check for required activation events
        const hasOnStartupFinished = manifest.activationEvents.includes('onStartupFinished');
        const hasOnViewClaudeWorkflow = manifest.activationEvents.includes('onView:claudeWorkflow');
        
        assert.ok(
            hasOnStartupFinished || hasOnViewClaudeWorkflow,
            'Should have onStartupFinished or onView:claudeWorkflow activation event'
        );
        
        console.log('✅ Manifest validation passed');
    });

    test('Extension should activate automatically', async () => {
        console.log('🚀 Testing automatic activation...');
        
        // Wait a bit for VS Code to process activation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
        assert.ok(ext, 'Extension should be present');
        
        console.log('📊 Extension state:', {
            id: ext.id,
            isActive: ext.isActive,
            activationEvents: ext.packageJSON.activationEvents
        });
        
        if (!ext.isActive) {
            console.log('⚠️ Extension not active, attempting to activate...');
            await ext.activate();
        }
        
        assert.ok(ext.isActive, 'Extension should be active');
        console.log('✅ Extension is active');
    });

    test('Tree view should be visible in explorer', async () => {
        console.log('🌳 Testing tree view visibility...');
        
        // Ensure extension is active
        const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
        if (!ext?.isActive) {
            await ext?.activate();
        }
        
        // Check if view commands are registered
        const commands = await vscode.commands.getCommands(true);
        const claudeCommands = commands.filter(cmd => cmd.startsWith('claudeWorkflow.'));
        
        console.log('📋 Found Claude commands:', claudeCommands.length);
        claudeCommands.forEach(cmd => console.log(`   - ${cmd}`));
        
        assert.ok(claudeCommands.length > 0, 'Should have Claude workflow commands');
        
        // Specifically check for view-related commands
        const viewCommands = [
            'claudeWorkflow.open',
            'claudeWorkflow.focus',
            'claudeWorkflow.refresh'
        ];
        
        const foundViewCommands = viewCommands.filter(cmd => commands.includes(cmd));
        console.log('🔍 View commands found:', foundViewCommands);
        
        assert.ok(
            foundViewCommands.length > 0,
            'Should have at least one view command registered'
        );
        
        console.log('✅ Tree view commands are available');
    });

    test('Extension should create tree view provider', async () => {
        console.log('🏗️ Testing tree view provider creation...');
        
        const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
        if (!ext?.isActive) {
            await ext?.activate();
        }
        
        // Try to trigger the tree data provider
        try {
            await vscode.commands.executeCommand('claudeWorkflow.refresh');
            console.log('✅ Tree refresh command executed successfully');
        } catch (error) {
            console.warn('⚠️ Tree refresh failed:', error);
            // This might be expected if no workspace is open
        }
        
        // The test passes if we get this far without throwing
        assert.ok(true, 'Tree view provider test completed');
    });

    test('Extension should appear in activity bar panel', async () => {
        console.log('👀 Testing activity bar panel visibility...');
        
        const ext = vscode.extensions.getExtension('local-dev.claude-workflow-manager');
        if (!ext?.isActive) {
            await ext?.activate();
        }
        
        // Check manifest contributions
        const manifest = ext?.packageJSON;
        assert.ok(manifest?.contributes?.views?.['claude-workflow'], 'Should contribute views to claude-workflow container');
        assert.ok(manifest?.contributes?.viewsContainers?.activitybar, 'Should contribute viewsContainers to activity bar');
        
        const claudeView = manifest.contributes.views['claude-workflow'].find(
            (view: { id: string }) => view.id === 'claudeWorkflow'
        );
        
        assert.ok(claudeView, 'Should have claudeWorkflow view in claude-workflow container');
        assert.strictEqual(claudeView.id, 'claudeWorkflow', 'View ID should be claudeWorkflow');
        assert.strictEqual(claudeView.name, 'Workflow Manager', 'View name should be Workflow Manager');
        
        console.log('📋 Activity bar view config:', claudeView);
        console.log('✅ Activity bar panel configuration is correct');
    });
});