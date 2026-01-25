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
    this.listenersAttached = false; // 🔧 Flag pour éviter les doublons
  }

  async init() {
    try {
      console.log('🚀 Initializing AdminApp...');

      // Check authentication
      await this.checkAuth();

      // Setup navigation
      this.setupNavigation();

      // Setup global events
      this.setupGlobalEvents();

      // 🔧 CORRECTION : Attacher les listeners de formulaires dès l'initialisation
      this.attachFormListeners();

      // Load initial view
      await this.router.navigate('dashboard');

      console.log('✅ AdminApp initialized');

    } catch (error) {
      console.error('❌ Erreur initialisation:', error);
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
        console.log('➕ Add button clicked');
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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // ESC to close modals
      if (e.key === 'Escape') {
        ui.closeCurrentModal();
      }
    });

    // Modal backdrop clicks
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          ui.closeModal(modal.id);
        }
      });
    });
  }

  // 🔧 CORRECTION CRITIQUE : Attacher les listeners UNE SEULE FOIS
  attachFormListeners() {
    console.log('🔗 Attaching form listeners...');

    // Marquer qu'on a déjà attaché les listeners
    if (this.listenersAttached) {
      console.log('⚠️ Listeners already attached, skipping');
      return;
    }

    // Matière Form - Cloner pour éviter les doublons
    const matiereForm = document.getElementById('matiereForm');
    if (matiereForm) {
      const newMatiereForm = matiereForm.cloneNode(true);
      matiereForm.parentNode.replaceChild(newMatiereForm, matiereForm);
      newMatiereForm.addEventListener('submit', (e) => {
        console.log('📝 Matiere form submit');
        matieresView.save(e);
      });
    }

    // Chapitre Form
    const chapitreForm = document.getElementById('chapitreForm');
    if (chapitreForm) {
      const newChapitreForm = chapitreForm.cloneNode(true);
      chapitreForm.parentNode.replaceChild(newChapitreForm, chapitreForm);
      newChapitreForm.addEventListener('submit', (e) => {
        console.log('📝 Chapitre form submit');
        chapitresView.save(e);
      });
    }

    // Cours Form
    const coursForm = document.getElementById('coursForm');
    if (coursForm) {
      const newCoursForm = coursForm.cloneNode(true);
      coursForm.parentNode.replaceChild(newCoursForm, coursForm);
      newCoursForm.addEventListener('submit', (e) => {
        console.log('📝 Cours form submit');
        coursView.save(e);
      });
    }

    // Exercice Form
    const exerciceForm = document.getElementById('exerciceForm');
    if (exerciceForm) {
      const newExerciceForm = exerciceForm.cloneNode(true);
      exerciceForm.parentNode.replaceChild(newExerciceForm, exerciceForm);
      newExerciceForm.addEventListener('submit', (e) => {
        console.log('📝 Exercice form submit');
        exercicesView.save(e);
      });
    }

    // Cancel buttons
    const cancelMatiere = document.getElementById('cancelModal');
    if (cancelMatiere) {
      cancelMatiere.onclick = () => ui.closeModal('matiereModal');
    }

    const cancelChapitre = document.getElementById('cancelChapitreModal');
    if (cancelChapitre) {
      cancelChapitre.onclick = () => ui.closeModal('chapitreModal');
    }

    const cancelCours = document.getElementById('cancelCoursModal');
    if (cancelCours) {
      cancelCours.onclick = () => ui.closeModal('coursModal');
    }

    const cancelExercice = document.getElementById('cancelExerciceModal');
    if (cancelExercice) {
      cancelExercice.onclick = () => ui.closeModal('exerciceModal');
    }

    this.listenersAttached = true;
    console.log('✅ Form listeners attached');
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
window.coursView = coursView;
window.matieresView = matieresView;
window.chapitresView = chapitresView;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    window.app = new AdminApp();
    window.app.init();
  });
} else {
  console.log('📄 DOM Already Loaded');
  window.app = new AdminApp();
  window.app.init();
}