import { useEffect, useCallback, useRef } from 'react';
import { 
    WebviewMessage, 
    MessageType, 
    ExecuteCommandRequest,
    GetProjectStateRequest,
    GetCommandHistoryRequest,
    createMessage
} from '../../../src/webview/protocol';

declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
            setState: (state: any) => void;
            getState: () => any;
        };
    }
}

interface VSCodeAPI {
    executeCommand: (command: string, args?: string[]) => Promise<void>;
    getProjectState: () => Promise<void>;
    getCommandHistory: () => Promise<void>;
    onMessage: (handler: (message: WebviewMessage) => void) => () => void;
}

let vscodeApiInstance: ReturnType<typeof window.acquireVsCodeApi> | null = null;

export function useVSCodeAPI(): VSCodeAPI {
    const messageHandlersRef = useRef<Set<(message: WebviewMessage) => void>>(new Set());

    useEffect(() => {
        // Acquire VSCode API if not already done
        if (!vscodeApiInstance && typeof window !== 'undefined' && window.acquireVsCodeApi) {
            vscodeApiInstance = window.acquireVsCodeApi();
        }

        // Set up message listener
        const handleMessage = (event: MessageEvent) => {
            const message = event.data as WebviewMessage;
            messageHandlersRef.current.forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const executeCommand = useCallback(async (command: string, args?: string[]) => {
        if (!vscodeApiInstance) {
            console.error('VSCode API not available');
            return;
        }

        const message = createMessage<ExecuteCommandRequest>(MessageType.EXECUTE_COMMAND, {
            command,
            args
        });

        vscodeApiInstance.postMessage(message);
    }, []);

    const getProjectState = useCallback(async () => {
        if (!vscodeApiInstance) {
            console.error('VSCode API not available');
            return;
        }

        const message = createMessage<GetProjectStateRequest>(MessageType.GET_PROJECT_STATE, {});
        vscodeApiInstance.postMessage(message);
    }, []);

    const getCommandHistory = useCallback(async () => {
        if (!vscodeApiInstance) {
            console.error('VSCode API not available');
            return;
        }

        const message = createMessage<GetCommandHistoryRequest>(MessageType.GET_COMMAND_HISTORY, {});
        vscodeApiInstance.postMessage(message);
    }, []);

    const onMessage = useCallback((handler: (message: WebviewMessage) => void) => {
        messageHandlersRef.current.add(handler);
        
        return () => {
            messageHandlersRef.current.delete(handler);
        };
    }, []);

    return {
        executeCommand,
        getProjectState,
        getCommandHistory,
        onMessage
    };
}

export function useVSCodeTheme() {
    const api = useVSCodeAPI();
    
    useEffect(() => {
        const handleThemeMessage = (message: WebviewMessage) => {
            if (message.type === MessageType.THEME_UPDATE) {
                const theme = (message as any).theme;
                document.body.className = `vscode-${theme}`;
            }
        };

        return api.onMessage(handleThemeMessage);
    }, [api]);
}