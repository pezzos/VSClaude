import { SerializableProjectState, SerializableLogEntry, CommandHistoryEntry, CommandStatus } from '../../../src/webview/protocol';
import { ProjectStatus } from '../../../src/types';

// Fake project state for browser development
export const createFakeProjectState = (): SerializableProjectState => ({
  isInitialized: true,
  status: ProjectStatus.INITIALIZED,
  currentProjectPath: '/Users/dev/example-project',
  currentEpic: {
    id: '1',
    name: 'User Authentication System',
    description: 'Implement secure user authentication with JWT tokens',
    status: 'in-progress',
    stories: []
  },
  currentStory: {
    id: '1-1',
    name: 'Login Page Development',
    description: 'Create responsive login page with form validation',
    status: 'in-progress',
    tickets: []
  },
  epics: [
    {
      id: '1',
      name: 'User Authentication System',
      description: 'Implement secure user authentication with JWT tokens',
      status: 'in-progress',
      stories: [
        {
          id: '1-1',
          name: 'Login Page Development',
          description: 'Create responsive login page with form validation',
          status: 'in-progress',
          tickets: [
            { id: '1-1-1', title: 'Design login form layout', status: 'completed' },
            { id: '1-1-2', title: 'Add form validation', status: 'in-progress' },
            { id: '1-1-3', title: 'Implement password visibility toggle', status: 'pending' }
          ]
        },
        {
          id: '1-2',
          name: 'JWT Token Management',
          description: 'Implement secure token storage and refresh logic',
          status: 'pending',
          tickets: [
            { id: '1-2-1', title: 'Setup JWT library', status: 'pending' },
            { id: '1-2-2', title: 'Create token storage service', status: 'pending' }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Dashboard Interface',
      description: 'Build main dashboard with data visualization',
      status: 'pending',
      stories: [
        {
          id: '2-1',
          name: 'Analytics Dashboard',
          description: 'Create charts and metrics display',
          status: 'pending',
          tickets: [
            { id: '2-1-1', title: 'Setup chart library', status: 'pending' },
            { id: '2-1-2', title: 'Create metrics components', status: 'pending' }
          ]
        }
      ]
    }
  ],
  recentCommands: [
    'claude /project:agile:iterate',
    'claude /task:implement Login validation',
    'claude /debug Check authentication flow'
  ],
  lastUpdated: Date.now(),
  hasFeedback: true,
  hasChallenge: true,
  hasStatus: true,
  hasValidFeedback: true,
  hasExecutedImportFeedback: true,
  hasExecutedPlanEpics: true,
  epicTitles: ['User Authentication System', 'Dashboard Interface']
});

// Fake logs for development
export const createFakeLogs = (): SerializableLogEntry[] => [
  {
    timestamp: Date.now() - 10000,
    level: 'info',
    message: 'Starting project initialization...',
    source: 'claude'
  },
  {
    timestamp: Date.now() - 8000,
    level: 'info',
    message: 'Analyzing project structure',
    source: 'claude'
  },
  {
    timestamp: Date.now() - 6000,
    level: 'success',
    message: 'Found existing package.json',
    source: 'system'
  },
  {
    timestamp: Date.now() - 4000,
    level: 'info',
    message: 'Setting up project workflows...',
    source: 'claude'
  },
  {
    timestamp: Date.now() - 2000,
    level: 'success',
    message: 'Project successfully initialized!',
    source: 'system'
  }
];

// Fake command history
export const createFakeCommandHistory = (): CommandHistoryEntry[] => [
  {
    id: 'cmd-1',
    command: '/project:agile:start Example Project Setup',
    args: ['Example Project Setup'],
    status: CommandStatus.COMPLETED,
    startTime: Date.now() - 3600000, // 1 hour ago
    endTime: Date.now() - 3580000,
    output: 'Project successfully initialized with agile workflow'
  },
  {
    id: 'cmd-2', 
    command: '/project:agile:design',
    args: [],
    status: CommandStatus.COMPLETED,
    startTime: Date.now() - 1800000, // 30 minutes ago
    endTime: Date.now() - 1750000,
    output: 'Architecture design completed'
  },
  {
    id: 'cmd-3',
    command: '/project:agile:plan', 
    args: [],
    status: CommandStatus.COMPLETED,
    startTime: Date.now() - 900000, // 15 minutes ago
    endTime: Date.now() - 860000,
    output: 'Implementation plan created with 2 epics'
  }
];

// Mock statistics
export const createFakeStats = () => ({
  totalEpics: 2,
  completedEpics: 0,
  totalStories: 3, 
  completedStories: 0,
  totalTickets: 5,
  completedTickets: 1
});