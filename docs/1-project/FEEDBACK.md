# Extension VS Code : Claude Workflow Manager

## Vue d'ensemble

Créer une extension VS Code qui visualise et pilote le workflow de développement Claude Code sous forme d'arborescence interactive. L'extension affiche l'état du projet en temps réel et permet d'exécuter les commandes Claude Code directement depuis l'interface graphique.

## Architecture technique

### Structure de l'extension
```
claude-workflow-manager/
├── src/
│   ├── extension.ts          # Point d'entrée
│   ├── providers/
│   │   ├── WorkflowTreeProvider.ts    # Arborescence principale
│   │   └── StateManager.ts            # Gestion état projet
│   ├── commands/
│   │   ├── CommandExecutor.ts         # Exécution claude -p
│   │   └── CommandRegistry.ts         # Mapping commandes
│   ├── parsers/
│   │   ├── ProjectParser.ts           # Parse EPICS.md, etc.
│   │   ├── EpicParser.ts              # Parse PRD.md
│   │   └── StoryParser.ts             # Parse STORIES.md
│   └── views/
│       └── icons/                     # Icônes pour l'arbre
├── package.json
└── README.md
```

## Interface utilisateur

### Vue arborescente (TreeView)
```
🏗️ Mon Projet (non initialisé)
   └── 🔧 Initialiser le projet

// Après initialisation
📁 Mon Projet E-commerce
   ├── 📋 Import feedback
   ├── 🔍 Challenge
   └── 📊 Status

// Après planification des epics
📁 Mon Projet E-commerce
   ├── ✅ Update → [Import] [Challenge] [Enrich] [Status]
   └── 📚 Epics
       ├── 🎯 Epic #1: Authentication System
       │   └── 🔧 Select epic
       ├── 🎯 Epic #2: Product Catalog
       │   └── 🔧 Select epic
       └── ➕ Plan new epics

// Epic sélectionné et stories planifiées
📁 Mon Projet E-commerce
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

// Story active avec tickets
📁 Mon Projet E-commerce
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

### États visuels et icônes
- 🏗️ Projet non initialisé
- 📁 Projet actif
- 📚 Collection d'epics
- 🎯 Epic (gris=planifié, bleu=actif, vert=terminé)
- 📝 Collection de stories  
- 📌 Story (P0=rouge, P1=orange, P2=jaune, P3=gris)
- 🎫 Collection de tickets
- ⏳ Ticket planifié
- 🚧 Ticket en cours
- ✓ Ticket terminé
- 🔧 Action disponible
- ✅ Actions multiples

## Comportements dynamiques

### 1. État initial
- Seul "Initialiser le projet" est visible
- Clic → clone le repo de config + exécute `/1-Init`
- Parse README.md pour extraire le nom du projet

### 2. Projet initialisé sans contenu
- Affiche le nom du projet
- Seules les commandes "Update" sont disponibles
- Import-feedback est mis en évidence

### 3. Après import feedback
- Les autres commandes Update deviennent disponibles
- Le bloc "Epics" apparaît avec "Plan new epics"

### 4. Après planification des epics
- Parse EPICS.md pour afficher la liste
- Chaque epic a une action "Select"
- Les epics terminés ont une coche verte

### 5. Epic actif
- Parse PRD.md pour l'epic courant
- Affiche "Plan stories" si pas encore fait
- Affiche la liste des stories depuis STORIES.md

### 6. Navigation contextuelle
- Clic droit sur un élément → menu contextuel avec actions
- Double-clic sur fichier → ouvre le .md associé
- Badges pour montrer la progression (3/5 stories)

## Intégration Claude Code

### Exécution des commandes
```typescript
async function executeClaudeCommand(command: string) {
    const terminal = vscode.window.createTerminal('Claude Workflow');
    terminal.sendText(`claude -p "${command}"`);
    terminal.show();
    
    // Attendre la fin et rafraîchir l'arbre
    setTimeout(() => {
        this.refresh();
    }, 3000);
}
```

### Détection de l'état
```typescript
class StateDetector {
    async getProjectState(): ProjectState {
        // Vérifier l'existence des fichiers
        const hasEpics = await fs.exists('docs/1-project/EPICS.md');
        const hasPRD = await fs.exists('docs/2-current-epic/PRD.md');
        const hasStories = await fs.exists('docs/2-current-epic/STORIES.md');
        
        // Parser les fichiers pour extraire l'état
        return {
            initialized: hasEpics,
            currentEpic: this.parseCurrentEpic(),
            currentStory: this.parseCurrentStory(),
            // ...
        };
    }
}
```

## Fonctionnalités avancées

### 1. Statusbar
- Affiche l'epic/story/ticket actuel dans la barre de status
- Click → focus sur l'élément dans l'arbre

### 2. Quick picks (Ctrl+Shift+P)
- "Claude: Next ticket" → sélectionne automatiquement
- "Claude: Complete current" → termine l'élément actif
- "Claude: Show metrics" → affiche le dashboard

### 3. Notifications
- Toast quand une commande est terminée
- Warning si tentative d'action invalide
- Progress bar pour les commandes longues

### 4. Synchronisation
- File watcher sur les .md pour rafraîchir l'arbre
- Détection automatique des changements Git

## Configuration (settings.json)
```json
{
    "claudeWorkflow.autoRefresh": true,
    "claudeWorkflow.commandTimeout": 60,
    "claudeWorkflow.showCompletedItems": true,
    "claudeWorkflow.githubConfigRepo": "user/claude-config"
}
```

## MVP - Première version

Pour la v1, implémenter :
1. TreeView basique avec parsing des fichiers
2. Exécution des commandes principales
3. Rafraîchissement manuel (bouton refresh)
4. Navigation projet → epic → story → ticket
5. Ouverture des fichiers .md au double-clic

## Commandes VS Code à implémenter
- `claude-workflow.initProject`
- `claude-workflow.refresh`
- `claude-workflow.executeCommand`
- `claude-workflow.showCurrent`
- `claude-workflow.clearContext`

## Installation et setup
1. Clone le repo de config depuis GitHub
2. Installe les commandes dans `.claude/commands/`
3. Vérifie que `claude` CLI est disponible
4. Active l'extension et initialise le projet

---

Cette extension transformera le workflow textuel en interface visuelle intuitive, rendant la navigation et l'exécution des commandes beaucoup plus fluides !