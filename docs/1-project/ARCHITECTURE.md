# VSClaude Architecture

## Overview

VSClaude is a Visual Studio Code extension that provides a visual interface for Claude Code's agile development workflow. The extension displays project state in real-time through an interactive tree view and enables direct execution of Claude Code commands from the VS Code interface.

## System Architecture

### Core Components

```
claude-workflow-manager/
├── src/
│   ├── extension.ts                   # Main entry point
│   ├── providers/
│   │   ├── WorkflowTreeProvider.ts   # Main tree view provider
│   │   └── StateManager.ts           # Project state management
│   ├── commands/
│   │   ├── CommandExecutor.ts        # Claude command execution
│   │   └── CommandRegistry.ts        # Command mapping registry
│   ├── parsers/
│   │   ├── ProjectParser.ts          # Parse EPICS.md, etc.
│   │   ├── EpicParser.ts            # Parse PRD.md
│   │   └── StoryParser.ts           # Parse STORIES.md
│   └── views/
│       └── icons/                    # Tree view icons
├── package.json
└── README.md
```

### State Management Architecture

The extension employs a hierarchical state management system:

```typescript
interface ProjectState {
    initialized: boolean;
    currentEpic: EpicState | null;
    currentStory: StoryState | null;
    currentTicket: TicketState | null;
}
```

#### State Detection Strategy

```typescript
class StateDetector {
    async getProjectState(): ProjectState {
        // Check file existence
        const hasEpics = await fs.exists('docs/1-project/EPICS.md');
        const hasPRD = await fs.exists('docs/2-current-epic/PRD.md');
        const hasStories = await fs.exists('docs/2-current-epic/STORIES.md');
        
        // Parse files to extract state
        return {
            initialized: hasEpics,
            currentEpic: this.parseCurrentEpic(),
            currentStory: this.parseCurrentStory(),
            // Additional state properties...
        };
    }
}
```

### Command Execution Architecture

The extension integrates with Claude Code CLI through a structured command execution system:

```typescript
async function executeClaudeCommand(command: string) {
    const terminal = vscode.window.createTerminal('Claude Workflow');
    terminal.sendText(`claude -p "${command}"`);
    terminal.show();
    
    // Wait for completion and refresh tree
    setTimeout(() => {
        this.refresh();
    }, 3000);
}
```

#### Command Mapping System

The extension maintains a registry of Claude Code commands mapped to their corresponding UI actions:

```typescript
interface CommandMapping {
    projectInit: '/1-Init';
    importFeedback: '/1-project:2-update:1-Import-feedback';
    challengeProject: '/1-project:2-update:2-Challenge';
    enrichProject: '/1-project:2-update:3-Enrich';
    statusProject: '/1-project:2-update:4-Status';
    planEpics: '/1-project:3-plan:1-Epics';
    selectEpic: '/2-epic:1-select:{epicId}';
    planStories: '/2-epic:2-plan:1-Stories';
    startStory: '/3-story:1-start:{storyId}';
    completeStory: '/3-story:2-complete';
}
```

#### Terminal Integration Strategy

- **Named Terminals**: Uses consistent 'Claude Workflow' terminal for all operations
- **Command Visibility**: Maintains user visibility of all executed commands
- **State Synchronization**: Automatic tree refresh after command completion
- **Error Handling**: Terminal output monitoring for command completion status

### Tree View Architecture

The extension uses VS Code's TreeDataProvider interface to create a dynamic, context-aware tree view:

#### Tree Structure Hierarchy

1. **Project Level**: Displays project name and initialization state
2. **Epic Level**: Shows planned and active epics with completion status
3. **Story Level**: Displays prioritized stories within each epic
4. **Ticket Level**: Shows individual development tasks with status

#### Visual State System

- 🏗️ Project (uninitialized)
- 📁 Project (active)
- 📚 Epic collection
- 🎯 Epic (gray=planned, blue=active, green=completed)
- 📝 Story collection
- 📌 Story (P0=red, P1=orange, P2=yellow, P3=gray)
- 🎫 Ticket collection
- ⏳ Ticket (planned)
- 🚧 Ticket (in progress)
- ✓ Ticket (completed)

## Dynamic Behavior Patterns

### 1. Initial State
- Only "Initialize Project" action visible
- Execution clones config repository and runs `/1-Init`
- Parses README.md to extract project name
- Single action button for streamlined first-time setup

### 2. Post-Initialization State (Project Without Content)
- Displays project name from parsed README
- Shows "Update" commands with Import-feedback highlighted
- Other update commands remain disabled until feedback import
- Creates clear visual hierarchy for next steps

### 3. Post-Feedback Import State
- Enables remaining Update commands (Challenge, Enrich, Status)
- Displays Epics section with "Plan new epics" action
- Triggers epic planning workflow
- Unlocks full workflow capabilities

