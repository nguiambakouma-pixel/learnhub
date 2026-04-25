// js/views/exercices-code.js
// ========================================
// VUE : GESTION DES EXERCICES DE CODE
// ========================================
// Permet de créer, éditer, supprimer des exercices de programmation
// avec support multi-langages (JS, Python, HTML, CSS, SQL)

import { api } from './api.js';
import { ui } from './ui.js';

export class ExercicesCodeView {
    constructor() {
        this.editingId = null;
    }

    // ========================================
    // RENDER PRINCIPAL
    // ========================================
    async render() {
        const container = document.getElementById('exercicesCodeContentArea');
        ui.setPageTitle('Exercices de Code', 'Gestion des exercices pratiques pour développeurs');
        ui.showAddButton(true);
        ui.showLoading(container);

        try {
            await this.loadData();
        } catch (error) {
            console.error('❌ Erreur chargement exercices code:', error);
            ui.showError(container, 'Impossible de charger les exercices');
        }
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    async loadData() {
        const container = document.getElementById('exercicesCodeContentArea');

        // Récupérer tous les exercices avec leurs cours liés
        const { data: exercices, error } = await api.client
            .from('exercices_code')
            .select(`
                *,
                cours:cours(
                    id, 
                    titre,
                    chapitre:chapitres(
                        titre,
                        matiere:matieres(nom, couleur)
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            ui.showError(container, error.message);
            return;
        }

        if (!exercices || exercices.length === 0) {
            container.innerHTML = this.renderEmpty();
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Grouper les exercices par cours
        const groupedByCours = {};
        exercices.forEach(ex => {
            const coursId = ex.cours?.id || 'sans-cours';
            if (!groupedByCours[coursId]) {
                groupedByCours[coursId] = { cours: ex.cours, exercices: [] };
            }
            groupedByCours[coursId].exercices.push(ex);
        });

        // Afficher les exercices groupés
        let html = '<div class="space-y-6">';
        Object.values(groupedByCours).forEach(group => {
            if (group.cours) {
                html += this.renderCoursGroup(group.cours, group.exercices);
            }
        });
        html += '</div>';
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    // ========================================
    // RENDER : ÉTAT VIDE
    // ========================================
    renderEmpty() {
        return `
            <div class="text-center py-12 text-gray-500">
                <div class="mb-4 flex justify-center opacity-20"><i data-lucide="code-2" class="w-16 h-16"></i></div>
                <h3 class="text-xl font-semibold text-white mb-2">Aucun exercice de code</h3>
                <p class="mb-6">Créez votre premier exercice pratique</p>
                <button onclick="exercicesCodeView.openModal()" 
                    class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i> Créer un exercice
                </button>
            </div>
        `;
    }

    // ========================================
    // RENDER : GROUPE PAR COURS
    // ========================================
    renderCoursGroup(cours, exercices) {
        const couleur = cours.chapitre?.matiere?.couleur || '#10b981';

        return `
            <div class="glass-card rounded-xl shadow-sm border border-slate-700/50 overflow-hidden mb-6">
                <!-- En-tête du cours -->
                <div class="p-5 border-b border-slate-700/50" 
                     style="background: linear-gradient(135deg, ${couleur}15 0%, ${couleur}05 100%);">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-white">${cours.titre}</h3>
                            <p class="text-sm text-gray-400">
                                ${cours.chapitre?.matiere?.nom} • ${cours.chapitre?.titre}
                            </p>
                        </div>
                        <span class="px-3 py-1 bg-slate-800/80 rounded-full text-sm font-semibold border border-slate-700/50" 
                              style="color: ${couleur};">
                            ${exercices.length} exercice(s)
                        </span>
                    </div>
                </div>

                <!-- Liste des exercices -->
                <div class="divide-y divide-slate-700/50">
                    ${exercices.map(ex => this.renderCard(ex, couleur)).join('')}
                </div>
            </div>
        `;
    }

    // ========================================
    // RENDER : CARTE D'EXERCICE
    // ========================================
    renderCard(ex, couleur) {
        // Icônes pour chaque langage
        const langageIcons = {
            'javascript': '<i data-lucide="code" class="w-3.5 h-3.5"></i> JS',
            'python': '<i data-lucide="terminal" class="w-3.5 h-3.5"></i> Python',
            'html': '<i data-lucide="layout" class="w-3.5 h-3.5"></i> HTML',
            'css': '<i data-lucide="palette" class="w-3.5 h-3.5"></i> CSS',
            'sql': '<i data-lucide="database" class="w-3.5 h-3.5"></i> SQL',
            'php': '<i data-lucide="server" class="w-3.5 h-3.5"></i> PHP',
        };

        // Icônes pour la difficulté
        const difficulteIcons = {
            'facile': '<div class="flex gap-0.5 text-yellow-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>',
            'moyen': '<div class="flex gap-0.5 text-yellow-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>',
            'difficile': '<div class="flex gap-0.5 text-yellow-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>'
        };

        return `
            <div class="p-4 hover:bg-slate-800/40 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-start space-x-4">
                            <!-- Icône Langage -->
                            <div class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl" 
                                 style="background: ${couleur}20; color: ${couleur};">
                                <i data-lucide="code-2" class="w-6 h-6"></i>
                            </div>

                            <!-- Contenu -->
                            <div class="flex-1 min-w-0">
                                <h4 class="text-base font-bold text-white mb-1">${ex.titre}</h4>
                                
                                ${ex.description ? `<p class="text-sm text-gray-400 mb-2 line-clamp-2">${ex.description}</p>` : ''}

                                <!-- Tags -->
                                <div class="flex flex-wrap items-center gap-2 mt-2">
                                    <span class="px-2 py-1 bg-slate-700/50 text-gray-300 rounded text-xs font-semibold flex items-center gap-1">
                                        ${langageIcons[ex.langage] || ex.langage}
                                    </span>
                                    <span class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold flex items-center gap-1">
                                        ${difficulteIcons[ex.difficulte] || ex.difficulte}
                                        <span class="ml-1">${ex.difficulte.charAt(0).toUpperCase() + ex.difficulte.slice(1)}</span>
                                    </span>
                                    <span class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold flex items-center gap-1">
                                        <i data-lucide="target" class="w-3 h-3"></i> ${ex.points_recompense} pts
                                    </span>
                                    ${ex.tests_unitaires ?
                `<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold flex items-center gap-1">
                                            <i data-lucide="check-circle" class="w-3 h-3"></i> ${JSON.parse(ex.tests_unitaires || '[]').length} test(s)
                                        </span>`
                : ''}
                                    ${!ex.est_actif ?
                '<span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold flex items-center gap-1"><i data-lucide="eye-off" class="w-3 h-3"></i> Inactif</span>'
                : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="flex space-x-2 ml-4 flex-shrink-0">
                        <button onclick="exercicesCodeView.edit('${ex.id}')" 
                                class="p-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                        <button onclick="exercicesCodeView.deleteExercice('${ex.id}', '${ex.titre.replace(/'/g, "\\'")}')" 
                                class="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================
    // MODAL : OUVERTURE
    // ========================================
    async openModal(id = null) {
        console.log('💻 Opening code exercise modal, id:', id);
        this.editingId = id;
        ui.openModal('exerciceCodeModal');

        // Réinitialiser le formulaire
        const form = document.getElementById('exerciceCodeForm');
        if (form) form.reset();

        // Titre du modal
        document.getElementById('exerciceCodeModalTitle').textContent =
            id ? 'Modifier l\'exercice de code' : 'Nouvel exercice de code';

        // Charger la liste des cours
        await this.loadCoursOptions();

        // Si mode édition, charger les données
        if (id) {
            await this.loadExerciceData(id);
        }
        if (window.lucide) lucide.createIcons();
    }

    closeModal() {
        ui.closeModal('exerciceCodeModal');
    }


    // ========================================
    // CHARGER LES OPTIONS DE COURS
    // ========================================
    async loadCoursOptions() {
        const select = document.getElementById('exerciceCodeCours');
        if (!select) return;

        const { data: cours, error } = await api.client
            .from('cours')
            .select(`
                id, 
                titre, 
                chapitre:chapitres(
                    titre,
                    matiere:matieres(nom)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erreur chargement cours:', error);
            return;
        }

        select.innerHTML = '<option value="">Sélectionner un cours...</option>';

        cours.forEach(c => {
            const matiereName = c.chapitre?.matiere?.nom || 'N/A';
            const chapitreName = c.chapitre?.titre || 'N/A';
            select.innerHTML += `
                <option value="${c.id}">
                    ${c.titre} (${matiereName} • ${chapitreName})
                </option>
            `;
        });
    }

    // ========================================
    // CHARGER LES DONNÉES D'UN EXERCICE
    // ========================================
    async loadExerciceData(id) {
        const { data, error } = await api.client
            .from('exercices_code')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('❌ Erreur chargement exercice:', error);
            ui.showNotification('Impossible de charger l\'exercice', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('exerciceCodeCours').value = data.cours_id || '';
        document.getElementById('exerciceCodeTitre').value = data.titre || '';
        document.getElementById('exerciceCodeDescription').value = data.description || '';
        document.getElementById('exerciceCodeLangage').value = data.langage || 'javascript';
        document.getElementById('exerciceCodeDifficulte').value = data.difficulte || 'moyen';
        document.getElementById('exerciceCodePoints').value = data.points_recompense || 20;
        document.getElementById('exerciceCodeInitial').value = data.code_initial || '';
        document.getElementById('exerciceCodeSolution').value = data.code_solution || '';
        document.getElementById('exerciceCodeTests').value =
            data.tests_unitaires ? JSON.stringify(data.tests_unitaires, null, 2) : '';
        document.getElementById('exerciceCodeActif').checked = data.est_actif !== false;
    }

    // ========================================
    // SAUVEGARDE (CREATE / UPDATE)
    // ========================================
    async save(e) {
        e.preventDefault();
        console.log('💾 Save code exercise triggered');

        // Récupérer les données du formulaire
        const exerciceData = {
            cours_id: parseInt(document.getElementById('exerciceCodeCours').value),
            titre: document.getElementById('exerciceCodeTitre').value.trim(),
            description: document.getElementById('exerciceCodeDescription').value.trim(),
            langage: document.getElementById('exerciceCodeLangage').value,
            difficulte: document.getElementById('exerciceCodeDifficulte').value,
            points_recompense: parseInt(document.getElementById('exerciceCodePoints').value),
            code_initial: document.getElementById('exerciceCodeInitial').value.trim(),
            code_solution: document.getElementById('exerciceCodeSolution').value.trim(),
            tests_unitaires: null,
            est_actif: document.getElementById('exerciceCodeActif').checked
        };

        // Parser les tests JSON si fourni
        const testsInput = document.getElementById('exerciceCodeTests').value.trim();
        if (testsInput) {
            try {
                exerciceData.tests_unitaires = JSON.parse(testsInput);
            } catch (error) {
                ui.showNotification('❌ Format JSON invalide pour les tests', 'error');
                return;
            }
        }

        try {
            if (this.editingId) {
                // MODE UPDATE
                const { error } = await api.client
                    .from('exercices_code')
                    .update(exerciceData)
                    .eq('id', this.editingId);

                if (error) throw error;
                ui.showNotification('Exercice modifié avec succès!', 'success');
            } else {
                // MODE CREATE
                const { error } = await api.client
                    .from('exercices_code')
                    .insert([exerciceData]);

                if (error) throw error;
                ui.showNotification('Exercice créé avec succès!', 'success');
            }

            ui.closeModal('exerciceCodeModal');
            await this.loadData();

        } catch (error) {
            console.error('❌ Save error:', error);
            ui.showNotification('❌ Erreur: ' + error.message, 'error');
        }
    }

    // ========================================
    // ÉDITION
    // ========================================
    async edit(id) {
        await this.openModal(id);
    }

    // ========================================
    // SUPPRESSION
    // ========================================
    async deleteExercice(id, titre) {
        const confirmed = await ui.confirm(
            `Supprimer l'exercice "${titre}" ?\n\nToutes les soumissions seront également supprimées.`,
            'Confirmation'
        );

        if (!confirmed) return;

        try {
            const { error } = await api.client
                .from('exercices_code')
                .delete()
                .eq('id', id);

            if (error) throw error;

            ui.showNotification('Exercice supprimé!', 'success');
            await this.loadData();

        } catch (error) {
            console.error('❌ Delete error:', error);
            ui.showNotification('❌ Erreur: ' + error.message, 'error');
        }
    }
}

// ========================================
// EXPORT ET ACCÈS GLOBAL
// ========================================
const view = new ExercicesCodeView();
export const exercicesCodeView = view;
window.exercicesCodeView = view;