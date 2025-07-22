import { useState, useEffect, useCallback } from 'react';
import { useVSCodeAPI } from './useVSCodeAPI';
import { 
    SerializableProjectState, 
    MessageType, 
    CommandStatus,
    CommandHistoryEntry,
    SerializableLogEntry,
    isLogEntryStreamMessage,
    isInitProgressUpdateMessage
} from '../../../src/webview/protocol';
import { ProjectStatus } from '../../../src/types';

interface ProjectStateHook {
    projectState: SerializableProjectState | null;
    commandHistory: CommandHistoryEntry[];
    activeCommands: Map<string, { command: string; status: CommandStatus; progress?: number }>;
    isLoading: boolean;
    error: string | null;
    refreshProjectState: () => void;
    refreshCommandHistory: () => void;
    initInProgress: boolean;
    initLogs: SerializableLogEntry[];
    streamingCommandId: string | null;
    clearInitLogs: () => void;
}

const initialProjectState: SerializableProjectState = {
    isInitialized: false,
    status: ProjectStatus.NOT_INITIALIZED,
    currentProjectPath: null,
    currentEpic: null,
    currentStory: null,
    epics: [],
    recentCommands: [],
    lastUpdated: Date.now()
};

export function useProjectState(): ProjectStateHook {
    const [projectState, setProjectState] = useState<SerializableProjectState | null>(null);
    const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
    const [activeCommands, setActiveCommands] = useState(new Map<string, { command: string; status: CommandStatus; progress?: number }>());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initInProgress, setInitInProgress] = useState(false);
    const [initLogs, setInitLogs] = useState<SerializableLogEntry[]>([]);
    const [streamingCommandId, setStreamingCommandId] = useState<string | null>(null);
    
    const api = useVSCodeAPI();

    // Handle incoming messages
    useEffect(() => {
        const handleMessage = (message: any) => {
            switch (message.type) {
                case MessageType.PROJECT_STATE_UPDATE:
                    setProjectState(message.state);
                    setIsLoading(false);
                    setError(null);
                    break;

                case MessageType.COMMAND_STATUS_UPDATE:
                    const { commandId, command, status, progress, output, error: cmdError } = message;
                    
                    // Track initialization commands
                    if (command.includes('Init-Project')) {
                        setInitInProgress(status === CommandStatus.RUNNING);
                    }
                    
                    setActiveCommands(prev => {
                        const updated = new Map(prev);
                        
                        if (status === CommandStatus.COMPLETED || status === CommandStatus.FAILED || status === CommandStatus.CANCELLED) {
                            // Remove from active commands
                            updated.delete(commandId);
                            
                            // Stop streaming for this command
                            if (streamingCommandId === commandId) {
                                setStreamingCommandId(null);
                            }
                            
                            // Add to command history
                            const historyEntry: CommandHistoryEntry = {
                                id: commandId,
                                command,
                                args: [],
                                status,
                                startTime: Date.now(),
                                endTime: Date.now(),
                                output,
                                error: cmdError
                            };
                            
                            setCommandHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20
                        } else {
                            // Update active command
                            updated.set(commandId, { command, status, progress });
                            
                            // Set streaming command ID
                            if (status === CommandStatus.RUNNING) {
                                setStreamingCommandId(commandId);
                            }
                        }
                        
                        return updated;
                    });
                    break;

                case MessageType.LOG_ENTRY_STREAM:
                    if (isLogEntryStreamMessage(message)) {
                        setInitLogs(prev => {
                            const updated = [...prev, message.logEntry];
                            // Keep buffer to ~1000 entries to prevent memory issues
                            return updated.length > 1000 ? updated.slice(-1000) : updated;
                        });
                    }
                    break;

                case MessageType.INIT_PROGRESS_UPDATE:
                    if (isInitProgressUpdateMessage(message)) {
                        setInitInProgress(message.status === 'running');
                        // Add all logs from the progress update
                        setInitLogs(prev => {
                            const updated = [...prev, ...message.logs];
                            // Keep buffer to ~1000 entries to prevent memory issues
                            return updated.length > 1000 ? updated.slice(-1000) : updated;
                        });
                    }
                    break;

                default:
                    // Handle other message types if needed
                    break;
            }
        };

        return api.onMessage(handleMessage);
    }, [api, streamingCommandId]);

    // Initial load
    useEffect(() => {
        refreshProjectState();
        refreshCommandHistory();
    }, []);

    const refreshProjectState = useCallback(() => {
        setIsLoading(true);
        setError(null);
        api.getProjectState().catch(err => {
            setError(err.message || 'Failed to refresh project state');
            setIsLoading(false);
        });
    }, [api]);

    const refreshCommandHistory = useCallback(() => {
        api.getCommandHistory().catch(err => {
            console.error('Failed to refresh command history:', err);
        });
    }, [api]);

    const clearInitLogs = useCallback(() => {
        setInitLogs([]);
    }, []);

    return {
        projectState: projectState || initialProjectState,
        commandHistory,
        activeCommands,
        isLoading,
        error,
        refreshProjectState,
        refreshCommandHistory,
        initInProgress,
        initLogs,
        streamingCommandId,
        clearInitLogs
    };
}

// Hook for specific project data with computed values
export function useProjectData() {
    const { projectState, isLoading, error, initInProgress, initLogs, streamingCommandId, clearInitLogs } = useProjectState();
    
    const stats = {
        totalEpics: projectState?.epics.length || 0,
        completedEpics: projectState?.epics.filter(epic => epic.status === 'completed').length || 0,
        totalStories: projectState?.epics.reduce((sum, epic) => sum + epic.stories.length, 0) || 0,
        completedStories: projectState?.epics.reduce((sum, epic) => 
            sum + epic.stories.filter(story => story.status === 'completed').length, 0) || 0,
        totalTickets: projectState?.epics.reduce((sum, epic) => 
            sum + epic.stories.reduce((storySum, story) => storySum + story.tickets.length, 0), 0) || 0,
        completedTickets: projectState?.epics.reduce((sum, epic) => 
            sum + epic.stories.reduce((storySum, story) => 
                storySum + story.tickets.filter(ticket => ticket.status === 'completed').length, 0), 0) || 0
    };

    const progress = {
        epics: stats.totalEpics > 0 ? (stats.completedEpics / stats.totalEpics) * 100 : 0,
        stories: stats.totalStories > 0 ? (stats.completedStories / stats.totalStories) * 100 : 0,
        tickets: stats.totalTickets > 0 ? (stats.completedTickets / stats.totalTickets) * 100 : 0
    };

    // Computed properties for button states
    const canImportFeedback = !initInProgress && projectState?.isInitialized;
    const canPlanEpics = !initInProgress && projectState?.isInitialized && stats.totalEpics > 0;

    return {
        projectState,
        stats,
        progress,
        isLoading,
        error,
        initInProgress,
        initLogs,
        streamingCommandId,
        clearInitLogs,
        canImportFeedback,
        canPlanEpics
    };
}