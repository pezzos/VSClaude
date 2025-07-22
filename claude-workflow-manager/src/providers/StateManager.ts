import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, Epic, Story } from '../types';
import { ProjectParser } from '../parsers/ProjectParser';
import { EpicParser } from '../parsers/EpicParser';
import { StoryParser } from '../parsers/StoryParser';

/**
 * Interface for persisted state data stored in .claude-wm/state.json
 */
interface PersistedState {
    isInitialized: boolean;
    lastInitDate?: number;
    commandHistory: Array<{
        command: string;
        timestamp: number;
        success: boolean;
        output?: string;
        duration?: number;
    }>;
    projectMetadata: {
        name?: string;
        version?: string;
        description?: string;
    };
    settings: {
        autoSave: boolean;
        logRetentionDays: number;
    };
    lastUpdated: number;
}

export class StateManager {
    private workspaceRoot: string;
    private parsers: {
        project: ProjectParser;
        epic: EpicParser;
        story: StoryParser;
    };
    private initInProgress: boolean = false;
    private stateFilePath: string;

    constructor(workspaceRoot: string) {
        console.log('StateManager constructor, workspaceRoot:', workspaceRoot);
        this.workspaceRoot = workspaceRoot;
        this.stateFilePath = path.join(workspaceRoot, '.claude-wm', 'state.json');
        this.parsers = {
            project: new ProjectParser(),
            epic: new EpicParser(),
            story: new StoryParser()
        };
    }

    async getProjectState(): Promise<ProjectState> {
        console.log('getProjectState called');
        const state: ProjectState = {
            initialized: false,
            epics: [],
            hasFeedback: false,
            hasChallenge: false,
            hasStatus: false
        };
        console.log('Initial state created:', state);

        // Check if project is initialized - adapt to VSClaude structure
        const readmePath = path.join(this.workspaceRoot, 'README.md');
        
        // For VSClaude: look for the actual project structure indicators
        const vscodeInitIndicators = [
            'docs/1-project/PROJECT_VISION.md',
            'docs/1-project/ROADMAP.md',
            'docs/2-current-epic/PRD.md'
        ];
        
        // Legacy detection for standard Claude Code projects
        const legacyEpicsPath = path.join(this.workspaceRoot, 'docs/1-project/EPICS.md');
        
        if (await this.fileExists(readmePath)) {
            state.name = await this.extractProjectName(readmePath);
        }

        // Check initialization using VSClaude structure first
        const vscodeStructureExists = await Promise.all(
            vscodeInitIndicators.map(indicator => 
                this.fileExists(path.join(this.workspaceRoot, indicator))
            )
        );
        
        const hasVSCodeStructure = vscodeStructureExists.some(exists => exists);
        const hasLegacyStructure = await this.fileExists(legacyEpicsPath);
        
        console.log('🔍 Project structure detection:', {
            hasVSCodeStructure,
            hasLegacyStructure,
            vscodeFiles: vscodeInitIndicators.map((file, i) => ({ file, exists: vscodeStructureExists[i] }))
        });

        if (hasVSCodeStructure || hasLegacyStructure) {
            state.initialized = true;
            console.log('✅ Project detected as initialized');
            
            // Load epics from appropriate source
            if (hasLegacyStructure) {
                state.epics = await this.loadEpics();
            } else {
                // For VSClaude, epics might be in different format/location
                state.epics = await this.loadVSClaudeEpics();
            }
            
            state.currentEpic = await this.getCurrentEpic();
            
            if (state.currentEpic) {
                state.currentStory = await this.getCurrentStory(state.currentEpic);
            }
        } else {
            console.log('❌ Project not detected as initialized');
        }

        // Check update command availability
        state.hasFeedback = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/FEEDBACK.md'));
        state.hasChallenge = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/CHALLENGE.md'));
        state.hasStatus = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/STATUS.md'));

        console.log('Final state:', state);
        return state;
    }

