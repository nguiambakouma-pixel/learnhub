// ==========================================
// CHAPITRES.JS - Gestion des chapitres
// ==========================================

import { supabase, APP_STATE } from '../config.js';

const Chapitres = {
    async load() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">Chargement...</p></div>';
        
        const { data: chapitres, error } = await supabase
            .from('chapitres')
            .select(`
                *,
                matiere:matieres(id, nom, couleur, type_parcours)
            `)
            .order('ordre', { ascending: true });
        
        if (error) {
            contentArea.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Erreur: ${error.message}</div>`;
            return;
        }
        
        if (!chapitres || chapitres.length === 0) {
            contentArea.innerHTML = this.renderEmpty();
            return;
        }
        
        // Grouper par matière
        const groupedByMatiere = {};
        chapitres.forEach(c => {
            const matiereId = c.matiere?.id || 'sans-matiere';
            if (!groupedByMatiere[matiereId]) {
                groupedByMatiere[matiereId] = {
                    matiere: c.matiere,
                    chapitres: []
                };
            }
            groupedByMatiere[matiereId].chapitres.push(c);
        });
        
        let html = '<div class="space-y-8">';
        
        Object.values(groupedByMatiere).forEach(group => {
            if (group.matiere) {
                html += this.renderMatiereGroup(group.matiere, group.chapitres);
            }
        });
        
        html += '</div>';
        contentArea.innerHTML = html;
    },
    
    renderEmpty() {
        return `
            <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucun chapitre</h3>
                <p class="text-gray-500 mb-4">Créez votre premier chapitre</p>
                <button onclick="window.Chapitres.openModal()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                    + Créer un chapitre
                </button>
            </div>
        `;
    },
    
    renderMatiereGroup(matiere, chapitres) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-200" style="background: linear-gradient(135deg, ${matiere.couleur}15 0%, ${matiere.couleur}05 100%);">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: ${matiere.couleur}30;">
                                <svg class="w-6 h-6" style="color: ${matiere.couleur};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${matiere.nom}</h3>
                                <p class="text-sm text-gray-500">${chapitres.length} chapitre${chapitres.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="divide-y divide-gray-200">
                    ${chapitres.map(c => this.renderCard(c)).join('')}
                </div>
            </div>
        `;
    },
    
    renderCard(c) {
        const difficulteColors = {
            'facile': 'bg-green-100 text-green-800',
            'moyen': 'bg-yellow-100 text-yellow-800',
            'difficile': 'bg-red-100 text-red-800'
        };
        
        return `
            <div class="p-6 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                                ${c.ordre}
                            </span>
                            <h4 class="text-lg font-bold text-gray-900">${c.titre}</h4>
                            ${!c.est_publie ? '<span class="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded">Brouillon</span>' : ''}
                            ${c.est_premium ? '<span class="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-600 rounded">Premium</span>' : ''}
                        </div>
                        
                        ${c.description ? `<p class="text-gray-600 text-sm mb-3">${c.description}</p>` : ''}
                        
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <span class="px-2 py-1 rounded ${difficulteColors[c.difficulte] || 'bg-gray-100 text-gray-800'}">
                                ${c.difficulte || 'Non défini'}
                            </span>
                            ${c.duree_estimee ? `
                                <span class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    ${c.duree_estimee} min
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="flex space-x-2 ml-4">
                        <button onclick="window.Chapitres.moveUp(${c.id})" class="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition" title="Monter">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            </svg>
                        </button>
                        <button onclick="window.Chapitres.moveDown(${c.id})" class="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition" title="Descendre">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <button onclick="window.Chapitres.edit(${c.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="window.Chapitres.delete(${c.id}, '${c.titre.replace(/'/g, "\\'")}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    async openModal(id = null) {
        APP_STATE.editingChapitreId = id;
        const modal = document.getElementById('chapitreModal');
        const form = document.getElementById('chapitreForm');
        const modalTitle = document.getElementById('chapitreModalTitle');
        
        form.reset();
        
        await this.loadMatieresSelect();
        
        if (id) {
            modalTitle.textContent = 'Modifier le Chapitre';
            await this.loadData(id);
        } else {
            modalTitle.textContent = 'Nouveau Chapitre';
        }
        
        modal.classList.remove('hidden');
    },
    
    async loadMatieresSelect() {
        const { data: matieres } = await supabase
            .from('matieres')
            .select('id, nom, couleur')
            .order('ordre', { ascending: true });
        
        const select = document.getElementById('chapitreMatiere');
        select.innerHTML = '<option value="">Sélectionner une matière...</option>';
        
        if (matieres) {
            matieres.forEach(m => {
                select.innerHTML += `<option value="${m.id}">${m.nom}</option>`;
            });
        }
    },
    
    async loadData(id) {
        const { data } = await supabase
            .from('chapitres')
            .select('*')
            .eq('id', id)
            .single();
        
        if (data) {
            document.getElementById('chapitreMatiere').value = data.matiere_id || '';
            document.getElementById('chapitreTitre').value = data.titre || '';
            document.getElementById('chapitreDescription').value = data.description || '';
            document.getElementById('chapitreDifficulte').value = data.difficulte || 'moyen';
            document.getElementById('chapitreDuree').value = data.duree_estimee || 30;
            document.getElementById('chapitreOrdre').value = data.ordre || 1;
            document.getElementById('chapitreObjectifs').value = (data.objectifs || []).join('\n');
            document.getElementById('chapitreEstPublie').checked = data.est_publie !== false;
            document.getElementById('chapitreEstPremium').checked = data.est_premium === true;
        }
    },
    
    async save(formData) {
        const slug = formData.titre.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const objectifs = formData.objectifs.split('\n')
            .map(o => o.trim())
            .filter(o => o.length > 0);
        
        const data = {
            matiere_id: parseInt(formData.matiere_id),
            titre: formData.titre,
            slug: slug,
            description: formData.description || null,
            difficulte: formData.difficulte,
            duree_estimee: parseInt(formData.duree_estimee),
            ordre: parseInt(formData.ordre),
            objectifs: objectifs.length > 0 ? objectifs : null,
            est_publie: formData.est_publie,
            est_premium: formData.est_premium
        };
        
        let error;
        if (APP_STATE.editingChapitreId) {
            data.updated_at = new Date().toISOString();
            const result = await supabase
                .from('chapitres')
                .update(data)
                .eq('id', APP_STATE.editingChapitreId);
            error = result.error;
        } else {
            data.created_at = new Date().toISOString();
            const result = await supabase
                .from('chapitres')
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
        await this.openModal(id);
    },
    
    async delete(id, titre) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${titre}" ?\n\nCette action supprimera aussi tous les cours associés.`)) {
            return;
        }
        
        const { error } = await supabase
            .from('chapitres')
            .delete()
            .eq('id', id);
        
        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            this.load();
        }
    },
    
    async moveUp(id) {
        await this.reorder(id, 'up');
    },
    
    async moveDown(id) {
        await this.reorder(id, 'down');
    },
    
    async reorder(chapitreId, direction) {
        const { data: chapitre } = await supabase
            .from('chapitres')
            .select('ordre, matiere_id')
            .eq('id', chapitreId)
            .single();
        
        if (!chapitre) return;
        
        const newOrdre = direction === 'up' ? chapitre.ordre - 1 : chapitre.ordre + 1;
        
        if (newOrdre < 1) return;
        
        const { data: otherChapitre } = await supabase
            .from('chapitres')
            .select('id, ordre')
            .eq('matiere_id', chapitre.matiere_id)
            .eq('ordre', newOrdre)
            .single();
        
        if (!otherChapitre) return;
        
        await supabase.from('chapitres').update({ ordre: newOrdre }).eq('id', chapitreId);
        await supabase.from('chapitres').update({ ordre: chapitre.ordre }).eq('id', otherChapitre.id);
        
        this.load();
    }
};

export default Chapitres;