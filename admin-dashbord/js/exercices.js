// js/views/exercices.js
// ========================================
// VUE : GESTION DES EXERCICES QCM
// ========================================
// Permet de créer, éditer, supprimer des exercices QCM
// pour les matières classiques (Maths, Physique, SVT, etc.)

import { api } from './api.js';
import { ui } from './ui.js';

export class ExercicesView {
    constructor() {
        this.editingId = null;
    }

    // ========================================
    // RENDER PRINCIPAL
    // ========================================
    async render() {
        const container = document.getElementById('exercicesContentArea');
        if (!container) return;

        // Setup initial structure
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <!-- any specific header stuff for the list -->
            </div>
            <div id="exercicesListContainer"></div>
        `;
        const listContainer = document.getElementById('exercicesListContainer');
        ui.showLoading(listContainer);

        try {
            await this.loadData();
        } catch (error) {
            console.error('❌ Erreur chargement exercices:', error);
            const listContainer = document.getElementById('exercicesListContainer');
            if (listContainer) ui.showError(listContainer, 'Impossible de charger les exercices');
        }
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    async loadData() {
        const container = document.getElementById('exercicesContentArea');
        const listContainer = document.getElementById('exercicesListContainer');
        if (!container || !listContainer) return;

        // Récupérer tous les exercices avec leurs questions et réponses
        const { data: exercices, error } = await api.client
            .from('exercices')
            .select(`
                *,
                cours:cours(
                    id, 
                    titre,
                    chapitre:chapitres(
                        titre,
                        matiere:matieres(nom, couleur)
                    )
                ),
                questions(
                    id,
                    question_texte,
                    type_question,
                    points,
                    ordre,
                    reponses(id, texte_reponse, est_correcte, ordre)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            ui.showError(listContainer, error.message);
            return;
        }

        if (!exercices || exercices.length === 0) {
            listContainer.innerHTML = this.renderEmpty();
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
        listContainer.innerHTML = html;
    }

    // ========================================
    // RENDER : ÉTAT VIDE
    // ========================================
    renderEmpty() {
        return `
            <div class="text-center py-12 text-gray-500">
                <div class="mb-4 flex justify-center opacity-20"><i data-lucide="clipboard-list" class="w-16 h-16"></i></div>
                <h3 class="text-xl font-semibold text-white mb-2">Aucun exercice QCM</h3>
                <p class="mb-6">Créez votre premier exercice</p>
                <button onclick="exercicesView.openModal()" 
                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i> Créer un exercice
                </button>
            </div>
        `;
    }

    // ========================================
    // RENDER : GROUPE PAR COURS
    // ========================================
    renderCoursGroup(cours, exercices) {
        const couleur = cours.chapitre?.matiere?.couleur || '#3b82f6';

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
        const difficulteIcons = {
            'facile': '<div class="flex gap-0.5 text-yellow-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>',
            'moyen': '<div class="flex gap-0.5 text-yellow-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>',
            'difficile': '<div class="flex gap-0.5 text-yellow-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>'
        };

        const nbQuestions = ex.questions?.length || 0;
        const totalChoix = ex.questions?.reduce((sum, q) => sum + (q.reponses?.length || 0), 0) || 0;

        return `
            <div class="p-4 hover:bg-slate-800/40 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-start space-x-4">
                            <!-- Icône QCM -->
                            <div class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl" 
                                 style="background: ${couleur}20; color: ${couleur};">
                                <i data-lucide="file-spreadsheet" class="w-6 h-6"></i>
                            </div>

                            <!-- Contenu -->
                            <div class="flex-1 min-w-0">
                                <h4 class="text-base font-bold text-white mb-1">${ex.titre || ex.consigne}</h4>
                                
                                ${ex.consigne && ex.titre !== ex.consigne ?
                `<p class="text-sm text-gray-400 mb-2 line-clamp-2">${ex.consigne}</p>`
                : ''}

                                <!-- Tags -->
                                <div class="flex flex-wrap items-center gap-2 mt-2">
                                    <span class="px-2 py-1 bg-slate-700/50 text-gray-300 rounded text-xs font-semibold flex items-center gap-1">
                                        <i data-lucide="${ex.type_exercice === 'qcm' ? 'list-checks' : 'pencil-line'}" class="w-3 h-3"></i>
                                        ${ex.type_exercice === 'qcm' ? 'QCM' : 'Question'}
                                    </span>
                                    <span class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold flex items-center gap-1">
                                        ${difficulteIcons[ex.difficulte] || ex.difficulte}
                                        <span class="ml-1">${ex.difficulte.charAt(0).toUpperCase() + ex.difficulte.slice(1)}</span>
                                    </span>
                                    <span class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold flex items-center gap-1">
                                        <i data-lucide="target" class="w-3 h-3"></i> ${ex.points} pts
                                    </span>
                                    <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold flex items-center gap-1">
                                        <i data-lucide="help-circle" class="w-3 h-3"></i> ${nbQuestions} question(s) • ${totalChoix} choix
                                    </span>
                                    ${!ex.est_publie ?
                '<span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold flex items-center gap-1"><i data-lucide="eye-off" class="w-3 h-3"></i> Brouillon</span>'
                : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="flex space-x-2 ml-4 flex-shrink-0">
                        <button onclick="exercicesView.edit('${ex.id}')" 
                                class="p-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                        <button onclick="exercicesView.deleteExercice('${ex.id}', '${(ex.titre || ex.consigne).replace(/'/g, "\\'")}')" 
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
        console.log('🎯 Opening exercice modal, id:', id ? id : 'new');
        this.editingId = id;
        ui.openModal('exerciceModal');

        // Réinitialiser le formulaire
        const form = document.getElementById('exerciceForm');
        if (form) form.reset();

        // Titre du modal
        document.getElementById('exerciceModalTitle').textContent =
            id ? 'Modifier l\'exercice' : 'Nouvel exercice QCM';

        // Charger la liste des cours
        await this.loadCoursSelect();

        // Réinitialiser les choix
        this.resetChoix();

        // Si mode édition, charger les données
        if (id) {
            await this.loadExerciceData(id);
        }

        console.log('✅ Exercice modal opened');
        if (window.lucide) lucide.createIcons();
    }

    closeModal() {
        ui.closeModal('exerciceModal');
    }

    // ========================================
    // CHARGER LES OPTIONS DE COURS
    // ========================================
    async loadCoursSelect() {
        const select = document.getElementById('exerciceCours');
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
            .eq('est_publie', true)
            .order('titre', { ascending: true });

        if (error) {
            console.error('❌ Erreur chargement cours:', error);
            return;
        }

        select.innerHTML = '<option value="">Sélectionner un cours...</option>';

        if (cours) {
            cours.forEach(c => {
                const matiereName = c.chapitre?.matiere?.nom || 'N/A';
                const chapitreName = c.chapitre?.titre || 'N/A';
                const label = `${matiereName} • ${chapitreName} • ${c.titre}`;
                select.innerHTML += `<option value="${c.id}">${label}</option>`;
            });
        }
    }

    // ========================================
    // RÉINITIALISER LES CHOIX
    // ========================================
    resetChoix() {
        const container = document.getElementById('choixContainer');
        if (!container) return;

        container.innerHTML = '';

        // Créer 4 choix par défaut
        for (let i = 0; i < 4; i++) {
            this.addChoix('', false);
        }
    }

    // ========================================
    // AJOUTER UN CHOIX DE RÉPONSE
    // ========================================
    addChoix(texte = '', estCorrect = false) {
        const container = document.getElementById('choixContainer');
        if (!container) return;

        const index = container.children.length;
        const choixHtml = `
            <div class="choix-item flex items-start space-x-3 p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-500 transition">
                <input type="checkbox" 
                       class="choix-correct w-5 h-5 accent-indigo-500 bg-slate-700 border-slate-600 rounded mt-1" 
                       ${estCorrect ? 'checked' : ''}>
                <input type="text" 
                       class="choix-texte flex-1 input-dark px-3 py-2 rounded-lg" 
                       placeholder="Réponse ${index + 1}" 
                       value="${texte}" 
                       required>
                <button type="button" 
                        onclick="this.closest('.choix-item').remove()" 
                        class="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition flex items-center justify-center">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', choixHtml);
        if (window.lucide) lucide.createIcons();
    }

    // ========================================
    // CHARGER LES DONNÉES D'UN EXERCICE
    // ========================================
    async loadExerciceData(id) {
        const { data, error } = await api.client
            .from('exercices')
            .select(`
                *,
                questions(
                    id, 
                    question_texte, 
                    type_question, 
                    points, 
                    ordre,
                    reponses(id, texte_reponse, est_correcte, ordre)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('❌ Erreur chargement exercice:', error);
            ui.showNotification('Impossible de charger l\'exercice', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('exerciceCours').value = data.cours_id || '';
        document.getElementById('exerciceType').value = data.type_exercice || 'qcm';
        document.getElementById('exerciceQuestion').value = data.consigne || '';
        document.getElementById('exerciceDifficulte').value = data.difficulte || 'moyen';
        document.getElementById('exercicePoints').value = data.points || 10;
        document.getElementById('exerciceExplication').value = data.explication || '';

        // Charger les réponses de la première question
        const container = document.getElementById('choixContainer');
        if (container && data.questions && data.questions.length > 0) {
            container.innerHTML = '';
            const question = data.questions[0];

            if (question.reponses && question.reponses.length > 0) {
                // Trier par ordre et afficher
                question.reponses
                    .sort((a, b) => a.ordre - b.ordre)
                    .forEach(rep => {
                        this.addChoix(rep.texte_reponse, rep.est_correcte);
                    });
            }
            if (window.lucide) lucide.createIcons();
        }
    }

    // ========================================
    // SAUVEGARDE (CREATE / UPDATE)
    // ========================================
    async save(e) {
        e.preventDefault();
        console.log('💾 Save exercice triggered');

        // Récupérer les choix de réponse
        const choixItems = document.querySelectorAll('.choix-item');
        const choix = [];

        choixItems.forEach((item, index) => {
            const texte = item.querySelector('.choix-texte').value.trim();
            const estCorrect = item.querySelector('.choix-correct').checked;

            if (texte) {
                choix.push({
                    texte,
                    est_correct: estCorrect,
                    ordre: index + 1
                });
            }
        });

        // Validation
        if (choix.length < 2) {
            ui.showNotification('❌ Vous devez ajouter au moins 2 choix de réponse', 'error');
            return;
        }

        const nbCorrects = choix.filter(c => c.est_correct).length;
        if (nbCorrects === 0) {
            ui.showNotification('❌ Vous devez marquer au moins une réponse comme correcte', 'error');
            return;
        }

        // Préparer les données de l'exercice
        const questionTexte = document.getElementById('exerciceQuestion').value.trim();

        const exerciceData = {
            cours_id: parseInt(document.getElementById('exerciceCours').value),
            titre: questionTexte,
            consigne: questionTexte,
            type_exercice: 'qcm',
            difficulte: document.getElementById('exerciceDifficulte').value,
            points: parseInt(document.getElementById('exercicePoints').value),
            explication: document.getElementById('exerciceExplication').value.trim(),
            est_publie: true
        };

        try {
            let exerciceId = this.editingId;

            if (this.editingId) {
                // ========================================
                // MODE UPDATE
                // ========================================

                // 1. Mettre à jour l'exercice
                const { error: exError } = await api.client
                    .from('exercices')
                    .update(exerciceData)
                    .eq('id', this.editingId);

                if (exError) throw exError;

                // 2. Supprimer anciennes questions et réponses
                const { data: oldQuestions } = await api.client
                    .from('questions')
                    .select('id')
                    .eq('exercice_id', this.editingId);

                if (oldQuestions && oldQuestions.length > 0) {
                    const questionIds = oldQuestions.map(q => q.id);

                    await api.client
                        .from('reponses')
                        .delete()
                        .in('question_id', questionIds);

                    await api.client
                        .from('questions')
                        .delete()
                        .eq('exercice_id', this.editingId);
                }

            } else {
                // ========================================
                // MODE CREATE
                // ========================================

                const { data: newEx, error: exError } = await api.client
                    .from('exercices')
                    .insert([exerciceData])
                    .select()
                    .single();

                if (exError) throw exError;
                exerciceId = newEx.id;
            }

            // ========================================
            // CRÉER LA QUESTION
            // ========================================

            const { data: newQuestion, error: qError } = await api.client
                .from('questions')
                .insert([{
                    exercice_id: exerciceId,
                    question_texte: questionTexte,
                    type_question: 'choix_unique',
                    points: exerciceData.points,
                    ordre: 1
                }])
                .select()
                .single();

            if (qError) throw qError;

            // ========================================
            // CRÉER LES RÉPONSES
            // ========================================

            const reponses = choix.map(c => ({
                question_id: newQuestion.id,
                texte_reponse: c.texte,
                est_correcte: c.est_correct,
                ordre: c.ordre
            }));

            const { error: rError } = await api.client
                .from('reponses')
                .insert(reponses);

            if (rError) throw rError;

            // ========================================
            // SUCCÈS
            // ========================================

            ui.showNotification('Exercice enregistré avec succès!', 'success');
            ui.closeModal('exerciceModal');
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
            `Supprimer l'exercice "${titre}" ?\n\nToutes les questions et réponses seront également supprimées.`,
            'Confirmation'
        );

        if (!confirmed) return;

        try {
            // Les suppressions en cascade devraient gérer questions et réponses
            const { error } = await api.client
                .from('exercices')
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
// EXPORT SINGLETON
// ========================================
export const exercicesView = new ExercicesView();
window.exercicesView = exercicesView; // IMPORTANT: Expose to window for inline onclick handlers