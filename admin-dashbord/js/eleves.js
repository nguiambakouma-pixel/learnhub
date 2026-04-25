// ================================================
// ELEVES.JS - Gestion des élèves
// ✅ Liste + Recherche + Filtres
// ✅ Fiche élève (progression, stats, cours terminés)
// ✅ Blocage / Déblocage
// ✅ Modification de profil
// ✅ Suppression
// ✅ Export CSV
// ================================================

const ElevesManager = {

    allEleves: [],

    // ─────────────────────────────────────────────
    // CHARGER LA SECTION ÉLÈVES
    // ─────────────────────────────────────────────
    async loadSection() {
        const container = document.getElementById('contentEleves');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center py-16">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
                <span class="ml-3 text-gray-400">Chargement des élèves...</span>
            </div>
        `;

        try {
            const { data: eleves, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('type_parcours', 'eleve')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.allEleves = eleves || [];
            this.renderSection(this.allEleves);

        } catch (error) {
            console.error('Erreur chargement élèves:', error);
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-red-400">
                    <div class="mb-4 flex justify-center"><i data-lucide="alert-circle" class="w-12 h-12"></i></div>
                    <p>${error.message}</p>
                </div>
            `;
        }
    },

    // ─────────────────────────────────────────────
    // RENDU PRINCIPAL
    // ─────────────────────────────────────────────
    renderSection(eleves) {
        const container = document.getElementById('contentEleves');
        if (!container) return;

        const total = eleves.length;
        const bloques = eleves.filter(e => e.est_bloque).length;
        const actifs7j = eleves.filter(e => {
            if (!e.derniere_connexion) return false;
            return (Date.now() - new Date(e.derniere_connexion)) < 7 * 86400000;
        }).length;
        const jamaisConnectes = eleves.filter(e => !e.derniere_connexion).length;

        container.innerHTML = `

            <!-- STATS ──────────────────────────────────── -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="glass-card rounded-xl p-4 text-center">
                    <div class="text-3xl font-bold text-indigo-400">${total}</div>
                    <div class="text-xs text-gray-400 mt-1">Total élèves</div>
                </div>
                <div class="glass-card rounded-xl p-4 text-center">
                    <div class="text-3xl font-bold text-emerald-400">${actifs7j}</div>
                    <div class="text-xs text-gray-400 mt-1">Actifs (7j)</div>
                </div>
                <div class="glass-card rounded-xl p-4 text-center">
                    <div class="text-3xl font-bold text-orange-400">${jamaisConnectes}</div>
                    <div class="text-xs text-gray-400 mt-1">Jamais connectés</div>
                </div>
                <div class="glass-card rounded-xl p-4 text-center">
                    <div class="text-3xl font-bold text-red-400">${bloques}</div>
                    <div class="text-xs text-gray-400 mt-1">Bloqués</div>
                </div>
            </div>

            <!-- FILTRES ─────────────────────────────────── -->
            <div class="glass-card rounded-xl p-4 mb-6">
                <div class="flex flex-wrap gap-3">
                    <div class="flex-1 relative">
                        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"></i>
                        <input id="searchEleves" type="text"
                            placeholder="Rechercher par nom ou email..."
                            class="input-dark w-full pl-10 pr-4 py-2 rounded-lg text-sm">
                    </div>


                    <select id="filterActivite" class="input-dark px-4 py-2 rounded-lg text-sm">
                        <option value="">Toute activité</option>
                        <option value="actif">Actifs (7j)</option>
                        <option value="inactif">Inactifs</option>
                        <option value="jamais">Jamais connectés</option>
                        <option value="bloque">Bloqués</option>
                    </select>

                    <button onclick="ElevesManager.exportCSV()"
                        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                    </button>
                </div>
            </div>

            <!-- TABLEAU ─────────────────────────────────── -->
            <div class="glass-card rounded-xl overflow-hidden">
                ${eleves.length === 0 ? `
                    <div class="p-12 text-center text-gray-500">
                        <div class="mb-4 flex justify-center opacity-20"><i data-lucide="users" class="w-16 h-16"></i></div>
                        <p>Aucun élève inscrit pour le moment</p>
                    </div>
                ` : `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-slate-700 bg-slate-800/50">
                                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Élève</th>
                                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Points</th>
                                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Streak</th>
                                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Activité</th>
                                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Statut</th>
                                    <th class="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="elevesTableBody" class="divide-y divide-slate-800">
                                ${eleves.map(e => this.renderRow(e)).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        this.setupFilters();
        if (window.lucide) lucide.createIcons();
    },

    // ─────────────────────────────────────────────
    // RENDU D'UNE LIGNE DU TABLEAU
    // ─────────────────────────────────────────────
    renderRow(eleve) {
        const initials = (eleve.nom || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        const lastLogin = eleve.derniere_connexion ? new Date(eleve.derniere_connexion) : null;
        const daysSince = lastLogin ? Math.floor((Date.now() - lastLogin) / 86400000) : null;

        let activiteBadge = '<span class="text-gray-500 text-xs">Jamais connecté</span>';
        let activiteKey = 'jamais';

        if (daysSince === 0) { activiteBadge = '<span class="text-xs text-emerald-400">● Aujourd\'hui</span>'; activiteKey = 'actif'; }
        else if (daysSince !== null && daysSince <= 7) { activiteBadge = `<span class="text-xs text-emerald-400">Il y a ${daysSince}j</span>`; activiteKey = 'actif'; }
        else if (daysSince !== null && daysSince <= 30) { activiteBadge = `<span class="text-xs text-orange-400">Il y a ${daysSince}j</span>`; activiteKey = 'inactif'; }
        else if (daysSince !== null) { activiteBadge = `<span class="text-xs text-red-400">Il y a ${daysSince}j</span>`; activiteKey = 'inactif'; }

        const parcoursBadge = {
            'eleve': '<span class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs flex items-center gap-1"><i data-lucide="graduation-cap" class="w-3 h-3"></i> Élève</span>',
            'dev-web': '<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs flex items-center gap-1"><i data-lucide="code-2" class="w-3 h-3"></i> Dev-Web</span>',
            'designer': '<span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs flex items-center gap-1"><i data-lucide="palette" class="w-3 h-3"></i> Designer</span>',
        }[eleve.type_parcours] || '<span class="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">N/A</span>';

        const statutBadge = eleve.est_bloque
            ? '<span class="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-semibold flex items-center gap-1"><i data-lucide="slash" class="w-3 h-3"></i> Bloqué</span>'
            : '<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Actif</span>';

        const nomEsc = (eleve.nom || '').replace(/'/g, "\\'");

        return `
            <tr class="eleve-row hover:bg-slate-800/40 transition"
                data-id="${eleve.id}"
                data-nom="${(eleve.nom || '').toLowerCase()}"
                data-email="${(eleve.email || '').toLowerCase()}"
                data-activite="${activiteKey}"
                data-bloque="${eleve.est_bloque ? 'bloque' : ''}">

                <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
                            ${eleve.avatar_url
                ? `<img src="${eleve.avatar_url}" class="w-full h-full object-cover" onerror="this.outerHTML='${initials}'">`
                : initials}
                        </div>
                        <div>
                            <p class="font-semibold text-white text-sm">${eleve.nom || 'Sans nom'}</p>
                            <p class="text-gray-500 text-xs">${eleve.email || ''}</p>
                        </div>
                    </div>
                </td>
                    <span class="font-bold text-yellow-400">${eleve.points_total || 0}</span>
                    <span class="text-gray-500 text-xs"> pts</span>
                </td>

                <td class="px-5 py-4">
                    <div class="flex items-center gap-1 font-bold text-orange-400">
                        ${eleve.streak_jours || 0}
                        <i data-lucide="flame" class="w-3.5 h-3.5"></i>
                    </div>
                </td>

                <td class="px-5 py-4">${activiteBadge}</td>

                <td class="px-5 py-4">${statutBadge}</td>

                <td class="px-5 py-4">
                    <div class="flex justify-end gap-1">
                        <button onclick="ElevesManager.openFiche('${eleve.id}')" title="Voir fiche"
                            class="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="ElevesManager.openEditModal('${eleve.id}')" title="Modifier"
                            class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="ElevesManager.toggleBlocage('${eleve.id}', ${!!eleve.est_bloque})"
                            title="${eleve.est_bloque ? 'Débloquer' : 'Bloquer'}"
                            class="p-2 ${eleve.est_bloque ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-orange-400 hover:bg-orange-500/10'} rounded-lg transition flex items-center justify-center">
                            <i data-lucide="${eleve.est_bloque ? 'unlock' : 'lock'}" class="w-4 h-4"></i>
                        </button>
                        <button onclick="ElevesManager.deleteEleve('${eleve.id}', '${nomEsc}')" title="Supprimer"
                            class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    // ─────────────────────────────────────────────
    // FILTRES
    // ─────────────────────────────────────────────
    setupFilters() {
        const search = document.getElementById('searchEleves');
        const activite = document.getElementById('filterActivite');
        if (!search) return;

        const filter = () => {
            const s = search.value.toLowerCase();
            const a = activite ? activite.value : '';

            document.querySelectorAll('.eleve-row').forEach(row => {
                const matchS = !s || row.dataset.nom.includes(s) || row.dataset.email.includes(s);
                const matchA = !a
                    || (a === 'bloque' && row.dataset.bloque === 'bloque')
                    || (a !== 'bloque' && row.dataset.activite === a);

                row.style.display = (matchS && matchA) ? '' : 'none';
            });
        };

        search.addEventListener('input', filter);
        if (activite) activite.addEventListener('change', filter);
    },

    // ─────────────────────────────────────────────
    // FICHE ÉLÈVE DÉTAILLÉE
    // ─────────────────────────────────────────────
    async openFiche(userId) {
        Utils.showToast('Chargement de la fiche...', 'info');

        try {
            const [profileRes, progressRes, exercicesRes] = await Promise.all([
                supabaseClient.from('profiles').select('*').eq('id', userId).single(),
                supabaseClient.from('progressions_cours')
                    .select('*, cours(titre, matiere, image_url)')
                    .eq('user_id', userId)
                    .order('date_debut', { ascending: false })
                    .limit(8),
                supabaseClient.from('soumissions_exercices')
                    .select('est_reussi')
                    .eq('user_id', userId)
            ]);

            const eleve = profileRes.data;
            const progressions = progressRes.data || [];
            const exercices = exercicesRes.data || [];

            const coursTermines = progressions.filter(p => p.est_termine).length;
            const exercicesReussis = exercices.filter(e => e.est_reussi).length;
            const tauxReussite = exercices.length > 0
                ? Math.round((exercicesReussis / exercices.length) * 100) : 0;

            const initials = (eleve.nom || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

            const detailBody = document.getElementById('eleveDetailBody');
            if (!detailBody) return;

            detailBody.innerHTML = `
                <!-- Avatar + infos -->
                <div class="flex items-center gap-5 mb-6">
                    <div class="w-16 h-16 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-2xl flex-shrink-0 overflow-hidden">
                        ${eleve.avatar_url
                    ? `<img src="${eleve.avatar_url}" class="w-full h-full object-cover">`
                    : initials}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 flex-wrap">
                            <h3 class="text-xl font-bold text-white">${eleve.nom || 'Sans nom'}</h3>
                            ${eleve.est_bloque
                    ? '<span class="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-semibold flex items-center gap-1"><i data-lucide="slash" class="w-3 h-3"></i> Bloqué</span>'
                    : '<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Actif</span>'}
                        </div>
                        <p class="text-gray-400 text-sm">${eleve.email || ''}</p>
                        <p class="text-gray-500 text-xs mt-1">
                            Inscrit le ${Utils.formatDate(eleve.created_at)}
                            ${eleve.derniere_connexion
                    ? ` · Dernière connexion : ${Utils.formatDate(eleve.derniere_connexion)}`
                    : ' · Jamais connecté'}
                        </p>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div class="bg-slate-800/60 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-yellow-400">${eleve.points_total || 0}</div>
                        <div class="text-xs text-gray-400">Points XP</div>
                    </div>
                    <div class="bg-slate-800/60 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
                            ${eleve.streak_jours || 0} <i data-lucide="flame" class="w-5 h-5"></i>
                        </div>
                        <div class="text-xs text-gray-400">Streak</div>
                    </div>
                    <div class="bg-slate-800/60 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                            ${coursTermines} <i data-lucide="check-circle" class="w-5 h-5"></i>
                        </div>
                        <div class="text-xs text-gray-400">Cours terminés</div>
                    </div>
                    <div class="bg-slate-800/60 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-indigo-400">${tauxReussite}%</div>
                        <div class="text-xs text-gray-400">Taux de réussite</div>
                    </div>
                </div>

                <!-- Infos supplémentaires -->
                <div class="grid grid-cols-2 gap-3 mb-5 text-sm">
                    <div class="bg-slate-800/40 rounded-lg p-3">
                        <span class="ml-2 font-semibold text-white flex items-center gap-1">
                            <i data-lucide="${{ 'eleve': 'graduation-cap', 'dev-web': 'code-2', 'designer': 'palette' }[eleve.type_parcours] || 'user'}" class="w-3.5 h-3.5"></i>
                            ${{ 'eleve': 'Élève', 'dev-web': 'Dev-Web', 'designer': 'Designer' }[eleve.type_parcours] || 'Non défini'}
                        </span>
                    </div>
                    <div class="bg-slate-800/40 rounded-lg p-3">
                        <span class="text-gray-400">Exercices :</span>
                        <span class="ml-2 font-semibold text-white">${exercicesReussis} / ${exercices.length} réussis</span>
                    </div>
                    ${eleve.bio ? `
                    <div class="col-span-2 bg-slate-800/40 rounded-lg p-3">
                        <span class="text-gray-400">Bio :</span>
                        <span class="ml-2 text-gray-300">${eleve.bio}</span>
                    </div>` : ''}
                </div>

                <!-- Progression récente -->
                <h4 class="font-semibold text-gray-300 mb-3 text-sm">📚 Activité récente</h4>
                ${progressions.length === 0
                    ? '<p class="text-gray-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">Aucune progression enregistrée</p>'
                    : `<div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                        ${progressions.map(p => `
                            <div class="flex items-center gap-3 bg-slate-800/40 rounded-lg p-3">
                                ${p.cours?.image_url
                            ? `<img src="${p.cours.image_url}" class="w-10 h-10 rounded object-cover flex-shrink-0">`
                            : '<div class="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">📚</div>'}
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-white truncate">${p.cours?.titre || 'Cours inconnu'}</p>
                                    <p class="text-xs text-gray-500">${p.cours?.matiere || ''}</p>
                                </div>
                                <div class="text-right flex-shrink-0">
                                    <div class="text-xs font-semibold ${p.est_termine ? 'text-emerald-400' : 'text-orange-400'} flex items-center justify-end gap-1">
                                        ${p.est_termine ? '<i data-lucide="check-circle" class="w-3 h-3"></i> Terminé' : `${p.progression_pourcentage || 0}%`}
                                    </div>
                                    <div class="text-xs text-gray-500">${Utils.formatDate(p.date_debut)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }

                <!-- Boutons d'action -->
                <div class="mt-6 flex gap-3">
                    <button onclick="ElevesManager.toggleBlocage('${eleve.id}', ${!!eleve.est_bloque}); ElevesManager.closeFiche();"
                        class="flex-1 py-2.5 font-semibold rounded-lg transition text-sm text-white flex items-center justify-center gap-2
                        ${eleve.est_bloque ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}">
                        <i data-lucide="${eleve.est_bloque ? 'unlock' : 'lock'}" class="w-4 h-4"></i>
                        ${eleve.est_bloque ? 'Débloquer' : 'Bloquer'}
                    </button>
                    <button onclick="ElevesManager.closeFiche(); ElevesManager.openEditModal('${eleve.id}');"
                        class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2">
                        <i data-lucide="edit-2" class="w-4 h-4"></i> Modifier le profil
                    </button>
                </div>
            `;

            document.getElementById('eleveDetailModal').classList.remove('hidden');
            if (window.lucide) lucide.createIcons();

        } catch (error) {
            Utils.showToast('Erreur fiche : ' + error.message, 'error');
        }
    },

    closeFiche() {
        const modal = document.getElementById('eleveDetailModal');
        if (modal) modal.classList.add('hidden');
    },

    // ─────────────────────────────────────────────
    // MODAL ÉDITION
    // ─────────────────────────────────────────────
    async openEditModal(userId) {
        try {
            const { data: eleve, error } = await supabaseClient
                .from('profiles').select('*').eq('id', userId).single();

            if (error) throw error;

            document.getElementById('eleveEditContent').innerHTML = `
                <input type="hidden" id="editEleveId" value="${eleve.id}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                        <label class="block text-sm font-semibold text-gray-400 mb-2">👤 Nom complet</label>
                        <input id="editEleveNom" type="text" value="${eleve.nom || ''}"
                            class="input-dark w-full px-4 py-3 rounded-lg" placeholder="Nom complet">
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-400 mb-2">📧 Email (lecture seule)</label>
                        <input type="email" value="${eleve.email || ''}"
                            class="input-dark w-full px-4 py-3 rounded-lg opacity-50 cursor-not-allowed" readonly>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-400 mb-2">🎯 Parcours</label>
                        <select id="editEleveParcours" class="input-dark w-full px-4 py-3 rounded-lg">
                            <option value="">Non défini</option>
                            <option value="eleve"   ${eleve.type_parcours === 'eleve' ? 'selected' : ''}>Élève</option>
                            <option value="dev-web"  ${eleve.type_parcours === 'dev-web' ? 'selected' : ''}>Dev-Web</option>
                            <option value="designer" ${eleve.type_parcours === 'designer' ? 'selected' : ''}>Designer</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-400 mb-2">🏆 Points XP</label>
                        <input id="editElevePoints" type="number" min="0" value="${eleve.points_total || 0}"
                            class="input-dark w-full px-4 py-3 rounded-lg">
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-semibold text-gray-400 mb-2">📝 Bio</label>
                        <textarea id="editEleveBio" rows="3"
                            class="input-dark w-full px-4 py-3 rounded-lg resize-none"
                            placeholder="Bio de l'élève...">${eleve.bio || ''}</textarea>
                    </div>
                </div>

                <div class="flex items-center gap-2 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <input id="editEleveBloque" type="checkbox" ${eleve.est_bloque ? 'checked' : ''}
                        class="w-4 h-4 accent-red-500">
                    <label for="editEleveBloque" class="text-sm text-gray-300 cursor-pointer">
                        🚫 Bloquer cet élève (empêche l'accès à la plateforme)
                    </label>
                </div>
            `;

            document.getElementById('eleveEditModal').classList.remove('hidden');
            if (window.lucide) lucide.createIcons();

        } catch (error) {
            Utils.showToast('Erreur ouverture : ' + error.message, 'error');
        }
    },

    async saveEdit() {
        const userId = document.getElementById('editEleveId').value;
        const btn = document.getElementById('saveEditBtn');

        btn.disabled = true;
        btn.textContent = 'Enregistrement...';

        try {
            const updates = {
                nom: document.getElementById('editEleveNom').value.trim(),
                type_parcours: document.getElementById('editEleveParcours').value || null,
                points_total: parseInt(document.getElementById('editElevePoints').value) || 0,
                bio: document.getElementById('editEleveBio').value.trim() || null,
                est_bloque: document.getElementById('editEleveBloque').checked,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabaseClient
                .from('profiles').update(updates).eq('id', userId);

            if (error) throw error;

            Utils.showToast('Profil mis à jour !', 'success');
            document.getElementById('eleveEditModal').classList.add('hidden');
            await this.loadSection();

        } catch (error) {
            Utils.showToast('Erreur : ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Enregistrer';
        }
    },

    closeEditModal() {
        document.getElementById('eleveEditModal').classList.add('hidden');
    },

    // ─────────────────────────────────────────────
    // BLOCAGE / DÉBLOCAGE
    // ─────────────────────────────────────────────
    async toggleBlocage(userId, estBloque) {
        const action = estBloque ? 'débloquer' : 'bloquer';
        if (!confirm(`Voulez-vous ${action} cet élève ?`)) return;

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({ est_bloque: !estBloque, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            Utils.showToast(
                estBloque ? 'Élève débloqué !' : 'Élève bloqué !',
                estBloque ? 'success' : 'warning'
            );
            await this.loadSection();

        } catch (error) {
            Utils.showToast('Erreur : ' + error.message, 'error');
        }
    },

    // ─────────────────────────────────────────────
    // SUPPRESSION
    // ─────────────────────────────────────────────
    async deleteEleve(userId, nom) {
        if (!confirm(`⚠️ Supprimer définitivement "${nom}" ?\nToutes ses données seront perdues.`)) return;

        try {
            const { error } = await supabaseClient
                .from('profiles').delete().eq('id', userId);

            if (error) throw error;

            Utils.showToast('Élève supprimé', 'success');
            await this.loadSection();

        } catch (error) {
            Utils.showToast('Erreur suppression : ' + error.message, 'error');
        }
    },

    // ─────────────────────────────────────────────
    // EXPORT CSV
    // ─────────────────────────────────────────────
    exportCSV() {
        const rows = Array.from(document.querySelectorAll('.eleve-row'))
            .filter(r => r.style.display !== 'none');

        if (rows.length === 0) { Utils.showToast('Aucun élève à exporter', 'warning'); return; }

        let csv = 'Nom,Email,Parcours,Points,Streak,Statut,Inscription\n';
        rows.forEach(row => {
            const eleve = this.allEleves.find(e => e.id === row.dataset.id);
            if (!eleve) return;
            csv += `"${eleve.nom || ''}","${eleve.email || ''}","${eleve.type_parcours || ''}","${eleve.points_total || 0}","${eleve.streak_jours || 0}","${eleve.est_bloque ? 'Bloqué' : 'Actif'}","${Utils.formatDate(eleve.created_at)}"\n`;
        });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = `eleves_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Utils.showToast(`${rows.length} élève(s) exporté(s)`, 'success');
    }
};

// Aliases pour compatibilité avec index.html et switchSection
ElevesManager.render = () => ElevesManager.loadSection();
ElevesManager.closeDetailModal = () => ElevesManager.closeFiche();

// Exposer globalement
window.ElevesManager = ElevesManager;