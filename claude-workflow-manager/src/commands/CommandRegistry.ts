import { ClaudeCommand } from '../types';

export class CommandRegistry {
    private static readonly commands: { [key: string]: ClaudeCommand } = {
        initProject: {
            id: 'initProject',
            title: 'Initialize Project',
            command: '/1-Init',
            description: 'Initialize Claude workflow project structure',
            icon: 'tools',
            contextValue: 'action'
        },
        
        importFeedback: {
            id: 'importFeedback',
            title: 'Import Feedback',
            command: '/2-Update feedback',
            description: 'Import and analyze user feedback',
            icon: 'import',
            contextValue: 'action'
        },

        updateChallenge: {
            id: 'updateChallenge',
            title: 'Update Challenge',
            command: '/2-Update challenge',
            description: 'Update project challenges and constraints',
            icon: 'warning',
            contextValue: 'action'
        },

        updateStatus: {
            id: 'updateStatus',
            title: 'Update Status',
            command: '/2-Update status',
            description: 'Update project status and metrics',
            icon: 'pulse',
            contextValue: 'action'
        },

        enrichProject: {
            id: 'enrichProject',
            title: 'Enrich Project',
            command: '/2-Update enrich',
            description: 'Enrich project with additional context',
            icon: 'add',
            contextValue: 'action'
        },

        planEpics: {
            id: 'planEpics',
            title: 'Plan Epics',
            command: '/3-Epic plan',
            description: 'Plan and organize project epics',
            icon: 'list-tree',
            contextValue: 'action'
        },

        selectEpic: {
            id: 'selectEpic',
            title: 'Select Epic',
            command: '/4-Epic select',
            description: 'Select and activate an epic',
            icon: 'target',
            contextValue: 'epic'
        },

        completeEpic: {
            id: 'completeEpic',
            title: 'Complete Epic',
            command: '/4-Epic complete',
            description: 'Mark epic as completed',
            icon: 'check',
            contextValue: 'epic'
        },

        epicStatus: {
            id: 'epicStatus',
            title: 'Epic Status',
            command: '/4-Epic status',
            description: 'Show epic progress and status',
            icon: 'info',
            contextValue: 'epic'
        },

        planStories: {
            id: 'planStories',
            title: 'Plan Stories',
            command: '/5-Story plan',
            description: 'Plan user stories for current epic',
            icon: 'list-ordered',
            contextValue: 'action'
        },

        startStory: {
            id: 'startStory',
            title: 'Start Story',
            command: '/6-Story start',
            description: 'Start working on a story',
            icon: 'play',
            contextValue: 'story'
        },

        completeStory: {
            id: 'completeStory',
            title: 'Complete Story',
            command: '/6-Story complete',
            description: 'Mark story as completed',
            icon: 'check',
            contextValue: 'story'
        },

        storyStatus: {
            id: 'storyStatus',
            title: 'Story Status',
            command: '/6-Story status',
            description: 'Show story progress and status',
            icon: 'info',
            contextValue: 'story'
        },

        clearContext: {
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

    static getUpdateCommands(): ClaudeCommand[] {
        return [
            this.commands.importFeedback,
            this.commands.updateChallenge,
            this.commands.enrichProject,
            this.commands.updateStatus
        ];
    }

    static getEpicCommands(): ClaudeCommand[] {
        return [
            this.commands.selectEpic,
            this.commands.completeEpic,
            this.commands.epicStatus
        ];
    }

    static getStoryCommands(): ClaudeCommand[] {
        return [
            this.commands.startStory,
            this.commands.completeStory,
            this.commands.storyStatus
        ];
    }
}