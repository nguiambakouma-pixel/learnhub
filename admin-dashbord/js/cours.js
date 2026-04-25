// ================================================
// COURS.JS - Gestion des cours
// ================================================

const CoursManager = {
    /**
     * Créer un nouveau cours
     */
    async createCours(coursData) {
        try {
            // Vérifier que l'image est présente
            if (!coursData.image_url) {
                Utils.showToast('❌ Image requise', 'error');
                return null;
            }

            // Récupérer les UUIDs nécessaires
            const ids = await this.getRequiredIds(coursData);
            if (!ids) return null;

            // --- VÉRIFIER / CRÉER LA MATIÈRE AUTOMATIQUEMENT ---
            if (coursData.matiere) {
                try {
                    // Vérifier si la matière existe déjà (insensible à la casse)
                    const { data: existingMatieres } = await supabaseClient
                        .from('matieres')
                        .select('id')
                        .ilike('nom', coursData.matiere);
                        
                    if (!existingMatieres || existingMatieres.length === 0) {
                        // Créer la matière si elle n'existe pas
                        await supabaseClient
                            .from('matieres')
                            .insert([{
                                nom: coursData.matiere.trim(),
                                slug: this.generateSlug(coursData.matiere.trim()),
                                couleur: '#6366F1', // Couleur par défaut
                                type_parcours: 'eleve', // Parcours par défaut
                                ordre: 0
                            }]);
                        console.log('Nouvelle matière enregistrée automatiquement:', coursData.matiere);
                    }
                } catch (e) {
                    console.warn('Erreur silencieuse lors de la création auto de la matière:', e);
                }
            }

            // Préparer les données du cours
            const finalCoursData = {
                titre: coursData.titre,
                slug: this.generateSlug(coursData.titre),
                contenu: coursData.contenu,
                matiere: coursData.matiere,
                chapitre: coursData.chapitre,
                type_contenu: coursData.video_url ? 'video' : 'texte',
                video_url: coursData.video_url || null,
                pdf_url: coursData.pdf_url || null,
                image_url: coursData.image_url,
                duree_lecture: parseInt(coursData.duree_lecture) || null,
                points_recompense: parseInt(coursData.points_recompense) || 20,
                sous_systeme_id: ids.sousSystemeId,
                serie_id: ids.serieId,
                chapitre_id: null,  // Pas de lien direct avec la table chapitres
                est_gratuit: true,
                est_publie: coursData.est_publie !== false,
                ordre: 1,
                vues_total: 0
            };

            // Insérer dans la base de données
            const { data, error } = await supabaseClient
                .from('cours')
                .insert([finalCoursData])
                .select();

            if (error) throw error;

            Utils.showToast('Cours créé avec succès !', 'success');
            return data[0];

        } catch (error) {
            console.error('Erreur création cours:', error);
            Utils.showToast(`❌ Erreur: ${error.message}`, 'error');
            return null;
        }
    },

    /**
     * Récupérer les IDs UUID nécessaires
     */
    async getRequiredIds(coursData) {
        try {
            // Récupérer l'UUID du sous-système
            const { data: sousSysteme, error: ssError } = await supabaseClient
                .from('sous_systemes')
                .select('id')
                .eq('code', coursData.sous_systeme_code)
                .single();

            if (ssError) throw ssError;

            let serieId = null;

            // Si une série est spécifiée, récupérer son UUID
            if (coursData.serie_code) {
                const { data: serie, error: serieError } = await supabaseClient
                    .from('series_specialites')
                    .select('id')
                    .eq('code', coursData.serie_code)
                    .single();

                if (serieError) {
                    console.warn('Série non trouvée:', serieError);
                } else {
                    serieId = serie?.id;
                }
            }

            return {
                sousSystemeId: sousSysteme.id,
                serieId: serieId
            };

        } catch (error) {
            console.error('Erreur récupération IDs:', error);
            Utils.showToast('Erreur lors de la récupération des identifiants', 'error');
            return null;
        }
    },

    /**
     * Générer un slug à partir du titre
     */
    generateSlug(titre) {
        return titre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Charger la liste des cours
     */
    async loadCoursList(filters = {}, containerId = 'coursListFr') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<p class="text-gray-500 text-center py-4">Chargement...</p>';

        try {
            let query = supabaseClient
                .from('cours')
                .select(`
                    *,
                    sous_systeme:sous_systemes(code, nom_fr),
                    serie:series_specialites(
                        nom_court,
                        nom_fr,
                        niveau:niveaux_scolaires(nom_court, nom_fr)
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            // Appliquer les filtres si nécessaires
            if (filters.sous_systeme_code) {
                const { data: ss } = await supabaseClient
                    .from('sous_systemes')
                    .select('id')
                    .eq('code', filters.sous_systeme_code)
                    .single();

                if (ss) {
                    query = query.eq('sous_systeme_id', ss.id);
                }
            } else if (filters.sous_systeme) {
                query = query.eq('sous_systeme_id', filters.sous_systeme);
            }

            const { data: cours, error } = await query;

            if (error) throw error;

            if (!cours || cours.length === 0) {
                const noCoursText = filters.sous_systeme_code === 'anglophone'
                    ? 'No courses yet'
                    : 'Aucun cours pour le moment';
                container.innerHTML = `<p class="text-gray-500 text-center py-8">${noCoursText}</p>`;
                return;
            }

            // Afficher les cours
            this.displayCoursList(cours, container);
            if (window.lucide) lucide.createIcons();

        } catch (error) {
            console.error('Erreur chargement cours:', error);
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erreur de chargement</p>';
        }
    },

    /**
     * Afficher la liste des cours
     */
    displayCoursList(cours, container) {
        const html = cours.map(c => `
            <div class="course-card rounded-lg p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        ${c.image_url ? `<img src="${c.image_url}" class="w-16 h-16 object-cover rounded-lg mb-2">` : ''}
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            <span class="badge ${c.sous_systeme?.code === 'francophone' ? 'badge-fr' : 'badge-an'} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                ${c.sous_systeme?.code === 'francophone' ? 'FR' : 'EN'}
                            </span>
                            
                            <span class="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-semibold border border-indigo-500/30 flex items-center gap-1">
                                <i data-lucide="graduation-cap" class="w-3 h-3"></i> ${c.serie?.niveau?.nom_court || 'Classe N/A'}
                            </span>
                            
                            ${c.serie ? `
                                <span class="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                                    <i data-lucide="target" class="w-3 h-3"></i> ${c.serie.nom_court}
                                </span>
                            ` : ''}

                            ${c.matiere ? `
                                <span class="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs border border-slate-600 flex items-center gap-1">
                                    <i data-lucide="book-open" class="w-3 h-3"></i> ${c.matiere}
                                </span>
                            ` : ''}
                        </div>
                        <h3 class="font-bold text-lg text-white mb-1">${c.titre}</h3>
                        ${c.chapitre ? `<p class="text-sm text-gray-400 mb-2 flex items-center gap-1"><i data-lucide="file-text" class="w-3.5 h-3.5 text-gray-500"></i> ${c.chapitre}</p>` : ''}
                        <div class="flex items-center space-x-3 text-xs text-gray-500">
                            ${c.video_url ? '<span class="flex items-center gap-1"><i data-lucide="video" class="w-3 h-3"></i> Vidéo</span>' : ''}
                            ${c.pdf_url ? '<span class="flex items-center gap-1"><i data-lucide="file-text" class="w-3 h-3"></i> PDF</span>' : ''}
                            ${c.duree_lecture ? `<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${c.duree_lecture} min</span>` : ''}
                            <span class="flex items-center gap-1"><i data-lucide="award" class="w-3 h-3"></i> ${c.points_recompense} XP</span>
                            <span class="${c.est_publie ? 'text-green-400' : 'text-orange-400'} flex items-center gap-1">
                                <i data-lucide="${c.est_publie ? 'check-circle' : 'pause-circle'}" class="w-3 h-3"></i>
                                ${c.est_publie ? 'Publié' : 'Brouillon'}
                            </span>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="CoursManager.editCours('${c.id}')" class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg flex items-center justify-center transition-colors" title="Modifier">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="CoursManager.deleteCours('${c.id}')" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-colors" title="Supprimer">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    /**
     * Éditer un cours - Charge les données dans le formulaire
     */
    async editCours(id) {
        try {
            Utils.showToast('Chargement des données...', 'info');

            // 1. Récupérer les données complètes du cours
            const { data: cours, error } = await supabaseClient
                .from('cours')
                .select(`
                    *,
                    sous_systeme:sous_systemes(code),
                    serie:series_specialites(code, niveau:niveaux_scolaires(code))
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const lang = cours.sous_systeme?.code === 'francophone' ? 'fr' : 'an';
            const suffix = lang === 'fr' ? 'Fr' : 'An';

            // 2. Basculer sur le bon onglet si nécessaire
            Navigation.switchLanguageTab(lang);

            // 3. Marquer l'état d'édition
            AppState[`editingCoursId${suffix}`] = id;

            // 4. Remplir le formulaire
            document.getElementById(`matiere${suffix}`).value = cours.matiere || '';
            document.getElementById(`chapitre${suffix}`).value = cours.chapitre || '';
            document.getElementById(`titre${suffix}`).value = cours.titre || '';
            document.getElementById(`video${suffix}`).value = cours.video_url || '';
            document.getElementById(`duree${suffix}`).value = cours.duree_lecture || '';
            document.getElementById(`points${suffix}`).value = cours.points_recompense || 20;
            document.getElementById(`publie${suffix}`).checked = cours.est_publie;

            // Contenu (Editeur)
            const editor = document.getElementById(`contenu${suffix}`);
            if (editor) editor.innerHTML = cours.contenu || '';

            // Image Preview
            if (cours.image_url) {
                AppState[`currentImageUrl${suffix}`] = cours.image_url;
                Storage.updateImagePreview(cours.image_url, `imagePreview${suffix}`);
            }

            // PDF Preview
            if (cours.pdf_url) {
                AppState[`currentPdfUrl${suffix}`] = cours.pdf_url;
                Storage.updatePdfPreview("Fichier PDF existant", `pdfPreview${suffix}`);
            }

            // 5. Gérer les sélections de classe et série
            // Note: On a besoin du code du niveau
            const niveauCode = cours.serie?.niveau?.code;
            const classeSelect = document.getElementById(`classe${suffix}`);

            if (niveauCode) {
                classeSelect.value = niveauCode;
                // Charger les séries et sélectionner la bonne
                await DataLoader.loadSeries(niveauCode, `serie${suffix}`, `serie${suffix}Container`);
                if (cours.serie?.code) {
                    document.getElementById(`serie${suffix}`).value = cours.serie.code;
                }
            }

            // 6. Mettre à jour l'UI du bouton
            const submitBtn = document.getElementById(`submitBtn${suffix}`);
            if (submitBtn) {
                submitBtn.innerHTML = lang === 'fr' ? '<i data-lucide="upload-cloud" class="w-4 h-4"></i> Mettre à jour le Cours' : '<i data-lucide="upload-cloud" class="w-4 h-4"></i> Update Course';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('bg-emerald-600');
            }

            const cancelBtn = document.getElementById(`cancelEditBtn${suffix}`);
            if (cancelBtn) cancelBtn.style.display = 'block';

            // 7. Scroller vers le formulaire
            document.getElementById(`coursForm${suffix}`).scrollIntoView({ behavior: 'smooth' });

            Utils.showToast('✅ Prêt pour modification', 'success');

        } catch (error) {
            console.error('Erreur chargement cours pour édition:', error);
            Utils.showToast('❌ Erreur lors du chargement des données', 'error');
        }
    },

    /**
     * Mettre à jour un cours existant
     */
    async updateCours(id, coursData) {
        try {
            // Récupérer les UUIDs nécessaires
            const ids = await this.getRequiredIds(coursData);
            if (!ids) return null;

            // --- VÉRIFIER / CRÉER LA MATIÈRE AUTOMATIQUEMENT ---
            if (coursData.matiere) {
                try {
                    // Vérifier si la matière existe déjà (insensible à la casse)
                    const { data: existingMatieres } = await supabaseClient
                        .from('matieres')
                        .select('id')
                        .ilike('nom', coursData.matiere);
                        
                    if (!existingMatieres || existingMatieres.length === 0) {
                        // Créer la matière si elle n'existe pas
                        await supabaseClient
                            .from('matieres')
                            .insert([{
                                nom: coursData.matiere.trim(),
                                slug: this.generateSlug(coursData.matiere.trim()),
                                couleur: '#6366F1', // Couleur par défaut
                                type_parcours: 'eleve', // Parcours par défaut
                                ordre: 0
                            }]);
                        console.log('Nouvelle matière enregistrée automatiquement (update):', coursData.matiere);
                    }
                } catch (e) {
                    console.warn('Erreur silencieuse lors de la création auto de la matière:', e);
                }
            }

            // Préparer les données de mise à jour
            const updateData = {
                titre: coursData.titre,
                slug: this.generateSlug(coursData.titre),
                contenu: coursData.contenu,
                matiere: coursData.matiere,
                chapitre: coursData.chapitre,
                video_url: coursData.video_url || null,
                pdf_url: coursData.pdf_url || null,
                image_url: coursData.image_url,
                duree_lecture: parseInt(coursData.duree_lecture) || null,
                points_recompense: parseInt(coursData.points_recompense) || 20,
                sous_systeme_id: ids.sousSystemeId,
                serie_id: ids.serieId,
                est_publie: coursData.est_publie,
                updated_at: new Date()
            };

            const { data, error } = await supabaseClient
                .from('cours')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;

            Utils.showToast('Cours mis à jour !', 'success');
            return data[0];

        } catch (error) {
            console.error('Erreur mise à jour cours:', error);
            Utils.showToast(`❌ Erreur: ${error.message}`, 'error');
            return null;
        }
    },

    /**
     * Supprimer un cours
     */
    async deleteCours(id) {
        if (!confirm('Supprimer ce cours définitivement ?')) {
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('cours')
                .delete()
                .eq('id', id);

            if (error) throw error;

            Utils.showToast('Cours supprimé', 'success');
            this.loadCoursList();
        } catch (error) {
            console.error('Erreur suppression:', error);
            Utils.showToast('❌ Erreur lors de la suppression', 'error');
        }
    }
};

// ================================================
// FONCTIONS GLOBALES POUR COMPATIBILITÉ HTML
// ================================================
window.CoursManager = CoursManager;
window.editCours = (id) => CoursManager.editCours(id);
window.deleteCours = (id) => CoursManager.deleteCours(id);
