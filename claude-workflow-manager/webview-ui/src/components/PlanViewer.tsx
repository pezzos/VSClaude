import React, { useState } from 'react';
import { 
    FileText, 
    Edit3, 
    Check, 
    X, 
    Download,
    Share,
    Clock,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Code,
    File,
    Folder
} from 'lucide-react';

interface PlanViewerProps {
    className?: string;
}

interface PlanStep {
    id: string;
    title: string;
    description: string;
    type: 'file_change' | 'new_file' | 'command' | 'validation';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    filePath?: string;
    changes?: string;
    dependencies?: string[];
    estimatedTime?: number;
    complexity?: 'low' | 'medium' | 'high';
}

interface Plan {
    id: string;
    name: string;
    description: string;
    version: number;
    status: 'draft' | 'approved' | 'in_progress' | 'completed';
    createdAt: number;
    updatedAt: number;
    estimatedHours: number;
    actualHours?: number;
    steps: PlanStep[];
    tags: string[];
    riskLevel: 'low' | 'medium' | 'high';
}

// Mock plan data - in real implementation, this would come from the extension
const mockPlan: Plan = {
    id: 'plan-001',
    name: 'Webview Interface Implementation',
    description: 'Transform the existing tree view into a modern Traycer-style interface with task panels and interactive components',
    version: 1,
    status: 'approved',
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
    estimatedHours: 8,
    actualHours: 3.5,
    riskLevel: 'medium',
    tags: ['UI', 'React', 'Webview', 'Architecture'],
    steps: [
        {
            id: 'step-001',
            title: 'Create WebviewProvider',
            description: 'Implement the main webview provider class to handle communication between extension and UI',
            type: 'new_file',
            status: 'completed',
            filePath: 'src/webview/WorkflowWebviewProvider.ts',
            complexity: 'high',
            estimatedTime: 120
        },
        {
            id: 'step-002',
            title: 'Define Communication Protocol',
            description: 'Create TypeScript interfaces for webview ↔ extension communication',
            type: 'new_file',
            status: 'completed',
            filePath: 'src/webview/protocol.ts',
            complexity: 'medium',
            estimatedTime: 60
        },
        {
            id: 'step-003',
            title: 'Setup React Components',
            description: 'Create the main React components for the Traycer-style interface',
            type: 'new_file',
            status: 'in_progress',
            filePath: 'webview-ui/src/components/',
            complexity: 'high',
            estimatedTime: 180,
            dependencies: ['step-001', 'step-002']
        },
        {
            id: 'step-004',
            title: 'Update Extension Registration',
            description: 'Modify extension.ts to register the new webview provider',
            type: 'file_change',
            status: 'pending',
            filePath: 'src/extension.ts',
            complexity: 'medium',
            estimatedTime: 30,
            dependencies: ['step-001']
        }
    ]
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'in_progress': return 'status-in-progress';
        case 'failed': return 'status-failed';
        default: return 'status-pending';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return <CheckCircle className="status-icon completed" />;
        case 'in_progress': return <Clock className="status-icon in-progress" />;
        case 'failed': return <X className="status-icon failed" />;
        default: return <Clock className="status-icon pending" />;
    }
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'new_file': return <File className="type-icon new-file" />;
        case 'file_change': return <Edit3 className="type-icon file-change" />;
        case 'command': return <Code className="type-icon command" />;
        case 'validation': return <CheckCircle className="type-icon validation" />;
        default: return <FileText className="type-icon" />;
    }
};

const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
        case 'high': return 'complexity-high';
        case 'medium': return 'complexity-medium';
        case 'low': return 'complexity-low';
        default: return 'complexity-medium';
    }
};

const getRiskColor = (risk: string) => {
    switch (risk) {
        case 'high': return 'risk-high';
        case 'medium': return 'risk-medium';
        case 'low': return 'risk-low';
        default: return 'risk-medium';
    }
};

