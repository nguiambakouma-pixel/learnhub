// js/views/dashboard.js
import { api } from '../api.js';
import { ui } from '../ui.js';
import { PARCOURS_CONFIG } from '../config.js';

export class DashboardView {
  async render() {
    ui.setPageTitle('Tableau de bord', 'Vue d\'ensemble');
    ui.showAddButton(false);

    const container = document.getElementById('contentArea');
    
    // Structure HTML du dashboard
    container.innerHTML = `
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer" data-view="matieres">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 mb-1" id="statMatieres">
            <div class="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          </h3>
          <p class="text-sm text-gray-500">Matières</p>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer" data-view="chapitres">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 mb-1" id="statChapitres">
            <div class="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          </h3>
          <p class="text-sm text-gray-500">Chapitres</p>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer" data-view="cours">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 mb-1" id="statCours">
            <div class="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          </h3>
          <p class="text-sm text-gray-500">Cours</p>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer" data-view="utilisateurs">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </div>
          <h3 class="text-3xl font-bold text-gray-900 mb-1" id="statUtilisateurs">
            <div class="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          </h3>
          <p class="text-sm text-gray-500">Utilisateurs</p>
        </div>
      </div>

      <!-- Details Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Matières récentes -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              Matières récentes
            </h3>
            <button data-view="matieres" class="text-sm text-blue-600 hover:text-blue-800 font-semibold">
              Voir tout →
            </button>
          </div>
          <div id="recentMatieres">
            <div class="space-y-3">
              <div class="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
              <div class="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
              <div class="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- Répartition par parcours -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Répartition par parcours
          </h3>
          <div id="statsParParcours">
            <div class="space-y-3">
              <div class="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
              <div class="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chapitres récents -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Derniers chapitres créés
          </h3>
          <button data-view="chapitres" class="text-sm text-blue-600 hover:text-blue-800 font-semibold">
            Voir tout →
          </button>
        </div>
        <div id="recentChapitres">
          <div class="space-y-3">
            <div class="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
            <div class="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
            <div class="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
          </div>
        </div>
      </div>

      <!-- Statistiques utilisateurs -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          Utilisateurs par type de parcours
        </h3>
        <div id="statsUtilisateurs" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          <div class="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          <div class="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        </div>
      </div>
    `;

    // Add event listeners for navigation
    container.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', () => {
        window.app.router.navigate(el.dataset.view);
      });
    });

    // Load data
    await this.loadData();
  }

  async loadData() {
    try {
      // Load main stats
      const stats = await api.getStats();
      document.getElementById('statMatieres').textContent = stats.matieres;
      document.getElementById('statChapitres').textContent = stats.chapitres;
      document.getElementById('statCours').textContent = stats.cours;
      document.getElementById('statUtilisateurs').textContent = stats.utilisateurs;

      // Load recent matieres
      const matieres = await api.getMatieres();
      this.renderRecentMatieres(matieres.slice(0, 5));

      // Load parcours distribution
      this.renderParcoursDistribution(matieres);

      // Load recent chapitres
      const chapitres = await api.getChapitres();
      this.renderRecentChapitres(chapitres.slice(0, 5));

      // Load user stats
      const users = await api.getUtilisateurs();
      this.renderUserStats(users);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      ui.showNotification('Erreur lors du chargement des données', 'error');
    }
  }

  renderRecentMatieres(matieres) {
    const container = document.getElementById('recentMatieres');
    if (!matieres || matieres.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Aucune matière pour le moment</p>';
      return;
    }

    container.innerHTML = matieres.map(m => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer mb-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${m.couleur}20;">
            <div class="w-5 h-5 rounded" style="background-color: ${m.couleur};"></div>
          </div>
          <div>
            <p class="font-semibold text-gray-900">${m.nom}</p>
            <p class="text-xs text-gray-500">${PARCOURS_CONFIG[m.type_parcours]?.label || m.type_parcours}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-gray-900">${m.chapitres?.[0]?.count || 0}</p>
          <p class="text-xs text-gray-500">chapitres</p>
        </div>
      </div>
    `).join('');
  }

  renderParcoursDistribution(matieres) {
    const container = document.getElementById('statsParParcours');
    const distribution = {};
    
    matieres.forEach(m => {
      distribution[m.type_parcours] = (distribution[m.type_parcours] || 0) + 1;
    });

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    if (total === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Aucune donnée</p>';
      return;
    }

    const colorMap = {
      'eleve': { bg: 'bg-blue-100', text: 'text-blue-800', bar: 'bg-blue-500' },
      'dev-web': { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' },
      'designer': { bg: 'bg-purple-100', text: 'text-purple-800', bar: 'bg-purple-500' },
      'commun': { bg: 'bg-gray-100', text: 'text-gray-800', bar: 'bg-gray-500' }
    };

    container.innerHTML = Object.entries(distribution).map(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(0);
      const colors = colorMap[type] || colorMap.commun;
      const label = PARCOURS_CONFIG[type]?.label || type;

      return `
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm font-semibold">${label}</span>
            <span class="text-xl font-bold text-gray-900">${count}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="${colors.bar} h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderRecentChapitres(chapitres) {
    const container = document.getElementById('recentChapitres');
    if (!chapitres || chapitres.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Aucun chapitre pour le moment</p>';
      return;
    }

    container.innerHTML = chapitres.map(c => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer mb-3">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-1">
            <span class="px-2 py-1 text-xs font-semibold rounded" style="background-color: ${c.matieres?.couleur}20; color: ${c.matieres?.couleur};">
              ${c.matieres?.nom || 'N/A'}
            </span>
            ${c.est_publie ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Publié</span>' : '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Brouillon</span>'}
          </div>
          <p class="font-semibold text-gray-900">${c.titre}</p>
          <p class="text-xs text-gray-500 mt-1">📊 ${c.difficulte} • ⏱️ ${c.duree_estimee || 0} min</p>
        </div>
      </div>
    `).join('');
  }

  renderUserStats(users) {
    const container = document.getElementById('statsUtilisateurs');
    
    if (!users || users.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4 col-span-3">Aucun utilisateur pour le moment</p>';
      return;
    }

    const usersByType = {};
    users.forEach(u => {
      if (u.type_parcours) {
        usersByType[u.type_parcours] = (usersByType[u.type_parcours] || 0) + 1;
      }
    });

    const userColors = {
      'eleve': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      'dev-web': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
      'designer': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' }
    };

    const userLabels = {
      'eleve': '🎓 Élèves',
      'dev-web': '💻 Développeurs',
      'designer': '🎨 Designers'
    };

    container.innerHTML = Object.entries(usersByType).map(([type, count]) => {
      const color = userColors[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' };
      return `
        <div class="p-6 ${color.bg} border-2 ${color.border} rounded-lg">
          <p class="text-sm text-gray-600 mb-2">${userLabels[type] || type}</p>
          <p class="text-3xl font-bold ${color.text}">${count}</p>
        </div>
      `;
    }).join('');

    if (Object.keys(usersByType).length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4 col-span-3">Aucun utilisateur pour le moment</p>';
    }
  }
}

export const dashboardView = new DashboardView();