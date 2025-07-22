# Guide de Test - Claude Workflow Manager

## 🔧 Installation et Test

### 1. Test en Mode Développement (Recommandé)

```bash
# Dans le répertoire claude-workflow-manager
cd claude-workflow-manager
npm install
npm run compile
```

Ensuite dans VS Code :
1. Ouvrez le dossier `claude-workflow-manager` dans VS Code
2. Appuyez sur **F5** pour lancer Extension Development Host
3. Dans la nouvelle fenêtre VS Code qui s'ouvre :
   - **Ouvrez un dossier** (Fichier > Ouvrir le dossier...)
   - Choisissez n'importe quel dossier de votre choix
4. Dans le panneau **Explorer** (barre latérale gauche), vous devriez voir une section **"Claude Workflow"**

### 2. Installation Permanente

```bash
# Installer vsce globalement
npm install -g @vscode/vsce

# Dans le répertoire claude-workflow-manager
vsce package

# Installer l'extension packagée
code --install-extension claude-workflow-manager-0.1.0.vsix
```

## 🐛 Dépannage

### L'extension n'apparaît pas dans Explorer

**Vérifications :**

1. **Workspace ouvert ?** 
   - L'extension nécessite qu'un dossier soit ouvert
   - Vérifiez : Fichier > Ouvrir le dossier...

2. **Console de développement :**
   ```
   Affichage > Console de développement
   ```
   Recherchez des erreurs commençant par "Claude Workflow"

3. **Commandes disponibles :**
   - Appuyez sur `Ctrl+Shift+P` (Cmd+Shift+P sur Mac)
   - Tapez "Claude Workflow"
   - Les commandes devraient apparaître

4. **Vue forcée :**
   - `Ctrl+Shift+P` > "View: Focus on Claude Workflow View"

### Logs de débogage

En mode développement, ouvrez la console avec `F12` et regardez les messages de l'extension.

### Test Manuel des Fonctionnalités

1. **Arbre vide** : L'extension devrait afficher un projet non initialisé
2. **Actions disponibles** : Clic droit sur les éléments pour voir les menus contextuels
3. **Commandes** : Test des boutons et commandes

## 🧪 Tests de Base

### Test 1: Activation
```
✅ L'extension s'active quand un dossier est ouvert
✅ La vue "Claude Workflow" apparaît dans Explorer
✅ Un message de bienvenue s'affiche (première fois)
```

### Test 2: Interface
```
✅ L'arbre affiche "Projet (non initialisé)"
✅ Clic sur "Initialize Project" ouvre le terminal
✅ Le bouton refresh fonctionne
```

### Test 3: Commandes
```
✅ Ctrl+Shift+P > "Claude Workflow" montre les commandes
✅ Les commandes executent sans erreur
✅ Le terminal s'ouvre avec la bonne commande
```

## 📱 Interface Attendue

### État Initial (sans dossier ouvert)
- Extension inactive

### État Initial (dossier ouvert, pas de workflow)
```
🏗️ Mon Projet (non initialisé)
   └── 🔧 Initialize Project
```

### Après création de fichiers de test
Créez ces fichiers pour tester l'analyse :

**docs/1-project/EPICS.md**
```markdown
# Project Epics

## Epic #1: Test Epic [active]
**Description:** Epic de test pour validation

## Epic #2: Second Epic [planned]  
**Description:** Deuxième epic pour test
```

L'arbre devrait alors afficher :
```
📁 Mon Projet
   └── 📚 Epics (2)
       ├── 🔵 Epic #1: Test Epic (current)
       └── ⚪ Epic #2: Second Epic
```

## 🚨 Problèmes Courants

1. **"workspaceFolder" undefined** → Ouvrez un dossier
2. **Extension pas dans Explorer** → Redémarrez VS Code  
3. **Commandes Claude échouent** → Claude CLI pas installé (normal)
4. **Erreurs TypeScript** → `npm run compile`

## ✅ Validation Complète

L'extension fonctionne correctement si :
- ✅ Elle apparaît dans Explorer
- ✅ Elle affiche l'état du projet
- ✅ Les boutons sont cliquables
- ✅ Les commandes s'exécutent dans le terminal
- ✅ Elle se rafraîchit automatiquement

---

Si l'extension ne fonctionne toujours pas, vérifiez la console de développement pour les erreurs JavaScript.