### 4. Epic Management State
- Parses EPICS.md to display epic list with status indicators
- Provides "Select epic" action for each planned epic
- Shows completion status with visual indicators (gray=planned, blue=active, green=completed)
- Displays "Plan new epics" option for continuous planning

### 5. Active Epic State
- Parses PRD.md for current epic context
- Shows "Plan stories" if story planning not yet completed
- Displays story list from STORIES.md with priority indicators
- Provides story management actions (Complete, Status)

### 6. Active Story State
- Shows story details with priority-based color coding
- Displays ticket collection with individual task status
- Provides "Complete story" action for workflow progression
- Shows real-time ticket progress (planned ⏳, in progress 🚧, completed ✓)

### 7. Contextual Navigation
- Right-click context menus for element-specific actions
- Double-click opens associated .md files in editor
- Progress badges show completion ratios (e.g., 3/5 stories completed)
- Smart action availability based on current workflow state

## Advanced Features Architecture

### Status Bar Integration
- Displays current epic/story/ticket in VS Code status bar
- Click to focus element in tree view
- Provides quick navigation without opening tree

### Command Palette Integration
- "Claude: Next ticket" - Auto-selects next available ticket
- "Claude: Complete current" - Marks current element as completed
- "Claude: Show metrics" - Displays progress dashboard

### Notification System
- Toast notifications for command completion
- Warning alerts for invalid actions
- Progress bars for long-running commands

### File System Synchronization
- File watchers monitor .md file changes
- Automatic tree refresh on Git changes
- Real-time state synchronization

## Configuration Architecture

### Extension Settings
```json
{
    "claudeWorkflow.autoRefresh": true,
    "claudeWorkflow.commandTimeout": 60,
    "claudeWorkflow.showCompletedItems": true,
    "claudeWorkflow.githubConfigRepo": "user/claude-config"
}
```

### Command Registry
- `claude-workflow.initProject` - Initialize new project
- `claude-workflow.refresh` - Manual state refresh
- `claude-workflow.executeCommand` - Execute Claude commands
- `claude-workflow.showCurrent` - Show current context
- `claude-workflow.clearContext` - Clear current context

## Performance Considerations

### File System Operations
- Asynchronous file operations to prevent UI blocking
- Caching of parsed document states
- Efficient change detection through file watchers

### Command Execution
- Terminal-based execution to maintain user visibility
- Configurable timeouts for long-running operations
- Error handling and recovery mechanisms

## Security Architecture

### Input Validation
- Sanitization of user inputs before command execution
- Validation of file paths and command parameters
- Protection against command injection attacks

### File System Access
- Restricted to project directory scope
- Validation of file existence before operations
- Safe handling of file permissions

## Extensibility Architecture

### Plugin Architecture
- Modular parser system for different document types
- Extensible command registry for new Claude Code commands
- Configurable icon and theme system

### Integration Points
- VS Code extension API compliance
- Claude Code CLI compatibility
- Git integration through VS Code APIs

## MVP Implementation Strategy

### Version 1.0 Core Features
1. **Basic TreeView**: File-based parsing with document state detection
2. **Core Command Execution**: Primary Claude Code command integration
3. **Manual Refresh**: User-triggered state synchronization (refresh button)
4. **Hierarchical Navigation**: Project → Epic → Story → Ticket progression
5. **File Integration**: Double-click to open associated .md files in editor

### Implementation Priority

#### Phase 1: Foundation
- `WorkflowTreeProvider` with basic tree structure
- `StateDetector` for document parsing
- `CommandExecutor` for terminal integration
- Manual refresh button and basic UI

#### Phase 2: Interactivity
- Click handlers for tree elements
- Context menus for actions
- File opening integration
- Basic error handling

#### Phase 3: Polish
- Auto-refresh capabilities
- Status bar integration
- Command palette commands
- Configuration settings

## Deployment Architecture

### Installation Process
1. Clone configuration repository from GitHub
2. Install commands in `.claude/commands/` directory
3. Verify Claude CLI availability
4. Activate extension and initialize project structure

### Automated Setup Workflow
```typescript
class SetupManager {
    async initialize() {
        // 1. Clone config repo
        await this.cloneConfigRepository();
        
        // 2. Install commands
        await this.installCommands();
        
        // 3. Verify CLI
        const isAvailable = await this.verifyClaudeCLI();
        if (!isAvailable) {
            vscode.window.showErrorMessage('Claude CLI not found in PATH');
            return;
        }
        
        // 4. Initialize extension
        await this.activateExtension();
    }
}
```

### Packaging Strategy
- TypeScript compilation to JavaScript
- VS Code extension packaging (.vsix)
- Cross-platform compatibility (Windows, macOS, Linux)
- Dependency bundling for offline installation

## Error Handling Architecture

### Graceful Degradation
- Fallback to manual refresh if auto-refresh fails
- Alternative command execution methods
- User feedback for operation failures

### Logging and Diagnostics
- Structured logging for debugging
- Error reporting to VS Code output channel
- Performance metrics collection