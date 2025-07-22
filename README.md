# VSClaude

A Visual Studio Code extension that integrates Claude Code's agile development workflow directly into the IDE.

## Overview

VSClaude provides a visual tree-based interface for managing projects, epics, stories, and tasks while enabling seamless execution of Claude Code commands from within VS Code. This extension transforms Claude Code's text-based workflow into an intuitive graphical interface.

## Features

### Core Functionality
- **Interactive Workflow Tree**: Visual representation of project structure in VS Code sidebar
- **Command Integration**: Direct execution of Claude Code commands from the extension
- **State Management**: Real-time tracking of project, epic, and task status
- **File Navigation**: Quick access to project documents and source files
- **Manual Refresh**: Update project state on demand

### Extension Structure

```
claude-workflow-manager/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── providers/
│   │   ├── WorkflowTreeProvider.ts   # Tree view provider
│   │   └── StateManager.ts          # Project state management
│   ├── commands/
│   │   ├── CommandExecutor.ts       # Claude command execution
│   │   └── CommandRegistry.ts       # Command mapping
│   └── parsers/
│       ├── ProjectParser.ts         # Parse project documents
│       ├── EpicParser.ts           # Parse epic documents
│       └── StoryParser.ts          # Parse story documents
```

## Installation

1. Package the extension: `npm run package`
2. Install the generated `.vsix` file in VS Code
3. Ensure Claude Code CLI is installed and available in PATH

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