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
            name: '1-PROJECT (Project Level)',
            icon: <Settings className="category-icon" />,
            commands: [
                {
                    id: 'init-project',
                    name: 'Initialize Project',
                    command: '/1-project:1-start:1-Init-Project',
                    description: 'Creates docs structure and PRD template',
                    icon: <Play className="command-icon" />,
                    disabled: projectState?.isInitialized
                },
                {
                    id: 'import-feedback',
                    name: 'Import Feedback',
                    command: '/1-project:2-update:1-Import-feedback',
                    description: 'Import external feedback into project docs',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'challenge',
                    name: 'Challenge Assumptions',
                    command: '/1-project:2-update:2-Challenge',
                    description: 'Challenge current assumptions and plans',
                    icon: <AlertCircle className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'enrich-project',
                    name: 'Enrich Context',
                    command: '/1-project:2-update:3-Enrich',
                    description: 'Add context and insights to project',
                    icon: <Zap className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'update-status',
                    name: 'Update Status',
                    command: '/1-project:2-update:4-Status',
                    description: 'Check and update project status',
                    icon: <Clock className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'implementation-status',
                    name: 'Implementation Status',
                    command: '/1-project:2-update:5-Implementation-Status',
                    description: 'Review implementation progress',
                    icon: <CheckCircle className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'plan-epics',
                    name: 'Plan Epics',
                    command: '/1-project:3-epics:1-Plan-Epics',
                    description: 'Create EPICS.md with prioritized epics',
                    icon: <Terminal className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'update-epic-implementation',
                    name: 'Update Epic Implementation',
                    command: '/1-project:3-epics:2-Update-Implementation',
                    description: 'Update epic implementation status',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true
                }
            ]
        },
        {
            id: 'epic',
            name: '2-EPIC (Epic Level)',
            icon: <Zap className="category-icon" />,
            commands: [
                {
                    id: 'select-stories',
                    name: 'Select Epic & Stories',
                    command: '/2-epic:1-start:1-Select-Stories',
                    description: 'Choose next epic and create PRD',
                    icon: <Play className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'plan-stories',
                    name: 'Plan Stories',
                    command: '/2-epic:1-start:2-Plan-stories',
                    description: 'Create STORIES.md with acceptance criteria',
                    icon: <Terminal className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'complete-epic',
                    name: 'Complete Epic',
                    command: '/2-epic:2-manage:1-Complete-Epic',
                    description: 'Archive completed epic',
                    icon: <CheckCircle className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'epic-status',
                    name: 'Epic Status',
                    command: '/2-epic:2-manage:2-Status-Epic',
                    description: 'Check epic progress and blockers',
                    icon: <Clock className="command-icon" />,
                    requiresProject: true
                }
            ]
        },
        {
            id: 'story',
            name: '3-STORY (Story Level)',
            icon: <History className="category-icon" />,
            commands: [
                {
                    id: 'start-story',
                    name: 'Start Story',
                    command: '/3-story:1-manage:1-Start-Story',
                    description: 'Select story and create TODO.md',
                    icon: <Play className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'complete-story',
                    name: 'Complete Story',
                    command: '/3-story:1-manage:2-Complete-Story',
                    description: 'Mark story complete and update docs',
                    icon: <CheckCircle className="command-icon" />,
                    requiresProject: true
                }
            ]
        },
        {
            id: 'ticket',
            name: '4-TICKET (Ticket Level)',
            icon: <Terminal className="category-icon" />,
            commands: [
                {
                    id: 'ticket-from-story',
                    name: 'Ticket from Story',
                    command: '/4-ticket:1-start:1-From-story',
                    description: 'Create ticket from current story',
                    icon: <Play className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'ticket-from-issue',
                    name: 'Ticket from Issue',
                    command: '/4-ticket:1-start:2-From-issue',
                    description: 'Create ticket from GitHub issue',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'ticket-from-input',
                    name: 'Ticket from Input',
                    command: '/4-ticket:1-start:3-From-input',
                    description: 'Create ticket from user input',
                    icon: <Zap className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'plan-ticket',
                    name: 'Plan Ticket',
                    command: '/4-ticket:2-execute:1-Plan-Ticket',
                    description: 'Create detailed implementation plan',
                    icon: <Terminal className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'test-design',
                    name: 'Design Tests',
                    command: '/4-ticket:2-execute:2-Test-design',
                    description: 'Design test strategy and cases',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'implement',
                    name: 'Implement',
                    command: '/4-ticket:2-execute:3-Implement',
                    description: 'Code implementation and testing',
                    icon: <Play className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'validate-ticket',
                    name: 'Validate Ticket',
                    command: '/4-ticket:2-execute:4-Validate-Ticket',
                    description: 'Validate against acceptance criteria',
                    icon: <CheckCircle className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'review-ticket',
                    name: 'Review Ticket',
                    command: '/4-ticket:2-execute:5-Review-Ticket',
                    description: 'Final review and documentation',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'archive-ticket',
                    name: 'Archive Ticket',
                    command: '/4-ticket:3-complete:1-Archive-Ticket',
                    description: 'Archive completed ticket',
                    icon: <XCircle className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'status-ticket',
                    name: 'Ticket Status',
                    command: '/4-ticket:3-complete:2-Status-Ticket',
                    description: 'Update ticket status in docs',
                    icon: <Clock className="command-icon" />,
                    requiresProject: true
                }
            ]
        },
        {
            id: 'support',
            name: 'Support Tools',
            icon: <Settings className="category-icon" />,
            commands: [
                {
                    id: 'debug-check-state',
                    name: 'Debug: Check State',
                    command: '/debug:1-Check-state',
                    description: 'Verify project structure integrity',
                    icon: <AlertCircle className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'debug-fix-structure',
                    name: 'Debug: Fix Structure',
                    command: '/debug:2-Fix-structure',
                    description: 'Repair project structure issues',
                    icon: <Settings className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'enrich-global',
                    name: 'Enrich: Global Context',
                    command: '/enrich:1-claude:1-Global',
                    description: 'Update global Claude context',
                    icon: <Zap className="command-icon" />
                },
                {
                    id: 'enrich-epic',
                    name: 'Enrich: Epic Context',
                    command: '/enrich:1-claude:2-Epic',
                    description: 'Enrich epic-specific context',
                    icon: <Zap className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'enrich-post-ticket',
                    name: 'Enrich: Post-Ticket',
                    command: '/enrich:1-claude:3-Post-ticket',
                    description: 'Update context after ticket completion',
                    icon: <Zap className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'metrics-update',
                    name: 'Metrics: Update',
                    command: '/metrics:1-manage:1-Update',
                    description: 'Update project metrics',
                    icon: <History className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'metrics-dashboard',
                    name: 'Metrics: Dashboard',
                    command: '/metrics:1-manage:2-Dashboard',
                    description: 'Generate metrics dashboard',
                    icon: <History className="command-icon" />,
                    requiresProject: true
                },
                {
                    id: 'learning-dashboard',
                    name: 'Learning Dashboard',
                    command: '/learning:dashboard',
                    description: 'Display learning insights and patterns',
                    icon: <Settings className="command-icon" />
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
                    name: 'Clear Context',
                    command: '/clear',
                    description: 'Clear conversation context',
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