# Claude Workflow Manager

A Visual Studio Code extension that provides both tree view and modern webview interfaces for managing Claude Code workflows. This extension transforms the command-line Claude workflow into visual, interactive interfaces that show project state in real-time.

## Features

### 🖥️ Modern Webview Interface (NEW!)
- **Traycer-Style UI**: Modern, task-oriented interface similar to popular task management tools
- **Project Overview Dashboard**: Comprehensive project statistics and progress visualization
- **Task Management Panel**: Interactive task cards with drag-and-drop functionality
- **Command Execution Center**: Real-time command execution with progress tracking
- **Implementation Plan Viewer**: Visual plan management with step-by-step tracking

### 🌳 Classic Tree View Interface
- **Project Overview**: Visual representation of your Claude workflow state
- **Real-time Updates**: Automatically refreshes when project files change
- **Contextual Actions**: Click to execute Claude commands directly from the interface

### 📊 Project State Visualization
- **Initialization Status**: Shows whether project is initialized or not
- **Epic Management**: View all epics with their current status (planned/active/completed)
- **Story Tracking**: See user stories organized by priority (P0-P3)
- **Ticket Progress**: Track individual tasks within stories

### 🚀 One-Click Command Execution
- **Initialize Project**: Set up Claude workflow structure
- **Update Commands**: Import feedback, update challenges, status, and enrich project
- **Epic Management**: Plan, select, and complete epics
- **Story Workflow**: Plan, start, and complete user stories

### 📁 Smart File Navigation
- Double-click on items to open associated markdown files
- Quick access to PRD.md, STORIES.md, and other workflow documents

## Installation

### Prerequisites
- Visual Studio Code 1.60.0 or higher
- Claude CLI installed and configured
- A workspace folder open in VS Code

### From Source
1. Clone this repository
2. Open the folder in VS Code
3. Run `npm install` to install dependencies
4. Build the webview UI: `npm run build-webview`
5. Press F5 to run the extension in a new Extension Development Host window

### Development
For webview UI development:
1. Run `npm run dev-webview` in a separate terminal for hot reloading
2. The webview will automatically rebuild when you make changes to React components
3. Use the browser developer tools within VS Code to debug the webview

### Package Installation
1. Package the extension: `vsce package`
2. Install the .vsix file: `code --install-extension claude-workflow-manager-0.1.0.vsix`

## Usage

### Initial Setup
1. Open a folder in VS Code where you want to create your Claude workflow project
2. The Claude Workflow view will appear in the Activity Bar on the left
3. Choose between the **Workflow Manager** (webview) or **Workflow Tree** (classic tree view)
4. Click "Initialize Project" to set up the workflow structure

### Interface Options

#### 🖥️ Modern Webview Interface
The new webview interface provides a Traycer-style experience with multiple panels:

- **Project Overview**: Dashboard showing project statistics, progress, and current work
- **Task Management**: Interactive cards for epics, stories, and tickets with status tracking
- **Command Center**: Execute commands with real-time progress and history
- **Plan Viewer**: Visual implementation plans with step-by-step execution tracking

Navigate between views using the tabs at the top: Overview | Tasks | Commands | Plans

#### 🌳 Classic Tree View Interface  
The traditional tree interface provides a hierarchical view of your project structure with clickable actions for command execution.

### Managing Your Project
The tree view shows different items based on your project state:

#### 🏗️ Uninitialized Project
```
🏗️ My Project (not initialized)
   └── 🔧 Initialize Project
```

#### 📁 Initialized Project
```
📁 My Project
   ├── ✅ Update → [Import] [Challenge] [Status]
   └── 📚 Epics
       ├── 🎯 Epic #1: Authentication System
       │   └── 🔧 Select epic
       └── ➕ Plan new epics
```

