import React, { useState } from 'react';
import { useProjectState } from '../hooks/useProjectState';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';
import { 
    ChevronDown, 
    ChevronRight,
    Circle, 
    CheckCircle, 
    Clock,
    AlertCircle,
    Flag,
    User,
    Tag,
    Calendar,
    MoreHorizontal
} from 'lucide-react';
import { SerializableEpic, SerializableStory, SerializableTicket } from '../../../src/webview/protocol';

interface TaskPanelProps {
    className?: string;
}

type TaskFilter = 'all' | 'todo' | 'in-progress' | 'completed';
type TaskSort = 'created' | 'updated' | 'priority' | 'status';

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return <CheckCircle className="status-icon completed" />;
        case 'in-progress': return <Clock className="status-icon in-progress" />;
        case 'planning': return <Circle className="status-icon planning" />;
        default: return <Circle className="status-icon todo" />;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return 'priority-medium';
    }
};

export const TaskPanel: React.FC<TaskPanelProps> = ({ className }) => {
    const { projectState } = useProjectState();
    const api = useVSCodeAPI();
    
    const [filter, setFilter] = useState<TaskFilter>('all');
    const [sort, setSort] = useState<TaskSort>('updated');
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
    const [selectedTask, setSelectedTask] = useState<string | null>(null);

    if (!projectState?.isInitialized) {
        return (
            <div className={`task-panel not-initialized ${className || ''}`}>
                <div className="empty-state">
                    <AlertCircle className="empty-icon" />
                    <h3>No Project Initialized</h3>
                    <p>Initialize a project to start managing tasks</p>
                </div>
            </div>
        );
    }

    const toggleEpicExpanded = (epicId: string) => {
        setExpandedEpics(prev => {
            const next = new Set(prev);
            if (next.has(epicId)) {
                next.delete(epicId);
            } else {
                next.add(epicId);
            }
            return next;
        });
    };

    const toggleStoryExpanded = (storyId: string) => {
        setExpandedStories(prev => {
            const next = new Set(prev);
            if (next.has(storyId)) {
                next.delete(storyId);
            } else {
                next.add(storyId);
            }
            return next;
        });
    };

    const handleTaskSelect = (taskId: string, taskType: 'epic' | 'story' | 'ticket') => {
        setSelectedTask(taskId);
        
        // Execute appropriate command based on task type
        switch (taskType) {
            case 'epic':
                api.executeCommand('/select-epic', [taskId]);
                break;
            case 'story':
                api.executeCommand('/select-story', [taskId]);
                break;
            case 'ticket':
                api.executeCommand('/select-ticket', [taskId]);
                break;
        }
    };

    const filteredEpics = projectState.epics.filter(epic => {
        if (filter === 'all') return true;
        return epic.status === filter || 
               (filter === 'todo' && epic.status === 'planning') ||
               (filter === 'in-progress' && epic.status === 'in-progress');
    });

    const sortedEpics = [...filteredEpics].sort((a, b) => {
        switch (sort) {
            case 'created': return b.createdAt - a.createdAt;
            case 'updated': return b.updatedAt - a.updatedAt;
            case 'priority': {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority as keyof typeof priorityOrder] || 2) - 
                       (priorityOrder[a.priority as keyof typeof priorityOrder] || 2);
            }
            case 'status': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });

    return (
        <div className={`task-panel ${className || ''}`}>
            {/* Panel Header */}
            <div className="panel-header">
                <h3>Tasks</h3>
                <div className="panel-controls">
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as TaskFilter)}
                        className="filter-select"
                    >
                        <option value="all">All Tasks</option>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    
                    <select 
                        value={sort} 
                        onChange={(e) => setSort(e.target.value as TaskSort)}
                        className="sort-select"
                    >
                        <option value="updated">Recently Updated</option>
                        <option value="created">Recently Created</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>

            {/* Task List */}
            <div className="task-list">
                {sortedEpics.length === 0 ? (
                    <div className="empty-state">
                        <Circle className="empty-icon" />
                        <h4>No tasks found</h4>
                        <p>Try adjusting your filter or create a new epic</p>
                    </div>
                ) : (
                    sortedEpics.map(epic => (
                        <EpicCard
                            key={epic.id}
                            epic={epic}
                            isExpanded={expandedEpics.has(epic.id)}
                            isSelected={selectedTask === epic.id}
                            onToggleExpanded={() => toggleEpicExpanded(epic.id)}
                            onSelect={() => handleTaskSelect(epic.id, 'epic')}
                            expandedStories={expandedStories}
                            selectedTask={selectedTask}
                            onToggleStoryExpanded={toggleStoryExpanded}
                            onSelectTask={handleTaskSelect}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

interface EpicCardProps {
    epic: SerializableEpic;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpanded: () => void;
    onSelect: () => void;
    expandedStories: Set<string>;
    selectedTask: string | null;
    onToggleStoryExpanded: (storyId: string) => void;
    onSelectTask: (taskId: string, taskType: 'epic' | 'story' | 'ticket') => void;
}

const EpicCard: React.FC<EpicCardProps> = ({
    epic,
    isExpanded,
    isSelected,
    onToggleExpanded,
    onSelect,
    expandedStories,
    selectedTask,
    onToggleStoryExpanded,
    onSelectTask
}) => {
    const completedStories = epic.stories.filter(s => s.status === 'completed').length;
    const totalStories = epic.stories.length;

    return (
        <div className={`task-card epic-card ${isSelected ? 'selected' : ''}`}>
            <div className="task-header" onClick={onSelect}>
                <div className="task-expand" onClick={(e) => { e.stopPropagation(); onToggleExpanded(); }}>
                    {isExpanded ? <ChevronDown className="expand-icon" /> : <ChevronRight className="expand-icon" />}
                </div>
                
                <div className="task-content">
                    <div className="task-title-row">
                        {getStatusIcon(epic.status)}
                        <h4 className="task-title">{epic.name}</h4>
                        <div className={`priority-badge ${getPriorityColor(epic.priority)}`}>
                            <Flag className="priority-icon" />
                            {epic.priority}
                        </div>
                    </div>
                    
                    <p className="task-description">{epic.description}</p>
                    
                    <div className="task-meta">
                        <div className="task-progress">
                            <span className="progress-text">{completedStories}/{totalStories} stories</span>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${totalStories > 0 ? (completedStories / totalStories) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="task-tags">
                            {epic.tags.map(tag => (
                                <span key={tag} className="tag">
                                    <Tag className="tag-icon" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <button className="task-menu">
                    <MoreHorizontal className="menu-icon" />
                </button>
            </div>

            {isExpanded && (
                <div className="task-children">
                    {epic.stories.map(story => (
                        <StoryCard
                            key={story.id}
                            story={story}
                            isExpanded={expandedStories.has(story.id)}
                            isSelected={selectedTask === story.id}
                            onToggleExpanded={() => onToggleStoryExpanded(story.id)}
                            onSelect={() => onSelectTask(story.id, 'story')}
                            selectedTask={selectedTask}
                            onSelectTask={onSelectTask}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface StoryCardProps {
    story: SerializableStory;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpanded: () => void;
    onSelect: () => void;
    selectedTask: string | null;
    onSelectTask: (taskId: string, taskType: 'epic' | 'story' | 'ticket') => void;
}

const StoryCard: React.FC<StoryCardProps> = ({
    story,
    isExpanded,
    isSelected,
    onToggleExpanded,
    onSelect,
    selectedTask,
    onSelectTask
}) => {
    const completedTickets = story.tickets.filter(t => t.status === 'completed').length;
    const totalTickets = story.tickets.length;

    return (
        <div className={`task-card story-card ${isSelected ? 'selected' : ''}`}>
            <div className="task-header" onClick={onSelect}>
                <div className="task-expand" onClick={(e) => { e.stopPropagation(); onToggleExpanded(); }}>
                    {isExpanded ? <ChevronDown className="expand-icon" /> : <ChevronRight className="expand-icon" />}
                </div>
                
                <div className="task-content">
                    <div className="task-title-row">
                        {getStatusIcon(story.status)}
                        <h5 className="task-title">{story.name}</h5>
                    </div>
                    
                    <p className="task-description">{story.description}</p>
                    
                    <div className="task-meta">
                        <div className="task-progress">
                            <span className="progress-text">{completedTickets}/{totalTickets} tickets</span>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="time-info">
                            <Calendar className="time-icon" />
                            <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="task-children">
                    {story.tickets.map(ticket => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            isSelected={selectedTask === ticket.id}
                            onSelect={() => onSelectTask(ticket.id, 'ticket')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface TicketCardProps {
    ticket: SerializableTicket;
    isSelected: boolean;
    onSelect: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
    ticket,
    isSelected,
    onSelect
}) => {
    return (
        <div className={`task-card ticket-card ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
            <div className="task-header">
                <div className="task-content">
                    <div className="task-title-row">
                        {getStatusIcon(ticket.status)}
                        <h6 className="task-title">{ticket.name}</h6>
                    </div>
                    
                    <p className="task-description">{ticket.description}</p>
                    
                    <div className="task-meta">
                        {ticket.assignee && (
                            <div className="assignee">
                                <User className="assignee-icon" />
                                <span>{ticket.assignee}</span>
                            </div>
                        )}
                        
                        <div className="ticket-labels">
                            {ticket.labels.map(label => (
                                <span key={label} className="label">{label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};