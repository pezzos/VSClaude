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
    isExpanded,
    onToggleExpanded,
    logs,
    isStreaming,
    initInProgress
}) => {
    const [autoScroll, setAutoScroll] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
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
        // Removed console logging to reduce VSCode console clutter
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

    const getLogIcon = (log: SerializableLogEntry): string => {
        // Detect message type from content for better icons
        const message = log.message.toLowerCase();
        if (message.includes('tool_use') || message.includes('calling tool')) return '🔧';
        if (message.includes('tool_result')) return '✅';
        if (message.includes('thinking') || message.includes('💭')) return '💭';
        if (message.includes('response') || message.includes('📝')) return '📝';
        if (message.includes('file') || message.includes('edit') || message.includes('write')) return '📄';
        if (message.includes('error')) return '❌';
        if (message.includes('warning') || message.includes('warn')) return '⚠️';
        
        // Fallback to level-based icons
        switch (log.level.toLowerCase()) {
            case 'error': return '❌';
            case 'warning': case 'warn': return '⚠️';
            case 'info': return 'ℹ️';
            case 'debug': return '🔍';
            default: return '📋';
        }
    };

    const truncateMessage = (message: string, maxLines: number = 2): string => {
        const lines = message.split('\n');
        if (lines.length <= maxLines) return message;
        return lines.slice(0, maxLines).join('\n') + '...';
    };

    const toggleLogExpansion = (logId: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(logId)) {
                next.delete(logId);
            } else {
                next.add(logId);
            }
            return next;
        });
    };

    const extractLogDetails = (log: SerializableLogEntry) => {
        const details: Array<{label: string, value: string}> = [];
        
        // Try to parse JSON details if available
        if (log.details && typeof log.details === 'object') {
            const logDetails = log.details as any;
            if (logDetails.model) details.push({label: 'Model', value: logDetails.model});
            if (logDetails.file) details.push({label: 'File', value: logDetails.file});
            if (logDetails.tool) details.push({label: 'Tool', value: logDetails.tool});
            if (logDetails.duration) details.push({label: 'Duration', value: `${logDetails.duration}ms`});
        }

        // Extract details from message content
        const message = log.message;
        
        // Look for model mentions
        const modelMatch = message.match(/model[:\s]+([^\s,]+)/i);
        if (modelMatch && !details.some(d => d.label === 'Model')) {
            details.push({label: 'Model', value: modelMatch[1]});
        }
        
        // Look for file mentions
        const fileMatch = message.match(/file[:\s]+([^\s,]+\.[a-zA-Z]{1,4})/i);
        if (fileMatch && !details.some(d => d.label === 'File')) {
            details.push({label: 'File', value: fileMatch[1]});
        }

        // Look for tool mentions
        const toolMatch = message.match(/tool[:\s]+([^\s,]+)/i);
        if (toolMatch && !details.some(d => d.label === 'Tool')) {
            details.push({label: 'Tool', value: toolMatch[1]});
        }

        // Add source if available
        if (log.source) {
            details.push({label: 'Source', value: log.source});
        }

        // Add command ID if available
        if (log.commandId) {
            details.push({label: 'Command', value: log.commandId});
        }

        return details;
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
                        Claude Code output
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
                                ▶️ WORKING
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
                                {filteredLogs.map((log, index) => {
                                    const logId = log.id || `${log.timestamp}-${index}`;
                                    const isExpanded = expandedLogs.has(logId);
                                    const logDetails = extractLogDetails(log);
                                    
                                    return (
                                        <div
                                            key={logId}
                                            className={`log-entry-compact ${getLogLevelClass(log.level)}`}
                                        >
                                            {/* Compact header */}
                                            <div className="log-header-compact">
                                                <div className="log-icon">
                                                    {getLogIcon(log)}
                                                </div>
                                                <div className="log-content-compact">
                                                    <div className="log-message-truncated">
                                                        {truncateMessage(log.message, 2)}
                                                    </div>
                                                </div>
                                                <div className="log-meta-compact">
                                                    <span className="log-time-compact">
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                    <button
                                                        className="log-expand-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleLogExpansion(logId);
                                                        }}
                                                        title={isExpanded ? "Collapse details" : "Expand details"}
                                                    >
                                                        {isExpanded ? '-' : '+'}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div className="log-details-expanded">
                                                    <div className="log-full-message">
                                                        <strong>Full message:</strong>
                                                        <div className="log-message-content">
                                                            {log.message}
                                                        </div>
                                                    </div>
                                                    
                                                    {logDetails.length > 0 && (
                                                        <div className="log-metadata">
                                                            <strong>Details:</strong>
                                                            <div className="log-details-grid">
                                                                {logDetails.map((detail, idx) => (
                                                                    <div key={idx} className="log-detail-item">
                                                                        <span className="detail-label">{detail.label}:</span>
                                                                        <span className="detail-value">{detail.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="log-actions-expanded">
                                                        <button
                                                            onClick={() => copyLogToClipboard(log)}
                                                            className="log-action-btn"
                                                            title="Copy this log entry"
                                                        >
                                                            📋 Copy
                                                        </button>
                                                        <span className="log-level-badge">
                                                            {log.level.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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