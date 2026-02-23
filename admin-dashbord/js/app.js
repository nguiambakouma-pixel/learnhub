// ================================================
// APP.JS - Point d'entrée principal et Navigation
// VERSION CORRIGÉE - Initialisation niveaux fixée
// ================================================

/**
 * Navigation et Logique UI
 */
const Navigation = {
    /**
     * Ouvrir un espace (élèves, dev, designer)
     */
    openEspace(espace) {
        console.log('🚀 Ouverture espace:', espace);

        // Cacher tous les écrans
        document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');

        // Afficher l'écran demandé
        const targetScreen = document.getElementById(`screen-${espace}`);
        if (targetScreen) {
            targetScreen.style.display = 'block';

            // Initialisation spécifique par espace
            if (espace === 'cours' || espace === 'eleves') {
                // ✅ CORRIGÉ : Initialiser pour cours ET eleves
                this.initCoursSpace();
            }
        } else {
            console.error(`❌ Écran non trouvé: screen-${espace}`);
            Utils.showToast(`Écran ${espace} non disponible`, 'warning');
        }
    },

    /**
     * Initialiser l'espace cours
     */
    initCoursSpace() {
        console.log('📚 Initialisation espace cours/élèves...');

        // Par défaut sur le français
        this.switchLanguageTab('fr');

        // ✅ IMPORTANT : Charger les niveaux FR au démarrage
        DataLoader.loadNiveaux('francophone', 'classeFr');

        // Charger la liste des cours FR
        CoursManager.loadCoursList({ sous_systeme_code: 'francophone' }, 'coursListFr');
    },

    /**
     * Switch entre les onglets FR et AN
     */
    switchLanguageTab(lang) {
        console.log('🌐 Switch language:', lang);

        // Désactiver tous les boutons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'text-white');
            btn.classList.add('bg-slate-800', 'text-gray-400');
        });

        // Activer le bon bouton
        const targetBtn = Array.from(document.querySelectorAll('.tab-button')).find(btn =>
            btn.getAttribute('onclick')?.includes(`'${lang}'`)
        );
        if (targetBtn) {
            targetBtn.classList.add('active', 'text-white');
            targetBtn.classList.remove('bg-slate-800', 'text-gray-400');
        }

        // Afficher le bon contenu
        if (lang === 'fr') {
            const contentFr = document.getElementById('contentFr');
            const contentAn = document.getElementById('contentAn');

            if (contentFr) contentFr.style.display = 'block';
            if (contentAn) contentAn.style.display = 'none';

            // Charger les niveaux francophones
            DataLoader.loadNiveaux('francophone', 'classeFr');

            // Charger la liste des cours francophones
            CoursManager.loadCoursList({ sous_systeme_code: 'francophone' }, 'coursListFr');
        } else {
            const contentFr = document.getElementById('contentFr');
            const contentAn = document.getElementById('contentAn');

            if (contentFr) contentFr.style.display = 'none';
            if (contentAn) contentAn.style.display = 'block';

            // Charger les niveaux anglophones
            DataLoader.loadNiveaux('anglophone', 'classeAn');

            // Charger la liste des cours anglophones
            CoursManager.loadCoursList({ sous_systeme_code: 'anglophone' }, 'coursListAn');
        }
    },

    /**
     * Changer de section à l'intérieur d'un espace (ex: dashboard, cours, eleves)
     */
    switchSection(section) {
        console.log('📍 Navigation vers section:', section);

        // Mettre à jour l'UI de la sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = Array.from(document.querySelectorAll('.sidebar-item')).find(item =>
            item.getAttribute('onclick')?.includes(`'${section}'`)
        );
        if (activeItem) activeItem.classList.add('active');

        // Note: Pour l'instant on gère principalement la section "cours" 
        // car c'est celle qui a été implémentée visuellement.
        if (section === 'cours') {
            // Déjà affiché par défaut dans espaceEleves pour l'instant
        } else {
            Utils.showToast(`Section ${section} en cours de développement`, 'info');
        }
    },

    /**
     * Retourner à l'accueil
     */
    backToHome() {
        this.openEspace('dashboard');
    }
};

