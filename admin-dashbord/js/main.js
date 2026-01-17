// js/main.js
import { api } from './api.js';
import { ui } from './ui.js';
import { Router } from './router.js';
import { matieresView } from './views/matieres.js';
import { chapitresView } from './views/chapitres.js';
import { coursView } from './views/cours.js';
import { exercicesView } from './views/exercices.js';

class AdminApp {
  constructor() {
    this.router = new Router();
    this.currentUser = null;
  }

  async init() {
    try {
      // Check authentication
      await this.checkAuth();

      // Setup navigation
      this.setupNavigation();

      // Setup global events
      this.setupGlobalEvents();

      // Load initial view
      await this.router.navigate('dashboard');

    } catch (error) {
      console.error('Erreur initialisation:', error);
      this.redirectToLogin();
    }
  }

  async checkAuth() {
    try {
      this.currentUser = await api.getCurrentUser();
      if (!this.currentUser) {
        throw new Error('Non authentifié');
      }
      this.updateUserInfo();
    } catch (error) {
      throw error;
    }
  }

  updateUserInfo() {
    const email = this.currentUser.email || 'Admin';
    const initials = email.substring(0, 2).toUpperCase();

    const userInitialsEl = document.getElementById('userInitials');
    const userNameEl = document.getElementById('userName');

    if (userInitialsEl) userInitialsEl.textContent = initials;
    if (userNameEl) userNameEl.textContent = email.split('@')[0];
  }

  setupNavigation() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const view = e.currentTarget.dataset.view;
        await this.router.navigate(view);
      });
    });

    // Add button
    const addBtn = document.getElementById('addNewBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const currentView = this.router.getCurrentView();

        if (currentView === 'matieres') {
          matieresView.openModal();
        } else if (currentView === 'chapitres') {
          chapitresView.openModal();
        } else if (currentView === 'cours') {
          coursView.openModal();
        } else if (currentView === 'exercices') {
          exercicesView.openModal();
        }
      });
    }
  }

  setupGlobalEvents() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const confirmed = await ui.confirm(
          'Êtes-vous sûr de vouloir vous déconnecter ?',
          'Déconnexion'
        );

        if (confirmed) {
          await this.logout();
        }
      });
    }

    // Modal events
    this.setupModalEvents();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // ESC to close modals
      if (e.key === 'Escape') {
        ui.closeCurrentModal();
      }
    });
  }

  setupModalEvents() {
    // Matière modal
    const matiereForm = document.getElementById('matiereForm');
    const cancelMatiereBtn = document.getElementById('cancelModal');

    if (matiereForm) {
      matiereForm.addEventListener('submit', (e) => matieresView.save(e));
    }

    if (cancelMatiereBtn) {
      cancelMatiereBtn.addEventListener('click', () => ui.closeModal('matiereModal'));
    }

    // Chapitre modal
    const chapitreForm = document.getElementById('chapitreForm');
    const cancelChapitreBtn = document.getElementById('cancelChapitreModal');

    if (chapitreForm) {
      chapitreForm.addEventListener('submit', (e) => chapitresView.save(e));
    }

    if (cancelChapitreBtn) {
      cancelChapitreBtn.addEventListener('click', () => ui.closeModal('chapitreModal'));
    }

    // Cours modal
    const coursForm = document.getElementById('coursForm');
    const cancelCoursBtn = document.getElementById('cancelCoursModal');

    if (coursForm) {
      coursForm.addEventListener('submit', (e) => coursView.save(e));
    }

    if (cancelCoursBtn) {
      cancelCoursBtn.addEventListener('click', () => ui.closeModal('coursModal'));
    }

    // Exercice modal
    const exerciceForm = document.getElementById('exerciceForm');
    const cancelExerciceBtn = document.getElementById('cancelExerciceModal');

    if (exerciceForm) {
      exerciceForm.addEventListener('submit', (e) => exercicesView.save(e));
    }

    if (cancelExerciceBtn) {
      cancelExerciceBtn.addEventListener('click', () => ui.closeModal('exerciceModal'));
    }

    // Click outside to close
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          ui.closeModal(modal.id);
        }
      });
    });
  }

  async logout() {
    try {
      await api.signOut();
      this.redirectToLogin();
    } catch (error) {
      ui.showNotification('Erreur lors de la déconnexion', 'error');
    }
  }

  redirectToLogin() {
    window.location.href = './admin-login.html';
  }
}

// Exposer les vues globalement pour onclick
window.exercicesView = exercicesView;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new AdminApp();
    window.app.init();
  });
} else {
  window.app = new AdminApp();
  window.app.init();
}