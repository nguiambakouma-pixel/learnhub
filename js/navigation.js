// ==========================================
// NAVIGATION.JS - Module de navigation
// ==========================================

import { APP_STATE } from './config.js';
import Dashboard from './views/dashboard.js';
import Matieres from './views/matieres.js';
import Chapitres from './views/chapitres.js';
import Utilisateurs from './views/utilisateurs.js';

const Navigation = {
    titles: {
        dashboard: ['Tableau de bord', 'Vue d\'ensemble de votre plateforme'],
        matieres: ['Gestion des matières', 'Créer et gérer les matières'],
        chapitres: ['Gestion des chapitres', 'Organiser les chapitres par matière'],
        cours: ['Gestion des cours', 'Créer et publier des cours'],
        exercices: ['Gestion des exercices', 'Créer des QCM et exercices'],
        utilisateurs: ['Gestion des utilisateurs', 'Gérer les étudiants']
    },
    
    init() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.navigate(view);
            });
        });
        
        document.getElementById('addNewBtn').addEventListener('click', () => {
            this.handleAddNew();
        });
    },
    
    navigate(view) {
        APP_STATE.currentView = view;
        
        // Mettre à jour sidebar
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('sidebar-active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('sidebar-active');
        
        // Mettre à jour header
        if (this.titles[view]) {
            document.getElementById('pageTitle').textContent = this.titles[view][0];
            document.getElementById('pageSubtitle').textContent = this.titles[view][1];
        }
        
        // Afficher/masquer bouton ajouter
        const addBtn = document.getElementById('addNewBtn');
        if (['matieres', 'chapitres', 'cours', 'exercices'].includes(view)) {
            addBtn.classList.remove('hidden');
        } else {
            addBtn.classList.add('hidden');
        }
        
        // Charger la vue
        this.loadView(view);
    },
    
    async loadView(view) {
        switch(view) {
            case 'dashboard':
                await Dashboard.load();
                break;
            case 'matieres':
                await Matieres.load();
                break;
            case 'chapitres':
                await Chapitres.load();
                break;
            case 'utilisateurs':
                await Utilisateurs.load();
                break;
            default:
                document.getElementById('contentArea').innerHTML = `
                    <div class="text-center py-12">
                        <p class="text-gray-500 text-lg">Section en cours de développement</p>
                    </div>
                `;
        }
    },
    
    handleAddNew() {
        if (APP_STATE.currentView === 'matieres') {
            Matieres.openModal();
        } else if (APP_STATE.currentView === 'chapitres') {
            Chapitres.openModal();
        }
    }
};

export default Navigation;