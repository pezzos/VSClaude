import { SerializableProjectState, SerializableLogEntry, CommandHistoryEntry, CommandStatus } from '../../../src/webview/protocol';
import { ProjectStatus } from '../../../src/types';

// Fake project state for browser development
export const createFakeProjectState = (): SerializableProjectState => ({
  isInitialized: true,
  status: ProjectStatus.ACTIVE,
  currentProjectPath: '/Users/dev/example-project',
  currentEpic: {
    id: '1',
    name: 'User Authentication System',
    description: 'Implement secure user authentication with JWT tokens',
    status: 'in-progress',
    stories: [],
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000, // 1 hour ago
    priority: 'high',
    tags: ['authentication', 'security']
  },
  currentStory: {
    id: '1-1',
    name: 'Login Page Development',
    description: 'Create responsive login page with form validation',
    status: 'in-progress',
    tickets: [],
    epicId: '1',
    createdAt: Date.now() - 43200000, // 12 hours ago
    updatedAt: Date.now() - 1800000, // 30 minutes ago
    acceptanceCriteria: ['Form validates all inputs', 'Shows appropriate error messages', 'Responsive design works on mobile']
  },
  epics: [
    {
      id: '1',
      name: 'User Authentication System',
      description: 'Implement secure user authentication with JWT tokens',
      status: 'in-progress',
      createdAt: Date.now() - 86400000, // 1 day ago
      updatedAt: Date.now() - 3600000, // 1 hour ago
      priority: 'high',
      tags: ['authentication', 'security'],
      stories: [
        {
          id: '1-1',
          name: 'Login Page Development',
          description: 'Create responsive login page with form validation',
          status: 'in-progress',
          epicId: '1',
          createdAt: Date.now() - 43200000, // 12 hours ago
          updatedAt: Date.now() - 1800000, // 30 minutes ago
          acceptanceCriteria: ['Form validates all inputs', 'Shows appropriate error messages', 'Responsive design works on mobile'],
          tickets: [
            { 
              id: '1-1-1', 
              name: 'Design login form layout', 
              description: 'Create responsive login form with proper styling',
              status: 'completed',
              storyId: '1-1',
              createdAt: Date.now() - 86400000, // 1 day ago
              updatedAt: Date.now() - 43200000, // 12 hours ago
              labels: ['ui', 'design']
            },
            { 
              id: '1-1-2', 
              name: 'Add form validation', 
              description: 'Implement client-side form validation',
              status: 'in-progress',
              storyId: '1-1',
              createdAt: Date.now() - 43200000, // 12 hours ago
              updatedAt: Date.now() - 1800000, // 30 minutes ago
              labels: ['validation', 'frontend']
            },
            { 
              id: '1-1-3', 
              name: 'Implement password visibility toggle', 
              description: 'Add toggle button for password visibility',
              status: 'todo',
              storyId: '1-1',
              createdAt: Date.now() - 21600000, // 6 hours ago
              updatedAt: Date.now() - 21600000, // 6 hours ago
              labels: ['ui', 'accessibility']
            }
          ]
        },
        {
          id: '1-2',
          name: 'JWT Token Management',
          description: 'Implement secure token storage and refresh logic',
          status: 'todo',
          epicId: '1',
          createdAt: Date.now() - 21600000, // 6 hours ago
          updatedAt: Date.now() - 21600000, // 6 hours ago
          acceptanceCriteria: ['Secure token storage', 'Automatic token refresh', 'Proper logout functionality'],
          tickets: [
            { 
              id: '1-2-1', 
              name: 'Setup JWT library', 
              description: 'Install and configure JWT library',
              status: 'todo',
              storyId: '1-2',
              createdAt: Date.now() - 21600000, // 6 hours ago
              updatedAt: Date.now() - 21600000, // 6 hours ago
              labels: ['setup', 'jwt']
            },
            { 
              id: '1-2-2', 
              name: 'Create token storage service', 
              description: 'Implement secure token storage and retrieval',
              status: 'todo',
              storyId: '1-2',
              createdAt: Date.now() - 18000000, // 5 hours ago
              updatedAt: Date.now() - 18000000, // 5 hours ago
              labels: ['security', 'service']
            }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Dashboard Interface',
      description: 'Build main dashboard with data visualization',
      status: 'planning',
      createdAt: Date.now() - 43200000, // 12 hours ago
      updatedAt: Date.now() - 43200000, // 12 hours ago
      priority: 'medium',
      tags: ['ui', 'dashboard', 'analytics'],
      stories: [
        {
          id: '2-1',
          name: 'Analytics Dashboard',
          description: 'Create charts and metrics display',
          status: 'todo',
          epicId: '2',
          createdAt: Date.now() - 10800000, // 3 hours ago
          updatedAt: Date.now() - 10800000, // 3 hours ago
          acceptanceCriteria: ['Interactive charts', 'Real-time data updates', 'Export functionality'],
          tickets: [
            { 
              id: '2-1-1', 
              name: 'Setup chart library', 
              description: 'Install and configure charting library',
              status: 'todo',
              storyId: '2-1',
              createdAt: Date.now() - 10800000, // 3 hours ago
              updatedAt: Date.now() - 10800000, // 3 hours ago
              labels: ['setup', 'charts']
            },
            { 
              id: '2-1-2', 
              name: 'Create metrics components', 
              description: 'Build reusable metrics display components',
              status: 'todo',
              storyId: '2-1',
              createdAt: Date.now() - 7200000, // 2 hours ago
              updatedAt: Date.now() - 7200000, // 2 hours ago
              labels: ['components', 'metrics']
            }
          ]
        }
      ]
    }
  ],
  recentCommands: [
    {
      id: 'recent-1',
      command: '/project:agile:iterate',
      args: [],
      status: CommandStatus.COMPLETED,
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now() - 3580000,
      output: 'Iteration completed successfully'
    },
    {
      id: 'recent-2', 
      command: '/task:implement',
      args: ['Login validation'],
      status: CommandStatus.COMPLETED,
      startTime: Date.now() - 1800000, // 30 minutes ago
      endTime: Date.now() - 1700000,
      output: 'Login validation implemented'
    },
    {
      id: 'recent-3',
      command: '/debug',
      args: ['Check authentication flow'],
      status: CommandStatus.COMPLETED,
      startTime: Date.now() - 900000, // 15 minutes ago
      endTime: Date.now() - 800000,
      output: 'Authentication flow debugged'
    }
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
    id: 'log-1',
    timestamp: Date.now() - 10000,
    level: 'info',
    message: 'Starting project initialization...',
    source: 'claude'
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 8000,
    level: 'info',
    message: 'Analyzing project structure',
    source: 'claude'
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 6000,
    level: 'info',
    message: 'Found existing package.json',
    source: 'system'
  },
  {
    id: 'log-4',
    timestamp: Date.now() - 4000,
    level: 'info',
    message: 'Setting up project workflows...',
    source: 'claude'
  },
  {
    id: 'log-5',
    timestamp: Date.now() - 2000,
    level: 'info',
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