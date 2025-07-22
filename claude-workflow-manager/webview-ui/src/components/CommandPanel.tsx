import React, { useState } from 'react';
import { useProjectState } from '../hooks/useProjectState';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';
import { CommandStatus } from '../../../src/webview/protocol';
import { 
    Play, 
    Square,
    CheckCircle, 
    XCircle,
    Clock,
    Loader,
    ChevronDown,
    ChevronUp,
    Terminal,
    Zap,
    Settings,
    History,
    AlertCircle
} from 'lucide-react';

interface CommandPanelProps {
    className?: string;
}

interface CommandCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    commands: CommandDefinition[];
}

interface CommandDefinition {
    id: string;
    name: string;
    command: string;
    description: string;
    args?: string[];
    icon?: React.ReactNode;
    disabled?: boolean;
    requiresProject?: boolean;
}

const getStatusIcon = (status: CommandStatus) => {
    switch (status) {
        case CommandStatus.RUNNING: return <Loader className="status-icon running spin" />;
        case CommandStatus.COMPLETED: return <CheckCircle className="status-icon completed" />;
        case CommandStatus.FAILED: return <XCircle className="status-icon failed" />;
        case CommandStatus.CANCELLED: return <Square className="status-icon cancelled" />;
        default: return <Clock className="status-icon pending" />;
    }
};

// Commented out unused function
// const getStatusColor = (status: CommandStatus) => {
//     switch (status) {
//         case CommandStatus.RUNNING: return 'status-running';
//         case CommandStatus.COMPLETED: return 'status-completed';
//         case CommandStatus.FAILED: return 'status-failed';
//         case CommandStatus.CANCELLED: return 'status-cancelled';
//         default: return 'status-pending';
//     }
// };

