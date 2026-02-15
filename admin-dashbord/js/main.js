import { router } from './router.js';
import { ui } from './ui.js';
import { matieresView } from './views/matieres.js';
import { chapitresView } from './views/chapitres.js';
import { coursView } from './views/cours.js';
import { exercicesView } from './views/exercices.js';
import { exercicesCodeView } from './views/exercices-code.js';
import { utilisateursView } from './views/utilisateurs.js';

// Fonction pour configurer les événements globaux
function setupGlobalEvents() {
    // Navigation Sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.getAttribute('data-view');
            if (viewName) {
                router.navigate(viewName);
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // TODO: Implémenter la déconnexion réelle
            console.log('Déconnexion...');
            window.location.href = '../index.html';
        });
    }

    // Gestion du bouton global "+ Ajouter"
    const addNewBtn = document.getElementById('addNewBtn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            const currentViewName = router.getCurrentView();
            const view = router.views[currentViewName];
            if (view && typeof view.openModal === 'function') {
                view.openModal();
            } else {
                console.warn(`La vue ${currentViewName} n'a pas de méthode openModal`);
            }
        });
    }

    // Gestion des modales (Boutons Annuler)

    // Modal Matière
    const cancelModal = document.getElementById('cancelModal');
    if (cancelModal) {
        cancelModal.onclick = () => ui.closeModal('matiereModal');
    }

    // Modal Chapitre
    const cancelChapitreModal = document.getElementById('cancelChapitreModal');
    if (cancelChapitreModal) {
        cancelChapitreModal.onclick = () => ui.closeModal('chapitreModal');
    }

    // Modal Cours
    const cancelCoursModal = document.getElementById('cancelCoursModal');
    if (cancelCoursModal) {
        cancelCoursModal.onclick = () => ui.closeModal('coursModal');
    }

    // Modal Exercice QCM
    const cancelExerciceModal = document.getElementById('cancelExerciceModal');
    if (cancelExerciceModal) {
        cancelExerciceModal.onclick = () => ui.closeModal('exerciceModal');
    }

    // Modal Exercice Code (Nouveau)
    const cancelExerciceCodeModal = document.getElementById('cancelExerciceCodeModal');
    if (cancelExerciceCodeModal) {
        cancelExerciceCodeModal.onclick = () => ui.closeModal('exerciceCodeModal');
    }
}

// Fonction pour attacher les écouteurs sur les formulaires
function attachFormListeners() {
    // Formulaire Matière
    const matiereForm = document.getElementById('matiereForm');
    if (matiereForm) {
        const newForm = matiereForm.cloneNode(true);
        matiereForm.parentNode.replaceChild(newForm, matiereForm);
        newForm.addEventListener('submit', (e) => matieresView.save(e));

        // Réattacher le bouton annuler car le clone perd les événements
        const cancelBtn = document.getElementById('cancelModal');
        if (cancelBtn) cancelBtn.onclick = () => ui.closeModal('matiereModal');
    }

    // Formulaire Chapitre
    const chapitreForm = document.getElementById('chapitreForm');
    if (chapitreForm) {
        const newForm = chapitreForm.cloneNode(true);
        chapitreForm.parentNode.replaceChild(newForm, chapitreForm);
        newForm.addEventListener('submit', (e) => chapitresView.save(e));

        // Réattacher events des boutons dans le form si nécessaire (upload pdf etc)
        // Note: Si des events étaient attachés aux éléments INTERNES, ils sont perdus avec cloneNode(true).
        // Cependant, l'upload PDF semble géré via onclick inline ou par une logique séparée.
        // Vérifions si le PDF upload a besoin d'être ré-initié.
        const cancelBtn = document.getElementById('cancelChapitreModal');
        if (cancelBtn) cancelBtn.onclick = () => ui.closeModal('chapitreModal');
    }

    // Formulaire Cours
    const coursForm = document.getElementById('coursForm');
    if (coursForm) {
        const newForm = coursForm.cloneNode(true);
        coursForm.parentNode.replaceChild(newForm, coursForm);
        newForm.addEventListener('submit', (e) => coursView.save(e));

        const cancelBtn = document.getElementById('cancelCoursModal');
        if (cancelBtn) cancelBtn.onclick = () => ui.closeModal('coursModal');
    }

    // Formulaire Exercice QCM
    const exerciceForm = document.getElementById('exerciceForm');
    if (exerciceForm) {
        const newForm = exerciceForm.cloneNode(true);
        exerciceForm.parentNode.replaceChild(newForm, exerciceForm);
        newForm.addEventListener('submit', (e) => exercicesView.save(e));

        const cancelBtn = document.getElementById('cancelExerciceModal');
        if (cancelBtn) cancelBtn.onclick = () => ui.closeModal('exerciceModal');
    }

    // Formulaire Exercice Code (Nouveau)
    const exerciceCodeForm = document.getElementById('exerciceCodeForm');
    if (exerciceCodeForm) {
        const newExerciceCodeForm = exerciceCodeForm.cloneNode(true);
        exerciceCodeForm.parentNode.replaceChild(newExerciceCodeForm, exerciceCodeForm);
        newExerciceCodeForm.addEventListener('submit', (e) => {
            console.log('📝 Exercice Code form submit');
            exercicesCodeView.save(e);
        });

        const cancelBtn = document.getElementById('cancelExerciceCodeModal');
        if (cancelBtn) cancelBtn.onclick = () => ui.closeModal('exerciceCodeModal');
    }
}


// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Dashboard Initialized');

    setupGlobalEvents();
    attachFormListeners();

    // Route par défaut
    router.navigate('dashboard');
});

// Exposer les vues et le router globalement
window.app = {
    router: router,
    ui: ui
};

window.matieresView = matieresView;
window.chapitresView = chapitresView;
window.coursView = coursView;
window.exercicesView = exercicesView;
window.exercicesCodeView = exercicesCodeView;
window.utilisateursView = utilisateursView;
window.ui = ui;
