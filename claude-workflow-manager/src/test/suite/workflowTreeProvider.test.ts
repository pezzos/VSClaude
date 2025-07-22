import * as assert from 'assert';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { WorkflowTreeProvider } from '../../providers/WorkflowTreeProvider';

suite('WorkflowTreeProvider Test Suite', () => {
    let tempDir: string;
    let treeProvider: WorkflowTreeProvider;

    suiteSetup(() => {
        // Create a temporary directory for testing
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-workflow-test-'));
        console.log('Created temp dir:', tempDir);
    });

    suiteTeardown(() => {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log('Cleaned up temp dir:', tempDir);
        }
    });

    setup(() => {
        treeProvider = new WorkflowTreeProvider(tempDir);
    });

    test('TreeProvider should initialize correctly', () => {
        assert.ok(treeProvider, 'TreeProvider should be created');
        console.log('✓ TreeProvider initialized');
    });

    test('TreeProvider should return tree items for empty project', async () => {
        const children = await treeProvider.getChildren();
        assert.ok(Array.isArray(children), 'getChildren should return array');
        console.log('Root children count:', children.length);
        
        if (children.length > 0) {
            const rootItem = children[0];
            assert.ok(rootItem.label, 'Root item should have label');
            console.log('✓ Root item label:', rootItem.label);
            
            // Should be a project item
            assert.strictEqual(rootItem.itemType, 'project', 'Root should be project type');
            assert.strictEqual(rootItem.contextValue, 'project', 'Root should have project context');
        }
    });

    test('TreeProvider should handle project with README', async () => {
        // Create a README.md file
        const readmePath = path.join(tempDir, 'README.md');
        fs.writeFileSync(readmePath, '# Test Project\n\nThis is a test project.');
        
        // Create new provider instance to pick up the file
        const provider = new WorkflowTreeProvider(tempDir);
        const children = await provider.getChildren();
        
        assert.ok(children.length > 0, 'Should have children with README');
        const rootItem = children[0];
        assert.ok(
            rootItem.label && typeof rootItem.label === 'string' && rootItem.label.includes('Test Project'),
            'Should extract project name from README'
        );
        console.log('✓ Project name extracted:', rootItem.label);
    });

    test('TreeProvider should show initialization option for uninitialized project', async () => {
        const children = await treeProvider.getChildren();
        assert.ok(children.length > 0, 'Should have root project item');
        
        const rootItem = children[0];
        const projectChildren = await treeProvider.getChildren(rootItem);
        
        assert.ok(projectChildren.length > 0, 'Project should have children');
        
        // Should have an initialization item
        const initItem = projectChildren.find(item => 
            item.label && typeof item.label === 'string' && item.label.includes('Initialize Project')
        );
        assert.ok(initItem, 'Should have initialize project option');
        console.log('✓ Initialize option found:', initItem?.label);
    });

    test('TreeProvider should handle initialized project structure', async () => {
        // Create project structure
        const docsDir = path.join(tempDir, 'docs', '1-project');
        fs.mkdirSync(docsDir, { recursive: true });
        
        // Create EPICS.md file to mark as initialized
        const epicsPath = path.join(docsDir, 'EPICS.md');
        fs.writeFileSync(epicsPath, '# Epics\n\n## Epic 1: Test Epic\n- Description: Test epic description\n');
        
        // Create new provider instance
        const provider = new WorkflowTreeProvider(tempDir);
        const children = await provider.getChildren();
        assert.ok(children.length > 0, 'Should have root project item');
        
        const rootItem = children[0];
        const projectChildren = await provider.getChildren(rootItem);
        
        console.log('Project children:', projectChildren.map(c => c.label));
        
        // Should have epics collection
        const epicsItem = projectChildren.find(item => 
            item.label && typeof item.label === 'string' && item.label.includes('Epics')
        );
        assert.ok(epicsItem, 'Should have epics collection');
        console.log('✓ Epics collection found:', epicsItem?.label);
    });

    test('TreeProvider refresh should work', () => {
        // Should not throw
        assert.doesNotThrow(() => {
            treeProvider.refresh();
        }, 'Refresh should not throw error');
        console.log('✓ Refresh completed');
    });

    test('TreeProvider getTreeItem should return the same item', () => {
        const testItem = {
            label: 'Test Item',
            itemType: 'test' as 'project',
            contextValue: 'test'
        };
        
        const result = treeProvider.getTreeItem(testItem);
        assert.strictEqual(result, testItem, 'getTreeItem should return same item');
        console.log('✓ getTreeItem works correctly');
    });
});