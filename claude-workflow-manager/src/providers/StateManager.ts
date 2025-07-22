import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, Epic, Story } from '../types';
import { ProjectParser } from '../parsers/ProjectParser';
import { EpicParser } from '../parsers/EpicParser';
import { StoryParser } from '../parsers/StoryParser';

export class StateManager {
    private workspaceRoot: string;
    private parsers: {
        project: ProjectParser;
        epic: EpicParser;
        story: StoryParser;
    };
    private initInProgress: boolean = false;

    constructor(workspaceRoot: string) {
        console.log('StateManager constructor, workspaceRoot:', workspaceRoot);
        this.workspaceRoot = workspaceRoot;
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

        // Check if project is initialized
        const readmePath = path.join(this.workspaceRoot, 'README.md');
        const epicsPath = path.join(this.workspaceRoot, 'docs/1-project/EPICS.md');
        
        if (await this.fileExists(readmePath)) {
            state.name = await this.extractProjectName(readmePath);
        }

        if (await this.fileExists(epicsPath)) {
            state.initialized = true;
            state.epics = await this.loadEpics();
            state.currentEpic = await this.getCurrentEpic();
            
            if (state.currentEpic) {
                state.currentStory = await this.getCurrentStory(state.currentEpic);
            }
        }

        // Check update command availability
        state.hasFeedback = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/FEEDBACK.md'));
        state.hasChallenge = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/CHALLENGE.md'));
        state.hasStatus = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/STATUS.md'));

        console.log('Final state:', state);
        return state;
    }

    async canImportFeedback(): Promise<boolean> {
        return !this.initInProgress && await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/EPICS.md'));
    }

    async canPlanEpics(): Promise<boolean> {
        const feedbackExists = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/FEEDBACK.md'));
        const epicsExists = await this.fileExists(path.join(this.workspaceRoot, 'docs/1-project/EPICS.md'));
        return !this.initInProgress && feedbackExists && epicsExists;
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
                    // Check if initialization is complete
                    const epicsPath = path.join(this.workspaceRoot, 'docs/1-project/EPICS.md');
                    const readmePath = path.join(this.workspaceRoot, 'README.md');
                    
                    const epicsExists = await this.fileExists(epicsPath);
                    const readmeExists = await this.fileExists(readmePath);
                    
                    console.log(`📋 Polling check: EPICS.md=${epicsExists}, README.md=${readmeExists}`);
                    
                    if (epicsExists && readmeExists) {
                        // Additional validation: check if files have content
                        const epicsValid = await this.validateFileContent(epicsPath);
                        const readmeValid = await this.validateFileContent(readmePath);
                        
                        console.log(`✅ Content validation: EPICS.md=${epicsValid}, README.md=${readmeValid}`);
                        
                        if (epicsValid && readmeValid) {
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
        const requiredFiles = [
            'README.md',
            'docs/1-project/EPICS.md',
            'docs/1-project/ROADMAP.md'
        ];

        const missingFiles: string[] = [];
        const invalidFiles: string[] = [];

        console.log('🔍 Validating complete project structure...');

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
        console.log(`📊 Project validation result: ${valid ? 'VALID' : 'INVALID'}`);
        
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
}