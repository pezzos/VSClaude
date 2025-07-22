import { ClaudeCommand } from '../types';

export class CommandRegistry {
    private static readonly commands: { [key: string]: ClaudeCommand } = {
        // ===== PROJECT LEVEL (1-project) =====
        'initProject': {
            id: 'initProject',
            title: 'Initialize Project',
            command: '/1-project:1-start:1-Init-Project',
            description: 'Initialize Claude workflow project structure',
            icon: 'tools',
            contextValue: 'project'
        },

        'importFeedback': {
            id: 'importFeedback',
            title: 'Import Feedback',
            command: '/1-project:2-update:1-Import-feedback',
            description: 'Import and analyze user feedback',
            icon: 'import',
            contextValue: 'project'
        },

        'updateChallenge': {
            id: 'updateChallenge',
            title: 'Challenge Assumptions',
            command: '/1-project:2-update:2-Challenge',
            description: 'Challenge current assumptions and plans',
            icon: 'warning',
            contextValue: 'project'
        },

        'enrichProject': {
            id: 'enrichProject',
            title: 'Enrich Context',
            command: '/1-project:2-update:3-Enrich',
            description: 'Add context and insights to project',
            icon: 'add',
            contextValue: 'project'
        },

        'updateStatus': {
            id: 'updateStatus',
            title: 'Update Status',
            command: '/1-project:2-update:4-Status',
            description: 'Check and update project status',
            icon: 'pulse',
            contextValue: 'project'
        },

        'updateImplementationStatus': {
            id: 'updateImplementationStatus',
            title: 'Implementation Status',
            command: '/1-project:2-update:5-Implementation-Status',
            description: 'Review implementation progress',
            icon: 'checklist',
            contextValue: 'project'
        },

        'planEpics': {
            id: 'planEpics',
            title: 'Plan Epics',
            command: '/1-project:3-epics:1-Plan-Epics',
            description: 'Create EPICS.md with prioritized epics',
            icon: 'list-tree',
            contextValue: 'project'
        },

        'updateEpicImplementation': {
            id: 'updateEpicImplementation',
            title: 'Update Epic Implementation',
            command: '/1-project:3-epics:2-Update-Implementation',
            description: 'Update epic implementation status',
            icon: 'sync',
            contextValue: 'project'
        },

        // ===== EPIC LEVEL (2-epic) =====
        'selectStories': {
            id: 'selectStories',
            title: 'Select Epic & Stories',
            command: '/2-epic:1-start:1-Select-Stories',
            description: 'Choose next epic and create PRD',
            icon: 'target',
            contextValue: 'epic'
        },

        'planStories': {
            id: 'planStories',
            title: 'Plan Stories',
            command: '/2-epic:1-start:2-Plan-stories',
            description: 'Create STORIES.md with acceptance criteria',
            icon: 'list-ordered',
            contextValue: 'epic'
        },

        'completeEpic': {
            id: 'completeEpic',
            title: 'Complete Epic',
            command: '/2-epic:2-manage:1-Complete-Epic',
            description: 'Archive completed epic',
            icon: 'check',
            contextValue: 'epic'
        },

        'epicStatus': {
            id: 'epicStatus',
            title: 'Epic Status',
            command: '/2-epic:2-manage:2-Status-Epic',
            description: 'Check epic progress and blockers',
            icon: 'info',
            contextValue: 'epic'
        },

        // ===== STORY LEVEL (3-story) =====
        'startStory': {
            id: 'startStory',
            title: 'Start Story',
            command: '/3-story:1-manage:1-Start-Story',
            description: 'Select story and create TODO.md',
            icon: 'play',
            contextValue: 'story'
        },

        'completeStory': {
            id: 'completeStory',
            title: 'Complete Story',
            command: '/3-story:1-manage:2-Complete-Story',
            description: 'Mark story complete and update docs',
            icon: 'check',
            contextValue: 'story'
        },

        // ===== TICKET LEVEL (4-ticket) =====
        'ticketFromStory': {
            id: 'ticketFromStory',
            title: 'Ticket from Story',
            command: '/4-ticket:1-start:1-From-story',
            description: 'Create ticket from current story',
            icon: 'plus',
            contextValue: 'ticket'
        },

        'ticketFromIssue': {
            id: 'ticketFromIssue',
            title: 'Ticket from Issue',
            command: '/4-ticket:1-start:2-From-issue',
            description: 'Create ticket from GitHub issue',
            icon: 'plus',
            contextValue: 'ticket'
        },

        'ticketFromInput': {
            id: 'ticketFromInput',
            title: 'Ticket from Input',
            command: '/4-ticket:1-start:3-From-input',
            description: 'Create ticket from user input',
            icon: 'plus',
            contextValue: 'ticket'
        },

        'planTicket': {
            id: 'planTicket',
            title: 'Plan Ticket',
            command: '/4-ticket:2-execute:1-Plan-Ticket',
            description: 'Create detailed implementation plan',
            icon: 'gear',
            contextValue: 'ticket'
        },

        'testDesign': {
            id: 'testDesign',
            title: 'Design Tests',
            command: '/4-ticket:2-execute:2-Test-design',
            description: 'Design test strategy and cases',
            icon: 'gear',
            contextValue: 'ticket'
        },

        'implement': {
            id: 'implement',
            title: 'Implement',
            command: '/4-ticket:2-execute:3-Implement',
            description: 'Code implementation and testing',
            icon: 'gear',
            contextValue: 'ticket'
        },

        'validateTicket': {
            id: 'validateTicket',
            title: 'Validate Ticket',
            command: '/4-ticket:2-execute:4-Validate-Ticket',
            description: 'Validate against acceptance criteria',
            icon: 'gear',
            contextValue: 'ticket'
        },

        'reviewTicket': {
            id: 'reviewTicket',
            title: 'Review Ticket',
            command: '/4-ticket:2-execute:5-Review-Ticket',
            description: 'Final review and documentation',
            icon: 'gear',
            contextValue: 'ticket'
        },

        'archiveTicket': {
            id: 'archiveTicket',
            title: 'Archive Ticket',
            command: '/4-ticket:3-complete:1-Archive-Ticket',
            description: 'Archive completed ticket',
            icon: 'archive',
            contextValue: 'ticket'
        },

        'statusTicket': {
            id: 'statusTicket',
            title: 'Ticket Status',
            command: '/4-ticket:3-complete:2-Status-Ticket',
            description: 'Update ticket status in docs',
            icon: 'archive',
            contextValue: 'ticket'
        },

        // ===== SUPPORT TOOLS =====
        'debugCheckState': {
            id: 'debugCheckState',
            title: 'Debug: Check State',
            command: '/debug:1-Check-state',
            description: 'Verify project structure integrity',
            icon: 'bug',
            contextValue: 'support'
        },

        'debugFixStructure': {
            id: 'debugFixStructure',
            title: 'Debug: Fix Structure',
            command: '/debug:2-Fix-structure',
            description: 'Repair project structure issues',
            icon: 'bug',
            contextValue: 'support'
        },

        'enrichGlobal': {
            id: 'enrichGlobal',
            title: 'Enrich: Global Context',
            command: '/enrich:1-claude:1-Global',
            description: 'Update global Claude context',
            icon: 'light-bulb',
            contextValue: 'support'
        },

        'enrichEpic': {
            id: 'enrichEpic',
            title: 'Enrich: Epic Context',
            command: '/enrich:1-claude:2-Epic',
            description: 'Enrich epic-specific context',
            icon: 'light-bulb',
            contextValue: 'support'
        },

        'enrichPostTicket': {
            id: 'enrichPostTicket',
            title: 'Enrich: Post-Ticket',
            command: '/enrich:1-claude:3-Post-ticket',
            description: 'Update context after ticket completion',
            icon: 'light-bulb',
            contextValue: 'support'
        },

        'metricsUpdate': {
            id: 'metricsUpdate',
            title: 'Metrics: Update',
            command: '/metrics:1-manage:1-Update',
            description: 'Update project metrics',
            icon: 'graph',
            contextValue: 'support'
        },

        'metricsDashboard': {
            id: 'metricsDashboard',
            title: 'Metrics: Dashboard',
            command: '/metrics:1-manage:2-Dashboard',
            description: 'Generate metrics dashboard',
            icon: 'graph',
            contextValue: 'support'
        },

        'learningDashboard': {
            id: 'learningDashboard',
            title: 'Learning Dashboard',
            command: '/learning:dashboard',
            description: 'Display learning insights and patterns',
            icon: 'book',
            contextValue: 'support'
        },

        // ===== SYSTEM COMMANDS =====
        'clearContext': {
            id: 'clearContext',
            title: 'Clear Context',
            command: '/clear',
            description: 'Clear conversation context',
            icon: 'clear-all',
            contextValue: 'action'
        }
    };

