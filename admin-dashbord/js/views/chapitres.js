// js/views/chapitres.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { FILE_LIMITS, STORAGE_BUCKETS } from '../config.js';

export class ChapitresView {
  constructor() {
    this.currentEditId = null;
  }

  async render() {
    ui.setPageTitle('Chapitres', 'Gestion des chapitres');
    ui.showAddButton(true);

    const container = document.getElementById('contentArea');
    ui.showLoading(container);

    try {
      const chapitres = await api.getChapitres();

      if (!chapitres || chapitres.length === 0) {
        ui.showEmpty(container, 'Aucun chapitre pour le moment');
        return;
      }

      this.renderList(chapitres);
    } catch (error) {
      ui.showError(container, error.message);
    }
  }

  renderList(chapitres) {
    const container = document.getElementById('contentArea');
    container.innerHTML = `
      <div class="space-y-4">
        ${chapitres.map(c => this.renderCard(c)).join('')}
      </div>
    `;

    chapitres.forEach(c => {
      document.getElementById(`edit-${c.id}`).addEventListener('click', () => this.openModal(c.id));
      document.getElementById(`delete-${c.id}`).addEventListener('click', () => this.delete(c.id, c.titre));
    });
  }

  renderCard(chapitre) {
    let pdfBadge = '';
    if (chapitre.pdf_url) {
      pdfBadge = `
        <a href="${chapitre.pdf_url}" target="_blank" class="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded hover:bg-red-100 transition">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
          PDF
        </a>
      `;
    }

    return `
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-300 transition">
        <div class="flex justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <span class="px-3 py-1 text-xs font-semibold rounded-full" style="background-color: ${chapitre.matieres?.couleur}20; color: ${chapitre.matieres?.couleur};">
                ${chapitre.matieres?.nom || 'N/A'}
              </span>
              ${chapitre.est_premium ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">Premium</span>' : ''}
              ${chapitre.est_publie ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Publié</span>' : '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">Brouillon</span>'}
              ${pdfBadge}
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">${chapitre.titre}</h3>
            <p class="text-sm text-gray-600 mb-3">${chapitre.description || ''}</p>
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>📊 ${chapitre.difficulte}</span>
              <span>⏱️ ${chapitre.duree_estimee || 0} min</span>
              <span>🔢 Ordre: ${chapitre.ordre}</span>
            </div>
          </div>
          <div class="flex space-x-2 ml-4">
            <button id="edit-${chapitre.id}" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button id="delete-${chapitre.id}" class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition">
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
    this.currentEditId = id;

    document.getElementById('chapitreModalTitle').textContent = id ? 'Modifier le Chapitre' : 'Nouveau Chapitre';
    ui.resetForm('chapitreForm');

    // Réinitialiser l'interface PDF
    this.resetPdfInterface();

    // Charger les matières
    const matieres = await api.getMatieres();
    const matiereSelect = document.getElementById('chapitreMatiere');
    matiereSelect.innerHTML = '<option value="">Sélectionner une matière...</option>' +
      matieres.map(m => `<option value="${m.id}">${m.nom}</option>`).join('');

    if (id) {
      try {
        const chapitre = await api.getChapitreById(id);

        // Remplir les champs
        document.getElementById('chapitreMatiere').value = chapitre.matiere_id;
        document.getElementById('chapitreTitre').value = chapitre.titre;
        document.getElementById('chapitreDescription').value = chapitre.description || '';
        document.getElementById('chapitreDifficulte').value = chapitre.difficulte;
        document.getElementById('chapitreDuree').value = chapitre.duree_estimee;
        document.getElementById('chapitreOrdre').value = chapitre.ordre;
        document.getElementById('chapitreObjectifs').value = chapitre.objectifs?.join('\n') || '';
        document.getElementById('chapitreEstPublie').checked = chapitre.est_publie;
        document.getElementById('chapitreEstPremium').checked = chapitre.est_premium;

        // Afficher le PDF existant si présent
        if (chapitre.pdf_url) {
          window.currentPdfUrl = chapitre.pdf_url;
          document.getElementById('chapitrePdfUrlHidden').value = chapitre.pdf_url;
          document.getElementById('pdfExistingLink').href = chapitre.pdf_url;
          document.getElementById('pdfUploadZone').classList.add('hidden');
          document.getElementById('pdfExisting').classList.remove('hidden');
        }

      } catch (error) {
        ui.showNotification('Erreur lors du chargement', 'error');
        return;
      }
    }

    ui.openModal('chapitreModal');
  }

  resetPdfInterface() {
    // Réinitialiser l'interface PDF
    window.currentPdfFile = null;
    window.currentPdfUrl = null;
    window.isUploading = false;

    document.getElementById('chapitrePdfFile').value = '';
    document.getElementById('chapitrePdfUrlHidden').value = '';

    document.getElementById('pdfUploadZone').classList.remove('hidden');
    document.getElementById('pdfUploadProgress').classList.add('hidden');
    document.getElementById('pdfUploadSuccess').classList.add('hidden');
    document.getElementById('pdfExisting').classList.add('hidden');
  }

  async save(e) {
    e.preventDefault();

    // Vérifier si un upload est en cours
    if (window.isUploading) {
      ui.showNotification('Veuillez attendre la fin de l\'upload du PDF', 'warning');
      return;
    }

    ui.setFormLoading('chapitreForm', true);

    try {
      // Récupérer l'URL du PDF (soit uploadé, soit existant)
      const pdfUrl = document.getElementById('chapitrePdfUrlHidden').value.trim() || null;

      // Préparer les objectifs
      const objectifs = document.getElementById('chapitreObjectifs').value
        .split('\n')
        .map(o => o.trim())
        .filter(o => o);

      const titre = document.getElementById('chapitreTitre').value;

      // Préparer les données
      const data = {
        matiere_id: document.getElementById('chapitreMatiere').value,
        titre,
        slug: titre.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        description: document.getElementById('chapitreDescription').value,
        difficulte: document.getElementById('chapitreDifficulte').value,
        duree_estimee: parseInt(document.getElementById('chapitreDuree').value),
        ordre: parseInt(document.getElementById('chapitreOrdre').value),
        objectifs: objectifs,
        est_publie: document.getElementById('chapitreEstPublie').checked,
        est_premium: document.getElementById('chapitreEstPremium').checked,
        pdf_url: pdfUrl
      };

      // Créer ou modifier
      if (this.currentEditId) {
        await api.updateChapitre(this.currentEditId, data);
        ui.showNotification('Chapitre modifié avec succès');
      } else {
        await api.createChapitre(data);
        ui.showNotification('Chapitre créé avec succès');
      }

      ui.closeModal('chapitreModal');
      await this.render();

    } catch (error) {
      console.error('Erreur save chapitre:', error);
      ui.showNotification('Erreur: ' + error.message, 'error');
    } finally {
      ui.setFormLoading('chapitreForm', false);
    }
  }

  async delete(id, titre) {
    const confirmed = await ui.confirm(
      `Supprimer le chapitre "${titre}" ?\n\nTous les cours associés seront également supprimés.`,
      '⚠️ Suppression'
    );

    if (!confirmed) return;

    try {
      // Récupérer le chapitre pour supprimer le PDF de Supabase si présent
      const chapitre = await api.getChapitreById(id);

      if (chapitre.pdf_url) {
        try {
          // Extraire le nom du fichier de l'URL
          const fileName = chapitre.pdf_url.split('/').pop();

          // Supprimer de Supabase Storage
          const { error } = await api.client.storage
            .from('pdfs-cours')
            .remove([fileName]);

          if (error) {
            console.warn('Impossible de supprimer le PDF du storage:', error);
          }
        } catch (storageError) {
          console.warn('Erreur suppression PDF storage:', storageError);
          // On continue quand même la suppression du chapitre
        }
      }

      await api.deleteChapitre(id);
      ui.showNotification('Chapitre supprimé avec succès');
      await this.render();
    } catch (error) {
      ui.showNotification('Erreur: ' + error.message, 'error');
    }
  }
}

export const chapitresView = new ChapitresView();