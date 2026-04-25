// js/views/dashboard.js
// ========================================
// VUE : DASHBOARD STATISTIQUES (RÉÉCRIT DYNAMIQUE)
// ========================================

import { api } from './api.js';
import { ui } from './ui.js';

export class DashboardView {
    constructor() {
        this.charts = {}; // Stocker les instances Chart.js
        this.refreshInterval = null;
    }

    async render() {
        const container = document.getElementById('dashboardContentArea');
        ui.setPageTitle('Tableau de bord', 'Vue d\'ensemble des statistiques dynamiques');
        ui.showAddButton(false);

        // Skeleton loader
        container.innerHTML = this.renderSkeleton();

        try {
            await this.loadAllData();
        } catch (error) {
            console.error('❌ Erreur chargement dashboard:', error);
            ui.showError(container, 'Impossible de charger les statistiques depuis la base de données');
        }
    }

    renderSkeleton() {
        return `
            <div class="space-y-6 animate-pulse">
                <div class="grid grid-cols-4 gap-6">
                    ${Array(4).fill(0).map(() => `<div class="bg-gray-200 rounded-xl h-32"></div>`).join('')}
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-gray-200 rounded-xl h-80"></div>
                    <div class="bg-gray-200 rounded-xl h-80"></div>
                </div>
            </div>
        `;
    }

    async loadAllData() {
        const container = document.getElementById('dashboardContentArea');

        // Charger toutes les statistiques dynamiquement en parallèle
        const [
            statsGlobales,
            topEtudiants,
            topCours,
            matieresStats
        ] = await Promise.all([
            this.getStatsGlobalesDynamiques(),
            this.getTopEtudiantsDynamique(),
            this.getDerniersCours(),
            this.getMatieresCategories()
        ]);

        container.innerHTML = this.renderDashboard({
            statsGlobales,
            topEtudiants,
            topCours,
        });

        await this.initCharts(statsGlobales, matieresStats);
        if (window.lucide) lucide.createIcons();
        this.startAutoRefresh();
    }

    // --- REQUÊTES DYNAMIQUES SUR LES TABLES ---

    async getCount(table, filters = {}) {
        let query = api.client.from(table).select('id', { count: 'exact', head: true });
        for (const [key, val] of Object.entries(filters)) {
            query = query.eq(key, val);
        }
        const { count, error } = await query;
        if (error) console.error(`Erreur count ${table}:`, error);
        return count || 0;
    }

    async getStatsGlobalesDynamiques() {
        const eleves = await this.getCount('profiles', { type_parcours: 'eleve' });
        const devWeb = await this.getCount('profiles', { type_parcours: 'dev-web' });
        const designers = await this.getCount('profiles', { type_parcours: 'designer' });

        const total_cours = await this.getCount('cours');
        const total_chapitres = await this.getCount('chapitres');
        const total_exercices_qcm = await this.getCount('exercices');
        const total_exercices_code = await this.getCount('exercices_code');
        const total_annales = await this.getCount('annales');
        const total_matieres = await this.getCount('matieres');

        return {
            total_eleves: eleves,
            total_dev: devWeb,
            total_designer: designers,
            total_cours,
            total_chapitres,
            total_exercices_qcm,
            total_exercices_code,
            total_annales,
            total_matieres
        };
    }

    async getTopEtudiantsDynamique() {
        // Obtenir les 5 meilleurs profils d'élèves (basé sur l'ID pour avoir les plus récents en l'absence de points_recompense garantis)
        const { data, error } = await api.client
            .from('profiles')
            .select('nom, email, type_parcours, avatar_url')
            .eq('type_parcours', 'eleve')
            .limit(5);

        if (error) console.warn('Top etudiants error:', error);
        return data || [];
    }

    async getDerniersCours() {
        const { data, error } = await api.client
            .from('cours')
            .select('titre, est_publie')
            .limit(5);

        if (error) console.warn('Derniers cours error:', error);
        return data || [];
    }

    async getMatieresCategories() {
        const matieres = await this.getCount('matieres');
        return { total: matieres };
    }

