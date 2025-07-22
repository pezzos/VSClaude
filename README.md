# VSClaude - Claude Workflow Manager

A Visual Studio Code extension that transforms Claude Code's agile development workflow into an interactive, visual interface directly integrated into your IDE.

## Overview

VSClaude creates a visual tree-based interface for managing the complete Claude Code development workflow - from project initialization through epic planning, story management, and task execution. The extension displays real-time project state and enables seamless execution of Claude Code commands from within VS Code, transforming the text-based workflow into an intuitive graphical experience.

## Features

### Visual Interface
- **📊 Interactive Tree View**: Hierarchical display of projects → epics → stories → tickets in VS Code sidebar
- **🎯 Real-time State Management**: Live tracking of project progress with visual status indicators
- **🔧 One-Click Actions**: Execute Claude Code commands directly from tree elements
- **📋 Context-Aware Navigation**: Right-click menus and double-click file opening
- **📈 Progress Visualization**: Completion badges and progress indicators throughout the workflow

### Command Integration
- **⚡ Direct Claude Code Execution**: Run commands through integrated VS Code terminal
- **🚀 Quick Actions**: Command palette integration for rapid workflow navigation  
- **🔄 Auto-Refresh**: File watchers automatically update tree state on document changes
- **⚙️ Configurable Timeouts**: Customizable command execution settings

### Smart State Detection
- **📁 Project Initialization**: Auto-detect uninitialized projects and guide setup
- **📚 Epic Management**: Parse and display epics with completion status
- **📝 Story Planning**: Priority-based story display with visual priority indicators
- **🎫 Ticket Tracking**: Individual task management with status progression

## Visual Workflow Examples

### Project Lifecycle in Tree View

```
🏗️ My Project (uninitialized)
   └── 🔧 Initialize project

// After initialization
📁 My E-commerce Project
   ├── 📋 Import feedback
   ├── 🔍 Challenge
   └── 📊 Status

// After epic planning
📁 My E-commerce Project
   ├── ✅ Update → [Import] [Challenge] [Enrich] [Status]
   └── 📚 Epics
       ├── 🎯 Epic #1: Authentication System
       │   └── 🔧 Select epic
       ├── 🎯 Epic #2: Product Catalog
       │   └── 🔧 Select epic
       └── ➕ Plan new epics

// Active epic with stories
📁 My E-commerce Project
   └── 📚 Epics
       └── 🎯 Epic #1: Authentication System (current)
           ├── ✅ Manage → [Complete] [Status]
           └── 📝 Stories
               ├── 📌 Story #1: User Registration [P0]
               │   └── 🔧 Start story
               ├── 📌 Story #2: Login Flow [P0]
               │   └── 🔧 Start story
               └── 📌 Story #3: Password Reset [P1]
                   └── 🔧 Start story

// Active story with tickets
📁 My E-commerce Project
   └── 📚 Epics
       └── 🎯 Epic #1: Authentication System
           └── 📝 Stories
               └── 📌 Story #1: User Registration (active)
                   ├── ✅ Complete story
                   └── 🎫 Tickets
                       ├── ✓ Create user model
                       ├── 🚧 Implement API endpoint
                       ├── ⏳ Add validation
                       └── ⏳ Write tests
```

### Visual Status Indicators

| Icon | Element Type | Status/Priority |
|------|--------------|-----------------|
| 🏗️ | Project | Uninitialized |
| 📁 | Project | Active/Initialized |
| 📚 | Collection | Epic collection |
| 🎯 | Epic | Gray=Planned, Blue=Active, Green=Completed |
| 📝 | Collection | Story collection |
| 📌 | Story | P0=Red, P1=Orange, P2=Yellow, P3=Gray |
| 🎫 | Collection | Ticket collection |
| ⏳ | Ticket | Planned |
| 🚧 | Ticket | In Progress |
| ✓ | Ticket | Completed |
| 🔧 | Action | Single action available |
| ✅ | Action | Multiple actions available |
| ➕ | Action | Add/Create new item |

### Extension Structure

