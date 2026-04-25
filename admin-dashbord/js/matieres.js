// js/matieres.js
// ========================================
// VUE : GESTION DES MATIÈRES
// ========================================

import { api } from './api.js';
import { ui } from './ui.js';

export class MatieresView {
    constructor() {
        this.editingId = null;
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    generateSlug(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD') // Séparer les lettres des accents
            .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
            .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
            .replace(/^-+|-+$/g, ''); // Supprimer les tirets au début et à la fin
    }

    // ========================================
    // CHARGEMENT CLASSES POUR MODAL
    // ========================================
    async loadNiveauxForModal(sousSystemeId, selectedNiveauId = null) {
        const nivSelect = document.getElementById('matiereNiveau');
        if (!nivSelect) return;

        if (!sousSystemeId) {
            nivSelect.innerHTML = '<option value="">Toutes les classes</option>';
            return;
        }

        try {
            // Un peu hacké car api.js n'a pas de filtre simple, mais on peut utiliser le client directement ou rajouter une méthode
            const { data: cycles } = await api.client.from('cycles').select('id').eq('sous_systeme_id', sousSystemeId);
            const cycleIds = (cycles || []).map(c => c.id);

            const { data: niveaux } = await api.client.from('niveaux_scolaires')
                .select('id, nom_fr, nom_court')
                .in('cycle_id', cycleIds)
                .order('ordre');

            nivSelect.innerHTML = '<option value="">Toutes les classes</option>' +
                (niveaux || []).map(n => `<option value="${n.id}">${n.nom_fr}</option>`).join('');

            if (selectedNiveauId) {
                nivSelect.value = selectedNiveauId;
                await this.loadSeriesForModal(selectedNiveauId);
            }
        } catch (e) {
            console.error("Erreur chargement niveaux pour modal:", e);
        }
    }

    // ========================================
    // CHARGEMENT SÉRIES POUR MODAL
    // ========================================
    async loadSeriesForModal(niveauId, selectedSerieId = null) {
        const serSelect = document.getElementById('matiereSerie');
        if (!serSelect) return;

        if (!niveauId) {
            serSelect.innerHTML = '<option value="">Toutes les séries</option>';
            return;
        }

        try {
            const { data: series } = await api.client.from('series_specialites')
                .select('id, nom_fr, nom_court')
                .eq('niveau_id', niveauId)
                .order('ordre');

            serSelect.innerHTML = '<option value="">Toutes les séries</option>' +
                (series || []).map(s => `<option value="${s.id}">${s.nom_fr}</option>`).join('');

            if (selectedSerieId) serSelect.value = selectedSerieId;
        } catch (e) {
            console.error("Erreur chargement séries pour modal:", e);
        }
    }

    // ========================================
    // RENDER PRINCIPAL
    // ========================================
    async render() {
        const container = document.getElementById('matieresContentArea');
        if (!container) return;

        // On s'assure que le header est visible
        document.querySelectorAll('.section-header').forEach(h => h.style.display = 'none');
        const header = document.getElementById('header-matieres');
        if (header) header.style.display = 'flex';

        ui.showLoading(container);

        try {
            await this.loadData();
        } catch (error) {
            console.error('❌ Erreur chargement matières:', error);
            ui.showError(container, 'Impossible de charger les matières');
        }
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    async loadData() {
        const container = document.getElementById('matieresContentArea');

        const data = await api.getMatieres();

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="mb-4 flex justify-center opacity-20"><i data-lucide="book-open" class="w-16 h-16"></i></div>
                    <h3 class="text-xl font-semibold text-white mb-2">Aucune matière</h3>
                    <p class="mb-6">Commencez par créer votre première matière</p>
                    <button onclick="matieresView.openModal()" 
                        class="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i> Créer une matière
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(m => this.renderCard(m)).join('');
        if (window.lucide) lucide.createIcons();
    }

    // ========================================
    // RENDER : CARTE DE MATIÈRE
    // ========================================
    renderCard(m) {
        const parcoursLabels = {
            'eleve': '<i data-lucide="graduation-cap" class="w-3.5 h-3.5"></i> Éducation',
            'dev-web': '<i data-lucide="code-2" class="w-3.5 h-3.5"></i> Dev Web',
            'designer': '<i data-lucide="palette" class="w-3.5 h-3.5"></i> Design'
        };

        const sysLabel = m.sous_systemes ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${m.sous_systemes.code === 'francophone' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}">${m.sous_systemes.code === 'francophone' ? 'FR' : 'EN'}</span>` : '';
        const nivLabel = m.niveaux_scolaires ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-400">${m.niveaux_scolaires.nom_court || m.niveaux_scolaires.nom_fr}</span>` : '';
        const serLabel = m.series_specialites ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400">${m.series_specialites.nom_court || m.series_specialites.nom_fr}</span>` : '';

        return `
            <div class="glass-card rounded-2xl p-6 relative group overflow-hidden animate-slide-in">
                <div class="absolute top-0 left-0 w-1 h-full" style="background: ${m.couleur || '#6366F1'};"></div>
                
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5" 
                             style="color: ${m.couleur || '#6366F1'}; border: 1px solid ${m.couleur}40;">
                            ${m.icone_url && m.icone_url.length < 5 ? m.icone_url : '<i data-lucide="book-open" class="w-6 h-6"></i>'}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-lg font-bold text-white">${m.nom}</h4>
                                ${sysLabel}
                                ${nivLabel}
                                ${serLabel}
                            </div>
                            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                ${parcoursLabels[m.type_parcours] || m.type_parcours}
                            </div>
                        </div>
                    </div>

                    <div class="flex space-x-1">
                        <button onclick="matieresView.openModal('${m.id}')" 
                                class="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition flex items-center justify-center" 
                                title="Modifier">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                        <button onclick="matieresView.delete('${m.id}', '${m.nom.replace(/'/g, "\\'")}')" 
                                class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center justify-center" 
                                title="Supprimer">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <div class="mt-6 flex items-center justify-between text-sm">
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-400">Ordre:</span>
                        <span class="font-bold text-white">${m.ordre || 0}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-400">Chapitres:</span>
                        <span class="font-bold text-emerald-400">${m.chapitres && m.chapitres[0] ? m.chapitres[0].count : 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================================
    // MODAL : OUVERTURE
    // ========================================
    async openModal(id = null) {
        this.editingId = id;
        const form = document.getElementById('matiereForm');
        if (form) form.reset();

        document.getElementById('matiereModalTitle').textContent =
            id ? 'Modifier la Matière' : 'Nouvelle Matière';

        // Charger les sous-systèmes
        try {
            const ssList = await api.getSousSystemes();
            const ssSelect = document.getElementById('matiereSousSysteme');
            if (ssSelect) {
                ssSelect.innerHTML = '<option value="">Tous les sous-systèmes</option>' +
                    ssList.map(ss => `<option value="${ss.id}">${ss.nom_fr}</option>`).join('');
            }
        } catch (e) { console.error("Erreur chargement sous-systèmes:", e); }

        if (id) {
            try {
                const data = await api.getMatiereById(id);
                document.getElementById('matiereNom').value = data.nom || '';
                document.getElementById('matiereCouleur').value = data.couleur || '#6366F1';
                document.getElementById('matiereCouleurPicker').value = data.couleur || '#6366F1';
                document.getElementById('matiereOrdre').value = data.ordre || 0;
                document.getElementById('matiereTypeParcours').value = data.type_parcours || 'eleve';
                document.getElementById('matiereIcone').value = data.icone_url || '';
                if (document.getElementById('matiereSousSysteme')) {
                    document.getElementById('matiereSousSysteme').value = data.sous_systeme_id || '';
                    if (data.sous_systeme_id) {
                        await this.loadNiveauxForModal(data.sous_systeme_id, data.niveau_id);
                        if (data.niveau_id && document.getElementById('matiereSerie')) {
                            await this.loadSeriesForModal(data.niveau_id, data.serie_id);
                        }
                    }
                }
                if (document.getElementById('matiereNiveau') && data.niveau_id && !data.sous_systeme_id) {
                    document.getElementById('matiereNiveau').value = data.niveau_id;
                    await this.loadSeriesForModal(data.niveau_id, data.serie_id);
                }
            } catch (error) {
                console.error('Erreur chargement matière:', error);
                ui.showNotification('Erreur de chargement', 'error');
                return;
            }
        } else {
            document.getElementById('matiereCouleur').value = '#6366F1';
            document.getElementById('matiereCouleurPicker').value = '#6366F1';
        }

        ui.openModal('matiereModal');
        if (window.lucide) lucide.createIcons();
    }

    // ========================================
    // SAUVEGARDE
    // ========================================
    async save(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const nomMatiere = formData.get('nom');
        const data = {
            nom: nomMatiere,
            slug: this.generateSlug(nomMatiere),
            couleur: formData.get('couleur'),
            ordre: parseInt(formData.get('ordre')) || 0,
            type_parcours: formData.get('type_parcours'),
            icone_url: formData.get('icone_url') || null,
            sous_systeme_id: formData.get('sous_systeme_id') || null,
            niveau_id: formData.get('niveau_id') || null,
            serie_id: formData.get('serie_id') || null
        };

        try {
            if (this.editingId) {
                await api.updateMatiere(this.editingId, data);
                ui.showNotification('Matière mise à jour', 'success');
            } else {
                await api.createMatiere(data);
                ui.showNotification('Matière créée', 'success');
            }

            ui.closeModal('matiereModal');
            this.render();
            // Recharger les stats globales car le nombre de matières a changé
            if (window.DataLoader) window.DataLoader.loadGlobalStats();
        } catch (error) {
            console.error('Erreur sauvegarde matière:', error);
            ui.showNotification('❌ Erreur: ' + error.message, 'error');
        }
    }

    // ========================================
    // SUPPRESSION
    // ========================================
    async delete(id, nom) {
        if (!confirm(`Supprimer la matière "${nom}" ?\n\nAttention: Cela peut casser le lien avec les chapitres existants.`)) {
            return;
        }

        try {
            await api.deleteMatiere(id);
            ui.showNotification('Matière supprimée', 'success');
            this.render();
            if (window.DataLoader) window.DataLoader.loadGlobalStats();
        } catch (error) {
            console.error('Erreur suppression matière:', error);
            ui.showNotification('❌ Erreur: ' + error.message, 'error');
        }
    }
}

export const matieresView = new MatieresView();
window.matieresView = matieresView;