    renderDashboard(data) {
        const { statsGlobales, topEtudiants, topCours } = data;

        return `
            <!-- KPIs Principaux (Données Réelles) -->
            <div class="grid grid-cols-4 gap-6 mb-6">
                ${this.renderKPI('Étudiants', statsGlobales.total_eleves, 'Inscrits globaux', 'blue', 'users')}
                ${this.renderKPI('Cours', statsGlobales.total_cours, statsGlobales.total_chapitres + ' chapitres', 'green', 'book-open')}
                ${this.renderKPI('Exercices', statsGlobales.total_exercices_qcm + statsGlobales.total_exercices_code, 'QCM + Code', 'purple', 'pencil-line')}
                ${this.renderKPI('Annales', statsGlobales.total_annales, 'Épreuves passées', 'pink', 'library')}
            </div>

            <!-- Graphiques Réels -->
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 class="text-lg font-bold mb-4 text-gray-800">📊 Répartition des Parcours</h3>
                    <div class="h-64 relative">
                        <canvas id="chartRepartitionReal"></canvas>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 class="text-lg font-bold mb-4 text-gray-800">📈 Volume Contenus</h3>
                    <div class="h-64 relative">
                        <canvas id="chartVolumeReal"></canvas>
                    </div>
                </div>
            </div>

            <!-- Listes (Derniers inscrits / Derniers cours) -->
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                        <h3 class="text-lg font-bold">👥 Derniers Étudiants Inscrits</h3>
                    </div>
                    <div class="divide-y divide-gray-200">
                        ${topEtudiants.length > 0
                ? topEtudiants.map(e => this.renderListeItem(e.nom || e.email, e.avatar_url, 'Élève')).join('')
                : '<div class="p-4 text-center text-gray-500">Aucun étudiant</div>'
            }
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="bg-gradient-to-r from-green-600 to-teal-600 p-4 text-white">
                        <h3 class="text-lg font-bold">📚 Derniers Cours Créés</h3>
                    </div>
                    <div class="divide-y divide-gray-200">
                        ${topCours.length > 0
                ? topCours.map(c => this.renderListeItem(c.titre, null, c.est_publie ? 'Publié' : 'Brouillon')).join('')
                : '<div class="p-4 text-center text-gray-500">Aucun cours</div>'
            }
                    </div>
                </div>
            </div>
        `;
    }

    renderKPI(titre, valeur, sousTitre, couleur, icon) {
        const couleurs = {
            blue: 'from-blue-600 to-blue-400',
            green: 'from-green-600 to-green-400',
            purple: 'from-purple-600 to-purple-400',
            pink: 'from-pink-600 to-pink-400'
        };

        return `
            <div class="bg-gradient-to-br ${couleurs[couleur]} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">${titre}</p>
                        <h3 class="text-4xl font-extrabold mt-2">${valeur.toLocaleString()}</h3>
                        <p class="text-sm font-medium opacity-80 mt-2">${sousTitre}</p>
                    </div>
                    <div class="opacity-30">
                        <i data-lucide="${icon}" class="w-16 h-16 stroke-[1.5]"></i>
                    </div>
                </div>
            </div>
        `;
    }

    renderListeItem(titre, avatar, sousTitre) {
        return `
            <div class="p-4 hover:bg-gray-50 transition flex items-center space-x-3">
                ${avatar ? `<img src="${avatar}" class="w-10 h-10 rounded-full" onerror="this.src='https://ui-avatars.com/api/?name=${titre}&background=random'">` : '<div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><i data-lucide="file-text" class="w-5 h-5"></i></div>'}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gray-900 truncate">${titre}</p>
                    <p class="text-xs text-gray-500">${sousTitre}</p>
                </div>
            </div>
        `;
    }

    async initCharts(globalStats, matieresStats) {
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }

        const ctxRep = document.getElementById('chartRepartitionReal');
        if (ctxRep) {
            if (this.charts.repartition) this.charts.repartition.destroy();
            this.charts.repartition = new Chart(ctxRep, {
                type: 'doughnut',
                data: {
                    labels: ['Élèves', 'Dev Web', 'Designers'],
                    datasets: [{
                        data: [globalStats.total_eleves, globalStats.total_dev, globalStats.total_designer],
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    animation: { animateScale: true, animateRotate: true }
                }
            });
        }

        const ctxVol = document.getElementById('chartVolumeReal');
        if (ctxVol) {
            if (this.charts.volume) this.charts.volume.destroy();
            this.charts.volume = new Chart(ctxVol, {
                type: 'bar',
                data: {
                    labels: ['Cours', 'Chapitres', 'Matières', 'Exercices', 'Annales'],
                    datasets: [{
                        label: 'Éléments disponibles',
                        data: [globalStats.total_cours, globalStats.total_chapitres, globalStats.total_matieres, globalStats.total_exercices_qcm + globalStats.total_exercices_code, globalStats.total_annales],
                        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4] } }, x: { grid: { display: false } } },
                    animation: { duration: 1500, easing: 'easeOutQuart' }
                }
            });
        }
    }

    async loadChartJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadAllData();
        }, 60000); // Rafraîchir toutes les 60s
    }

    stopAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = null;
    }

    destroy() {
        this.stopAutoRefresh();
        Object.values(this.charts).forEach(chart => { if (chart) chart.destroy(); });
        this.charts = {};
    }
}

export const dashboardView = new DashboardView();
window.dashboardView = dashboardView;