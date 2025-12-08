// ==========================================
// MATIERES.JS - Gestion des matières
// ==========================================

import { supabase, APP_STATE } from '../config.js';

const Matieres = {
    async load() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">Chargement...</p></div>';
        
        const { data: matieres, error } = await supabase
            .from('matieres')
            .select('*')
            .order('ordre', { ascending: true });
        
        if (error) {
            contentArea.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Erreur: ${error.message}</div>`;
            return;
        }
        
        if (!matieres || matieres.length === 0) {
            contentArea.innerHTML = this.renderEmpty();
            return;
        }
        
        contentArea.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${matieres.map(m => this.renderCard(m)).join('')}
            </div>
        `;
    },
    
    renderEmpty() {
        return `
            <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucune matière</h3>
                <p class="text-gray-500 mb-4">Commencez par créer votre première matière</p>
                <button onclick="window.Matieres.openModal()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                    + Créer une matière
                </button>
            </div>
        `;
    },
    
    renderCard(m) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: ${m.couleur || '#3b82f6'}20;">
                            <svg class="w-6 h-6" style="color: ${m.couleur || '#3b82f6'};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${m.nom}</h3>
                            <span class="inline-block px-2 py-1 text-xs font-semibold rounded" style="background-color: ${m.couleur || '#3b82f6'}20; color: ${m.couleur || '#3b82f6'};">
                                ${m.type_parcours || 'Non défini'}
                            </span>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="window.Matieres.edit(${m.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="window.Matieres.delete(${m.id}, '${m.nom.replace(/'/g, "\\'")}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-3">${m.description || 'Aucune description'}</p>
                <div class="flex items-center text-sm text-gray-500">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                    Ordre: ${m.ordre || 0}
                </div>
            </div>
        `;
    },
    
    openModal(id = null) {
        APP_STATE.editingMatiereId = id;
        const modal = document.getElementById('matiereModal');
        const form = document.getElementById('matiereForm');
        const modalTitle = document.getElementById('modalTitle');
        
        form.reset();
        
        if (id) {
            modalTitle.textContent = 'Modifier la Matière';
            this.loadData(id);
        } else {
            modalTitle.textContent = 'Nouvelle Matière';
        }
        
        modal.classList.remove('hidden');
    },
    
    async loadData(id) {
        const { data } = await supabase
            .from('matieres')
            .select('*')
            .eq('id', id)
            .single();
        
        if (data) {
            document.getElementById('matiereNom').value = data.nom || '';
            document.getElementById('matiereDescription').value = data.description || '';
            document.getElementById('matiereTypeParcours').value = data.type_parcours || '';
            document.getElementById('matiereCouleur').value = data.couleur || '#3b82f6';
            document.getElementById('matiereOrdre').value = data.ordre || 1;
        }
    },
    
    async save(formData) {
        const slug = formData.nom.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const data = { ...formData, slug };
        
        let error;
        if (APP_STATE.editingMatiereId) {
            const result = await supabase
                .from('matieres')
                .update(data)
                .eq('id', APP_STATE.editingMatiereId);
            error = result.error;
        } else {
            const result = await supabase
                .from('matieres')
                .insert([data]);
            error = result.error;
        }
        
        if (error) {
            alert('Erreur: ' + error.message);
            return false;
        }
        
        return true;
    },
    
    async edit(id) {
        this.openModal(id);
    },
    
    async delete(id, nom) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?\n\nCette action est irréversible.`)) {
            return;
        }
        
        const { error } = await supabase
            .from('matieres')
            .delete()
            .eq('id', id);
        
        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            this.load();
        }
    }
};

export default Matieres;