export const PlanViewer: React.FC<PlanViewerProps> = ({ className }) => {
    const [plan] = useState<Plan>(mockPlan);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_editingStep, _setEditingStep] = useState<string | null>(null);
    const [showMetrics, setShowMetrics] = useState(true);

    const toggleStepExpanded = (stepId: string) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepId)) {
                next.delete(stepId);
            } else {
                next.add(stepId);
            }
            return next;
        });
    };

    const completedSteps = plan.steps.filter(step => step.status === 'completed').length;
    const totalSteps = plan.steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    const totalEstimatedTime = plan.steps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
    const completedTime = plan.steps
        .filter(step => step.status === 'completed')
        .reduce((sum, step) => sum + (step.estimatedTime || 0), 0);

    return (
        <div className={`plan-viewer ${className || ''}`}>
            {/* Plan Header */}
            <div className="plan-header">
                <div className="plan-title-section">
                    <div className="plan-title">
                        <FileText className="plan-icon" />
                        <div>
                            <h2>{plan.name}</h2>
                            <p className="plan-description">{plan.description}</p>
                        </div>
                    </div>
                    <div className="plan-actions">
                        <button className="action-button secondary">
                            <Edit3 className="action-icon" />
                            Edit
                        </button>
                        <button className="action-button secondary">
                            <Download className="action-icon" />
                            Export
                        </button>
                        <button className="action-button secondary">
                            <Share className="action-icon" />
                            Share
                        </button>
                    </div>
                </div>

                <div className="plan-meta">
                    <div className="meta-item">
                        <span className={`status-badge ${getStatusColor(plan.status)}`}>
                            {plan.status}
                        </span>
                    </div>
                    <div className="meta-item">
                        <span className={`risk-badge ${getRiskColor(plan.riskLevel)}`}>
                            <AlertTriangle className="risk-icon" />
                            {plan.riskLevel} risk
                        </span>
                    </div>
                    <div className="meta-item">
                        <span className="version-badge">v{plan.version}</span>
                    </div>
                </div>

                <div className="plan-tags">
                    {plan.tags.map(tag => (
                        <span key={tag} className="plan-tag">{tag}</span>
                    ))}
                </div>
            </div>

            {/* Plan Metrics */}
            {showMetrics && (
                <div className="plan-metrics">
                    <div className="metrics-header">
                        <h3>Plan Metrics</h3>
                        <button 
                            className="metrics-toggle"
                            onClick={() => setShowMetrics(!showMetrics)}
                        >
                            <ChevronDown className="toggle-icon" />
                        </button>
                    </div>
                    
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <h4>Progress</h4>
                            <div className="metric-content">
                                <div className="progress-circle">
                                    <svg viewBox="0 0 36 36" className="circular-chart">
                                        <path
                                            className="circle-bg"
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="circle"
                                            strokeDasharray={`${progressPercentage}, 100`}
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="percentage">{Math.round(progressPercentage)}%</div>
                                </div>
                                <div className="progress-details">
                                    <span>{completedSteps} / {totalSteps} steps</span>
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <h4>Time Tracking</h4>
                            <div className="metric-content">
                                <div className="time-stats">
                                    <div className="time-stat">
                                        <span className="time-label">Estimated</span>
                                        <span className="time-value">{Math.round(totalEstimatedTime / 60)}h</span>
                                    </div>
                                    <div className="time-stat">
                                        <span className="time-label">Completed</span>
                                        <span className="time-value">{Math.round(completedTime / 60)}h</span>
                                    </div>
                                    <div className="time-stat">
                                        <span className="time-label">Remaining</span>
                                        <span className="time-value">{Math.round((totalEstimatedTime - completedTime) / 60)}h</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <h4>Complexity Breakdown</h4>
                            <div className="metric-content">
                                <div className="complexity-chart">
                                    {['high', 'medium', 'low'].map(complexity => {
                                        const count = plan.steps.filter(step => step.complexity === complexity).length;
                                        const percentage = (count / totalSteps) * 100;
                                        return (
                                            <div key={complexity} className="complexity-bar">
                                                <span className={`complexity-label ${getComplexityColor(complexity)}`}>
                                                    {complexity} ({count})
                                                </span>
                                                <div className="bar-container">
                                                    <div 
                                                        className={`bar-fill ${getComplexityColor(complexity)}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Plan Steps */}
            <div className="plan-steps">
                <div className="steps-header">
                    <h3>Implementation Steps</h3>
                    <div className="steps-summary">
                        {completedSteps} of {totalSteps} completed
                    </div>
                </div>

                <div className="steps-list">
                    {plan.steps.map((step, index) => (
                        <div 
                            key={step.id} 
                            className={`step-card ${getStatusColor(step.status)}`}
                        >
                            <div className="step-header" onClick={() => toggleStepExpanded(step.id)}>
                                <div className="step-number">{index + 1}</div>
                                <div className="step-title-section">
                                    <div className="step-title">
                                        {getStatusIcon(step.status)}
                                        {getTypeIcon(step.type)}
                                        <h4>{step.title}</h4>
                                    </div>
                                    <div className="step-meta">
                                        <span className={`complexity-badge ${getComplexityColor(step.complexity)}`}>
                                            {step.complexity}
                                        </span>
                                        {step.estimatedTime && (
                                            <span className="time-badge">
                                                <Clock className="time-icon" />
                                                {Math.round(step.estimatedTime / 60)}h
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="step-expand">
                                    {expandedSteps.has(step.id) ? 
                                        <ChevronDown className="expand-icon" /> : 
                                        <ChevronRight className="expand-icon" />
                                    }
                                </div>
                            </div>

                            {expandedSteps.has(step.id) && (
                                <div className="step-details">
                                    <p className="step-description">{step.description}</p>
                                    
                                    {step.filePath && (
                                        <div className="file-info">
                                            <Folder className="file-icon" />
                                            <code className="file-path">{step.filePath}</code>
                                        </div>
                                    )}

                                    {step.dependencies && step.dependencies.length > 0 && (
                                        <div className="dependencies">
                                            <h5>Dependencies:</h5>
                                            <ul>
                                                {step.dependencies.map(dep => {
                                                    const depStep = plan.steps.find(s => s.id === dep);
                                                    return (
                                                        <li key={dep} className="dependency">
                                                            {getStatusIcon(depStep?.status || 'pending')}
                                                            {depStep?.title || dep}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {step.changes && (
                                        <div className="changes-preview">
                                            <h5>Expected Changes:</h5>
                                            <pre className="changes-code">{step.changes}</pre>
                                        </div>
                                    )}

                                    <div className="step-actions">
                                        <button 
                                            className="step-action edit"
                                            onClick={() => _setEditingStep(step.id)}
                                        >
                                            <Edit3 className="action-icon" />
                                            Edit Step
                                        </button>
                                        {step.status === 'pending' && (
                                            <button className="step-action start">
                                                <Check className="action-icon" />
                                                Mark Started
                                            </button>
                                        )}
                                        {step.status === 'in_progress' && (
                                            <button className="step-action complete">
                                                <CheckCircle className="action-icon" />
                                                Mark Completed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};