#### 🎯 Active Epic with Stories
```
📁 My Project
   └── 📚 Epics
       └── 🎯 Epic #1: Authentication System (current)
           ├── ✅ Manage → [Complete] [Status]
           └── 📝 Stories
               ├── 🔴 📌 Story #1: User Registration [P0]
               │   └── 🔧 Start story
               ├── 🟠 📌 Story #2: Login Flow [P1]
               └── 🟡 📌 Story #3: Password Reset [P2]
```

#### 📌 Active Story with Tickets
```
📌 Story #1: User Registration (active)
   ├── ✅ Complete story
   └── 🎫 Tickets
       ├── ✓ Create user model
       ├── 🚧 Implement API endpoint
       ├── ⏳ Add validation
       └── ⏳ Write tests
```

### Available Actions

| Action | Description | Command |
|--------|-------------|---------|
| 🔧 Initialize Project | Set up Claude workflow | `/1-Init` |
| 📋 Import Feedback | Import user feedback | `/2-Update feedback` |
| 🔍 Update Challenge | Update challenges | `/2-Update challenge` |
| 📊 Update Status | Update project status | `/2-Update status` |
| ➕ Enrich Project | Add context | `/2-Update enrich` |
| 📚 Plan Epics | Plan project epics | `/3-Epic plan` |
| 🎯 Select Epic | Select current epic | `/4-Epic select` |
| ✅ Complete Epic | Mark epic as done | `/4-Epic complete` |
| 📝 Plan Stories | Plan user stories | `/5-Story plan` |
| ▶️ Start Story | Begin story work | `/6-Story start` |
| ✅ Complete Story | Mark story as done | `/6-Story complete` |

## Configuration

Configure the extension through VS Code settings:

```json
{
  "claudeWorkflowManager.autoRefresh": true,
  "claudeWorkflowManager.commandTimeout": 60,
  "claudeWorkflowManager.showCompletedItems": true,
  "claudeWorkflowManager.githubConfigRepo": "user/claude-config",
  "claudeWorkflowManager.preferredInterface": "both"
}
```

### Settings Details

- **autoRefresh**: Automatically refresh when files change (default: true)
- **commandTimeout**: Timeout for Claude commands in seconds (default: 60)
- **showCompletedItems**: Show completed items in interfaces (default: true)
- **githubConfigRepo**: GitHub repo for Claude configuration (optional)
- **preferredInterface**: Choose interface type: "tree", "webview", or "both" (default: "both")

## File Structure

The extension monitors these key files in your project:

```
your-project/
├── README.md                      # Project overview
├── docs/
│   ├── 1-project/
│   │   ├── EPICS.md              # Project epics list
│   │   ├── FEEDBACK.md           # User feedback
│   │   ├── CHALLENGE.md          # Project challenges
│   │   └── STATUS.md             # Project status
│   ├── 2-current-epic/
│   │   ├── PRD.md                # Current epic details
│   │   └── STORIES.md            # User stories
│   └── 3-current-task/
│       └── STORY.md              # Current story details
```

## Commands

The extension provides these VS Code commands:

- `claudeWorkflow.refresh` - Manually refresh the tree view
- `claudeWorkflow.initProject` - Initialize new project
- `claudeWorkflow.executeCommand` - Execute Claude command
- `claudeWorkflow.openFile` - Open associated markdown file
- `claudeWorkflow.clearContext` - Clear Claude context

## Troubleshooting

### Extension Not Loading
- Ensure you have a workspace folder open
- Check that Claude CLI is installed and accessible
- Look at the VS Code Developer Console for error messages

### Commands Not Executing
- Verify Claude CLI is in your PATH
- Check the integrated terminal for error output
- Ensure you're in a valid Claude workflow project

### Tree Not Updating
- Try manually refreshing with the refresh button
- Check that `claudeWorkflow.autoRefresh` is enabled
- Verify file permissions for the docs directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### 0.1.0
- Initial release
- Basic tree view functionality
- Command execution integration
- File parsing for project state
- Real-time updates with file watchers

---

Transform your Claude Code workflow with visual project management! 🚀