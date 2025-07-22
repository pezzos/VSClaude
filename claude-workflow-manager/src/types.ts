import * as vscode from 'vscode';

export enum ProjectStatus {
    NOT_INITIALIZED = 'not_initialized',
    INITIALIZING = 'initializing',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

export interface ProjectState {
    initialized: boolean;
    name?: string;
    currentEpic?: Epic;
    currentStory?: Story;
    epics: Epic[];
    hasFeedback: boolean;
    hasChallenge: boolean;
    hasStatus: boolean;
    // New fields for command execution tracking
    hasValidFeedback: boolean;
    hasExecutedImportFeedback: boolean;
    hasExecutedPlanEpics: boolean;
    // Epic titles list for display
    epicTitles: string[];
}

export interface Epic {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    status: 'backlog' | 'todo' | 'in_progress' | 'done';
    dependencies: string[];
    description?: string;
    userStories: UserStory[];
    filePath?: string;
}

export interface EpicsCache {
    epics: Epic[];
    metadata: {
        version: string;
        lastUpdated: string;
        totalEpics: number;
        totalUserStories: number;
        statusSummary: {
            backlog: number;
            todo: number;
            in_progress: number;
            done: number;
        };
    };
}

export interface UserStory {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    acceptanceCriteria: string[];
}

export interface Story {
    id: string;
    title: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    status: 'planned' | 'active' | 'completed';
    description?: string;
    tickets: Ticket[];
    epicId: string;
}

export interface Ticket {
    id: string;
    title: string;
    status: 'planned' | 'in_progress' | 'completed';
    description?: string;
    storyId: string;
}

export interface WorkflowTreeItem extends vscode.TreeItem {
    itemType: 'project' | 'action' | 'epic' | 'story' | 'ticket' | 'collection' | 'info';
    data?: Epic | Story | Ticket;
    command?: vscode.Command;
}

export interface ClaudeCommand {
    id: string;
    title: string;
    command: string;
    description?: string;
    icon?: string;
    contextValue?: string;
}

export interface FileParseResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface OutputLogItem extends vscode.TreeItem {
    id: string;
    commandText: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    stdout: string;
    stderr: string;
    exitCode?: number;
    duration?: number;
    itemType: 'command' | 'output' | 'error' | 'output_block' | 'error_block';
}