export const CommandPanel: React.FC<CommandPanelProps> = ({ className }) => {
    const { projectState, activeCommands, commandHistory } = useProjectState();
    const api = useVSCodeAPI();
    
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['project']));
    const [expandedCommands, setExpandedCommands] = useState<Set<string>>(new Set());
    const [showHistory, setShowHistory] = useState(false);

    const commandCategories: CommandCategory[] = [
        {
            id: 'project',
            name: 'Project Management',
            icon: <Settings className="category-icon" />,
            commands: [
                {
                    id: 'init-project',
                    name: 'Initialize Project',
                    command: '/project:init',
                    description: 'Initialize a new Claude workflow project',
                    args: ['New Project'],
                    icon: <Play className="command-icon" />,
                    disabled: projectState?.isInitialized
                },
                {
                    id: 'start-epic',
                    name: 'Start New Epic',
                    command: '/project:agile:start',
                    description: 'Begin a new epic with requirements gathering',
                    args: ['New Epic'],
                    icon: <Zap className="command-icon" />,
                    requiresProject: true
                }
            ]
        },
        {
            id: 'epic',
            name: 'Epic Management',
            icon: <Zap className="category-icon" />,
            commands: [
                {
                    id: 'design-epic',
                    name: 'Design Architecture',
                    command: '/project:agile:design',
                    description: 'Create architecture design for current epic',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true,
                    disabled: !projectState?.currentEpic
                },
                {
                    id: 'plan-epic',
                    name: 'Plan Implementation',
                    command: '/project:agile:plan',
                    description: 'Generate detailed implementation plan',
                    icon: <Terminal className="command-icon" />,
                    requiresProject: true,
                    disabled: !projectState?.currentEpic
                },
                {
                    id: 'iterate-epic',
                    name: 'Start Development',
                    command: '/project:agile:iterate',
                    description: 'Begin development iteration',
                    icon: <Play className="command-icon" />,
                    requiresProject: true,
                    disabled: !projectState?.currentEpic
                },
                {
                    id: 'ship-epic',
                    name: 'Ship & Release',
                    command: '/project:agile:ship',
                    description: 'Finalize and ship the current epic',
                    icon: <CheckCircle className="command-icon" />,
                    requiresProject: true,
                    disabled: !projectState?.currentEpic
                }
            ]
        },
        {
            id: 'utilities',
            name: 'Utilities',
            icon: <Terminal className="category-icon" />,
            commands: [
                {
                    id: 'clear-workspace',
                    name: 'Clear Workspace',
                    command: '/clear',
                    description: 'Clear the current workspace state',
                    icon: <Square className="command-icon" />
                }
            ]
        }
    ];

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const toggleCommand = (commandId: string) => {
        setExpandedCommands(prev => {
            const next = new Set(prev);
            if (next.has(commandId)) {
                next.delete(commandId);
            } else {
                next.add(commandId);
            }
            return next;
        });
    };

    const executeCommand = (cmd: CommandDefinition) => {
        if (cmd.disabled || (cmd.requiresProject && !projectState?.isInitialized)) {
            return;
        }
        
        api.executeCommand(cmd.command, cmd.args);
    };

    const isCommandDisabled = (cmd: CommandDefinition) => {
        return cmd.disabled || (cmd.requiresProject && !projectState?.isInitialized);
    };

    return (
        <div className={`command-panel ${className || ''}`}>
            {/* Panel Header */}
            <div className="panel-header">
                <h3>Commands</h3>
                <div className="panel-actions">
                    <button 
                        className={`history-toggle ${showHistory ? 'active' : ''}`}
                        onClick={() => setShowHistory(!showHistory)}
                        title="Command History"
                    >
                        <History className="history-icon" />
                    </button>
                </div>
            </div>

            {/* Active Commands */}
            {activeCommands.size > 0 && (
                <div className="active-commands">
                    <h4>Running Commands</h4>
                    {Array.from(activeCommands.entries()).map(([commandId, commandInfo]) => (
                        <div key={commandId} className="active-command">
                            <div className="command-info">
                                {getStatusIcon(commandInfo.status)}
                                <span className="command-name">{commandInfo.command}</span>
                            </div>
                            <div className="command-progress">
                                {commandInfo.progress !== undefined && (
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${commandInfo.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Command History */}
            {showHistory && (
                <div className="command-history">
                    <h4>Recent Commands</h4>
                    {commandHistory.length === 0 ? (
                        <div className="empty-history">
                            <Terminal className="empty-icon" />
                            <p>No commands executed yet</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {commandHistory.slice(0, 10).map(entry => (
                                <div key={entry.id} className="history-item">
                                    <div className="history-info">
                                        {getStatusIcon(entry.status)}
                                        <span className="history-command">{entry.command}</span>
                                        <span className="history-time">
                                            {new Date(entry.startTime).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {(entry.output || entry.error) && (
                                        <div className="history-output">
                                            {entry.output && (
                                                <div className="output">{entry.output}</div>
                                            )}
                                            {entry.error && (
                                                <div className="error">{entry.error}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Command Categories */}
            <div className="command-categories">
                {commandCategories.map(category => (
                    <div key={category.id} className="command-category">
                        <div 
                            className="category-header"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="category-title">
                                {category.icon}
                                <span>{category.name}</span>
                            </div>
                            <div className="category-expand">
                                {expandedCategories.has(category.id) ? 
                                    <ChevronUp className="expand-icon" /> : 
                                    <ChevronDown className="expand-icon" />
                                }
                            </div>
                        </div>

                        {expandedCategories.has(category.id) && (
                            <div className="category-commands">
                                {category.commands.map(cmd => (
                                    <div key={cmd.id} className="command-item">
                                        <div 
                                            className={`command-header ${isCommandDisabled(cmd) ? 'disabled' : ''}`}
                                            onClick={() => !isCommandDisabled(cmd) && executeCommand(cmd)}
                                        >
                                            <div className="command-title">
                                                {cmd.icon}
                                                <span>{cmd.name}</span>
                                            </div>
                                            <div className="command-actions">
                                                <button 
                                                    className="expand-toggle"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCommand(cmd.id);
                                                    }}
                                                >
                                                    {expandedCommands.has(cmd.id) ? 
                                                        <ChevronUp className="expand-icon" /> : 
                                                        <ChevronDown className="expand-icon" />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {expandedCommands.has(cmd.id) && (
                                            <div className="command-details">
                                                <p className="command-description">{cmd.description}</p>
                                                {cmd.args && (
                                                    <div className="command-args">
                                                        <strong>Arguments:</strong>
                                                        <code>{cmd.args.join(', ')}</code>
                                                    </div>
                                                )}
                                                {cmd.requiresProject && !projectState?.isInitialized && (
                                                    <div className="command-warning">
                                                        <AlertCircle className="warning-icon" />
                                                        <span>Requires initialized project</span>
                                                    </div>
                                                )}
                                                <button 
                                                    className={`execute-button ${isCommandDisabled(cmd) ? 'disabled' : ''}`}
                                                    onClick={() => executeCommand(cmd)}
                                                    disabled={isCommandDisabled(cmd)}
                                                >
                                                    <Play className="execute-icon" />
                                                    Execute Command
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};