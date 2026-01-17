// js/views/exercices.js
import { api } from '../api.js';
import { ui } from '../ui.js';

class ExercicesView {
    constructor() {
        this.editingId = null;
    }

    async render() {
        const container = document.getElementById('contentArea');
        
        // Update header
        ui.setPageTitle('Gestion des exercices', 'Créer des QCM et exercices');
        ui.showAddButton(true);
        
        // Show loader
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
                groupedByCours[coursId] = {
                    cours: ex.cours,
                    exercices: []
                };
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
                            <p class="text-sm text-gray-600">
                                ${cours.chapitre?.matiere?.nom} • ${cours.chapitre?.titre}
                            </p>
                        </div>
                        <span class="px-3 py-1 bg-white rounded-full text-sm font-semibold" style="color: ${couleur};">
                            ${exercices.length} QCM
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
        const typeColors = {
            'qcm_unique': 'bg-blue-100 text-blue-800',
            'qcm_multiple': 'bg-purple-100 text-purple-800',
            'vrai_faux': 'bg-green-100 text-green-800'
        };
        
        const typeLabels = {
            'qcm_unique': 'Choix unique',
            'qcm_multiple': 'Choix multiples',
            'vrai_faux': 'Vrai/Faux'
        };
        
        const difficulteIcons = {
            'facile': '⭐',
            'moyen': '⭐⭐',
            'difficile': '⭐⭐⭐'
        };
        
        const nbChoix = ex.choix ? ex.choix.length : 0;
        const nbCorrects = ex.choix ? ex.choix.filter(c => c.est_correct).length : 0;
        
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
                                <h4 class="text-base font-bold text-gray-900 mb-2">${ex.question}</h4>
                                
                                <div class="flex items-center flex-wrap gap-2 mb-3">
                                    <span class="px-2 py-1 rounded text-xs font-semibold ${typeColors[ex.type_question] || 'bg-gray-100 text-gray-800'}">
                                        ${typeLabels[ex.type_question] || ex.type_question}
                                    </span>
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                        ${difficulteIcons[ex.difficulte]} ${ex.difficulte}
                                    </span>
                                    <span class="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold">
                                        ${ex.points} points
                                    </span>
                                    ${!ex.est_actif ? '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Désactivé</span>' : ''}
                                </div>
                                
                                <div class="text-sm text-gray-600 space-y-1">
                                    <div class="flex items-center">
                                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                        </svg>
                                        ${nbChoix} choix proposés • ${nbCorrects} réponse(s) correcte(s)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2 ml-4 flex-shrink-0">
                        <button onclick="exercicesView.edit(${ex.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="exercicesView.duplicate(${ex.id})" class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Dupliquer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <button onclick="exercicesView.deleteExercice(${ex.id}, \`${ex.question.substring(0, 30).replace(/`/g, '').replace(/'/g, "\\'")}\`)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
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
        this.editingId = id;
        ui.openModal('exerciceModal');
        
        // Reset form
        const form = document.getElementById('exerciceForm');
        if (form) form.reset();
        
        document.getElementById('exerciceModalTitle').textContent = id ? 'Modifier l\'exercice' : 'Nouvel exercice QCM';
        
        // Load cours
        await this.loadCoursSelect();
        
        // Reset choix
        this.resetChoix();
        
        // Load data if editing
        if (id) {
            await this.loadExerciceData(id);
        }
    }

    async loadCoursSelect() {
        const { data: cours } = await api.client
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
        if (!container) {
            console.error('Container choixContainer not found');
            return;
        }
        
        const index = container.children.length;
        
        const choixHtml = `
            <div class="choix-item flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition">
                <input type="checkbox" 
                       class="choix-correct w-5 h-5 text-blue-600 border-gray-300 rounded mt-1"
                       ${estCorrect ? 'checked' : ''}>
                <input type="text" 
                       class="choix-texte flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                       placeholder="Réponse ${index + 1}"
                       value="${texte}"
                       required>
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
            .select('*')
            .eq('id', id)
            .single();
        
        if (data) {
            document.getElementById('exerciceCours').value = data.cours_id || '';
            document.getElementById('exerciceType').value = data.type_question || 'qcm_unique';
            document.getElementById('exerciceQuestion').value = data.question || '';
            document.getElementById('exerciceDifficulte').value = data.difficulte || 'moyen';
            document.getElementById('exercicePoints').value = data.points || 10;
            document.getElementById('exerciceExplication').value = data.explication || '';
            document.getElementById('exerciceEstActif').checked = data.est_actif !== false;
            
            // Load choix
            const container = document.getElementById('choixContainer');
            if (container) {
                container.innerHTML = '';
                if (data.choix && data.choix.length > 0) {
                    data.choix.forEach(choix => {
                        this.addChoix(choix.texte, choix.est_correct);
                    });
                }
            }
        }
    }

    async save(e) {
        e.preventDefault();
        
        // Get choix
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
        
        if (choix.length < 2) {
            ui.showNotification('Vous devez ajouter au moins 2 choix de réponse.', 'error');
            return;
        }
        
        const nbCorrects = choix.filter(c => c.est_correct).length;
        if (nbCorrects === 0) {
            ui.showNotification('Vous devez marquer au moins une réponse comme correcte.', 'error');
            return;
        }
        
        const data = {
            cours_id: parseInt(document.getElementById('exerciceCours').value),
            type_question: document.getElementById('exerciceType').value,
            question: document.getElementById('exerciceQuestion').value.trim(),
            choix: choix,
            difficulte: document.getElementById('exerciceDifficulte').value,
            points: parseInt(document.getElementById('exercicePoints').value),
            explication: document.getElementById('exerciceExplication').value.trim() || null,
            est_actif: document.getElementById('exerciceEstActif').checked
        };
        
        try {
            let error;
            if (this.editingId) {
                data.updated_at = new Date().toISOString();
                const result = await api.client
                    .from('exercices')
                    .update(data)
                    .eq('id', this.editingId);
                error = result.error;
            } else {
                data.created_at = new Date().toISOString();
                const result = await api.client
                    .from('exercices')
                    .insert([data]);
                error = result.error;
            }
            
            if (error) throw error;
            
            ui.showNotification('Exercice enregistré avec succès!', 'success');
            ui.closeModal('exerciceModal');
            await this.loadData();
            
        } catch (error) {
            console.error('Erreur save:', error);
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    async edit(id) {
        await this.openModal(id);
    }

    async duplicate(id) {
        const confirmed = await ui.confirm('Dupliquer cet exercice ?', 'Confirmation');
        if (!confirmed) return;
        
        const { data } = await api.client
            .from('exercices')
            .select('*')
            .eq('id', id)
            .single();
        
        if (data) {
            const { cours_id, type_question, question, choix, difficulte, points, explication } = data;
            
            const { error } = await api.client
                .from('exercices')
                .insert([{
                    cours_id,
                    type_question,
                    question: question + ' (copie)',
                    choix,
                    difficulte,
                    points,
                    explication,
                    est_actif: false,
                    created_at: new Date().toISOString()
                }]);
            
            if (!error) {
                ui.showNotification('Exercice dupliqué!', 'success');
                await this.loadData();
            }
        }
    }

    async deleteExercice(id, question) {
        const confirmed = await ui.confirm(
            `Supprimer cet exercice ?\n\n"${question}..."\n\nCette action est irréversible.`,
            'Confirmation'
        );
        
        if (!confirmed) return;
        
        const { error } = await api.client
            .from('exercices')
            .delete()
            .eq('id', id);
        
        if (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        } else {
            ui.showNotification('Exercice supprimé!', 'success');
            await this.loadData();
        }
    }
}

export const exercicesView = new ExercicesView();