/**
 * Logique principale de l'Application
 */
const App = {
    /**
     * Initialiser les événements
     */
    attachEventListeners() {
        // Formulaire création cours FR
        const formFr = document.getElementById('coursFormFr');
        if (formFr) {
            formFr.addEventListener('submit', async (e) => {
                e.preventDefault();

                const coursData = {
                    matiere: document.getElementById('matiereFr').value,
                    chapitre: document.getElementById('chapitreFr').value,
                    titre: document.getElementById('titreFr').value,
                    contenu: document.getElementById('contenuFr').innerHTML,
                    video_url: document.getElementById('videoFr').value,
                    duree_lecture: document.getElementById('dureeFr').value,
                    points_recompense: document.getElementById('pointsFr').value,
                    est_publie: document.getElementById('publieFr').checked,
                    image_url: AppState.currentImageUrlFr,
                    pdf_url: AppState.currentPdfUrlFr,
                    sous_systeme_code: 'francophone',
                    serie_code: document.getElementById('serieFr').value
                };

                const editId = AppState.editingCoursIdFr;
                const result = editId
                    ? await CoursManager.updateCours(editId, coursData)
                    : await CoursManager.createCours(coursData);

                if (result) {
                    this.resetForm();
                    CoursManager.loadCoursList({ sous_systeme_code: 'francophone' }, 'coursListFr');
                }
            });
        }

        // Formulaire création cours AN
        const formAn = document.getElementById('coursFormAn');
        if (formAn) {
            formAn.addEventListener('submit', this.handleCoursSubmitAn.bind(this));
        }

        // Upload image FR
        const imageFr = document.getElementById('imageFr');
        if (imageFr) {
            imageFr.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) Storage.uploadImage(file, 'fr');
            });
        }

        // Upload PDF FR
        const pdfFr = document.getElementById('pdfFr');
        if (pdfFr) {
            pdfFr.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) Storage.uploadPdf(file, 'fr');
            });
        }

        // Upload image AN
        const imageAn = document.getElementById('imageAn');
        if (imageAn) {
            imageAn.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) Storage.uploadImage(file, 'an');
            });
        }

        // Upload PDF AN
        const pdfAn = document.getElementById('pdfAn');
        if (pdfAn) {
            pdfAn.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) Storage.uploadPdf(file, 'an');
            });
        }

        // Chargement niveau → séries FR
        const classeFr = document.getElementById('classeFr');
        if (classeFr) {
            classeFr.addEventListener('change', (e) => {
                const niveauCode = e.target.value;
                console.log('📌 Niveau FR sélectionné:', niveauCode);
                if (niveauCode) {
                    DataLoader.loadSeries(niveauCode, 'serieFr', 'serieFrContainer');
                }
            });
        }

        // Chargement niveau → séries AN
        const classeAn = document.getElementById('classeAn');
        if (classeAn) {
            classeAn.addEventListener('change', (e) => {
                const niveauCode = e.target.value;
                console.log('📌 Niveau AN sélectionné:', niveauCode);
                if (niveauCode) {
                    DataLoader.loadSeries(niveauCode, 'serieAn', 'serieAnContainer');
                }
            });
        }
    },

    /**
     * Gérer la soumission du formulaire Anglophone
     */
    async handleCoursSubmitAn(e) {
        e.preventDefault();

        // Récupérer les valeurs
        const coursData = {
            matiere: document.getElementById('matiereAn').value,
            chapitre: document.getElementById('chapitreAn').value,
            titre: document.getElementById('titreAn').value,
            contenu: document.getElementById('contenuAn').innerHTML,
            video_url: document.getElementById('videoAn').value,
            duree_lecture: document.getElementById('dureeAn').value,
            points_recompense: document.getElementById('pointsAn').value,
            est_publie: document.getElementById('publieAn').checked,
            image_url: AppState.currentImageUrlAn,
            pdf_url: AppState.currentPdfUrlAn,
            sous_systeme_code: 'anglophone',
            serie_code: document.getElementById('serieAn').value
        };

        // Créer ou Mettre à jour le cours
        const editId = AppState.editingCoursIdAn;
        const result = editId
            ? await CoursManager.updateCours(editId, coursData)
            : await CoursManager.createCours(coursData);

        if (result) {
            this.resetFormAn();
            CoursManager.loadCoursList({ sous_systeme_code: 'anglophone' }, 'coursListAn');
        }
    },

    /**
     * Annuler l'édition en cours
     */
    cancelEdit(lang) {
        if (lang === 'fr') {
            this.resetForm();
        } else {
            this.resetFormAn();
        }
        Utils.showToast(lang === 'fr' ? 'Modification annulée' : 'Edit cancelled', 'info');
    },

    /**
     * Réinitialiser le formulaire Français
     */
    resetForm() {
        Utils.clearForm('coursFormFr');
        Storage.resetUploads('fr');

        const serieContainer = document.getElementById('serieFrContainer');
        if (serieContainer) serieContainer.style.display = 'none';

        // Réinitialiser l'état d'édition
        AppState.editingCoursIdFr = null;

        // Réinitialiser l'UI du bouton
        const submitBtn = document.getElementById('submitBtnFr');
        if (submitBtn) {
            submitBtn.innerHTML = '💾 Enregistrer le Cours';
            submitBtn.classList.add('btn-primary');
            submitBtn.classList.remove('bg-emerald-600');
        }

        const cancelBtn = document.getElementById('cancelEditBtnFr');
        if (cancelBtn) cancelBtn.style.display = 'none';

        // Réinitialiser l'éditeur
        const editor = document.getElementById('contenuFr');
        if (editor) editor.innerHTML = '';

        Utils.showToast('📝 Formulaire prêt', 'info');
    },

    /**
     * Réinitialiser le formulaire Anglophone
     */
    resetFormAn() {
        Utils.clearForm('coursFormAn');
        Storage.resetUploads('an');

        const serieContainer = document.getElementById('serieAnContainer');
        if (serieContainer) serieContainer.style.display = 'none';

        // Réinitialiser l'état d'édition
        AppState.editingCoursIdAn = null;

        // Réinitialiser l'UI du bouton
        const submitBtn = document.getElementById('submitBtnAn');
        if (submitBtn) {
            submitBtn.innerHTML = '💾 Save Course';
            submitBtn.classList.add('btn-primary');
            submitBtn.classList.remove('bg-emerald-600');
        }

        const cancelBtn = document.getElementById('cancelEditBtnAn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        // Réinitialiser l'éditeur
        const editor = document.getElementById('contenuAn');
        if (editor) editor.innerHTML = '';

        Utils.showToast('📝 Form ready', 'info');
    }
};


// Global exports
window.AppState = AppState;
window.Navigation = Navigation;
window.App = App;
window.resetFormFr = () => App.resetForm();
window.resetFormAn = () => App.resetFormAn();
window.openEspace = (e) => Navigation.openEspace(e);
window.switchLanguageTab = (lang) => Navigation.switchLanguageTab(lang);
window.formatTextDark = (lang, command) => Utils.formatText(command, lang);

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 KMERSCHOOL Admin Dashboard Ready');

    // Vérifier l'authentification
    const user = await Auth.init();

    if (user) {
        // Charger les statistiques globales
        DataLoader.loadGlobalStats();

        // Attacher les écouteurs d'événements
        App.attachEventListeners();

        // Par défaut sur le dashboard
        Navigation.openEspace('dashboard');
    }
});