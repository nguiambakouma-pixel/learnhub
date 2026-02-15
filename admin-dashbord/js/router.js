// js/router.js
import { dashboardView } from './views/dashboard.js';
import { matieresView } from './views/matieres.js';
import { chapitresView } from './views/chapitres.js';
import { coursView } from './views/cours.js';
import { exercicesView } from './views/exercices.js';
import { utilisateursView } from './views/utilisateurs.js';
import { exercicesCodeView } from './views/exercices-code.js';

export class Router {
  constructor() {
    this.currentView = null;
    this.views = {
      dashboard: dashboardView,
      matieres: matieresView,
      chapitres: chapitresView,
      cours: coursView,
      exercices: exercicesView,
      'exercices-code': exercicesCodeView, // NOUVEAU
      utilisateurs: utilisateursView
    };
  }
  async navigate(viewName) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('sidebar-active');
    });

    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
      activeLink.classList.add('sidebar-active');
    }

    // Load view
    this.currentView = viewName;
    const view = this.views[viewName];

    if (view) {
      try {
        await view.render();
      } catch (error) {
        console.error('Erreur lors du chargement de la vue:', error);
        this.showError(error.message);
      }
    } else {
      this.showNotImplemented(viewName);
    }
  }

  showNotImplemented(viewName) {
    const container = document.getElementById('contentArea');
    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Section en développement</h3>
        <p class="text-gray-500">La section "${viewName}" sera bientôt disponible</p>
      </div>
    `;
  }

  showError(message) {
    const container = document.getElementById('contentArea');
    container.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-xl font-bold text-red-900 mb-2">Erreur de chargement</h3>
        <p class="text-red-700">${message}</p>
      </div>
    `;
  }

  getCurrentView() {
    return this.currentView;
  }
}

export const router = new Router();