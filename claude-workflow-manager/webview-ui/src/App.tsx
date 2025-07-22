import React, { useState } from 'react';
import { ProjectOverview } from './components/ProjectOverview';
import { ActionHeader } from './components/ActionHeader';
import { ProjectCard } from './components/ProjectCard';
import { useVSCodeTheme } from './hooks/useVSCodeAPI';
import { useProjectData } from './hooks/useProjectState';
import './styles/main.css';

export const App: React.FC = () => {
    const [isLogCardExpanded, setIsLogCardExpanded] = useState(false);
    const { 
        projectState, 
        stats, 
        isLoading, 
        error,
        initInProgress,
        initLogs,
        streamingCommandId,
        canImportFeedback,
        canPlanEpics
    } = useProjectData();
    
    // Apply VSCode theme
    useVSCodeTheme();

    if (isLoading) {
        return (
            <div className="app loading">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Initializing Claude Workflow Manager...</p>
                </div>
            </div>
        );
    }

    // Debug: Add a simple test to ensure React is working
    console.log('App rendering, projectState:', projectState);

    if (error) {
        return (
            <div className="app error">
                <div className="error-container">
                    <h3>Error Loading Project</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app dashboard">
            {/* Simple debug header */}
            <div style={{padding: '20px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', borderRadius: '8px', marginBottom: '16px'}}>
                <h2>🚀 Claude Workflow Manager Dashboard</h2>
                <p>Debug Info: {projectState ? 'Project loaded' : 'No project'}, Loading: {isLoading ? 'Yes' : 'No'}</p>
            </div>

            {/* Action Header */}
            <ActionHeader
                isInitialized={projectState?.isInitialized || false}
                initInProgress={initInProgress || false}
                canImportFeedback={canImportFeedback || false}
                canPlanEpics={canPlanEpics || false}
            />

            {/* Project Card for Streaming Logs */}
            <ProjectCard
                projectName={projectState?.currentProjectPath ? 
                    projectState.currentProjectPath.split('/').pop() || 'Current Project' : 
                    'Current Project'
                }
                isExpanded={isLogCardExpanded}
                onToggleExpanded={() => setIsLogCardExpanded(!isLogCardExpanded)}
                logs={initLogs}
                isStreaming={!!streamingCommandId}
                initInProgress={initInProgress || false}
            />

            {/* Project Overview Content */}
            <div className="dashboard-content">
                <ProjectOverview />
            </div>

            {/* Status Bar */}
            <div className="status-bar">
                <div className="status-left">
                    {projectState?.isInitialized ? (
                        <>
                            <div className="status-item">
                                <div className="status-dot active"></div>
                                <span>Project Active</span>
                            </div>
                            {projectState.currentEpic && (
                                <div className="status-item">
                                    <span>Epic: {projectState.currentEpic.name}</span>
                                </div>
                            )}
                            {projectState.currentStory && (
                                <div className="status-item">
                                    <span>Story: {projectState.currentStory.name}</span>
                                </div>
                            )}
                            <div className="status-item">
                                <span>
                                    {stats.completedEpics}/{stats.totalEpics} Epics • 
                                    {stats.completedStories}/{stats.totalStories} Stories • 
                                    {stats.completedTickets}/{stats.totalTickets} Tickets
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="status-item">
                            <div className="status-dot inactive"></div>
                            <span>No Project</span>
                        </div>
                    )}
                </div>
                
                <div className="status-right">
                    <div className="status-item">
                        <span>Claude Workflow Manager v0.1.6</span>
                    </div>
                </div>
            </div>
        </div>
    );
};