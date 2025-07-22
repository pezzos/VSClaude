import React from 'react';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';

interface ActionHeaderProps {
    isInitialized: boolean;
    initInProgress: boolean;
    canImportFeedback: boolean;
    canPlanEpics: boolean;
    onInitializeProject?: () => void;
    onImportFeedback?: () => void;
    onPlanEpics?: () => void;
}

export const ActionHeader: React.FC<ActionHeaderProps> = ({
    isInitialized,
    initInProgress,
    canImportFeedback,
    canPlanEpics,
    onInitializeProject,
    onImportFeedback,
    onPlanEpics
}) => {
    const api = useVSCodeAPI();

    const handleInitializeProject = () => {
        api.executeCommand('Init-Project');
        onInitializeProject?.();
    };

    const handleImportFeedback = () => {
        api.executeCommand('Import-FEEDBACK.md');
        onImportFeedback?.();
    };

    const handlePlanEpics = () => {
        api.executeCommand('Plan-Epics');
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
            <div className="secondary-actions">
                <button
                    className="action-button-secondary"
                    onClick={handleImportFeedback}
                    disabled={!canImportFeedback || initInProgress}
                    aria-label="Import feedback document"
                    title={canImportFeedback ? "Import FEEDBACK.md to update project requirements" : "Complete project initialization first"}
                >
                    <span className="icon">📋</span>
                    Import FEEDBACK.md
                </button>
                
                <button
                    className="action-button-secondary"
                    onClick={handlePlanEpics}
                    disabled={!canPlanEpics || initInProgress}
                    aria-label="Plan project epics"
                    title={canPlanEpics ? "Generate detailed epic plans based on project requirements" : "Import FEEDBACK.md first"}
                >
                    <span className="icon">📊</span>
                    Plan EPICS
                </button>
            </div>
        </div>
    );
};