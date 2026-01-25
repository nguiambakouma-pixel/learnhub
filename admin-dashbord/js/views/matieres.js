// js/views/matieres.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { PARCOURS_CONFIG } from '../config.js';

export class MatieresView {
  constructor() {
    this.currentEditId = null;
  }

  async render() {
    ui.setPageTitle('Matières', 'Gestion des matières');
    ui.showAddButton(true);

    const container = document.getElementById('contentArea');
    ui.showLoading(container);

    try {
      const matieres = await api.getMatieres();

      if (!matieres || matieres.length === 0) {
        ui.showEmpty(container, 'Aucune matière pour le moment', `
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <div class="mt-4">
            <button onclick="matieresView.openModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              + Créer une matière
            </button>
          </div>
        `);
        return;
      }

      this.renderList(matieres);
    } catch (error) {
      ui.showError(container, error.message);
    }
  }

  renderList(matieres) {
    const container = document.getElementById('contentArea');
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${matieres.map(m => this.renderCard(m)).join('')}
      </div>
    `;

    // Event listeners are handled via onclick
  }

  renderCard(matiere) {
    const parcoursLabel = PARCOURS_CONFIG[matiere.type_parcours]?.label || matiere.type_parcours;
    const chapitresCount = matiere.chapitres?.[0]?.count || 0;

    return `
      <div class="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100 hover:border-blue-300 transition">
        <div class="flex justify-between mb-4">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: ${matiere.couleur}20;">
            <div class="w-6 h-6 rounded" style="background-color: ${matiere.couleur};"></div>
          </div>
          <div class="flex space-x-2">
            <button onclick="matieresView.openModal('${matiere.id}')" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="matieresView.delete('${matiere.id}', '${matiere.nom.replace(/'/g, "\\'")}')" class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">${matiere.nom}</h3>
        <p class="text-sm text-gray-500 mb-3 line-clamp-2">${matiere.description || ''}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">${parcoursLabel}</span>
          <div class="flex items-center space-x-3 text-gray-500">
            <span>📚 ${chapitresCount} chapitre${chapitresCount > 1 ? 's' : ''}</span>
            <span>Ordre: ${matiere.ordre}</span>
          </div>
        </div>
      </div>
    `;
  }

  async openModal(id = null) {
    this.currentEditId = id;
    const modal = document.getElementById('matiereModal');
    const form = document.getElementById('matiereForm');

    document.getElementById('modalTitle').textContent = id ? 'Modifier la Matière' : 'Nouvelle Matière';
    ui.resetForm('matiereForm');

    if (id) {
      try {
        const matiere = await api.getMatiereById(id);
        document.getElementById('matiereNom').value = matiere.nom;
        document.getElementById('matiereDescription').value = matiere.description || '';
        document.getElementById('matiereTypeParcours').value = matiere.type_parcours;
        document.getElementById('matiereCouleur').value = matiere.couleur;
        document.getElementById('matiereOrdre').value = matiere.ordre;
      } catch (error) {
        ui.showNotification('Erreur lors du chargement', 'error');
        return;
      }
    }

    ui.openModal('matiereModal');
  }

  async save(e) {
    e.preventDefault();
    ui.setFormLoading('matiereForm', true);

    try {
      const nom = document.getElementById('matiereNom').value;
      const data = {
        nom,
        slug: nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
        description: document.getElementById('matiereDescription').value,
        type_parcours: document.getElementById('matiereTypeParcours').value,
        couleur: document.getElementById('matiereCouleur').value,
        ordre: parseInt(document.getElementById('matiereOrdre').value)
      };

      if (this.currentEditId) {
        await api.updateMatiere(this.currentEditId, data);
        ui.showNotification('Matière modifiée avec succès');
      } else {
        await api.createMatiere(data);
        ui.showNotification('Matière créée avec succès');
      }

      ui.closeModal('matiereModal');
      await this.render();
    } catch (error) {
      ui.showNotification('Erreur: ' + error.message, 'error');
    } finally {
      ui.setFormLoading('matiereForm', false);
    }
  }

  async delete(id, nom) {
    const confirmed = await ui.confirm(
      `Supprimer la matière "${nom}" ?\n\nTous les chapitres et cours associés seront également supprimés.`,
      '⚠️ Suppression'
    );

    if (!confirmed) return;

    try {
      await api.deleteMatiere(id);
      ui.showNotification('Matière supprimée avec succès');
      await this.render();
    } catch (error) {
      ui.showNotification('Erreur: ' + error.message, 'error');
    }
  }
}

export const matieresView = new MatieresView();