#!/usr/bin/env node

// Script de diagnostic pour Claude Workflow Manager

const fs = require('fs');
const path = require('path');

console.log('🔍 Claude Workflow Manager - Diagnostic');
console.log('=====================================\n');

// Vérifier les fichiers essentiels
const requiredFiles = [
    'package.json',
    'src/extension.ts',
    'out/extension.js',
    'src/providers/WorkflowTreeProvider.ts'
];

console.log('📁 Vérification des fichiers...');
let allFilesPresent = true;

for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MANQUANT`);
        allFilesPresent = false;
    }
}

if (!allFilesPresent) {
    console.log('\n❌ Des fichiers sont manquants. Recompilez avec npm run compile');
    process.exit(1);
}

// Vérifier package.json
console.log('\n📦 Vérification package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const checks = [
        { key: 'name', expected: 'claude-workflow-manager' },
        { key: 'main', expected: './out/extension.js' },
        { key: 'publisher', required: true }
    ];
    
    for (const check of checks) {
        if (check.expected && packageJson[check.key] === check.expected) {
            console.log(`✅ ${check.key}: ${packageJson[check.key]}`);
        } else if (check.required && packageJson[check.key]) {
            console.log(`✅ ${check.key}: ${packageJson[check.key]}`);
        } else {
            console.log(`❌ ${check.key}: ${packageJson[check.key] || 'MANQUANT'}`);
        }
    }
    
    // Vérifier la configuration de la vue
    if (packageJson.contributes && packageJson.contributes.views && packageJson.contributes.views.explorer) {
        const claudeView = packageJson.contributes.views.explorer.find(v => v.id === 'claudeWorkflow');
        if (claudeView) {
            console.log('✅ Vue "claudeWorkflow" configurée');
        } else {
            console.log('❌ Vue "claudeWorkflow" manquante');
        }
    } else {
        console.log('❌ Configuration des vues manquante');
    }
    
} catch (error) {
    console.log(`❌ Erreur lecture package.json: ${error.message}`);
}

// Vérifier la compilation
console.log('\n🔨 Vérification compilation...');
try {
    const extensionJs = fs.readFileSync('out/extension.js', 'utf8');
    if (extensionJs.includes('activate')) {
        console.log('✅ Fonction activate trouvée');
    } else {
        console.log('❌ Fonction activate manquante');
    }
    
    if (extensionJs.includes('WorkflowTreeProvider')) {
        console.log('✅ WorkflowTreeProvider référencé');
    } else {
        console.log('❌ WorkflowTreeProvider manquant');
    }
    
} catch (error) {
    console.log(`❌ Erreur lecture extension.js: ${error.message}`);
}

console.log('\n📋 Instructions de test:');
console.log('1. Ouvrez VS Code');
console.log('2. Ouvrez ce dossier dans VS Code');
console.log('3. Appuyez sur F5 pour lancer Extension Development Host');
console.log('4. Dans la nouvelle fenêtre, ouvrez un dossier quelconque');
console.log('5. Vérifiez le panneau Explorer pour "Claude Workflow"');

console.log('\n🔧 Si problème persiste:');
console.log('- Ouvrez Console de développement (F12)');
console.log('- Cherchez les erreurs "Claude Workflow"');
console.log('- Testez Ctrl+Shift+P > "Claude Workflow"');

console.log('\n✅ Diagnostic terminé');