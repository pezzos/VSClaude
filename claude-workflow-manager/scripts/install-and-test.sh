#!/bin/bash

# Claude Workflow Manager - Installation and Testing Script

set -e

echo "🚀 Claude Workflow Manager Installation Script"
echo "=============================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code is not installed or not in PATH"
    echo "Please install Visual Studio Code and ensure 'code' command is available"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Claude CLI is installed (optional warning)
if ! command -v claude &> /dev/null; then
    echo "⚠️  Claude CLI not found in PATH"
    echo "The extension will work but commands won't execute without Claude CLI"
    echo "Install Claude CLI from: https://docs.anthropic.com/claude/docs/claude-cli"
else
    echo "✅ Claude CLI found"
fi

echo "✅ Prerequisites check complete"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile the extension
echo "🔨 Compiling TypeScript..."
npm run compile

# Run linting
echo "🔍 Running linting..."
npm run lint || echo "⚠️  Linting completed with warnings"

echo "🎉 Installation complete!"
echo ""
echo "🧪 Testing Instructions:"
echo "1. Press F5 to launch Extension Development Host"
echo "2. Open a folder in the new VS Code window"
echo "3. Look for 'Claude Workflow' in the Explorer panel"
echo "4. Click on items to test the interface"
echo ""
echo "📦 Packaging Instructions:"
echo "1. Install vsce: npm install -g vsce"
echo "2. Package extension: vsce package"
echo "3. Install packaged extension: code --install-extension *.vsix"
echo ""
echo "🛠️  Development Commands:"
echo "- npm run compile    # Compile TypeScript"
echo "- npm run watch      # Watch mode compilation"
echo "- npm run lint       # Run ESLint"
echo ""
echo "Ready to develop! 🎯"