```
claude-workflow-manager/
├── src/
│   ├── extension.ts                   # Main entry point and activation
│   ├── providers/
│   │   ├── WorkflowTreeProvider.ts   # Main tree view provider
│   │   └── StateManager.ts          # Project state management
│   ├── commands/
│   │   ├── CommandExecutor.ts       # Claude command execution (claude -p)
│   │   └── CommandRegistry.ts       # Command mapping and registry
│   ├── parsers/
│   │   ├── ProjectParser.ts         # Parse EPICS.md and project files
│   │   ├── EpicParser.ts           # Parse PRD.md for epic details
│   │   └── StoryParser.ts          # Parse STORIES.md for story planning
│   └── views/
│       ├── icons/                   # Custom icons for tree view elements
│       └── themes/                  # Color themes for different states
├── package.json                     # Extension manifest and dependencies
├── README.md                       # User documentation
└── CHANGELOG.md                    # Version history and updates
```

### Key Architecture Components

- **TreeDataProvider**: VS Code's native tree view interface implementation
- **State Detection**: Real-time monitoring of .md file changes for auto-refresh
- **Terminal Integration**: Direct execution of Claude Code commands with visibility
- **File System Watchers**: Automatic tree updates on document modifications
- **Context Menus**: Right-click actions for workflow element interactions

## Advanced Features

### Status Bar Integration
- Current epic/story/ticket displayed in VS Code status bar
- Click status bar to focus element in tree view
- Quick navigation without opening tree panel

### Command Palette Integration
- `Claude: Next ticket` - Auto-select next available ticket
- `Claude: Complete current` - Mark current element as completed  
- `Claude: Show metrics` - Display progress dashboard
- `Claude: Clear context` - Reset current workflow context

### Smart Notifications
- Toast notifications for command completion
- Warning alerts for invalid action attempts
- Progress bars for long-running operations
- File change detection and auto-refresh

### Configuration Options
```json
{
    "claudeWorkflow.autoRefresh": true,
    "claudeWorkflow.commandTimeout": 60,
    "claudeWorkflow.showCompletedItems": true,
    "claudeWorkflow.githubConfigRepo": "user/claude-config"
}
```

### VS Code Commands Implemented

| Command ID | Description | Shortcut |
|------------|-------------|----------|
| `claude-workflow.initProject` | Initialize new project | - |
| `claude-workflow.refresh` | Manual tree refresh | `Ctrl+Shift+R` |
| `claude-workflow.executeCommand` | Execute Claude command | - |
| `claude-workflow.showCurrent` | Show current context | `Ctrl+Shift+C` |
| `claude-workflow.clearContext` | Clear workflow context | - |
| `claude-workflow.nextTicket` | Select next ticket | `Ctrl+Shift+N` |
| `claude-workflow.completeCurrent` | Complete current element | `Ctrl+Shift+X` |

## Installation

### Quick Setup
1. Package the extension: `npm run package`
2. Install the generated `.vsix` file in VS Code
3. Ensure Claude Code CLI is installed and available in PATH
4. Extension will guide you through project initialization

### Automated Setup Process
1. Clone configuration repository from GitHub
2. Install commands in `.claude/commands/` directory
3. Verify Claude CLI availability
4. Activate extension and initialize project structure

## Development

### Prerequisites
- Node.js (v16 or higher)
- VS Code
- Claude Code CLI

### Setup
```bash
cd claude-workflow-manager
npm install
npm run compile
```

### Testing
```bash
npm run test
```

### Package Extension
```bash
npm run package
```

## Claude Code Workflow

This project follows the Claude Code agile methodology:
- **Epic-Level**: start → design → plan  
- **Iteration-Level**: iterate → ship → clear

### Documentation Structure
```
docs/
├── 1-project/     # Global project vision and roadmap
├── 2-current-epic/ # Current epic execution
├── 3-current-task/ # Current task details
└── archive/       # Completed epics backup
```

## Contributing

1. Follow the Claude Code agile methodology
2. Maintain TypeScript strict mode compliance
3. Ensure comprehensive test coverage
4. Document all public APIs
5. Test across platforms (Windows, macOS, Linux)

## License

See LICENSE file for details.

---

For detailed workflow instructions and development standards, refer to CLAUDE.md.