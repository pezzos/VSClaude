import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SerializableLogEntry } from '../../../src/webview/protocol';

interface ProjectCardProps {
    projectName: string;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    logs: SerializableLogEntry[];
    isStreaming: boolean;
    initInProgress: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    projectName,
    isExpanded,
    onToggleExpanded,
    logs,
    isStreaming,
    initInProgress
}) => {
    const [autoScroll, setAutoScroll] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const logContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive and auto-scroll is enabled
    useEffect(() => {
        if (autoScroll && isStreaming && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs.length, autoScroll, isStreaming]);

    // Filtered logs based on search term
    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        return logs.filter(log => 
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.source && log.source.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [logs, searchTerm]);

    const handleScroll = () => {
        if (!logContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10; // 10px threshold
        setAutoScroll(isAtBottom);
    };

    const copyLogToClipboard = (log: SerializableLogEntry) => {
        const logText = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`;
        navigator.clipboard.writeText(logText);
    };

    const copyAllLogsToClipboard = () => {
        const allLogsText = filteredLogs
            .map(log => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`)
            .join('\n');
        navigator.clipboard.writeText(allLogsText);
    };

    const clearLogs = () => {
        // This would need to be passed as a prop or handled by parent
        console.log('Clear logs requested');
    };

    const getLogLevelClass = (level: string): string => {
        switch (level.toLowerCase()) {
            case 'error': return 'log-level-error';
            case 'warning': case 'warn': return 'log-level-warning';
            case 'info': return 'log-level-info';
            case 'debug': return 'log-level-debug';
            default: return 'log-level-info';
        }
    };

    const getLogIcon = (level: string): string => {
        switch (level.toLowerCase()) {
            case 'error': return '❌';
            case 'warning': case 'warn': return '⚠️';
            case 'info': return 'ℹ️';
            case 'debug': return '🔍';
            default: return '📋';
        }
    };

    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className="project-card">
            <div 
                className="project-card-header"
                onClick={onToggleExpanded}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleExpanded();
                    }
                }}
                aria-expanded={isExpanded}
                aria-controls="project-logs"
            >
                <div className="project-info">
                    <h3 className="project-name">
                        {projectName || 'Current Project'}
                    </h3>
                    <div className="project-status">
                        {initInProgress ? (
                            <>
                                <div className="spinner-small" />
                                <span className="status-text">Initializing...</span>
                            </>
                        ) : (
                            <>
                                <span className={`status-indicator ${logs.length > 0 ? 'has-logs' : 'no-logs'}`} />
                                <span className="status-text">
                                    {logs.length > 0 ? `${logs.length} log entries` : 'No logs'}
                                </span>
                            </>
                        )}
                        {isStreaming && (
                            <span className="streaming-indicator">
                                🔴 LIVE
                            </span>
                        )}
                    </div>
                </div>
                <div className="expand-icon" aria-hidden="true">
                    {isExpanded ? '▼' : '▶'}
                </div>
            </div>

            {isExpanded && (
                <div className="project-card-content" id="project-logs">
                    <div className="log-controls">
                        <div className="log-search">
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="log-actions">
                            <button
                                onClick={copyAllLogsToClipboard}
                                className="control-button"
                                title="Copy all logs to clipboard"
                                disabled={filteredLogs.length === 0}
                            >
                                📋 Copy All
                            </button>
                            <button
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={`control-button ${autoScroll ? 'active' : ''}`}
                                title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
                            >
                                {autoScroll ? '📌' : '📌'} Auto-scroll
                            </button>
                            <button
                                onClick={clearLogs}
                                className="control-button"
                                title="Clear logs"
                                disabled={logs.length === 0}
                            >
                                🗑️ Clear
                            </button>
                        </div>
                    </div>

                    <div 
                        className="log-container"
                        ref={logContainerRef}
                        onScroll={handleScroll}
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="log-placeholder">
                                {searchTerm ? `No logs matching "${searchTerm}"` : 'No logs available'}
                            </div>
                        ) : (
                            <div className="log-list">
                                {filteredLogs.map((log, index) => (
                                    <div
                                        key={log.id || `${log.timestamp}-${index}`}
                                        className={`log-entry ${getLogLevelClass(log.level)}`}
                                        onClick={() => copyLogToClipboard(log)}
                                        title="Click to copy this log entry"
                                    >
                                        <div className="log-meta">
                                            <span className="log-time">
                                                {formatTimestamp(log.timestamp)}
                                            </span>
                                            <span className="log-level">
                                                {getLogIcon(log.level)} {log.level.toUpperCase()}
                                            </span>
                                            {log.source && (
                                                <span className="log-source">
                                                    [{log.source}]
                                                </span>
                                            )}
                                        </div>
                                        <div className="log-message">
                                            {log.message}
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>
                        )}
                    </div>

                    {filteredLogs.length > 0 && (
                        <div className="log-footer">
                            <div className="log-stats">
                                Showing {filteredLogs.length} of {logs.length} entries
                                {searchTerm && ` matching "${searchTerm}"`}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};