// ==========================================
// UTILISATEURS.JS - Gestion des utilisateurs
// ==========================================

import { supabase } from '../config.js';

const Utilisateurs = {
    async load() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">Chargement...</p></div>';
        
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            contentArea.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Erreur: ${error.message}</div>`;
            return;
        }
        
        if (!users || users.length === 0) {
            contentArea.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">Aucun utilisateur</p></div>';
            return;
        }
        
        contentArea.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parcours</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Niveau</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Inscription</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map(u => this.renderRow(u)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    renderRow(u) {
        const parcoursColors = {
            'eleve': 'bg-blue-100 text-blue-800',
            'dev-web': 'bg-green-100 text-green-800',
            'designer': 'bg-purple-100 text-purple-800'
        };
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold text-sm">${(u.nom || 'U').charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-semibold text-gray-900">${u.nom || 'Sans nom'}</div>
                            <div class="text-sm text-gray-500">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded ${parcoursColors[u.type_parcours] || 'bg-gray-100 text-gray-800'}">
                        ${u.type_parcours || 'Non défini'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${u.niveau_actuel || 'Non défini'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${u.points_total || 0} pts
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
            </tr>
        `;
    }
};

export default Utilisateurs;