// js/views/exercices.js - ADAPTÉ AU SCHÉMA EXISTANT
import { api } from '../api.js';
import { ui } from '../ui.js';

class ExercicesView {
    constructor() {
        this.editingId = null;
    }

    async render() {
        const container = document.getElementById('contentArea');
        ui.setPageTitle('Gestion des exercices', 'Créer des QCM et exercices');
        ui.showAddButton(true);
        ui.showLoading(container);

        try {
            await this.loadData();
        } catch (error) {
            console.error('Erreur chargement exercices:', error);
            ui.showError(container, 'Impossible de charger les exercices');
        }
    }

    async loadData() {
        const container = document.getElementById('contentArea');

        // Charger exercices avec leurs questions et réponses
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
            ui.showError(container, error.message);
            return;
        }

        if (!exercices || exercices.length === 0) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Grouper par cours
        const groupedByCours = {};
        exercices.forEach(ex => {
            const coursId = ex.cours?.id || 'sans-cours';
            if (!groupedByCours[coursId]) {
                groupedByCours[coursId] = { cours: ex.cours, exercices: [] };
            }
            groupedByCours[coursId].exercices.push(ex);
        });

        let html = '<div class="space-y-6">';
        Object.values(groupedByCours).forEach(group => {
            if (group.cours) {
                html += this.renderCoursGroup(group.cours, group.exercices);
            }
        });
        html += '</div>';
        container.innerHTML = html;
    }

    renderEmpty() {
        return `
            <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucun exercice</h3>
                <p class="text-gray-500 mb-4">Créez votre premier exercice QCM</p>
                <button onclick="exercicesView.openModal()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                    + Créer un exercice
                </button>
            </div>
        `;
    }

    renderCoursGroup(cours, exercices) {
        const couleur = cours.chapitre?.matiere?.couleur || '#3b82f6';

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-5 border-b border-gray-200" style="background: linear-gradient(135deg, ${couleur}15 0%, ${couleur}05 100%);">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${cours.titre}</h3>
                            <p class="text-sm text-gray-600">${cours.chapitre?.matiere?.nom} • ${cours.chapitre?.titre}</p>
                        </div>
                        <span class="px-3 py-1 bg-white rounded-full text-sm font-semibold" style="color: ${couleur};">
                            ${exercices.length} exercice(s)
                        </span>
                    </div>
                </div>
                <div class="divide-y divide-gray-200">
                    ${exercices.map(ex => this.renderCard(ex, couleur)).join('')}
                </div>
            </div>
        `;
    }

    renderCard(ex, couleur) {
        const difficulteIcons = { 'facile': '⭐', 'moyen': '⭐⭐', 'difficile': '⭐⭐⭐' };
        const nbQuestions = ex.questions?.length || 0;
        const totalChoix = ex.questions?.reduce((sum, q) => sum + (q.reponses?.length || 0), 0) || 0;

        return `
            <div class="p-5 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-start space-x-3 mb-3">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background: ${couleur}20; color: ${couleur};">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-base font-bold text-gray-900 mb-2">${ex.titre}</h4>
                                <div class="flex items-center flex-wrap gap-2 mb-3">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                        ${difficulteIcons[ex.difficulte]} ${ex.difficulte}
                                    </span>
                                    <span class="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold">
                                        ${ex.points} points
                                    </span>
                                    ${!ex.est_publie ? '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Brouillon</span>' : ''}
                                </div>
                                <div class="text-sm text-gray-600">
                                    📝 ${nbQuestions} question(s) • ${totalChoix} choix au total
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4 flex-shrink-0">
                        <button onclick="exercicesView.edit('${ex.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="exercicesView.deleteExercice('${ex.id}', '${ex.titre.replace(/'/g, "\\'")}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async openModal(id = null) {
        console.log('🎯 Opening exercice modal, id:', id ? id : 'new');
        this.editingId = id;
        ui.openModal('exerciceModal');

        const form = document.getElementById('exerciceForm');
        if (form) form.reset();

        document.getElementById('exerciceModalTitle').textContent = id ? 'Modifier l\'exercice' : 'Nouvel exercice';

        await this.loadCoursSelect();
        this.resetChoix();

        if (id) {
            await this.loadExerciceData(id);
        }

        console.log('✅ Exercice modal opened');
    }

    async loadCoursSelect() {
        const { data: cours } = await api.client
            .from('cours')
            .select(`id, titre, chapitre:chapitres(titre, matiere:matieres(nom))`)
            .eq('est_publie', true)
            .order('titre', { ascending: true });

        const select = document.getElementById('exerciceCours');
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionner un cours...</option>';
        if (cours) {
            cours.forEach(c => {
                const label = `${c.chapitre?.matiere?.nom} • ${c.chapitre?.titre} • ${c.titre}`;
                select.innerHTML += `<option value="${c.id}">${label}</option>`;
            });
        }
    }

    resetChoix() {
        const container = document.getElementById('choixContainer');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            this.addChoix('', false);
        }
    }

    addChoix(texte = '', estCorrect = false) {
        const container = document.getElementById('choixContainer');
        if (!container) return;

        const index = container.children.length;
        const choixHtml = `
            <div class="choix-item flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition">
                <input type="checkbox" class="choix-correct w-5 h-5 text-blue-600 border-gray-300 rounded mt-1" ${estCorrect ? 'checked' : ''}>
                <input type="text" class="choix-texte flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="Réponse ${index + 1}" value="${texte}" required>
                <button type="button" onclick="this.closest('.choix-item').remove()" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', choixHtml);
    }

    async loadExerciceData(id) {
        const { data } = await api.client
            .from('exercices')
            .select(`
                *,
                questions(
                    id, question_texte, type_question, points, ordre,
                    reponses(id, texte_reponse, est_correcte, ordre)
                )
            `)
            .eq('id', id)
            .single();

        if (data) {
            document.getElementById('exerciceCours').value = data.cours_id || '';
            document.getElementById('exerciceType').value = data.type_exercice || 'qcm';
            document.getElementById('exerciceQuestion').value = data.consigne || '';
            document.getElementById('exerciceDifficulte').value = data.difficulte || 'moyen';
            document.getElementById('exercicePoints').value = data.points || 10;
            document.getElementById('exerciceExplication').value = ''; // Pas de champ explication dans le schéma
            // document.getElementById('exerciceEstActif').checked = data.est_publie !== false;

            // Charger les réponses de la première question
            const container = document.getElementById('choixContainer');
            if (container && data.questions && data.questions.length > 0) {
                container.innerHTML = '';
                const question = data.questions[0];
                if (question.reponses && question.reponses.length > 0) {
                    question.reponses.sort((a, b) => a.ordre - b.ordre).forEach(rep => {
                        this.addChoix(rep.texte_reponse, rep.est_correcte);
                    });
                }
            }
        }
    }

    async save(e) {
        e.preventDefault();
        console.log('💾 Save exercice triggered');

        // Récupérer les choix
        const choixItems = document.querySelectorAll('.choix-item');
        const choix = [];
        choixItems.forEach((item, index) => {
            const texte = item.querySelector('.choix-texte').value.trim();
            const estCorrect = item.querySelector('.choix-correct').checked;
            if (texte) {
                choix.push({ texte, est_correct: estCorrect, ordre: index + 1 });
            }
        });

        if (choix.length < 2) {
            ui.showNotification('Vous devez ajouter au moins 2 choix de réponse.', 'error');
            return;
        }

        const nbCorrects = choix.filter(c => c.est_correct).length;
        if (nbCorrects === 0) {
            ui.showNotification('Vous devez marquer au moins une réponse comme correcte.', 'error');
            return;
        }

        const exerciceData = {
            cours_id: parseInt(document.getElementById('exerciceCours').value),
            titre: document.getElementById('exerciceQuestion').value.trim(),
            consigne: document.getElementById('exerciceQuestion').value.trim(),
            type_exercice: 'qcm',
            difficulte: document.getElementById('exerciceDifficulte').value,
            points: parseInt(document.getElementById('exercicePoints').value),
            est_publie: true // document.getElementById('exerciceEstActif').checked
        };

        try {
            let exerciceId = this.editingId;

            if (this.editingId) {
                // Mise à jour
                const { error: exError } = await api.client
                    .from('exercices')
                    .update(exerciceData)
                    .eq('id', this.editingId);

                if (exError) throw exError;

                // Supprimer anciennes questions/réponses
                const { data: oldQuestions } = await api.client
                    .from('questions')
                    .select('id')
                    .eq('exercice_id', this.editingId);

                if (oldQuestions && oldQuestions.length > 0) {
                    await api.client.from('reponses').delete().in('question_id', oldQuestions.map(q => q.id));
                    await api.client.from('questions').delete().eq('exercice_id', this.editingId);
                }
            } else {
                // Création
                const { data: newEx, error: exError } = await api.client
                    .from('exercices')
                    .insert([exerciceData])
                    .select()
                    .single();

                if (exError) throw exError;
                exerciceId = newEx.id;
            }

            // Créer la question
            const { data: newQuestion, error: qError } = await api.client
                .from('questions')
                .insert([{
                    exercice_id: exerciceId,
                    question_texte: exerciceData.consigne,
                    type_question: 'choix_unique',
                    points: exerciceData.points,
                    ordre: 1
                }])
                .select()
                .single();

            if (qError) throw qError;

            // Créer les réponses
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

            ui.showNotification('Exercice enregistré avec succès!', 'success');
            ui.closeModal('exerciceModal');
            await this.loadData();

        } catch (error) {
            console.error('❌ Save error:', error);
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    async edit(id) {
        await this.openModal(id);
    }

    async deleteExercice(id, titre) {
        const confirmed = await ui.confirm(
            `Supprimer l'exercice "${titre}" ?\n\nToutes les questions et réponses seront également supprimées.`,
            'Confirmation'
        );

        if (!confirmed) return;

        try {
            // Les suppressions en cascade devraient gérer questions et réponses
            const { error } = await api.client.from('exercices').delete().eq('id', id);

            if (error) throw error;

            ui.showNotification('Exercice supprimé!', 'success');
            await this.loadData();
        } catch (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }
}

export const exercicesView = new ExercicesView();