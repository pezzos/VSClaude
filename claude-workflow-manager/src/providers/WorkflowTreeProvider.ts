import * as vscode from 'vscode';
import { ProjectState, WorkflowTreeItem, Epic, Story } from '../types';
import { StateManager } from './StateManager';
import { StateEventBus, StateEventType } from '../webview/StateEventBus';
import { CommandRegistry } from '../commands/CommandRegistry';

export class WorkflowTreeProvider implements vscode.TreeDataProvider<WorkflowTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkflowTreeItem | undefined | null | void> = new vscode.EventEmitter<WorkflowTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkflowTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private stateManager: StateManager;
    private projectState: ProjectState | undefined;
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(private workspaceRoot: string, private stateEventBus?: StateEventBus) {
        this.outputChannel = vscode.window.createOutputChannel('Claude Workflow Manager - Tree');
        this.log('🌳 WorkflowTreeProvider CONSTRUCTOR');
        this.log('📁 Workspace Root:', workspaceRoot);
        this.stateManager = new StateManager(workspaceRoot);
        this.initializeWatchers();
        this.setupStateEventListeners();
        this.log('✅ WorkflowTreeProvider initialized successfully');
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

    private async initializeWatchers(): Promise<void> {
        const config = vscode.workspace.getConfiguration('claudeWorkflowManager');
        if (config.get<boolean>('autoRefresh', true)) {
            const disposables = await this.stateManager.watchForChanges(() => {
                this.refresh();
                // Emit state change event to webview
                this.emitProjectStateChange();
            });
            
            // Store disposables for cleanup
            this.disposables.push(...disposables);
        }
    }

    private setupStateEventListeners(): void {
        if (!this.stateEventBus) return;

        // Listen for project state changes from webview or other sources
        this.disposables.push(
            this.stateEventBus.on(StateEventType.PROJECT_STATE_CHANGED, () => {
                this.refresh();
            })
        );

        // Listen for epic/story selection events
        this.disposables.push(
            this.stateEventBus.on(StateEventType.EPIC_SELECTED, (event) => {
                if (event.type === StateEventType.EPIC_SELECTED) {
                    const data = event.data as { epicId: string };
                    this.log('🎯 Epic selected:', data.epicId);
                    // Could expand the epic in tree view or highlight it
                }
            })
        );

        this.disposables.push(
            this.stateEventBus.on(StateEventType.STORY_SELECTED, (event) => {
                if (event.type === StateEventType.STORY_SELECTED) {
                    const data = event.data as { storyId: string };
                    this.log('📝 Story selected:', data.storyId);
                    // Could expand the story in tree view or highlight it
                }
            })
        );
    }

    private async emitProjectStateChange(): Promise<void> {
        if (!this.stateEventBus) return;

        try {
            const projectState = await this.stateManager.getProjectState();
            this.stateEventBus.emit(StateEventType.PROJECT_STATE_CHANGED, projectState);
        } catch (error) {
            this.log('Error emitting project state change:', error, 'error');
        }
    }

    refresh(): void {
        this.log('🔄 REFRESH CALLED - Clearing project state and firing tree update');
        this.projectState = undefined; // Clear cached state
        this.log('✅ Project state cleared, firing onDidChangeTreeData event');
        this._onDidChangeTreeData.fire();
        
        // Force immediate re-evaluation to verify refresh works
        setTimeout(() => {
            this.log('🔍 REFRESH VERIFICATION - Checking if tree was updated');
        }, 100);
    }

    getTreeItem(element: WorkflowTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
        try {
            this.log('🔍 GET CHILDREN CALLED');
            this.log('📋 Element:', element?.label || 'ROOT');
            
            if (!this.projectState) {
                this.log('🔄 Loading project state...');
                this.log('📁 Workspace root for StateManager:', this.workspaceRoot);
                
                try {
                    this.projectState = await this.stateManager.getProjectState();
                    this.log('✅ Project state loaded successfully!');
                    this.log('📊 Project state details:', this.projectState);
                    this.log('🔍 Project state type:', typeof this.projectState);
                    this.log('🔍 Project state null?', this.projectState === null);
                    this.log('🔍 Project state undefined?', this.projectState === undefined);
                    
                    if (this.projectState) {
                        this.log('✅ Project state properties:', {
                            name: this.projectState.name,
                            initialized: this.projectState.initialized,
                            epicsLength: this.projectState.epics?.length || 0,
                            hasCurrentEpic: !!this.projectState.currentEpic
                        });
                    }
                } catch (error) {
                    this.log('❌ ERROR loading project state:', error, 'error');
                    this.log('Stack trace:', (error as Error).stack, 'error');
                    this.projectState = undefined;
                }
            }

            if (!element) {
                // Root level - show project
                this.log('🌟 Returning ROOT items');
                const items = this.getRootItems();
                this.log(`📊 Root items count: ${items.length}`);
                items.forEach((item, index) => {
                    this.log(`   ${index + 1}. ${item.label} (${item.itemType})`);
                });
                return items;
            }

            this.log(`🔄 Processing element of type: ${element.itemType}`);
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
                    this.log(`⚠️ Unknown item type: ${element.itemType}`, undefined, 'warn');
                    return [];
            }
        } catch (error) {
            this.log('❌ ERROR in getChildren:', error, 'error');
            this.log('Stack trace:', (error as Error).stack, 'error');
            
            // Return a fallback item to show the error
            return [{
                label: '❌ Error loading items - Check console',
                itemType: 'action',
                contextValue: 'action'
            }];
        }
    }

    private getRootItems(): WorkflowTreeItem[] {
        this.log('🌟 GET ROOT ITEMS - Project State exists:', !!this.projectState);
        
        // CRITICAL FIX: Never return empty array - always show something in tree
        if (!this.projectState) {
            this.log('⚠️ No project state - showing fallback items', undefined, 'warn');
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

        this.log('✅ Project state found - creating project item');
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
        this.log('🏗️ GET PROJECT CHILDREN');
        if (!this.projectState) {
            this.log('⚠️ No project state in getProjectChildren - returning debug info');
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
            this.log('🔧 Project not initialized, adding init action');
            // Show initialization action
            try {
                const initCommand = CommandRegistry.getCommand('initProject');
                this.log('📋 Init command:', initCommand);
                
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
                this.log('✅ Init item created successfully');
            } catch (error) {
                this.log('❌ Error creating init item:', error, 'error');
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
            const statusIcon = epic.status === 'done' ? '✅' : (isActive ? '🔵' : '⚪');
            
            const epicItem: WorkflowTreeItem = {
                label: `${statusIcon} Epic #${epic.id}: ${epic.title}${isActive ? ' (current)' : ''}`,
                collapsibleState: isActive && epic.userStories.length > 0 ? 
                    vscode.TreeItemCollapsibleState.Expanded : 
                    vscode.TreeItemCollapsibleState.Collapsed,
                itemType: 'epic',
                contextValue: 'epic',
                data: epic,
                tooltip: epic.description
            };
            items.push(epicItem);
        }

        // Show plan epics action if no epics exist or if we should have epics but parsing failed
        if (this.projectState.epics.length === 0) {
            if (this.projectState.hasExecutedPlanEpics) {
                // Plan Epics was executed but no epics found - show info + reparse option
                const infoItem: WorkflowTreeItem = {
                    label: '⚠️ Plan Epics executed but no epics found',
                    iconPath: new vscode.ThemeIcon('warning'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    itemType: 'info',
                    contextValue: 'info',
                    tooltip: 'Plan Epics was executed but EPICS.md might be empty or malformed'
                };
                items.push(infoItem);
                
                const refreshItem: WorkflowTreeItem = {
                    label: '🔄 Refresh epic parsing',
                    command: {
                        command: 'claudeWorkflow.refresh',
                        title: 'Refresh'
                    },
                    itemType: 'action',
                    contextValue: 'action',
                    tooltip: 'Force refresh epic parsing from EPICS.md'
                };
                items.push(refreshItem);
            } else {
                // No epics and Plan Epics not executed - show plan option
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
            if (epic.userStories.length > 0) {
                const storiesItem: WorkflowTreeItem = {
                    label: `📝 Stories (${epic.userStories.length})`,
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
        
        return epic.userStories.map((story: any) => {
            const isActive = this.projectState?.currentStory?.id === story.id;
            const priorityIcon = priorityIcons[story.priority as keyof typeof priorityIcons] || '⚫';
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

    /**
     * Wait for project initialization to complete using intelligent polling
     */
    async waitForInitialization(timeoutMs?: number): Promise<boolean> {
        return this.stateManager.waitForInitialization(timeoutMs);
    }

    /**
     * Wait for project initialization with comprehensive validation
     */
    async waitForInitializationWithValidation(timeoutMs?: number): Promise<{ success: boolean; validation?: { valid: boolean; missingFiles: string[]; invalidFiles: string[] } }> {
        return this.stateManager.waitForInitializationWithValidation(timeoutMs);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}