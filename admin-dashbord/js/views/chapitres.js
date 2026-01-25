// js/views/chapitres.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { FILE_LIMITS, STORAGE_BUCKETS } from '../config.js';

export class ChapitresView {
  constructor() {
    this.currentEditId = null;
    this.currentPdfFile = null;
    this.currentPdfUrl = null;
    this.isUploadingPdf = false;
  }

  async render() {
    ui.setPageTitle('Chapitres', 'Gestion des chapitres');
    ui.showAddButton(true);

    const container = document.getElementById('contentArea');
    ui.showLoading(container);

    try {
      const chapitres = await api.getChapitres();

      if (!chapitres || chapitres.length === 0) {
        ui.showEmpty(container, 'Aucun chapitre pour le moment', `
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <div class="mt-4">
            <button onclick="chapitresView.openModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              + Créer un chapitre
            </button>
          </div>
        `);
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

    // Event listeners are handled via onclick
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
            <button onclick="chapitresView.openModal('${chapitre.id}')" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="chapitresView.delete('${chapitre.id}', '${chapitre.titre.replace(/'/g, "\\'")}')" class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition">
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
          this.currentPdfUrl = chapitre.pdf_url;
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

    // Setup handlers
    this.setupPdfHandlers();
  }

  setupPdfHandlers() {
    const pdfInput = document.getElementById('chapitrePdfFile');
    const dropZone = document.getElementById('pdfUploadZone');

    // Remove existing listeners to avoid duplicates
    const newPdfInput = pdfInput.cloneNode(true);
    pdfInput.parentNode.replaceChild(newPdfInput, pdfInput);

    // File input change
    newPdfInput.addEventListener('change', (e) => this.handlePdfFileUpload(e));

    // Drag & Drop
    if (dropZone) {
      // Prevent default behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      // Highlight
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.add('border-blue-500', 'bg-blue-50');
        });
      });

      // Unhighlight
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        });
      });

      // Drop
      dropZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          newPdfInput.files = files;
          this.handlePdfFileUpload({ target: { files } });
        }
      });
    }

    // Buttons
    const removePdfBtn = document.getElementById('removePDF'); // Note: ID might need check in HTML
    // Actually, based on previous HTML cleanup, we need to ensure IDs match.
    // The HTML had onclick handlers. We should probably attach them here if we removed onclicks or if we want to be cleaner.
    // But for now let's rely on the methods being called or attach if elements exist.

    // Attaching directly to global window functions for compatibility if needed, OR strict class methods.
    // Let's stick to class methods and updating HTML buttons if possible, or re-attaching.

    // Re-attach removal buttons
    /* 
       The HTML structure for success/existing has buttons with onclick="removePdfUpload()" etc.
       We should probably replace those with event listeners or make sure the functions exist globally calling the instance.
       Better: Since we are in a module, we can't easily expose to window without explicit assignment.
       The plan is to add listeners here.
    */

    // We need to find the specific buttons for removing PDF
    // 'pdfUploadSuccess' -> button inside
    const successDiv = document.getElementById('pdfUploadSuccess');
    if (successDiv) {
      const removeBtn = successDiv.querySelector('button');
      if (removeBtn) {
        // Clone to remove old listeners/onclicks
        const newBtn = removeBtn.cloneNode(true);
        removeBtn.parentNode.replaceChild(newBtn, removeBtn);
        newBtn.addEventListener('click', () => this.removePdfUpload());
      }
    }

    const existingDiv = document.getElementById('pdfExisting');
    if (existingDiv) {
      const removeBtn = existingDiv.querySelector('button');
      if (removeBtn) {
        const newBtn = removeBtn.cloneNode(true);
        removeBtn.parentNode.replaceChild(newBtn, removeBtn);
        newBtn.addEventListener('click', () => this.removeExistingPdfUpload());
      }
    }
  }

  async handlePdfFileUpload(event) {
    const file = event.target.files[0];
    if (!file || this.isUploadingPdf) return;

    // Validations
    if (file.type !== 'application/pdf') {
      ui.showNotification('Seuls les fichiers PDF sont acceptés', 'error');
      event.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      const confirmUpload = await ui.confirm(
        `Le fichier est volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB).\nLe téléchargement pourrait être lent pour les élèves.`,
        'Fichier volumineux'
      );
      if (!confirmUpload) {
        event.target.value = '';
        return;
      }
    }

    this.isUploadingPdf = true;
    this.currentPdfFile = file;

    // UI
    document.getElementById('pdfUploadZone').classList.add('hidden');
    document.getElementById('pdfExisting').classList.add('hidden');
    document.getElementById('pdfUploadProgress').classList.remove('hidden');

    try {
      // Authenticated user check via API
      const user = await api.getCurrentUser();
      if (!user) throw new Error('Vous devez être connecté');

      // Generate filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-')
        .toLowerCase();
      const fileName = `${timestamp}-${randomStr}-${sanitizedName}`;

      this.updatePdfUploadProgress(10, 'Préparation du fichier...');

      // Use api.uploadFile wrapper if possible, but it expects specific bucket.
      // It seems api.js has uploadFile. Let's use it or direct client if specific options needed.
      // api.js uploadFile: async uploadFile(bucket, file, path = null)

      this.updatePdfUploadProgress(30, 'Upload en cours...');

      // Direct upload to match previous logic's specific bucket 'pdfs-cours'
      // api.js might use a constant. Let's use the raw client for the specific 'pdfs-cours' bucket if not in config.
      // Waiting... 'pdfs-cours' might not be in STORAGE_BUCKETS config in api.js?
      // Let's check config later, but for now safe to use string 'pdfs-cours'.

      const { data, error } = await api.client.storage
        .from('pdfs-cours')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (error) throw error;

      this.updatePdfUploadProgress(80, 'Finalisation...');

      const { data: urlData } = api.client.storage
        .from('pdfs-cours')
        .getPublicUrl(fileName);

      this.currentPdfUrl = urlData.publicUrl;
      document.getElementById('chapitrePdfUrlHidden').value = this.currentPdfUrl;

      this.updatePdfUploadProgress(100, '✅ Upload terminé !');

      // Show Success
      document.getElementById('pdfUploadProgress').classList.add('hidden');
      this.showPdfUploadSuccess(file.name, file.size, this.currentPdfUrl);

    } catch (error) {
      console.error('Erreur upload PDF:', error);
      ui.showNotification(error.message, 'error');
      this.resetPdfInterface();
    } finally {
      this.isUploadingPdf = false;
    }
  }

  updatePdfUploadProgress(percent, message) {
    const bar = document.getElementById('pdfProgressBar');
    const pct = document.getElementById('pdfUploadPercent');
    const status = document.getElementById('pdfUploadStatus');

    if (bar) bar.style.width = percent + '%';
    if (pct) pct.textContent = percent + '%';
    if (status) status.textContent = message;
  }

  showPdfUploadSuccess(fileName, fileSize, url) {
    document.getElementById('pdfUploadedName').textContent = fileName;
    document.getElementById('pdfUploadedSize').textContent = ui.formatFileSize(fileSize);
    document.getElementById('pdfPreviewLink').href = url;
    document.getElementById('pdfUploadSuccess').classList.remove('hidden');
  }

  removePdfUpload() {
    // Logic to remove the *just uploaded* file
    // Optional: Delete from server immediately or wait? 
    // Previous code kept it simple.
    this.currentPdfFile = null;
    this.currentPdfUrl = null;
    document.getElementById('chapitrePdfUrlHidden').value = '';
    document.getElementById('chapitrePdfFile').value = ''; // Reset input

    document.getElementById('pdfUploadSuccess').classList.add('hidden');
    document.getElementById('pdfUploadZone').classList.remove('hidden');
  }

  removeExistingPdfUpload() {
    this.currentPdfUrl = null;
    document.getElementById('chapitrePdfUrlHidden').value = '';
    document.getElementById('pdfExisting').classList.add('hidden');
    document.getElementById('pdfUploadZone').classList.remove('hidden');
  }

  resetPdfInterface() {
    // Réinitialiser l'interface PDF
    this.currentPdfFile = null;
    this.currentPdfUrl = null;
    this.isUploadingPdf = false;

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
    if (this.isUploadingPdf) {
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