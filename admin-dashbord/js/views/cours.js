// js/views/cours.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { FILE_LIMITS, STORAGE_BUCKETS } from '../config.js';

export class CoursView {
  constructor() {
    this.currentEditId = null;
    this.selectedVideo = null;
    this.currentVideoUrl = null;
  }

  async render() {
    ui.setPageTitle('Cours', 'Gestion des cours');
    ui.showAddButton(true);

    const container = document.getElementById('contentArea');
    ui.showLoading(container);

    try {
      const cours = await api.getCours();

      if (!cours || cours.length === 0) {
        ui.showEmpty(container, 'Aucun cours pour le moment', `
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        `);
        return;
      }

      this.renderList(cours);
    } catch (error) {
      ui.showError(container, error.message);
    }
  }

  renderList(cours) {
    const container = document.getElementById('contentArea');
    const typeIcon = {
      'texte': '📝',
      'video': '🎥',
      'mixte': '🎬'
    };

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${cours.map(c => `
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-green-300 transition">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2 py-1 text-xs font-semibold rounded" style="background-color: ${c.chapitres?.matieres?.couleur}20; color: ${c.chapitres?.matieres?.couleur};">
                    ${c.chapitres?.matieres?.nom || 'N/A'}
                  </span>
                  <span class="text-xs text-gray-500">• ${c.chapitres?.titre || 'N/A'}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center">
                  <span class="mr-2">${typeIcon[c.type_contenu] || '📄'}</span>
                  ${c.titre}
                </h3>
                <div class="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                  <span>⏱️ ${c.duree_lecture || 0} min</span>
                  <span>🏆 ${c.points_recompense || 0} pts</span>
                  <span>👁️ ${c.vues_total || 0} vues</span>
                </div>
                <div class="flex items-center space-x-2">
                  ${c.est_gratuit ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Gratuit</span>' : '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Premium</span>'}
                  ${c.est_publie ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Publié</span>' : '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Brouillon</span>'}
                  ${c.video_url ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">🎬 Vidéo</span>' : ''}
                </div>
              </div>
              <div class="flex space-x-2 ml-4">
                <button id="edit-${c.id}" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button id="delete-${c.id}" class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add event listeners
    cours.forEach(c => {
      document.getElementById(`edit-${c.id}`).addEventListener('click', () => this.openModal(c.id));
      document.getElementById(`delete-${c.id}`).addEventListener('click', () => this.delete(c.id, c.titre));
    });
  }

  async openModal(id = null) {
    try {
      this.currentEditId = id;
      this.selectedVideo = null;
      this.currentVideoUrl = null;

      const modal = document.getElementById('coursModal');
      const form = document.getElementById('coursForm');

      if (!modal || !form) {
        throw new Error('Éléments du formulaire introuvables');
      }

      document.getElementById('coursModalTitle').textContent = id ? 'Modifier le Cours' : 'Nouveau Cours';
      ui.resetForm('coursForm');

      // Reset video section
      document.getElementById('videoSection').classList.add('hidden');
      document.getElementById('videoPreview').classList.add('hidden');
      document.getElementById('existingVideo').classList.add('hidden');
      document.getElementById('coursVideoFile').value = '';
      document.getElementById('coursVideoUrl').value = '';

      // Load matieres
      const matieres = await api.getMatieres();
      const matiereSelect = document.getElementById('coursMatiere');
      matiereSelect.innerHTML = '<option value="">Sélectionner une matière...</option>' +
        matieres.map(m => `<option value="${m.id}">${m.nom}</option>`).join('');

      if (id) {
        try {
          const cours = await api.getCoursById(id);

          // Get chapitre info to load correct matiere
          const { data: chapitre } = await api.client
            .from('chapitres')
            .select('matiere_id')
            .eq('id', cours.chapitre_id)
            .single();

          if (chapitre) {
            matiereSelect.value = chapitre.matiere_id;
            await this.loadChapitres(chapitre.matiere_id);
            document.getElementById('coursChapitre').value = cours.chapitre_id;
          }

          document.getElementById('coursTitre').value = cours.titre;
          document.getElementById('coursContenu').value = cours.contenu;
          const typeRadio = document.querySelector(`input[name="typeContenu"][value="${cours.type_contenu}"]`);
          if (typeRadio) typeRadio.checked = true;

          document.getElementById('coursDuree').value = cours.duree_lecture;
          document.getElementById('coursPoints').value = cours.points_recompense;
          document.getElementById('coursOrdre').value = cours.ordre;
          document.getElementById('coursEstGratuit').checked = cours.est_gratuit;
          document.getElementById('coursEstPublie').checked = cours.est_publie;

          // Handle video section
          if (cours.type_contenu === 'video' || cours.type_contenu === 'mixte') {
            document.getElementById('videoSection').classList.remove('hidden');

            if (cours.video_url) {
              this.currentVideoUrl = cours.video_url;

              if (cours.video_url.includes('youtube.com') || cours.video_url.includes('youtu.be')) {
                document.getElementById('coursVideoUrl').value = cours.video_url;
              } else {
                // Check if api.getPublicUrl exists or use client directly for safety
                const publicUrl = api.getPublicUrl ?
                  api.getPublicUrl(STORAGE_BUCKETS.videos, cours.video_url) :
                  api.client.storage.from(STORAGE_BUCKETS.videos).getPublicUrl(cours.video_url).data.publicUrl;

                document.getElementById('existingVideoLink').href = publicUrl;
                document.getElementById('existingVideo').classList.remove('hidden');
              }
            }
          }

        } catch (error) {
          console.error('Erreur chargement cours:', error);
          ui.showNotification('Erreur lors du chargement des données: ' + error.message, 'error');
          return;
        }
      }

      // Setup handlers
      this.setupHandlers();

      ui.openModal('coursModal');
    } catch (error) {
      console.error('Erreur ouverture modal cours:', error);
      ui.showNotification('Impossible d\'ouvrir le formulaire: ' + error.message, 'error');
    }
  }

  setupHandlers() {
    // Matiere change handler
    const matiereSelect = document.getElementById('coursMatiere');
    matiereSelect.onchange = (e) => this.loadChapitres(e.target.value);

    // Type contenu change handler
    document.querySelectorAll('input[name="typeContenu"]').forEach(radio => {
      radio.onchange = (e) => {
        const videoSection = document.getElementById('videoSection');
        if (e.target.value === 'video' || e.target.value === 'mixte') {
          videoSection.classList.remove('hidden');
        } else {
          videoSection.classList.add('hidden');
        }
      };
    });

    // Video file upload handler
    const videoInput = document.getElementById('coursVideoFile');
    videoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('video/')) {
        ui.showNotification('Veuillez sélectionner un fichier vidéo', 'error');
        e.target.value = '';
        return;
      }

      if (file.size > FILE_LIMITS.video) {
        ui.showNotification('Le fichier est trop volumineux (max 100 MB)', 'error');
        e.target.value = '';
        return;
      }

      this.selectedVideo = file;
      document.getElementById('videoFileName').textContent = file.name;
      document.getElementById('videoFileSize').textContent = ui.formatFileSize(file.size);
      document.getElementById('videoPreview').classList.remove('hidden');
      document.getElementById('existingVideo').classList.add('hidden');
    };

    // Remove video
    document.getElementById('removeVideo').onclick = () => {
      this.selectedVideo = null;
      videoInput.value = '';
      document.getElementById('videoPreview').classList.add('hidden');
      if (this.currentVideoUrl) {
        document.getElementById('existingVideo').classList.remove('hidden');
      }
    };

    // Delete existing video
    document.getElementById('deleteExistingVideo').onclick = () => {
      this.currentVideoUrl = null;
      document.getElementById('existingVideo').classList.add('hidden');
    };
  }

  async loadChapitres(matiereId) {
    const chapitreSelect = document.getElementById('coursChapitre');

    if (!matiereId) {
      chapitreSelect.innerHTML = '<option value="">Sélectionner un chapitre...</option>';
      return;
    }

    const chapitres = await api.getChapitres({ matiere_id: matiereId });
    chapitreSelect.innerHTML = '<option value="">Sélectionner un chapitre...</option>' +
      chapitres.map(c => `<option value="${c.id}">${c.titre}</option>`).join('');
  }

  async save(e) {
    e.preventDefault();
    ui.setFormLoading('coursForm', true);

    try {
      const typeContenu = document.querySelector('input[name="typeContenu"]:checked').value;
      let videoUrl = document.getElementById('coursVideoUrl').value || this.currentVideoUrl;

      // Upload video if file selected
      if (this.selectedVideo) {
        videoUrl = await api.uploadFile(STORAGE_BUCKETS.videos, this.selectedVideo);

        // Delete old video if editing
        if (this.currentVideoUrl && this.currentEditId && !this.currentVideoUrl.includes('youtube')) {
          await api.deleteFile(STORAGE_BUCKETS.videos, this.currentVideoUrl);
        }
      }

      const titre = document.getElementById('coursTitre').value;
      const data = {
        chapitre_id: document.getElementById('coursChapitre').value,
        titre,
        slug: titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
        contenu: document.getElementById('coursContenu').value,
        type_contenu: typeContenu,
        video_url: videoUrl,
        duree_lecture: parseInt(document.getElementById('coursDuree').value),
        points_recompense: parseInt(document.getElementById('coursPoints').value),
        ordre: parseInt(document.getElementById('coursOrdre').value),
        est_gratuit: document.getElementById('coursEstGratuit').checked,
        est_publie: document.getElementById('coursEstPublie').checked
      };

      if (this.currentEditId) {
        await api.updateCours(this.currentEditId, data);
        ui.showNotification('Cours modifié avec succès');
      } else {
        await api.createCours(data);
        ui.showNotification('Cours créé avec succès');
      }

      ui.closeModal('coursModal');
      await this.render();

      // Reset
      this.selectedVideo = null;
      this.currentVideoUrl = null;

    } catch (error) {
      ui.showNotification('Erreur: ' + error.message, 'error');
    } finally {
      ui.setFormLoading('coursForm', false);
    }
  }

  async delete(id, titre) {
    const confirmed = await ui.confirm(
      `Supprimer le cours "${titre}" ?`,
      '⚠️ Suppression'
    );

    if (!confirmed) return;

    try {
      // Delete video if exists
      const cours = await api.getCoursById(id);
      if (cours.video_url && !cours.video_url.includes('youtube')) {
        await api.deleteFile(STORAGE_BUCKETS.videos, cours.video_url);
      }

      await api.deleteCours(id);
      ui.showNotification('Cours supprimé avec succès');
      await this.render();
    } catch (error) {
      ui.showNotification('Erreur: ' + error.message, 'error');
    }
  }
}

export const coursView = new CoursView();