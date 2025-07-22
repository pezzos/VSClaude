import * as vscode from 'vscode';

export interface ProjectState {
    initialized: boolean;
    name?: string;
    currentEpic?: Epic;
    currentStory?: Story;
    epics: Epic[];
    hasFeedback: boolean;
    hasChallenge: boolean;
    hasStatus: boolean;
}

export interface Epic {
    id: string;
    title: string;
    status: 'planned' | 'active' | 'completed';
    description?: string;
    stories: Story[];
    filePath?: string;
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
    itemType: 'project' | 'action' | 'epic' | 'story' | 'ticket' | 'collection';
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