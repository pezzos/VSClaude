#!/bin/bash

echo "🚀 Lancement de l'Extension Development Host"

# Ouvrir une nouvelle instance de VS Code avec l'extension en mode développement
/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/bin/code \
    --extensionDevelopmentPath="$(pwd)" \
    --new-window

echo "✅ Extension Development Host lancé"
echo "📝 Dans la nouvelle fenêtre VS Code qui s'ouvre :"
echo "   1. Ouvrez un dossier (Cmd+O)"
echo "   2. Cherchez 'Claude Workflow' dans l'Explorer"