import React from 'react';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';

interface ActionHeaderProps {
    isInitialized: boolean;
    initInProgress: boolean;
    canImportFeedback: boolean;
    canPlanEpics: boolean;
    hasFeedback: boolean;
    hasChallenge: boolean;
    hasStatus: boolean;
    hasValidFeedback: boolean;
    hasExecutedImportFeedback: boolean;
    hasExecutedPlanEpics: boolean;
    epicTitles: string[];
    onInitializeProject?: () => void;
    onImportFeedback?: () => void;
    onPlanEpics?: () => void;
}

export const ActionHeader: React.FC<ActionHeaderProps> = ({
    isInitialized,
    initInProgress,
    canPlanEpics,
    hasValidFeedback,
    hasExecutedImportFeedback,
    hasExecutedPlanEpics,
    epicTitles,
    onInitializeProject,
    onImportFeedback,
    onPlanEpics
}) => {
    const api = useVSCodeAPI();

    const handleInitializeProject = () => {
        api.executeCommand('/1-project:1-start:1-Init-Project');
        onInitializeProject?.();
    };

    const handleImportFeedback = () => {
        api.executeCommand('/1-project:2-update:1-Import-feedback');
        onImportFeedback?.();
    };

    const handleChallenge = () => {
        api.executeCommand('/1-project:2-update:2-Challenge');
    };

    const handleEnrich = () => {
        api.executeCommand('/1-project:2-update:3-Enrich');
    };

    const handleStatus = () => {
        api.executeCommand('/1-project:2-update:4-Status');
    };

    const handleImplementationStatus = () => {
        api.executeCommand('/1-project:2-update:5-Implementation-Status');
    };

    const handlePlanEpics = () => {
        api.executeCommand('/1-project:3-epics:1-Plan-Epics');
        onPlanEpics?.();
    };

    if (!isInitialized) {
        return (
            <div className="action-header">
                <button
                    className="action-button-primary"
                    onClick={handleInitializeProject}
                    disabled={initInProgress}
                    aria-label="Initialize project"
                >
                    {initInProgress ? (
                        <>
                            <div className="spinner" />
                            Initializing Project...
                        </>
                    ) : (
                        <>
                            <span className="icon">🚀</span>
                            Initialize Project
                        </>
                    )}
                </button>
                {initInProgress && (
                    <div className="progress-info">
                        Setting up your project structure and initial documentation...
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="action-header">
            {/* Project update cycle block */}
            <h3 className="block-title">Project update cycle</h3>
            <div className="action-sequence">
                <button
                    className={`action-button-secondary ${!hasValidFeedback ? 'disabled' : ''}`}
                    onClick={handleImportFeedback}
                    disabled={!hasValidFeedback || initInProgress}
                    aria-label="Import feedback document"
                    title={hasValidFeedback ? "Import FEEDBACK.md to update project requirements" : "Add content to FEEDBACK.md file first"}
                >
                    <span className="icon">📋</span>
                    Import Feedback
                </button>
                
                {!hasValidFeedback && (
                    <div className="feedback-help">
                        💡 Add information about needs/features/needs/etc. for the project in the FEEDBACK.md file.
                    </div>
                )}
                
                <button
                    className={`action-button-secondary ${!hasExecutedImportFeedback ? 'disabled' : ''}`}
                    onClick={handleChallenge}
                    disabled={!hasExecutedImportFeedback || initInProgress}
                    aria-label="Challenge current assumptions"
                    title={hasExecutedImportFeedback ? "Challenge current assumptions and plans" : "Execute Import Feedback first"}
                >
                    <span className="icon">🤔</span>
                    Challenge the project
                </button>
                
                <button
                    className={`action-button-secondary ${!hasExecutedImportFeedback ? 'disabled' : ''}`}
                    onClick={handleEnrich}
                    disabled={!hasExecutedImportFeedback || initInProgress}
                    aria-label="Add context and insights"
                    title={hasExecutedImportFeedback ? "Add context and insights to project" : "Execute Import Feedback first"}
                >
                    <span className="icon">✨</span>
                    Enrich
                </button>
                
                <button
                    className={`action-button-secondary ${!hasExecutedPlanEpics ? 'disabled' : ''}`}
                    onClick={handleStatus}
                    disabled={!hasExecutedPlanEpics || initInProgress}
                    aria-label="Check project status"
                    title={hasExecutedPlanEpics ? "Check and update project status" : "Execute Plan Epics first"}
                >
                    <span className="icon">📊</span>
                    Status
                </button>
                
                <button
                    className={`action-button-secondary ${!hasExecutedPlanEpics ? 'disabled' : ''}`}
                    onClick={handleImplementationStatus}
                    disabled={!hasExecutedPlanEpics || initInProgress}
                    aria-label="Review implementation progress"
                    title={hasExecutedPlanEpics ? "Review implementation progress" : "Execute Plan Epics first"}
                >
                    <span className="icon">🔧</span>
                    Implementation Status
                </button>
            </div>

            {/* Epic management block */}
            <h3 className="block-title">Epic management</h3>
            <div className="epic-actions">
                <button
                    className="action-button-secondary"
                    onClick={handlePlanEpics}
                    disabled={!canPlanEpics || initInProgress}
                    aria-label={epicTitles.length > 0 ? "Update project epics" : "Plan project epics"}
                    title={canPlanEpics ? 
                        (epicTitles.length > 0 ? "Update existing epic plans" : "Generate detailed epic plans based on project requirements") 
                        : "Complete project initialization first"}
                >
                    <span className="icon">📋</span>
                    {epicTitles.length > 0 ? 'Update Epics' : 'Plan Epics'}
                </button>
            </div>
            
            {/* Display epic titles list when epics exist */}
            {epicTitles.length > 0 && (
                <div className="epic-list">
                    <h4 className="epic-list-title">Current Epics:</h4>
                    <ul className="epic-titles">
                        {epicTitles.map((title, index) => (
                            <li key={index} className="epic-title">
                                <span className="epic-number">#{index + 1}</span>
                                <span className="epic-name">{title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};