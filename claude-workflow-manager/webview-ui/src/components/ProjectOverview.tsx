import React from 'react';
import { useProjectData } from '../hooks/useProjectState';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';
import { 
    FolderOpen, 
    Play, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    AlertCircle,
    Zap
} from 'lucide-react';

export const ProjectOverview: React.FC = () => {
    const { projectState, stats, progress, isLoading, error } = useProjectData();
    const api = useVSCodeAPI();

    const handleInitializeProject = () => {
        api.executeCommand('/project:init', ['New Claude Workflow Project']);
    };

    const handleStartEpic = () => {
        api.executeCommand('/project:agile:start', ['New Epic']);
    };

    if (isLoading) {
        return (
            <div className="project-overview loading">
                <div className="loading-spinner"></div>
                <p>Loading project state...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-overview error">
                <AlertCircle className="error-icon" />
                <p>Error loading project: {error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    if (!projectState?.isInitialized) {
        return (
            <div className="project-overview not-initialized">
                <div className="welcome-card">
                    <FolderOpen className="welcome-icon" />
                    <h2>Welcome to Claude Workflow Manager</h2>
                    <p>Get started by initializing your first project</p>
                    <button 
                        className="primary-button"
                        onClick={handleInitializeProject}
                    >
                        <Play className="button-icon" />
                        Initialize Project
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="project-overview">
            {/* Project Header */}
            <div className="project-header">
                <div className="project-title">
                    <FolderOpen className="project-icon" />
                    <div>
                        <h2>Claude Workflow Project</h2>
                        <p className="project-path">{projectState.currentProjectPath}</p>
                    </div>
                </div>
                <div className={`status-badge status-${projectState.status}`}>
                    {projectState.status === 'active' && <Zap className="status-icon" />}
                    {projectState.status}
                </div>
            </div>

            {/* Current Epic & Story */}
            {projectState.currentEpic && (
                <div className="current-work">
                    <div className="current-epic">
                        <div className="work-header">
                            <h3>Current Epic</h3>
                            <span className={`work-status ${projectState.currentEpic.status}`}>
                                {projectState.currentEpic.status}
                            </span>
                        </div>
                        <h4>{projectState.currentEpic.name}</h4>
                        <p>{projectState.currentEpic.description}</p>
                        
                        <div className="epic-stats">
                            <div className="stat">
                                <span className="stat-value">{projectState.currentEpic.stories.length}</span>
                                <span className="stat-label">Stories</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">
                                    {projectState.currentEpic.stories.filter(s => s.status === 'completed').length}
                                </span>
                                <span className="stat-label">Completed</span>
                            </div>
                        </div>
                    </div>

                    {projectState.currentStory && (
                        <div className="current-story">
                            <div className="work-header">
                                <h3>Current Story</h3>
                                <span className={`work-status ${projectState.currentStory.status}`}>
                                    {projectState.currentStory.status}
                                </span>
                            </div>
                            <h4>{projectState.currentStory.name}</h4>
                            <p>{projectState.currentStory.description}</p>
                            
                            <div className="story-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{
                                            width: `${(projectState.currentStory.tickets.filter(t => t.status === 'completed').length / projectState.currentStory.tickets.length) * 100}%`
                                        }}
                                    />
                                </div>
                                <span className="progress-text">
                                    {projectState.currentStory.tickets.filter(t => t.status === 'completed').length} / {projectState.currentStory.tickets.length} tickets
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Project Statistics */}
            <div className="project-stats">
                <h3>Project Progress</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <FolderOpen className="stat-icon" />
                            <span>Epics</span>
                        </div>
                        <div className="stat-content">
                            <div className="stat-main">
                                <span className="stat-number">{stats.completedEpics}</span>
                                <span className="stat-total">/ {stats.totalEpics}</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${progress.epics}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <Clock className="stat-icon" />
                            <span>Stories</span>
                        </div>
                        <div className="stat-content">
                            <div className="stat-main">
                                <span className="stat-number">{stats.completedStories}</span>
                                <span className="stat-total">/ {stats.totalStories}</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${progress.stories}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <CheckCircle className="stat-icon" />
                            <span>Tickets</span>
                        </div>
                        <div className="stat-content">
                            <div className="stat-main">
                                <span className="stat-number">{stats.completedTickets}</span>
                                <span className="stat-total">/ {stats.totalTickets}</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${progress.tickets}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card overall">
                        <div className="stat-header">
                            <TrendingUp className="stat-icon" />
                            <span>Overall Progress</span>
                        </div>
                        <div className="stat-content">
                            <div className="overall-progress">
                                <span className="overall-percentage">
                                    {Math.round((progress.epics + progress.stories + progress.tickets) / 3)}%
                                </span>
                                <div className="progress-ring">
                                    <svg viewBox="0 0 36 36" className="circular-chart">
                                        <path
                                            className="circle-bg"
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="circle"
                                            strokeDasharray={`${(progress.epics + progress.stories + progress.tickets) / 3}, 100`}
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                    {!projectState.currentEpic && (
                        <button 
                            className="action-button primary"
                            onClick={handleStartEpic}
                        >
                            <Play className="button-icon" />
                            Start New Epic
                        </button>
                    )}
                    
                    {projectState.currentEpic && projectState.currentEpic.status !== 'completed' && (
                        <>
                            <button 
                                className="action-button"
                                onClick={() => api.executeCommand('/project:agile:design')}
                            >
                                Design Architecture
                            </button>
                            <button 
                                className="action-button"
                                onClick={() => api.executeCommand('/project:agile:plan')}
                            >
                                Plan Implementation
                            </button>
                            <button 
                                className="action-button"
                                onClick={() => api.executeCommand('/project:agile:iterate')}
                            >
                                Start Development
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};