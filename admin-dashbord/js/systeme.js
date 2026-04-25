// js/systeme.js
import { api } from './api.js';
import { ui } from './ui.js';
import { matieresView } from './matieres.js';

export class SystemeView {
    constructor() {
        this.currentTab = 'classes';
        this.editingNiveauId = null;
        this.editingSerieId = null;
    }

    async render() {
        const header = document.getElementById('header-systeme');
        const section = document.getElementById('systemeSection');

        // Cacher les autres headers/sections
        document.querySelectorAll('.section-header').forEach(h => h.style.display = 'none');
        document.querySelectorAll('.main-section').forEach(s => s.style.display = 'none');

        if (header) header.style.display = 'flex';
        if (section) section.style.display = 'block';

        this.switchTab(this.currentTab);
    }

    async switchTab(tab) {
        this.currentTab = tab;

        // Update UI Tabs
        document.querySelectorAll('.systeme-tab').forEach(btn => {
            btn.classList.remove('text-white', 'border-indigo-500');
            btn.classList.add('text-gray-400', 'border-transparent');
        });

        const activeTabBtn = document.getElementById(`tab-${tab}`);
        if (activeTabBtn) {
            activeTabBtn.classList.remove('text-gray-400', 'border-transparent');
            activeTabBtn.classList.add('text-white', 'border-indigo-500');
        }

        // Show/Hide Content
        document.querySelectorAll('.systeme-tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const activeContent = document.getElementById(`${tab}Content`);
        if (activeContent) activeContent.style.display = 'block';

        // Load Data
        if (tab === 'classes') {
            this.loadClasses();
        } else if (tab === 'series') {
            this.loadSeries();
        } else if (tab === 'matieres') {
            matieresView.loadData();
        }
    }

    // ========================================
    // CLASSES (NIVEAUX)
    // ========================================
    async loadClasses() {
        const container = document.getElementById('classesListArea');
        ui.showLoading(container);
        try {
            const data = await api.getNiveaux();
            container.innerHTML = data.map(n => this.renderNiveauCard(n)).join('');
            if (window.lucide) lucide.createIcons();
        } catch (error) {
            ui.showError(container, 'Erreur de chargement des classes');
        }
    }

    renderNiveauCard(n) {
        return `
            <div class="glass-card p-5 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all group">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-xs font-bold text-indigo-400 uppercase mb-1">${n.cycles?.sous_systemes?.nom_fr || 'N/A'}</div>
                        <h4 class="text-lg font-bold text-white">${n.nom_fr}</h4>
                        <div class="text-sm text-gray-500">Code: ${n.code} | Ordre: ${n.ordre}</div>
                        ${n.est_classe_examen ? '<span class="inline-block mt-2 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded uppercase border border-red-500/20">🎯 Classe Examen</span>' : ''}
                    </div>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="systemeView.openNiveauModal('${n.id}')" class="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="systemeView.deleteNiveau('${n.id}', '${n.nom_fr.replace(/'/g, "\\'")}')" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async openNiveauModal(id = null) {
        this.editingNiveauId = id;
        const form = document.getElementById('niveauForm');
        form.reset();
        document.getElementById('niveauId').value = id || '';
        document.getElementById('niveauModalTitle').textContent = id ? 'Modifier la Classe' : 'Ajouter une Classe';

        try {
            const cycles = await api.getCycles();
            const cycleSelect = document.getElementById('niveauCycleCode');
            cycleSelect.innerHTML = cycles.map(c => `<option value="${c.id}">${c.nom_fr} (${c.sous_systemes.nom_fr})</option>`).join('');

            if (id) {
                const n = await api.getNiveauById(id);
                document.getElementById('niveauCodeInput').value = n.code;
                document.getElementById('niveauNomFr').value = n.nom_fr;
                document.getElementById('niveauOrdre').value = n.ordre;
                document.getElementById('niveauEstExamen').value = n.est_classe_examen ? 'true' : 'false';
                document.getElementById('niveauCycleCode').value = n.cycle_id;
            }
        } catch (error) {
            ui.showNotification('Erreur initialisation modal', 'error');
        }

        ui.openModal('niveauModal');
        if (window.lucide) lucide.createIcons();
    }

    async saveNiveau(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            code: formData.get('code'),
            nom_fr: formData.get('nom_fr'),
            ordre: parseInt(formData.get('ordre')) || 0,
            est_classe_examen: formData.get('est_classe_examen') === 'true',
            cycle_id: formData.get('cycle_id')
        };

        try {
            if (this.editingNiveauId) {
                await api.updateNiveau(this.editingNiveauId, data);
            } else {
                await api.createNiveau(data);
            }
            ui.closeModal('niveauModal');
            ui.showNotification('Classe enregistrée', 'success');
            this.loadClasses();
        } catch (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    async deleteNiveau(id, nom) {
        if (!confirm(`Supprimer la classe "${nom}" ?`)) return;
        try {
            await api.deleteNiveau(id);
            ui.showNotification('Classe supprimée', 'success');
            this.loadClasses();
        } catch (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    // ========================================
    // SERIES
    // ========================================
    async loadSeries() {
        const container = document.getElementById('seriesListArea');
        ui.showLoading(container);
        try {
            const data = await api.getSeries();
            container.innerHTML = data.map(s => this.renderSerieCard(s)).join('');
            if (window.lucide) lucide.createIcons();
        } catch (error) {
            ui.showError(container, 'Erreur de chargement des séries');
        }
    }

    renderSerieCard(s) {
        return `
            <div class="glass-card p-5 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all group">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-xs font-bold text-emerald-400 uppercase mb-1">${s.niveaux_scolaires?.nom_fr || 'Classe Inconnue'}</div>
                        <h4 class="text-lg font-bold text-white">${s.nom_court} - ${s.nom_fr}</h4>
                        <div class="text-sm text-gray-500">Code: ${s.code} | Ordre: ${s.ordre}</div>
                    </div>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="systemeView.openSerieModal('${s.id}')" class="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="systemeView.deleteSerie('${s.id}', '${s.nom_fr.replace(/'/g, "\\'")}')" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async openSerieModal(id = null) {
        this.editingSerieId = id;
        const form = document.getElementById('serieForm');
        form.reset();
        document.getElementById('serieId').value = id || '';
        document.getElementById('serieModalTitle').textContent = id ? 'Modifier la Série' : 'Ajouter une Série';

        try {
            const niveaux = await api.getNiveaux();
            const niveauSelect = document.getElementById('serieNiveauId');
            niveauSelect.innerHTML = '<option value="">Sélectionner une classe...</option>' +
                niveaux.map(n => `<option value="${n.id}">${n.nom_fr} (${n.cycles?.sous_systemes?.nom_fr})</option>`).join('');

            if (id) {
                const s = await api.getSerieById(id);
                document.getElementById('serieNiveauId').value = s.niveau_id;
                document.getElementById('serieCodeInput').value = s.code;
                document.getElementById('serieNomCourt').value = s.nom_court;
                document.getElementById('serieNomFr').value = s.nom_fr;
                document.getElementById('serieOrdre').value = s.ordre;
            }
        } catch (error) {
            ui.showNotification('Erreur initialisation modal', 'error');
        }

        ui.openModal('serieModal');
        if (window.lucide) lucide.createIcons();
    }

    async saveSerie(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            niveau_id: formData.get('niveau_id'),
            code: formData.get('code'),
            nom_fr: formData.get('nom_fr'),
            nom_court: formData.get('nom_court'),
            ordre: parseInt(formData.get('ordre')) || 0,
            actif: true
        };

        try {
            if (this.editingSerieId) {
                await api.updateSerie(this.editingSerieId, data);
            } else {
                await api.createSerie(data);
            }
            ui.closeModal('serieModal');
            ui.showNotification('Série enregistrée', 'success');
            this.loadSeries();
        } catch (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    async deleteSerie(id, nom) {
        if (!confirm(`Supprimer la série "${nom}" ?`)) return;
        try {
            await api.deleteSerie(id);
            ui.showNotification('Série supprimée', 'success');
            this.loadSeries();
        } catch (error) {
            ui.showNotification('Erreur: ' + error.message, 'error');
        }
    }
}

export const systemeView = new SystemeView();
window.systemeView = systemeView;
