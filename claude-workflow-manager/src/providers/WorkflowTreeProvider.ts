import * as vscode from 'vscode';
import { ProjectState, WorkflowTreeItem, Epic, Story } from '../types';
import { StateManager } from './StateManager';
import { CommandRegistry } from '../commands/CommandRegistry';

export class WorkflowTreeProvider implements vscode.TreeDataProvider<WorkflowTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkflowTreeItem | undefined | null | void> = new vscode.EventEmitter<WorkflowTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkflowTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private stateManager: StateManager;
    private projectState: ProjectState | undefined;

    constructor(private workspaceRoot: string) {
        console.log('🌳 WorkflowTreeProvider CONSTRUCTOR');
        console.log('📁 Workspace Root:', workspaceRoot);
        this.stateManager = new StateManager(workspaceRoot);
        this.initializeWatchers();
        console.log('✅ WorkflowTreeProvider initialized successfully');
    }

    private async initializeWatchers(): Promise<void> {
        const config = vscode.workspace.getConfiguration('claudeWorkflowManager');
        if (config.get<boolean>('autoRefresh', true)) {
            const disposables = await this.stateManager.watchForChanges(() => {
                this.refresh();
            });
            
            // Store disposables for cleanup
            vscode.Disposable.from(...disposables);
        }
    }

    refresh(): void {
        console.log('🔄 REFRESH CALLED - Clearing project state and firing tree update');
        this.projectState = undefined; // Clear cached state
        console.log('✅ Project state cleared, firing onDidChangeTreeData event');
        this._onDidChangeTreeData.fire();
        
        // Force immediate re-evaluation to verify refresh works
        setTimeout(() => {
            console.log('🔍 REFRESH VERIFICATION - Checking if tree was updated');
        }, 100);
    }

    getTreeItem(element: WorkflowTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
        try {
            console.log('🔍 GET CHILDREN CALLED');
            console.log('📋 Element:', element?.label || 'ROOT');
            
            if (!this.projectState) {
                console.log('🔄 Loading project state...');
                console.log('📁 Workspace root for StateManager:', this.workspaceRoot);
                
                try {
                    this.projectState = await this.stateManager.getProjectState();
                    console.log('✅ Project state loaded successfully!');
                    console.log('📊 Project state details:', JSON.stringify(this.projectState, null, 2));
                    console.log('🔍 Project state type:', typeof this.projectState);
                    console.log('🔍 Project state null?', this.projectState === null);
                    console.log('🔍 Project state undefined?', this.projectState === undefined);
                    
                    if (this.projectState) {
                        console.log('✅ Project state properties:', {
                            name: this.projectState.name,
                            initialized: this.projectState.initialized,
                            epicsLength: this.projectState.epics?.length || 0,
                            hasCurrentEpic: !!this.projectState.currentEpic
                        });
                    }
                } catch (error) {
                    console.error('❌ ERROR loading project state:', error);
                    console.error('Stack trace:', (error as Error).stack);
                    this.projectState = undefined;
                }
            }

            if (!element) {
                // Root level - show project
                console.log('🌟 Returning ROOT items');
                const items = this.getRootItems();
                console.log(`📊 Root items count: ${items.length}`);
                items.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.label} (${item.itemType})`);
                });
                return items;
            }

            console.log(`🔄 Processing element of type: ${element.itemType}`);
            switch (element.itemType) {
                case 'project':
                    return this.getProjectChildren();
                case 'collection':
                    return this.getCollectionChildren(element);
                case 'epic':
                    return this.getEpicChildren(element);
                case 'story':
                    return this.getStoryChildren(element);
                default:
                    console.log(`⚠️ Unknown item type: ${element.itemType}`);
                    return [];
            }
        } catch (error) {
            console.error('❌ ERROR in getChildren:', error);
            console.error('Stack trace:', (error as Error).stack);
            
            // Return a fallback item to show the error
            return [{
                label: '❌ Error loading items - Check console',
                itemType: 'action',
                contextValue: 'action'
            }];
        }
    }

    private getRootItems(): WorkflowTreeItem[] {
        console.log('🌟 GET ROOT ITEMS - Project State exists:', !!this.projectState);
        
        // CRITICAL FIX: Never return empty array - always show something in tree
        if (!this.projectState) {
            console.log('⚠️ No project state - showing fallback items');
            return [
                {
                    label: '🔧 Claude Project Not Detected',
                    iconPath: new vscode.ThemeIcon('warning'),
                    collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                    itemType: 'action',
                    contextValue: 'status',
                    tooltip: 'No Claude project detected in this workspace. Initialize one to get started.'
                },
                {
                    label: '📁 Initialize Claude Project',
                    iconPath: new vscode.ThemeIcon('add'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    itemType: 'action',
                    contextValue: 'initAction',
                    command: {
                        command: 'claudeWorkflow.initProject',
                        title: 'Initialize Project'
                    },
                    tooltip: 'Click to initialize a new Claude project in this workspace'
                },
                {
                    label: `📂 Workspace: ${this.workspaceRoot ? this.workspaceRoot.split('/').pop() || 'Root' : 'No workspace'}`,
                    iconPath: new vscode.ThemeIcon('folder-opened'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    itemType: 'action',
                    contextValue: 'info',
                    tooltip: `Current workspace: ${this.workspaceRoot || 'No workspace folder open'}`
                }
            ];
        }

        console.log('✅ Project state found - creating project item');
        const projectName = this.projectState.name || 'Claude Project';
        const projectLabel = this.projectState.initialized ? projectName : `${projectName} (not initialized)`;

        const projectItem: WorkflowTreeItem = {
            label: projectLabel,
            iconPath: new vscode.ThemeIcon('folder'),
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            itemType: 'project',
            contextValue: 'project'
        };

        return [projectItem];
    }

    private getProjectChildren(): WorkflowTreeItem[] {
        console.log('🏗️ GET PROJECT CHILDREN');
        if (!this.projectState) {
            console.log('⚠️ No project state in getProjectChildren - returning debug info');
            return [
                {
                    label: '❌ No project state available',
                    iconPath: new vscode.ThemeIcon('error'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    itemType: 'action',
                    contextValue: 'error',
                    tooltip: 'Project state could not be loaded'
                }
            ];
        }

        const items: WorkflowTreeItem[] = [];

        if (!this.projectState.initialized) {
            console.log('🔧 Project not initialized, adding init action');
            // Show initialization action
            try {
                const initCommand = CommandRegistry.getCommand('initProject');
                console.log('📋 Init command:', initCommand);
                
                const initItem: WorkflowTreeItem = {
                    label: '🔧 Initialize Project',
                    command: {
                        command: 'claudeWorkflow.executeCommand',
                        title: 'Initialize Project',
                        arguments: [initCommand]
                    },
                    itemType: 'action',
                    contextValue: 'action'
                };
                items.push(initItem);
                console.log('✅ Init item created successfully');
            } catch (error) {
                console.error('❌ Error creating init item:', error);
                // Fallback without command
                const initItem: WorkflowTreeItem = {
                    label: '🔧 Initialize Project (Fallback)',
                    itemType: 'action',
                    contextValue: 'action'
                };
                items.push(initItem);
            }
        } else {
            // Show update commands if available
            const updateCommands = this.getAvailableUpdateCommands();
            if (updateCommands.length > 0) {
                const updateItem: WorkflowTreeItem = {
                    label: `✅ Update → [${updateCommands.map(cmd => cmd.title.replace('Update ', '').replace('Import ', '')).join('] [')}]`,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    itemType: 'collection',
                    contextValue: 'updateCommands'
                };
                items.push(updateItem);
            }

            // Show epics collection
            const epicsItem: WorkflowTreeItem = {
                label: `📚 Epics${this.projectState.epics.length > 0 ? ` (${this.projectState.epics.length})` : ''}`,
                collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                itemType: 'collection',
                contextValue: 'epics'
            };
            items.push(epicsItem);
        }

        return items;
    }

    private getCollectionChildren(element: WorkflowTreeItem): WorkflowTreeItem[] {
        if (!this.projectState) return [];

        switch (element.contextValue) {
            case 'updateCommands':
                return this.getUpdateCommandItems();
            case 'epics':
                return this.getEpicItems();
            case 'stories':
                return this.getStoryItems(element.data as Epic);
            case 'tickets':
                return this.getTicketItems(element.data as Story);
            default:
                return [];
        }
    }

    private getUpdateCommandItems(): WorkflowTreeItem[] {
        return this.getAvailableUpdateCommands().map(cmd => ({
            label: `${cmd.icon ? cmd.icon + ' ' : ''}${cmd.title}`,
            command: {
                command: 'claudeWorkflow.executeCommand',
                title: cmd.title,
                arguments: [cmd]
            },
            itemType: 'action',
            contextValue: 'action',
            tooltip: cmd.description
        }));
    }

    private getEpicItems(): WorkflowTreeItem[] {
        if (!this.projectState) return [];

        const items: WorkflowTreeItem[] = [];

        // Show existing epics
        for (const epic of this.projectState.epics) {
            const isActive = this.projectState.currentEpic?.id === epic.id;
            const statusIcon = epic.status === 'completed' ? '✅' : (isActive ? '🔵' : '⚪');
            
            const epicItem: WorkflowTreeItem = {
                label: `${statusIcon} Epic #${epic.id}: ${epic.title}${isActive ? ' (current)' : ''}`,
                collapsibleState: isActive && epic.stories.length > 0 ? 
                    vscode.TreeItemCollapsibleState.Expanded : 
                    vscode.TreeItemCollapsibleState.Collapsed,
                itemType: 'epic',
                contextValue: 'epic',
                data: epic,
                tooltip: epic.description
            };
            items.push(epicItem);
        }

        // Show plan epics action if no epics exist
        if (this.projectState.epics.length === 0) {
            const planItem: WorkflowTreeItem = {
                label: '➕ Plan new epics',
                command: {
                    command: 'claudeWorkflow.executeCommand',
                    title: 'Plan Epics',
                    arguments: [CommandRegistry.getCommand('planEpics')]
                },
                itemType: 'action',
                contextValue: 'action'
            };
            items.push(planItem);
        }

        return items;
    }

    private getEpicChildren(element: WorkflowTreeItem): WorkflowTreeItem[] {
        const epic = element.data as Epic;
        const items: WorkflowTreeItem[] = [];
        const isActive = this.projectState?.currentEpic?.id === epic.id;

        if (isActive) {
            // Show epic management commands
            const manageItem: WorkflowTreeItem = {
                label: '✅ Manage → [Complete] [Status]',
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                itemType: 'collection',
                contextValue: 'epicCommands',
                data: epic
            };
            items.push(manageItem);

            // Show stories collection
            if (epic.stories.length > 0) {
                const storiesItem: WorkflowTreeItem = {
                    label: `📝 Stories (${epic.stories.length})`,
                    collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                    itemType: 'collection',
                    contextValue: 'stories',
                    data: epic
                };
                items.push(storiesItem);
            } else {
                // Show plan stories action
                const planStoriesItem: WorkflowTreeItem = {
                    label: '📝 Plan Stories',
                    command: {
                        command: 'claudeWorkflow.executeCommand',
                        title: 'Plan Stories',
                        arguments: [CommandRegistry.getCommand('planStories')]
                    },
                    itemType: 'action',
                    contextValue: 'action'
                };
                items.push(planStoriesItem);
            }
        } else {
            // Show select epic action
            const selectItem: WorkflowTreeItem = {
                label: '🔧 Select epic',
                command: {
                    command: 'claudeWorkflow.executeCommand',
                    title: 'Select Epic',
                    arguments: [CommandRegistry.getCommand('selectStories')]
                },
                itemType: 'action',
                contextValue: 'action'
            };
            items.push(selectItem);
        }

        return items;
    }

    private getStoryItems(epic: Epic): WorkflowTreeItem[] {
        const priorityIcons = { P0: '🔴', P1: '🟠', P2: '🟡', P3: '⚫' };
        
        return epic.stories.map(story => {
            const isActive = this.projectState?.currentStory?.id === story.id;
            const priorityIcon = priorityIcons[story.priority];
            const statusIcon = story.status === 'completed' ? '✅' : (isActive ? '🔵' : '⚪');
            
            return {
                label: `${statusIcon} ${priorityIcon} Story #${story.id}: ${story.title}${isActive ? ' (active)' : ''}`,
                collapsibleState: isActive && story.tickets.length > 0 ? 
                    vscode.TreeItemCollapsibleState.Expanded : 
                    vscode.TreeItemCollapsibleState.Collapsed,
                itemType: 'story',
                contextValue: 'story',
                data: story,
                tooltip: story.description
            };
        });
    }

    private getStoryChildren(element: WorkflowTreeItem): WorkflowTreeItem[] {
        const story = element.data as Story;
        const items: WorkflowTreeItem[] = [];
        const isActive = this.projectState?.currentStory?.id === story.id;

        if (isActive) {
            // Show complete story action
            const completeItem: WorkflowTreeItem = {
                label: '✅ Complete story',
                command: {
                    command: 'claudeWorkflow.executeCommand',
                    title: 'Complete Story',
                    arguments: [CommandRegistry.getCommand('completeStory')]
                },
                itemType: 'action',
                contextValue: 'action'
            };
            items.push(completeItem);

            // Show tickets if any
            if (story.tickets.length > 0) {
                const ticketsItem: WorkflowTreeItem = {
                    label: `🎫 Tickets (${story.tickets.length})`,
                    collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                    itemType: 'collection',
                    contextValue: 'tickets',
                    data: story
                };
                items.push(ticketsItem);
            }
        } else {
            // Show start story action
            const startItem: WorkflowTreeItem = {
                label: '🔧 Start story',
                command: {
                    command: 'claudeWorkflow.executeCommand',
                    title: 'Start Story',
                    arguments: [CommandRegistry.getCommand('startStory')]
                },
                itemType: 'action',
                contextValue: 'action'
            };
            items.push(startItem);
        }

        return items;
    }

    private getTicketItems(story: Story): WorkflowTreeItem[] {
        return story.tickets.map(ticket => {
            const statusIcon = ticket.status === 'completed' ? '✓' : 
                             (ticket.status === 'in_progress' ? '🚧' : '⏳');
            
            return {
                label: `${statusIcon} ${ticket.title}`,
                itemType: 'ticket',
                contextValue: 'ticket',
                data: ticket,
                tooltip: ticket.description
            };
        });
    }

    private getAvailableUpdateCommands() {
        if (!this.projectState) return [];

        const commands = [];
        
        if (!this.projectState.hasFeedback) {
            commands.push(CommandRegistry.getCommand('importFeedback')!);
        }
        if (!this.projectState.hasChallenge) {
            commands.push(CommandRegistry.getCommand('updateChallenge')!);
        }
        if (!this.projectState.hasStatus) {
            commands.push(CommandRegistry.getCommand('updateStatus')!);
        }
        
        // Enrich is always available
        commands.push(CommandRegistry.getCommand('enrichProject')!);

        return commands;
    }
}