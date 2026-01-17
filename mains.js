// ==========================================
// MAIN.JS - Point d'entrée principal
// ==========================================

import Auth from './auth.js';
import Navigation from './navigation.js';
import Matieres from './views/matieres.js';
import Chapitres from './views/chapitres.js';

// Exposer globalement pour onclick dans le HTML
window.Matieres = Matieres;
window.Chapitres = Chapitres;

// Gestion formulaire Matière
document.getElementById('matiereForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        nom: document.getElementById('matiereNom').value.trim(),
        slug: document.getElementById('matiereNom').value.trim().toLowerCase().replace(/\s+/g, '-'),
        description: document.getElementById('matiereDescription').value.trim(),
        type_parcours: document.getElementById('matiereTypeParcours').value,
        couleur: document.getElementById('matiereCouleur').value,
        ordre: parseInt(document.getElementById('matiereOrdre').value)
    };
    
    const success = await Matieres.save(formData);
    
    if (success) {
        document.getElementById('matiereModal').classList.add('hidden');
        Matieres.load();
    }
});

document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('matiereModal').classList.add('hidden');
});

// Gestion formulaire Chapitre
document.getElementById('chapitreForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        matiere_id: document.getElementById('chapitreMatiere').value,
        titre: document.getElementById('chapitreTitre').value.trim(),
        description: document.getElementById('chapitreDescription').value.trim(),
        difficulte: document.getElementById('chapitreDifficulte').value,
        duree_estimee: document.getElementById('chapitreDuree').value,
        ordre: document.getElementById('chapitreOrdre').value,
        objectifs: document.getElementById('chapitreObjectifs').value,
        est_publie: document.getElementById('chapitreEstPublie').checked,
        est_premium: document.getElementById('chapitreEstPremium').checked
    };
    
    const success = await Chapitres.save(formData);
    
    if (success) {
        document.getElementById('chapitreModal').classList.add('hidden');
        Chapitres.load();
    }
});

document.getElementById('cancelChapitreModal').addEventListener('click', () => {
    document.getElementById('chapitreModal').classList.add('hidden');
});

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
});

// Initialisation
async function init() {
    const admin = await Auth.checkAdmin();
    if (admin) {
        Navigation.init();
        Navigation.navigate('dashboard');
    }
}

init();