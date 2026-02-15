// js/views/exercices-code.js
import { api } from '../api.js';
import { ui } from '../ui.js';

export class ExercicesCodeView {
    constructor() {
        this.editingId = null;
    }

    async render() {
        const container = document.getElementById('contentArea');
        ui.setPageTitle('Exercices de Code', 'Gestion des exercices pratiques pour développeurs');
        ui.showAddButton(true);
        ui.showLoading(container);

        try {
            await this.loadData();
        } catch (error) {
            console.error('Erreur chargement exercices code:', error);
            ui.showError(container, 'Impossible de charger les exercices');
        }
    }

    async loadData() {
        const container = document.getElementById('contentArea');

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
        <div class="text-6xl mb-4">💻</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucun exercice de code</h3>
        <p class="text-gray-500 mb-4">Créez votre premier exercice pratique</p>
        <button onclick="exercicesCodeView.openModal()" class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
          + Créer un exercice
        </button>
      </div>
    `;
    }

    renderCoursGroup(cours, exercices) {
        const couleur = cours.chapitre?.matiere?.couleur || '#10b981';

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
        const langageIcons = {
            'javascript': '🟨 JS',
            'python': '🐍 Python',
            'html': '🌐 HTML',
            'css': '🎨 CSS',
            'sql': '🗄️ SQL'
        };

        const difficulteIcons = {
            'facile': '⭐',
            'moyen': '⭐⭐',
            'difficile': '⭐⭐⭐'
        };

        return `
      <div class="p-5 hover:bg-gray-50 transition-colors">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-start space-x-3 mb-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background: ${couleur}20; color: ${couleur};">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="text-base font-bold text-gray-900 mb-2">${ex.titre}</h4>
                <p class="text-sm text-gray-600 mb-3">${ex.description || 'Aucune description'}</p>
                <div class="flex items-center flex-wrap gap-2 mb-3">
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                    ${langageIcons[ex.langage] || ex.langage}
                  </span>
                  <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                    ${difficulteIcons[ex.difficulte]} ${ex.difficulte}
                  </span>
                  <span class="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold">
                    ${ex.points_recompense} points
                  </span>
                  ${!ex.est_actif ? '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Inactif</span>' : ''}
                </div>
              </div>
            </div>
          </div>
          <div class="flex space-x-2 ml-4 flex-shrink-0">
            <button onclick="exercicesCodeView.edit('${ex.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="exercicesCodeView.deleteExercice('${ex.id}', '${ex.titre.replace(/'/g, "\\'")}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
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
        console.log('💻 Opening code exercise modal, id:', id);
        this.editingId = id;
        ui.openModal('exerciceCodeModal');

        const form = document.getElementById('exerciceCodeForm');
        if (form) form.reset();

        document.getElementById('exerciceCodeModalTitle').textContent = id ? 'Modifier l\'exercice' : 'Nouvel exercice de code';

        await this.loadCoursSelect();

        if (id) {
            await this.loadExerciceData(id);
        }
    }

    async loadCoursSelect() {
        const { data: cours } = await api.client
            .from('cours')
            .select(`id, titre, chapitre:chapitres(titre, matiere:matieres(nom))`)
            .eq('est_publie', true)
            .order('titre', { ascending: true });

        const select = document.getElementById('exerciceCodeCours');
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionner un cours...</option>';
        if (cours) {
            // Filtrer uniquement les cours pour devs
            const coursDevs = cours.filter(c => c.chapitre?.matiere?.nom &&
                (c.chapitre.matiere.nom.toLowerCase().includes('dev') ||
                    c.chapitre.matiere.nom.toLowerCase().includes('programmation') ||
                    c.chapitre.matiere.nom.toLowerCase().includes('web')));

            coursDevs.forEach(c => {
                const label = `${c.chapitre?.matiere?.nom} • ${c.chapitre?.titre} • ${c.titre}`;
                select.innerHTML += `<option value="${c.id}">${label}</option>`;
            });
        }
    }

    async loadExerciceData(id) {
        const { data } = await api.client
            .from('exercices_code')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            document.getElementById('exerciceCodeCours').value = data.cours_id || '';
            document.getElementById('exerciceCodeTitre').value = data.titre;
            document.getElementById('exerciceCodeDescription').value = data.description || '';
            document.getElementById('exerciceCodeLangage').value = data.langage;
            document.getElementById('exerciceCodeDifficulte').value = data.difficulte || 'moyen';
            document.getElementById('exerciceCodePoints').value = data.points_recompense || 20;
            document.getElementById('exerciceCodeInitial').value = data.code_initial || '';
            document.getElementById('exerciceCodeSolution').value = data.code_solution || '';
            document.getElementById('exerciceCodeTests').value = data.tests_unitaires ? JSON.stringify(data.tests_unitaires, null, 2) : '';
            document.getElementById('exerciceCodeActif').checked = data.est_actif !== false;
        }
    }

    async save(e) {
        e.preventDefault();
        console.log('💾 Save code exercise triggered');

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

        // Parse tests JSON si fourni
        const testsInput = document.getElementById('exerciceCodeTests').value.trim();
        if (testsInput) {
            try {
                exerciceData.tests_unitaires = JSON.parse(testsInput);
            } catch (error) {
                ui.showNotification('Format JSON invalide pour les tests', 'error');
                return;
            }
        }

        try {
            if (this.editingId) {
                const { error } = await api.client
                    .from('exercices_code')
                    .update(exerciceData)
                    .eq('id', this.editingId);

                if (error) throw error;
            } else {
                const { error } = await api.client
                    .from('exercices_code')
                    .insert([exerciceData]);

                if (error) throw error;
            }

            ui.showNotification('Exercice enregistré avec succès!', 'success');
            ui.closeModal('exerciceCodeModal');
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
            `Supprimer l'exercice "${titre}" ?\n\nToutes les soumissions seront également supprimées.`,
            'Confirmation'
        );

        if (!confirmed) return;

        try {
            const { error } = await api.client.from('exercices_code').delete().eq('id', id);

            if (error) throw error;

            ui.showNotification('Exercice supprimé!', 'success');
            await this.loadData();
        } catch (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }
}

export const exercicesCodeView = new ExercicesCodeView();