    static getCommand(id: string): ClaudeCommand | undefined {
        return this.commands[id];
    }

    static getAllCommands(): ClaudeCommand[] {
        return Object.values(this.commands);
    }

    static getCommandsByContext(contextValue: string): ClaudeCommand[] {
        return Object.values(this.commands).filter(cmd => cmd.contextValue === contextValue);
    }

    static getProjectCommands(): ClaudeCommand[] {
        return [
            this.commands.initProject,
            this.commands.planEpics,
            this.commands.updateEpicImplementation
        ];
    }

    static getUpdateCommands(): ClaudeCommand[] {
        return [
            this.commands.importFeedback,
            this.commands.updateChallenge,
            this.commands.enrichProject,
            this.commands.updateStatus,
            this.commands.updateImplementationStatus
        ];
    }

    static getEpicCommands(): ClaudeCommand[] {
        return [
            this.commands.selectStories,
            this.commands.planStories,
            this.commands.completeEpic,
            this.commands.epicStatus
        ];
    }

    static getStoryCommands(): ClaudeCommand[] {
        return [
            this.commands.startStory,
            this.commands.completeStory
        ];
    }

    static getTicketCreateCommands(): ClaudeCommand[] {
        return [
            this.commands.ticketFromStory,
            this.commands.ticketFromIssue,
            this.commands.ticketFromInput
        ];
    }

    static getTicketExecuteCommands(): ClaudeCommand[] {
        return [
            this.commands.planTicket,
            this.commands.testDesign,
            this.commands.implement,
            this.commands.validateTicket,
            this.commands.reviewTicket
        ];
    }

    static getTicketCompleteCommands(): ClaudeCommand[] {
        return [
            this.commands.archiveTicket,
            this.commands.statusTicket
        ];
    }

    static getSupportCommands(): ClaudeCommand[] {
        return [
            this.commands.debugCheckState,
            this.commands.debugFixStructure,
            this.commands.enrichGlobal,
            this.commands.enrichEpic,
            this.commands.enrichPostTicket,
            this.commands.metricsUpdate,
            this.commands.metricsDashboard,
            this.commands.learningDashboard
        ];
    }
}