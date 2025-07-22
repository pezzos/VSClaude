/**
 * Communication protocol between the webview and extension
 */

import { ProjectStatus } from '../types';

export enum MessageType {
    // From webview to extension
    EXECUTE_COMMAND = 'executeCommand',
    GET_PROJECT_STATE = 'getProjectState',
    GET_COMMAND_HISTORY = 'getCommandHistory',
    
    // From extension to webview
    PROJECT_STATE_UPDATE = 'projectStateUpdate',
    COMMAND_STATUS_UPDATE = 'commandStatusUpdate',
    OUTPUT_LOG_UPDATE = 'outputLogUpdate',
    THEME_UPDATE = 'themeUpdate',
    LOG_ENTRY_STREAM = 'logEntryStream',
    INIT_PROGRESS_UPDATE = 'initProgressUpdate'
}

export enum CommandStatus {
    PENDING = 'pending',
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

// Base message interface
export interface BaseMessage {
    id: string;
    type: MessageType;
    timestamp: number;
}

// Request messages (webview → extension)
export interface ExecuteCommandRequest extends BaseMessage {
    type: MessageType.EXECUTE_COMMAND;
    command: string;
    args?: string[];
}

export interface GetProjectStateRequest extends BaseMessage {
    type: MessageType.GET_PROJECT_STATE;
}

export interface GetCommandHistoryRequest extends BaseMessage {
    type: MessageType.GET_COMMAND_HISTORY;
}

// Response/notification messages (extension → webview)
export interface ProjectStateUpdateMessage extends BaseMessage {
    type: MessageType.PROJECT_STATE_UPDATE;
    state: SerializableProjectState;
}

export interface CommandStatusUpdateMessage extends BaseMessage {
    type: MessageType.COMMAND_STATUS_UPDATE;
    commandId: string;
    command: string;
    status: CommandStatus;
    output?: string;
    error?: string;
    progress?: number;
}

export interface OutputLogUpdateMessage extends BaseMessage {
    type: MessageType.OUTPUT_LOG_UPDATE;
    logs: LogEntry[];
}

export interface ThemeUpdateMessage extends BaseMessage {
    type: MessageType.THEME_UPDATE;
    theme: 'light' | 'dark' | 'high-contrast';
}

export interface LogEntryStreamMessage extends BaseMessage {
    type: MessageType.LOG_ENTRY_STREAM;
    logEntry: SerializableLogEntry;
    commandId: string;
}

export interface InitProgressUpdateMessage extends BaseMessage {
    type: MessageType.INIT_PROGRESS_UPDATE;
    progress: number;
    status: string;
    logs: SerializableLogEntry[];
}

export interface CommandHistoryUpdateMessage extends BaseMessage {
    type: MessageType.COMMAND_STATUS_UPDATE;
    commandHistory: CommandHistoryEntry[];
}

// Serializable data structures (without VSCode-specific classes)
export interface SerializableProjectState {
    isInitialized: boolean;
    status: ProjectStatus;
    currentProjectPath: string | null;
    currentEpic: SerializableEpic | null;
    currentStory: SerializableStory | null;
    epics: SerializableEpic[];
    recentCommands: CommandHistoryEntry[];
    lastUpdated: number;
    // Additional state for button visibility logic
    hasFeedback: boolean;
    hasChallenge: boolean;
    hasStatus: boolean;
}

export interface SerializableEpic {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'in-progress' | 'completed';
    stories: SerializableStory[];
    createdAt: number;
    updatedAt: number;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
}

export interface SerializableStory {
    id: string;
    name: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    tickets: SerializableTicket[];
    epicId: string;
    createdAt: number;
    updatedAt: number;
    estimatedHours?: number;
    actualHours?: number;
    acceptanceCriteria: string[];
}

export interface SerializableTicket {
    id: string;
    name: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    storyId: string;
    createdAt: number;
    updatedAt: number;
    assignee?: string;
    labels: string[];
}

export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    source?: string;
    details?: unknown;
}

export interface SerializableLogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    source?: string;
    details?: unknown;
    commandId?: string;
    streamIndex?: number;
}

export interface CommandHistoryEntry {
    id: string;
    command: string;
    args: string[];
    status: CommandStatus;
    startTime: number;
    endTime?: number;
    output?: string;
    error?: string;
}

// Type union for all message types
export type WebviewMessage = 
    | ExecuteCommandRequest
    | GetProjectStateRequest
    | GetCommandHistoryRequest
    | ProjectStateUpdateMessage
    | CommandStatusUpdateMessage
    | OutputLogUpdateMessage
    | ThemeUpdateMessage
    | CommandHistoryUpdateMessage
    | LogEntryStreamMessage
    | InitProgressUpdateMessage;

// Type guards for message validation
export function isExecuteCommandRequest(message: unknown): message is ExecuteCommandRequest {
    return (message as Record<string, unknown>)?.type === MessageType.EXECUTE_COMMAND && 
           typeof (message as Record<string, unknown>)?.command === 'string';
}

export function isGetProjectStateRequest(message: unknown): message is GetProjectStateRequest {
    return (message as Record<string, unknown>)?.type === MessageType.GET_PROJECT_STATE;
}

export function isGetCommandHistoryRequest(message: unknown): message is GetCommandHistoryRequest {
    return (message as Record<string, unknown>)?.type === MessageType.GET_COMMAND_HISTORY;
}

export function isProjectStateUpdateMessage(message: unknown): message is ProjectStateUpdateMessage {
    const msg = message as Record<string, unknown>;
    const state = msg.state as Record<string, unknown> | undefined;
    return msg?.type === MessageType.PROJECT_STATE_UPDATE && 
           !!state && 
           typeof state.isInitialized === 'boolean';
}

export function isCommandStatusUpdateMessage(message: unknown): message is CommandStatusUpdateMessage {
    const msg = message as Record<string, unknown>;
    return msg?.type === MessageType.COMMAND_STATUS_UPDATE && 
           typeof msg?.commandId === 'string' && 
           typeof msg?.status === 'string';
}

export function isLogEntryStreamMessage(message: unknown): message is LogEntryStreamMessage {
    const msg = message as Record<string, unknown>;
    return msg?.type === MessageType.LOG_ENTRY_STREAM && 
           typeof msg?.commandId === 'string' && 
           !!msg?.logEntry;
}

export function isInitProgressUpdateMessage(message: unknown): message is InitProgressUpdateMessage {
    const msg = message as Record<string, unknown>;
    return msg?.type === MessageType.INIT_PROGRESS_UPDATE && 
           typeof msg?.progress === 'number' && 
           typeof msg?.status === 'string' && 
           Array.isArray(msg?.logs);
}

// Utility functions for creating messages
export function createMessage<T extends BaseMessage>(
    type: MessageType, 
    data: Omit<T, 'id' | 'timestamp' | 'type'>
): T {
    return {
        id: generateMessageId(),
        type,
        timestamp: Date.now(),
        ...data
    } as T;
}

export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error handling
export interface WebviewError {
    code: string;
    message: string;
    details?: unknown;
}

export class WebviewProtocolError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'WebviewProtocolError';
    }
}