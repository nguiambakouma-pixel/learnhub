// js/views/annales.js
// ========================================
// VUE : GESTION DES ANNALES D'EXAMENS
// ========================================
// Permet de gérer les annales (BEPC, BAC, GCE, etc.)
// avec upload de sujets et corrections

import { api } from './api.js';
import { ui } from './ui.js';

export class AnnalesView {
    constructor() {
        this.editingId = null;
        this.currentFilters = {
            type_examen: null,
            annee: null,
            matiere_id: null,
            serie_id: null,
            niveau_id: null
        };
    }

    // ========================================
    // RENDER PRINCIPAL
    // ========================================
    async render() {
        const container = document.getElementById('annalesContentArea');
        ui.setPageTitle('Annales d\'Examens', 'Gestion des sujets et corrections');
        ui.showAddButton(true);
        ui.showLoading(container);

        try {
            await this.loadData();
        } catch (error) {
            console.error('❌ Erreur chargement annales:', error);
            ui.showError(container, 'Impossible de charger les annales');
        }
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    async loadData() {
        const container = document.getElementById('annalesContentArea');

        // Récupérer toutes les annales avec leurs relations
        const { data: annales, error } = await api.client
            .from('annales')
            .select(`
                *,
                matiere:matieres(id, nom, couleur),
                niveau:niveaux_scolaires(id, nom_fr, nom_en),
                serie:series_specialites(id, nom_fr, nom_en),
                sous_systeme:sous_systemes(id, nom_fr, nom_en)
            `)
            .order('annee', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            ui.showError(container, error.message);
            return;
        }

        if (!annales || annales.length === 0) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Afficher avec filtres
        container.innerHTML = this.renderWithFilters(annales);
    }

    // ========================================
    // RENDER : ÉTAT VIDE
    // ========================================
    renderEmpty() {
        return `
            <div class="text-center py-12 text-gray-500">
                <div class="mb-4 flex justify-center opacity-20"><i data-lucide="library" class="w-16 h-16"></i></div>
                <h3 class="text-xl font-semibold text-white mb-2">Aucune annale</h3>
                <p class="mb-6">Ajoutez votre première annale d'examen</p>
                <button onclick="annalesView.openModal()" 
                    class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i> Ajouter une annale
                </button>
            </div>
        `;
    }

    // ========================================
    // RENDER : AVEC FILTRES
    // ========================================
    renderWithFilters(annales) {
        // Grouper par année
        const groupedByYear = {};
        annales.forEach(a => {
            if (!groupedByYear[a.annee]) {
                groupedByYear[a.annee] = [];
            }
            groupedByYear[a.annee].push(a);
        });

        return `
            <!-- Filtres -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i data-lucide="search" class="w-5 h-5 text-purple-600"></i> Filtres
                </h3>
                <div class="grid grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Type d'examen</label>
                        <select id="filterTypeExamen" onchange="annalesView.applyFilters()" 
                            class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none">
                            <option value="">Tous</option>
                            <option value="bepc">BEPC</option>
                            <option value="probatoire">Probatoire</option>
                            <option value="bac">BAC</option>
                            <option value="gce_olevel">GCE O-Level</option>
                            <option value="gce_alevel">GCE A-Level</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Année</label>
                        <select id="filterAnnee" onchange="annalesView.applyFilters()" 
                            class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none">
                            <option value="">Toutes</option>
                            ${this.getYearsOptions()}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Cours</label>
                        <select id="filterMatiere" onchange="annalesView.applyFilters()" 
                            class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none">
                            <option value="">Tous</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="annalesView.resetFilters()" 
                            class="w-full py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <!-- Liste groupée par année -->
            <div class="space-y-6">
                ${Object.keys(groupedByYear).sort((a, b) => b - a).map(year => `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                            <h3 class="text-xl font-bold flex items-center gap-2">
                                <i data-lucide="calendar" class="w-6 h-6"></i> Année ${year}
                            </h3>
                            <p class="text-sm opacity-90">${groupedByYear[year].length} annale(s)</p>
                        </div>
                        <div class="divide-y divide-gray-200">
                            ${groupedByYear[year].map(a => this.renderCard(a)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return html;
    }

    // ========================================
    // RENDER : CARTE D'ANNALE
    // ========================================
    renderCard(annale) {
        const typeIcons = {
            'bepc': 'book',
            'probatoire': 'book-open',
            'bac': 'graduation-cap',
            'gce_olevel': 'languages',
            'gce_alevel': 'award',
            'cep': 'pencil',
            'concours': 'target'
        };

        const typeLabels = {
            'bepc': 'BEPC',
            'probatoire': 'Probatoire',
            'bac': 'BAC',
            'gce_olevel': 'GCE O-Level',
            'gce_alevel': 'GCE A-Level',
            'cep': 'CEP',
            'concours': 'Concours'
        };

        const difficulteIcons = {
            'facile': '<div class="flex gap-0.5 text-orange-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>',
            'moyen': '<div class="flex gap-0.5 text-orange-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>',
            'difficile': '<div class="flex gap-0.5 text-orange-400"><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i><i data-lucide="star" class="w-3 h-3 fill-current"></i></div>'
        };

        const couleur = annale.matiere?.couleur || '#9333ea';

        return `
            <div class="p-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-start space-x-4">
                            <!-- Icône -->
                            <div class="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl" 
                                 style="background: ${couleur}20; color: ${couleur};">
                                <i data-lucide="${typeIcons[annale.type_examen] || 'library'}" class="w-6 h-6"></i>
                            </div>

                            <!-- Contenu -->
                            <div class="flex-1 min-w-0">
                                <h4 class="text-base font-bold text-gray-900 mb-1">${annale.titre}</h4>
                                
                                ${annale.description ?
                `<p class="text-sm text-gray-600 mb-2 line-clamp-2">${annale.description}</p>`
                : ''}

                                <!-- Tags -->
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                        ${typeLabels[annale.type_examen] || annale.type_examen}
                                    </span>
                                    
                                    ${annale.matiere ?
                `<span class="px-2 py-1 rounded text-xs font-semibold" 
                                               style="background: ${couleur}20; color: ${couleur};">
                                            ${annale.matiere.nom}
                                        </span>`
                : ''}
                                    
                                    ${annale.serie ?
                `<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                            ${annale.serie.nom_fr}
                                        </span>`
                : ''}
                                    
                                    ${annale.session ?
                `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                            ${annale.session.charAt(0).toUpperCase() + annale.session.slice(1)}
                                        </span>`
                : ''}
                                    
                                    ${annale.difficulte ?
                `<span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                                            ${difficulteIcons[annale.difficulte] || annale.difficulte}
                                        </span>`
                : ''}
                                    
                                    ${annale.duree_examen ?
                `<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                                            <i data-lucide="clock" class="w-3 h-3"></i> ${annale.duree_examen} min
                                        </span>`
                : ''}
                                    
                                    ${annale.bareme_total ?
                `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold flex items-center gap-1">
                                            <i data-lucide="target" class="w-3 h-3"></i> /${annale.bareme_total}
                                        </span>`
                : ''}
                                    
                                    ${annale.sujet_pdf_url ?
                '<span class="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-semibold">📄 Sujet</span>'
                : ''}
                                    
                                    ${annale.correction_pdf_url ?
                '<span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">✅ Correction</span>'
                : ''}
                                    
                                    ${annale.Corrige_video_url ?
                '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1"><i data-lucide="video" class="w-3 h-3"></i> Vidéo</span>'
                : ''}
                                    
                                    ${!annale.est_publie ?
                '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Brouillon</span>'
                : ''}
                                    
                                    ${!annale.est_gratuit ?
                '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">💎 Premium</span>'
                : ''}
                                </div>

                                <!-- Statistiques -->
                                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span class="flex items-center gap-1"><i data-lucide="eye" class="w-3 h-3"></i> ${annale.nombre_vues || 0}</span>
                                    <span class="flex items-center gap-1"><i data-lucide="download" class="w-3 h-3"></i> ${annale.nombre_telechargements || 0}</span>
                                    ${annale.note_moyenne ?
                `<span class="flex items-center gap-1"><i data-lucide="star" class="w-3 h-3"></i> ${annale.note_moyenne}/20</span>`
                : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="flex space-x-2 ml-4 flex-shrink-0">
                        <button onclick="annalesView.edit('${annale.id}')" 
                                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                        <button onclick="annalesView.deleteAnnale('${annale.id}', '${annale.titre.replace(/'/g, "\\'")}')" 
                                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    getYearsOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let year = currentYear; year >= 2000; year--) {
            options += `<option value="${year}">${year}</option>`;
        }
        return options;
    }

    async applyFilters() {
        // TODO: Implémenter le filtrage
        console.log('Filtres appliqués');
        await this.loadData();
    }

    async resetFilters() {
        document.getElementById('filterTypeExamen').value = '';
        document.getElementById('filterAnnee').value = '';
        document.getElementById('filterMatiere').value = '';
        this.currentFilters = { type_examen: null, annee: null, matiere_id: null, serie_id: null, niveau_id: null };
        await this.loadData();
    }

    // ========================================
    // MODAL : OUVERTURE
    // ========================================
    async openModal(id = null) {
        console.log('📚 Opening annale modal, id:', id);
        this.editingId = id;
        ui.openModal('annaleModal');

        const form = document.getElementById('annaleForm');
        if (form) form.reset();

        document.getElementById('annaleModalTitle').textContent =
            id ? 'Modifier l\'annale' : 'Nouvelle annale';

        await this.loadMatiereOptions();
        await this.loadSerieOptions();
        await this.loadNiveauOptions();

        if (id) {
            await this.loadAnnaleData(id);
        }
        if (window.lucide) lucide.createIcons();
    }

    closeModal() {
        ui.closeModal('annaleModal');
    }

    // ========================================
    // CHARGER OPTIONS
    // ========================================
    async loadMatiereOptions() {
        const select = document.getElementById('annaleMatiere');
        if (!select) return;

        const { data: matieres } = await api.client
            .from('matieres')
            .select('id, nom')
            .order('nom');

        select.innerHTML = '<option value="">Sélectionner un cours...</option>';
        if (matieres) {
            matieres.forEach(m => {
                select.innerHTML += `<option value="${m.id}">${m.nom}</option>`;
            });
        }
    }

    async loadNiveauOptions() {
        const select = document.getElementById('annaleClasse');
        if (!select) return;

        const { data: niveaux } = await api.client
            .from('niveaux_scolaires')
            .select('id, nom_fr')
            .order('ordre');

        select.innerHTML = '<option value="">Sélectionner une classe...</option>';
        if (niveaux) {
            niveaux.forEach(n => {
                select.innerHTML += `<option value="${n.id}">${n.nom_fr}</option>`;
            });
        }
    }

    async loadSerieOptions() {
        const select = document.getElementById('annaleSerie');
        if (!select) return;

        const { data: series } = await api.client
            .from('series_specialites')
            .select('id, nom_fr')
            .order('nom_fr');

        select.innerHTML = '<option value="">Sélectionner une série...</option>';
        if (series) {
            series.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.nom_fr}</option>`;
            });
        }
    }

