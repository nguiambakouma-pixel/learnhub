// ================================================
// DATA.JS - Chargement des données
// ================================================

const DataLoader = {
    /**
     * Charger les niveaux scolaires pour un sous-système
     */
    async loadNiveaux(sousSystemeCode, targetSelectId) {
        const select = document.getElementById(targetSelectId);
        select.innerHTML = '<option value="">Chargement...</option>';

        try {
            // 1. Récupérer l'ID du sous-système
            const { data: sousSysteme, error: ssError } = await supabaseClient
                .from('sous_systemes')
                .select('id')
                .eq('code', sousSystemeCode)
                .single();

            if (ssError) throw ssError;

            // 2. Récupérer les cycles de ce sous-système
            const { data: cycles, error: cError } = await supabaseClient
                .from('cycles')
                .select('id')
                .eq('sous_systeme_id', sousSysteme.id);

            if (cError) throw cError;

            const cycleIds = cycles.map(c => c.id);

            // 3. Récupérer les niveaux de ces cycles
            const { data: niveaux, error: nError } = await supabaseClient
                .from('niveaux_scolaires')
                .select('*')
                .in('cycle_id', cycleIds)
                .order('ordre');

            if (nError) throw nError;

            select.innerHTML = '<option value="">Sélectionner...</option>';

            if (niveaux && niveaux.length > 0) {
                niveaux.forEach(niveau => {
                    const option = document.createElement('option');
                    option.value = niveau.code;
                    option.textContent = `${niveau.nom_fr}${niveau.est_classe_examen ? ' 🎯' : ''}`;
                    option.dataset.examen = niveau.est_classe_examen;
                    option.dataset.typeExamen = niveau.type_examen || '';
                    select.appendChild(option);
                });
                return niveaux;
            } else {
                console.warn(`Aucun niveau trouvé pour ${sousSystemeCode}`);
                select.innerHTML = '<option value="">Aucun niveau disponible</option>';
                return [];
            }

        } catch (error) {
            console.error('Erreur chargement niveaux:', error);
            Utils.showToast('Erreur de chargement des niveaux', 'error');
            select.innerHTML = '<option value="">Erreur de chargement</option>';
            return [];
        }
    },

    /**
     * Charger les séries pour un niveau
     */
    async loadSeries(niveauCode, targetSelectId, containerTargetId) {
        const serieSelect = document.getElementById(targetSelectId);
        const serieContainer = document.getElementById(containerTargetId);

        if (!niveauCode) {
            serieContainer.style.display = 'none';
            return [];
        }

        try {
            // Trouver l'ID du niveau à partir du code
            const { data: niveau, error: nivError } = await supabaseClient
                .from('niveaux_scolaires')
                .select('id')
                .eq('code', niveauCode)
                .single();

            if (nivError) throw nivError;

            if (!niveau) {
                console.warn('Niveau non trouvé pour le code:', niveauCode);
                return [];
            }

            // Charger les séries liées à ce niveau
            const { data: series, error } = await supabaseClient
                .from('series_specialites')
                .select('*')
                .eq('niveau_id', niveau.id)
                .eq('actif', true)
                .order('ordre');

            if (error) throw error;

            if (series && series.length > 0) {
                serieContainer.style.display = 'block';
                serieSelect.innerHTML = '<option value="">Toutes les séries</option>';

                series.forEach(serie => {
                    const option = document.createElement('option');
                    option.value = serie.code;
                    option.textContent = `${serie.nom_court} - ${serie.nom_fr}`;
                    serieSelect.appendChild(option);
                });

                return series;
            } else {
                serieContainer.style.display = 'none';
                return [];
            }
        } catch (error) {
            console.error('Erreur chargement séries:', error);
            Utils.showToast('Erreur de chargement des séries', 'error');
            serieContainer.style.display = 'none';
            return [];
        }
    },

    /**
     * Charger les statistiques globales
     */
    async loadGlobalStats() {
        try {
            // Stats tous profils
            const { data: profiles, error: profilesError } = await supabaseClient
                .from('profiles')
                .select('id, sous_systeme_id, type_parcours');

            if (profilesError) throw profilesError;

            // Filtrer par catégorie
            const eleveProfiles = profiles.filter(p => p.type_parcours === 'eleve');
            const devProfiles = profiles.filter(p => p.type_parcours === 'dev-web');
            const designerProfiles = profiles.filter(p => p.type_parcours === 'designer');

            // Compter par sous-système (pour les élèves uniquement)
            const stats = await this.countBySubsystem(eleveProfiles);

            // Ajouter les autres totaux
            stats.totalDev = devProfiles.length;
            // Mettre à jour l'interface
            this.updateStatsUI(stats);

            // Stats cours
            await this.loadCoursStats();

            // Charger les datalists de matières
            await this.loadMatieresDatalists();

            return stats;
        } catch (error) {
            console.error('Erreur stats globales:', error);
            Utils.showToast('Erreur chargement statistiques', 'error');
        }
    },

    /**
     * Wrapper pour compatibilité HTML (appelé depuis onchange)
     */
    async loadSeriesFr() {
        return this.loadSeries(
            document.getElementById('classeFr').value,
            'serieFr',
            'serieFrContainer'
        );
    },

    /**
     * Wrapper pour compatibilité HTML Anglophone
     */
    async loadSeriesAn() {
        return this.loadSeries(
            document.getElementById('classeAn').value,
            'serieAn',
            'serieAnContainer'
        );
    },

    /**
     * Compter les élèves par sous-système
     */
    async countBySubsystem(profiles) {
        const { data: sousSystemes } = await supabaseClient
            .from('sous_systemes')
            .select('id, code');

        const francophoneId = sousSystemes?.find(s => s.code === 'francophone')?.id;
        const anglophoneId = sousSystemes?.find(s => s.code === 'anglophone')?.id;

        const totalEleves = profiles?.length || 0;
        const elevesFr = profiles?.filter(p => p.sous_systeme_id === francophoneId).length || 0;
        const elevesAn = profiles?.filter(p => p.sous_systeme_id === anglophoneId).length || 0;

        return {
            total: totalEleves,
            francophone: elevesFr,
            anglophone: elevesAn
        };
    },

    /**
     * Mettre à jour l'interface des stats
     */
    updateStatsUI(stats) {
        const elements = {
            'statTotalEleves': stats.total,
            'statElevesFr': stats.francophone,
            'statElevesAn': stats.anglophone,
            'sidebarStatFr': stats.francophone,
            'sidebarStatAn': stats.anglophone,
            'statApprenantsdev': stats.totalDev,
            'statCreatifs': stats.totalDesigner
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    },

    /**
     * Charger les stats des cours
     */
    async loadCoursStats() {
        try {
            const { data: cours, error } = await supabaseClient
                .from('cours')
                .select('id');

            if (error) throw error;

            const total = cours?.length || 0;
            const el = document.getElementById('statTotalCours');
            if (el) el.textContent = total;

            return total;
        } catch (error) {
            console.error('Erreur stats cours:', error);
        }
    },

    /**
     * Charger les datalists de matières dynamiquement
     */
    async loadMatieresDatalists() {
        try {
            const { data: matieres, error } = await supabaseClient
                .from('matieres')
                .select('nom, type_parcours')
                .order('nom');

            if (error) throw error;

            const frList = document.getElementById('matieresFrList');
            const anList = document.getElementById('matieresAnList');

            if (frList) {
                // Pour la section francophone, on peut filtrer si besoin, mais ici on met tout ou par parcours
                frList.innerHTML = matieres
                    .map(m => `<option value="${m.nom}">`)
                    .join('');
            }

            if (anList) {
                anList.innerHTML = matieres
                    .map(m => `<option value="${m.nom}">`)
                    .join('');
            }

            console.log('✅ Datalists matières mis à jour');
        } catch (error) {
            console.error('Erreur chargement datalists matières:', error);
        }
    }
};

// ================================================
// FONCTIONS GLOBALES POUR COMPATIBILITÉ HTML
// ================================================
window.loadSeriesFr = () => DataLoader.loadSeriesFr();
window.loadSeriesAn = () => DataLoader.loadSeriesAn();