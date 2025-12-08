// ==========================================
// DASHBOARD.JS - Vue tableau de bord
// ==========================================

import { supabase } from '../config.js';

const Dashboard = {
    async load() {
        const contentArea = document.getElementById('contentArea');
        
        const { count: coursCount } = await supabase.from('cours').select('*', { count: 'exact', head: true });
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: chapitresCount } = await supabase.from('chapitres').select('*', { count: 'exact', head: true });
        const { count: exercicesCount } = await supabase.from('exercices').select('*', { count: 'exact', head: true });
        
        contentArea.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${this.renderStatCard('Cours', coursCount, 'blue', 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z')}
                ${this.renderStatCard('Étudiants', usersCount, 'purple', 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z')}
                ${this.renderStatCard('Chapitres', chapitresCount, 'green', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
                ${this.renderStatCard('Exercices', exercicesCount, 'amber', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4')}
            </div>
        `;
    },
    
    renderStatCard(title, value, color, iconPath) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="p-3 bg-${color}-100 rounded-lg">
                        <svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                        </svg>
                    </div>
                </div>
                <h3 class="text-gray-500 text-sm font-medium">${title}</h3>
                <p class="text-3xl font-bold text-gray-900 mt-2">${value || 0}</p>
            </div>
        `;
    }
};

export default Dashboard;