    // ========================================
    // CHARGER DONNÉES ANNALE
    // ========================================
    async loadAnnaleData(id) {
        const { data, error } = await api.client
            .from('annales')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            ui.showNotification('Impossible de charger l\'annale', 'error');
            return;
        }

        // Remplir le formulaire
        document.getElementById('annaleTitre').value = data.titre || '';
        document.getElementById('annaleType').value = data.type_examen || '';
        document.getElementById('annaleAnnee').value = data.annee || '';
        document.getElementById('annaleSession').value = data.session || '';
        document.getElementById('annaleMatiere').value = data.matiere_id || '';
        document.getElementById('annaleSerie').value = data.serie_id || '';
        document.getElementById('annaleClasse').value = data.niveau_id || '';
        document.getElementById('annaleDescription').value = data.description || '';
        document.getElementById('annaleDuree').value = data.duree_examen || '';
        document.getElementById('annaleBareme').value = data.bareme_total || '';
        document.getElementById('annaleDifficulte').value = data.difficulte || '';
        document.getElementById('annaleSource').value = data.source || '';
        document.getElementById('annaleEstPublie').checked = data.est_publie !== false;
        document.getElementById('annaleEstGratuit').checked = data.est_gratuit !== false;
        document.getElementById('annaleEstOfficiel').checked = data.est_officiel !== false;
    }

    // ========================================
    // SAUVEGARDE
    // ========================================
    async save(e) {
        e.preventDefault();
        console.log('💾 Save annale triggered');

        // 1. Gestion des uploads de fichiers
        const sujetFile = document.getElementById('annaleSujetFile').files[0];
        const correctionFile = document.getElementById('annaleCorrectionFile').files[0];

        // Indicateur de chargement visuel dans le bouton
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Envoi en cours...';

        const annaleData = {
            titre: document.getElementById('annaleTitre').value.trim(),
            type_examen: document.getElementById('annaleType').value,
            annee: parseInt(document.getElementById('annaleAnnee').value),
            session: document.getElementById('annaleSession').value || null,
            matiere_id: parseInt(document.getElementById('annaleMatiere').value) || null,
            serie_id: document.getElementById('annaleSerie').value || null,
            niveau_id: document.getElementById('annaleClasse').value || null,
            description: document.getElementById('annaleDescription').value.trim() || null,
            duree_examen: parseInt(document.getElementById('annaleDuree').value) || null,
            bareme_total: parseInt(document.getElementById('annaleBareme').value) || 20,
            difficulte: document.getElementById('annaleDifficulte').value || null,
            source: document.getElementById('annaleSource').value.trim() || null,
            est_publie: document.getElementById('annaleEstPublie').checked,
            est_gratuit: document.getElementById('annaleEstGratuit').checked,
            est_officiel: document.getElementById('annaleEstOfficiel').checked
        };

        try {
            // 2. Upload des fichiers si présents
            if (sujetFile) {
                ui.showNotification('⏳ Upload du sujet...', 'info');
                const bucket = CONFIG.storage.pdfs.bucket;
                const safeName = sujetFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const sujetPath = await api.uploadFile(bucket, sujetFile, `annales/sujets/${Date.now()}_${safeName}`);
                annaleData.sujet_pdf_url = api.getPublicUrl(bucket, sujetPath);
            }
            if (correctionFile) {
                ui.showNotification('⏳ Upload de la correction...', 'info');
                const bucket = CONFIG.storage.pdfs.bucket;
                const safeName = correctionFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const corrPath = await api.uploadFile(bucket, correctionFile, `annales/corrections/${Date.now()}_${safeName}`);
                annaleData.correction_pdf_url = api.getPublicUrl(bucket, corrPath);
            }

            // 3. Sauvegarde en base de données
            if (this.editingId) {
                const { error } = await api.client
                    .from('annales')
                    .update(annaleData)
                    .eq('id', this.editingId);

                if (error) throw error;
                ui.showNotification('Annale modifiée avec succès!', 'success');
            } else {
                const { error } = await api.client
                    .from('annales')
                    .insert([annaleData]);

                if (error) throw error;
                ui.showNotification('Annale créée avec succès!', 'success');
            }

            ui.closeModal('annaleModal');
            await this.loadData();

        } catch (error) {
            console.error('❌ Save error:', error);
            ui.showNotification('❌ Erreur: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
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
    async deleteAnnale(id, titre) {
        const confirmed = await ui.confirm(
            `Supprimer l'annale "${titre}" ?\n\nTous les téléchargements et tentatives seront également supprimés.`,
            'Confirmation'
        );

        if (!confirmed) return;

        try {
            const { error } = await api.client
                .from('annales')
                .delete()
                .eq('id', id);

            if (error) throw error;

            ui.showNotification('Annale supprimée!', 'success');
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
export const annalesView = new AnnalesView();
window.annalesView = annalesView;