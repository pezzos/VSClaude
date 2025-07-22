/**
 * Centralized event bus for coordinating state between webview and tree provider
 */

import * as vscode from 'vscode';
import { SerializableProjectState, LogEntry } from './protocol';

export enum StateEventType {
    PROJECT_STATE_CHANGED = 'projectStateChanged',
    COMMAND_STARTED = 'commandStarted',
    COMMAND_PROGRESS = 'commandProgress',
    COMMAND_COMPLETED = 'commandCompleted',
    COMMAND_FAILED = 'commandFailed',
    LOG_ENTRY_ADDED = 'logEntryAdded',
    EPIC_SELECTED = 'epicSelected',
    STORY_SELECTED = 'storySelected',
    THEME_CHANGED = 'themeChanged'
}

export interface StateEvent {
    type: StateEventType;
    timestamp: number;
    data: unknown;
}

export interface ProjectStateChangedEvent extends StateEvent {
    type: StateEventType.PROJECT_STATE_CHANGED;
    data: SerializableProjectState;
}

export interface CommandStartedEvent extends StateEvent {
    type: StateEventType.COMMAND_STARTED;
    data: {
        commandId: string;
        command: string;
        args: string[];
    };
}

export interface CommandProgressEvent extends StateEvent {
    type: StateEventType.COMMAND_PROGRESS;
    data: {
        commandId: string;
        progress: number;
        message?: string;
    };
}

export interface CommandCompletedEvent extends StateEvent {
    type: StateEventType.COMMAND_COMPLETED;
    data: {
        commandId: string;
        output?: string;
        duration: number;
    };
}

export interface CommandFailedEvent extends StateEvent {
    type: StateEventType.COMMAND_FAILED;
    data: {
        commandId: string;
        error: string;
        duration: number;
    };
}

export interface LogEntryAddedEvent extends StateEvent {
    type: StateEventType.LOG_ENTRY_ADDED;
    data: LogEntry;
}

export interface EpicSelectedEvent extends StateEvent {
    type: StateEventType.EPIC_SELECTED;
    data: {
        epicId: string;
    };
}

export interface StorySelectedEvent extends StateEvent {
    type: StateEventType.STORY_SELECTED;
    data: {
        storyId: string;
    };
}

export interface ThemeChangedEvent extends StateEvent {
    type: StateEventType.THEME_CHANGED;
    data: {
        theme: 'light' | 'dark' | 'high-contrast';
    };
}

type StateEventData = 
    | ProjectStateChangedEvent
    | CommandStartedEvent
    | CommandProgressEvent
    | CommandCompletedEvent
    | CommandFailedEvent
    | LogEntryAddedEvent
    | EpicSelectedEvent
    | StorySelectedEvent
    | ThemeChangedEvent;

export type StateEventListener<T = StateEventData> = (event: T) => void;

/**
 * Centralized event bus for managing state changes across the extension
 */
export class StateEventBus {
    private readonly eventEmitters: Map<StateEventType, vscode.EventEmitter<StateEventData>>;
    private readonly disposables: vscode.Disposable[] = [];
    private readonly eventHistory: StateEventData[] = [];
    private readonly maxHistorySize = 100;

    constructor() {
        this.eventEmitters = new Map();
        
        // Initialize event emitters for each event type
        Object.values(StateEventType).forEach(eventType => {
            this.eventEmitters.set(eventType, new vscode.EventEmitter<StateEventData>());
        });

        // Listen for VSCode theme changes
        this.disposables.push(
            vscode.window.onDidChangeActiveColorTheme(() => {
                this.emit(StateEventType.THEME_CHANGED, {
                    theme: this.getCurrentTheme()
                });
            })
        );
    }

    /**
     * Emit an event to all registered listeners
     */
    emit<T extends StateEventData>(type: StateEventType, data: Omit<T['data'], never>): void {
        const event: StateEventData = {
            type,
            timestamp: Date.now(),
            data
        } as T;

        // Add to history
        this.addToHistory(event);

        // Emit to listeners
        const emitter = this.eventEmitters.get(type);
        if (emitter) {
            emitter.fire(event);
        }
    }

    /**
     * Subscribe to events of a specific type
     */
    on<T extends StateEventData>(
        type: StateEventType, 
        listener: StateEventListener<T>
    ): vscode.Disposable {
        const emitter = this.eventEmitters.get(type);
        if (!emitter) {
            throw new Error(`Unknown event type: ${type}`);
        }

        return emitter.event(listener as StateEventListener<StateEventData>);
    }

    /**
     * Subscribe to all events
     */
    onAny(listener: StateEventListener<StateEventData>): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        
        this.eventEmitters.forEach(emitter => {
            disposables.push(emitter.event(listener));
        });

        return {
            dispose: () => {
                disposables.forEach(d => d.dispose());
            }
        };
    }

    /**
     * Get recent event history
     */
    getEventHistory(count?: number): StateEventData[] {
        const limit = count || this.maxHistorySize;
        return this.eventHistory.slice(-limit);
    }

    /**
     * Get events of a specific type from history
     */
    getEventsByType<T extends StateEventData>(
        type: StateEventType, 
        count?: number
    ): T[] {
        const events = this.eventHistory
            .filter(event => event.type === type)
            .slice(-(count || 10));
        return events as T[];
    }

    /**
     * Clear event history
     */
    clearHistory(): void {
        this.eventHistory.length = 0;
    }

    /**
     * Get the current VSCode theme
     */
    private getCurrentTheme(): 'light' | 'dark' | 'high-contrast' {
        const theme = vscode.window.activeColorTheme;
        switch (theme.kind) {
            case vscode.ColorThemeKind.Light:
                return 'light';
            case vscode.ColorThemeKind.Dark:
                return 'dark';
            case vscode.ColorThemeKind.HighContrast:
                return 'high-contrast';
            default:
                return 'dark';
        }
    }

    /**
     * Add event to history with size limit
     */
    private addToHistory(event: StateEventData): void {
        this.eventHistory.push(event);
        
        // Maintain history size limit
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * Dispose all resources
     */
    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.eventEmitters.forEach(emitter => emitter.dispose());
        this.eventEmitters.clear();
        this.eventHistory.length = 0;
    }
}

/**
 * Debounce utility for preventing rapid event emissions
 */
export class DebouncedEventEmitter {
    private timeout: NodeJS.Timeout | undefined;
    private readonly eventBus: StateEventBus;
    private readonly delay: number;

    constructor(eventBus: StateEventBus, delay: number = 300) {
        this.eventBus = eventBus;
        this.delay = delay;
    }

    emit<T extends StateEventData>(type: StateEventType, data: Omit<T['data'], never>): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.eventBus.emit(type, data);
            this.timeout = undefined;
        }, this.delay);
    }

    dispose(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }
}