    async canImportFeedback(): Promise<boolean> {
        if (this.initInProgress) return false;
        
        // Check for either legacy or VSClaude structure
        const legacyEpicsExists = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/EPICS.md'));
        const vscodeInitialized = await this.isVSClaudeInitialized();
        
        return legacyEpicsExists || vscodeInitialized;
    }

    async canPlanEpics(): Promise<boolean> {
        if (this.initInProgress) return false;
        
        const feedbackExists = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/FEEDBACK.md'));
        
        // Check for either legacy or VSClaude structure
        const legacyEpicsExists = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/EPICS.md'));
        const vscodeInitialized = await this.isVSClaudeInitialized();
        
        return feedbackExists && (legacyEpicsExists || vscodeInitialized);
    }

    getInitInProgress(): boolean {
        return this.initInProgress;
    }

    setInitInProgress(inProgress: boolean): void {
        this.initInProgress = inProgress;
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private async extractProjectName(readmePath: string): Promise<string> {
        try {
            const content = await fs.promises.readFile(readmePath, 'utf8');
            const match = content.match(/^# (.+)$/m);
            return match ? match[1].trim() : 'Project';
        } catch {
            return 'Project';
        }
    }

    private async loadEpics(): Promise<Epic[]> {
        const epicsPath = path.join(this.workspaceRoot, 'docs/1-project/EPICS.md');
        if (!await this.fileExists(epicsPath)) {
            return [];
        }

        try {
            const content = await fs.promises.readFile(epicsPath, 'utf8');
            const parseResult = this.parsers.project.parseEpics(content);
            return parseResult.success ? parseResult.data! : [];
        } catch (error) {
            console.error('Error loading epics:', error);
            return [];
        }
    }

    private async getCurrentEpic(): Promise<Epic | undefined> {
        const prdPath = path.join(this.workspaceRoot, 'docs/2-current-epic/PRD.md');
        if (!await this.fileExists(prdPath)) {
            return undefined;
        }

        try {
            const content = await fs.promises.readFile(prdPath, 'utf8');
            const parseResult = this.parsers.epic.parseEpic(content);
            if (parseResult.success && parseResult.data) {
                const epic = parseResult.data;
                epic.stories = await this.loadStoriesForEpic(epic.id);
                return epic;
            }
        } catch (error) {
            console.error('Error loading current epic:', error);
        }

        return undefined;
    }

    private async loadStoriesForEpic(epicId: string): Promise<Story[]> {
        const storiesPath = path.join(this.workspaceRoot, 'docs/2-current-epic/STORIES.md');
        if (!await this.fileExists(storiesPath)) {
            return [];
        }

        try {
            const content = await fs.promises.readFile(storiesPath, 'utf8');
            const parseResult = this.parsers.story.parseStories(content);
            if (parseResult.success && parseResult.data) {
                return parseResult.data.map(story => ({
                    ...story,
                    epicId
                }));
            }
        } catch (error) {
            console.error('Error loading stories:', error);
        }

        return [];
    }

    private async getCurrentStory(epic: Epic): Promise<Story | undefined> {
        const currentTaskPath = path.join(this.workspaceRoot, 'docs/3-current-task');
        if (!await this.fileExists(currentTaskPath)) {
            return undefined;
        }

        // Look for STORY.md in current task directory
        const storyPath = path.join(currentTaskPath, 'STORY.md');
        if (!await this.fileExists(storyPath)) {
            return undefined;
        }

        try {
            const content = await fs.promises.readFile(storyPath, 'utf8');
            const parseResult = this.parsers.story.parseStory(content);
            if (parseResult.success && parseResult.data) {
                return {
                    ...parseResult.data,
                    epicId: epic.id
                };
            }
        } catch (error) {
            console.error('Error loading current story:', error);
        }

        return undefined;
    }

    /**
     * Check if VSClaude project structure indicates initialization
     */
    private async isVSClaudeInitialized(): Promise<boolean> {
        const vscodeInitIndicators = [
            'docs/1-project/PROJECT_VISION.md',
            'docs/1-project/ROADMAP.md',
            'docs/2-current-epic/PRD.md'
        ];
        
        const existsChecks = await Promise.all(
            vscodeInitIndicators.map(indicator => 
                this.fileExists(path.join(this.workspaceRoot, indicator))
            )
        );
        
        return existsChecks.some(exists => exists);
    }

    /**
     * Load epics from VSClaude project structure
     */
    private async loadVSClaudeEpics(): Promise<Epic[]> {
        // For VSClaude structure, we might need to extract epics from different sources
        // For now, try to extract from ROADMAP.md or other available documents
        const prdPath = path.join(this.workspaceRoot, 'docs/2-current-epic/PRD.md');
        
        const epics: Epic[] = [];
        
        // Try to extract epic information from current PRD
        if (await this.fileExists(prdPath)) {
            try {
                const content = await fs.promises.readFile(prdPath, 'utf8');
                const parseResult = this.parsers.epic.parseEpic(content);
                if (parseResult.success && parseResult.data) {
                    const epic = parseResult.data;
                    epic.stories = await this.loadStoriesForEpic(epic.id);
                    epics.push(epic);
                }
            } catch (error) {
                console.error('Error loading VSClaude epic from PRD:', error);
            }
        }
        
        // TODO: In the future, might parse ROADMAP.md for additional epics
        
        return epics;
    }

    async watchForChanges(onStateChanged: () => void): Promise<vscode.Disposable[]> {
        const disposables: vscode.Disposable[] = [];
        
        // Watch key directories and files
        const watchPaths = [
            'docs/1-project/**/*.md',
            'docs/2-current-epic/**/*.md',
            'docs/3-current-task/**/*.md',
            'README.md'
        ];

        for (const pattern of watchPaths) {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(this.workspaceRoot, pattern)
            );

            watcher.onDidCreate(onStateChanged);
            watcher.onDidChange(onStateChanged);
            watcher.onDidDelete(onStateChanged);

            disposables.push(watcher);
        }

        return disposables;
    }

    /**
     * Waits for project initialization to complete with intelligent polling
     * Returns true when initialization is detected, false on timeout
     */
    async waitForInitialization(timeoutMs: number = 300000): Promise<boolean> {
        const startTime = Date.now();
        const pollInterval = 2000; // Check every 2 seconds
        console.log('🔄 Starting intelligent polling for project initialization...');
        
        return new Promise((resolve) => {
            const poll = async () => {
                try {
                    // Check if initialization is complete using new detection logic
                    const readmePath = path.join(this.workspaceRoot, 'README.md');
                    const readmeExists = await this.fileExists(readmePath);
                    
                    // Check for both legacy and VSClaude structures
                    const legacyEpicsPath = path.join(this.workspaceRoot, 'docs/1-project/EPICS.md');
                    const legacyExists = await this.fileExists(legacyEpicsPath);
                    const vscodeInitialized = await this.isVSClaudeInitialized();
                    
                    console.log(`📋 Polling check: README.md=${readmeExists}, Legacy=${legacyExists}, VSCode=${vscodeInitialized}`);
                    
                    if (readmeExists && (legacyExists || vscodeInitialized)) {
                        // Additional validation: check if files have content
                        const readmeValid = await this.validateFileContent(readmePath);
                        
                        let structureValid = false;
                        if (legacyExists) {
                            structureValid = await this.validateFileContent(legacyEpicsPath);
                        } else if (vscodeInitialized) {
                            // Validate VSClaude structure
                            const prdPath = path.join(this.workspaceRoot, 'docs/2-current-epic/PRD.md');
                            const roadmapPath = path.join(this.workspaceRoot, 'docs/1-project/ROADMAP.md');
                            
                            const prdValid = await this.fileExists(prdPath) ? await this.validateFileContent(prdPath) : false;
                            const roadmapValid = await this.fileExists(roadmapPath) ? await this.validateFileContent(roadmapPath) : false;
                            structureValid = prdValid || roadmapValid;
                        }
                        
                        console.log(`✅ Content validation: README.md=${readmeValid}, Structure=${structureValid}`);
                        
                        if (readmeValid && structureValid) {
                            console.log('🎉 Project initialization completed successfully!');
                            resolve(true);
                            return;
                        }
                    }
                    
                    // Check timeout
                    if (Date.now() - startTime > timeoutMs) {
                        console.log('⏰ Timeout reached waiting for initialization');
                        resolve(false);
                        return;
                    }
                    
                    // Continue polling
                    setTimeout(poll, pollInterval);
                } catch (error) {
                    console.error('❌ Error during polling:', error);
                    setTimeout(poll, pollInterval);
                }
            };
            
            // Start first poll
            poll();
        });
    }

    /**
     * Validates that a file exists and has meaningful content
     */
    private async validateFileContent(filePath: string): Promise<boolean> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const trimmedContent = content.trim();
            
            // File must have at least 50 characters of meaningful content
            return trimmedContent.length > 50 && !trimmedContent.includes('placeholder');
        } catch {
            return false;
        }
    }

    /**
     * Comprehensive validation of project structure after initialization
     */
    async validateProjectStructure(): Promise<{ valid: boolean; missingFiles: string[]; invalidFiles: string[] }> {
        // Define structure for both legacy and VSClaude projects
        const legacyRequiredFiles = [
            'README.md',
            'docs/1-project/EPICS.md',
            'docs/1-project/ROADMAP.md'
        ];
        
        const vscodeRequiredFiles = [
            'README.md',
            'docs/1-project/PROJECT_VISION.md',
            'docs/1-project/ROADMAP.md',
            'docs/2-current-epic/PRD.md'
        ];

        const missingFiles: string[] = [];
        const invalidFiles: string[] = [];

        console.log('🔍 Validating complete project structure...');

        // Determine which structure to validate based on what exists
        const legacyExists = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/EPICS.md'));
        const vscodeExists = await this.isVSClaudeInitialized();
        
        let requiredFiles: string[];
        let structureType: string;
        
        if (legacyExists) {
            requiredFiles = legacyRequiredFiles;
            structureType = 'Legacy Claude Code';
        } else if (vscodeExists) {
            requiredFiles = vscodeRequiredFiles;
            structureType = 'VSClaude';
        } else {
            // Try VSClaude structure as default
            requiredFiles = vscodeRequiredFiles;
            structureType = 'VSClaude (default)';
        }
        
        console.log(`🏗️ Validating ${structureType} project structure`);

        for (const relativePath of requiredFiles) {
            const fullPath = path.join(this.workspaceRoot, relativePath);
            
            if (!await this.fileExists(fullPath)) {
                missingFiles.push(relativePath);
                console.log(`❌ Missing file: ${relativePath}`);
            } else {
                const isValid = await this.validateFileContent(fullPath);
                if (!isValid) {
                    invalidFiles.push(relativePath);
                    console.log(`⚠️ Invalid content in: ${relativePath}`);
                } else {
                    console.log(`✅ Valid file: ${relativePath}`);
                }
            }
        }

        const valid = missingFiles.length === 0 && invalidFiles.length === 0;
        console.log(`📊 ${structureType} project validation result: ${valid ? 'VALID' : 'INVALID'}`);
        
        return { valid, missingFiles, invalidFiles };
    }

    /**
     * Wait for project initialization with enhanced validation
     */
    async waitForInitializationWithValidation(timeoutMs: number = 300000): Promise<{ success: boolean; validation?: { valid: boolean; missingFiles: string[]; invalidFiles: string[] } }> {
        const basicSuccess = await this.waitForInitialization(timeoutMs);
        
        if (!basicSuccess) {
            return { success: false };
        }

        // Perform comprehensive validation
        const validation = await this.validateProjectStructure();
        
        return { 
            success: validation.valid, 
            validation 
        };
    }

    // ======================== STATE PERSISTENCE ========================

    /**
     * Load persisted state from .claude-wm/state.json
     */
    async loadPersistedState(): Promise<PersistedState | null> {
        try {
            if (!await this.fileExists(this.stateFilePath)) {
                console.log('📁 No persisted state file found');
                return null;
            }

            const content = await fs.promises.readFile(this.stateFilePath, 'utf8');
            const state: PersistedState = JSON.parse(content);
            
            console.log('📤 Loaded persisted state:', {
                isInitialized: state.isInitialized,
                commandHistoryLength: state.commandHistory?.length || 0,
                lastUpdated: new Date(state.lastUpdated).toISOString()
            });
            
            return state;
        } catch (error) {
            console.error('❌ Error loading persisted state:', error);
            return null;
        }
    }

    /**
     * Save current state to .claude-wm/state.json
     */
    async savePersistedState(projectState: ProjectState, commandHistory: Array<{ command: string; timestamp: number; success: boolean; output?: string; duration?: number }> = []): Promise<void> {
        try {
            // Ensure .claude-wm directory exists
            const stateDir = path.dirname(this.stateFilePath);
            await fs.promises.mkdir(stateDir, { recursive: true });

            const persistedState: PersistedState = {
                isInitialized: projectState.initialized,
                lastInitDate: projectState.initialized ? Date.now() : undefined,
                commandHistory: commandHistory.slice(-50), // Keep last 50 commands
                projectMetadata: {
                    name: projectState.name,
                    version: '1.0.0',
                    description: 'Claude Workflow Manager Project'
                },
                settings: {
                    autoSave: true,
                    logRetentionDays: 30
                },
                lastUpdated: Date.now()
            };

            await fs.promises.writeFile(
                this.stateFilePath, 
                JSON.stringify(persistedState, null, 2), 
                'utf8'
            );

            console.log('💾 State persisted successfully to:', this.stateFilePath);
        } catch (error) {
            console.error('❌ Error saving persisted state:', error);
        }
    }

    /**
     * Enhanced getProjectState that uses persisted state
     */
    async getProjectStateWithPersistence(): Promise<ProjectState> {
        // Get current filesystem-based state
        const currentState = await this.getProjectState();
        
        // Load persisted state for additional context
        const persistedState = await this.loadPersistedState();
        
        if (persistedState) {
            // Check if the filesystem state indicates initialization but persisted state doesn't
            if (currentState.initialized && !persistedState.isInitialized) {
                console.log('🔄 Detected new initialization, updating persisted state...');
                persistedState.isInitialized = true;
                persistedState.lastInitDate = Date.now();
            }
            
            // Merge persisted metadata with current state
            // Persist state takes precedence for initialization status if it's more recent
            const enhancedState = {
                ...currentState,
                // Use the most accurate initialization state
                initialized: persistedState.isInitialized || currentState.initialized,
                lastInitDate: persistedState.lastInitDate,
                commandHistory: persistedState.commandHistory
            };
            
            // Auto-save updated state if there were changes
            if (persistedState.isInitialized !== enhancedState.initialized) {
                await this.savePersistedState(enhancedState);
            }
            
            return enhancedState;
        }
        
        return currentState;
    }

    /**
     * Clear persisted state (useful for testing or reset)
     */
    async clearPersistedState(): Promise<void> {
        try {
            if (await this.fileExists(this.stateFilePath)) {
                await fs.promises.unlink(this.stateFilePath);
                console.log('🗑️ Persisted state cleared');
            }
        } catch (error) {
            console.error('❌ Error clearing persisted state:', error);
        }
    }
}