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

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.parsers = {
            project: new ProjectParser(),
            epic: new EpicParser(),
            story: new StoryParser()
        };
    }

    async getProjectState(): Promise<ProjectState> {
        const state: ProjectState = {
            initialized: false,
            epics: [],
            hasFeedback: false,
            hasChallenge: false,
            hasStatus: false
        };

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

        return state;
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
}