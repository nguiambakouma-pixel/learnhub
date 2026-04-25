// ================================================
// views/professeurs.js — File de validation professeurs
// S'intègre dans le router admin KMERSCHOOL
// ================================================

export const professeursView = {

    // ─── État local ───────────────────────────────
    _currentProfId: null,
    _currentTab: 'validation',

    // ─── Render principal ──────────────────────────
    async render() {
        const container = document.getElementById('professeursContentArea');
        container.innerHTML = this._skeleton();
        this._attachEvents();
        await this._loadTab(this._currentTab);
    },

    // ─── Skeleton HTML ────────────────────────────
    _skeleton() {
        return `
    <div id="profs-root">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white" style="font-family:'Space Grotesk',sans-serif">
            Gestion Professeurs
          </h2>
          <p class="text-sm mt-1" style="color:#64748b">Validation des candidatures et des épreuves soumises</p>
        </div>
        <div class="flex gap-3">
          <div id="badge-pending" class="hidden items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:#f59e0b">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> <span id="pending-count">0</span> en attente
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 p-1 rounded-xl" style="background:rgba(14,22,40,.8);border:1px solid rgba(99,102,241,.12);width:fit-content">
        ${[
                ['validation', 'search', 'Candidatures'],
                ['epreuves', 'file-text', 'Épreuves'],
                ['cours', 'book-open', 'Cours'],
                ['actifs', 'check-circle', 'Actifs'],
                ['paiements', 'banknote', 'Paiements'],
            ].map(([id, ico, label]) => `
          <button data-tab="${id}" onclick="ProfView._loadTab('${id}')"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            style="font-family:'Space Grotesk',sans-serif">
            <i data-lucide="${ico}" class="w-4 h-4"></i> ${label}
          </button>
        `).join('')}
      </div>

      <!-- Alert -->
      <div id="profs-alert" class="hidden mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"></div>

      <!-- Content zone -->
      <div id="profs-content"></div>

      <!-- ═══ MODAL DÉTAIL PROF ═══ -->
      <div id="modal-prof" class="fixed inset-0 z-50 hidden items-center justify-center p-4"
        style="background:rgba(0,0,0,.75);backdrop-filter:blur(4px)">
        <div class="w-full max-w-2xl rounded-2xl overflow-hidden"
          style="background:#0e1628;border:1px solid rgba(99,102,241,.2);max-height:90vh;overflow-y:auto">
          <div id="modal-prof-body"></div>
        </div>
      </div>

      <!-- ═══ MODAL ÉPREUVE ═══ -->
      <div id="modal-epreuve" class="fixed inset-0 z-50 hidden items-center justify-center p-4"
        style="background:rgba(0,0,0,.75);backdrop-filter:blur(4px)">
        <div class="w-full max-w-3xl rounded-2xl overflow-hidden"
          style="background:#0e1628;border:1px solid rgba(99,102,241,.2);max-height:90vh;overflow-y:auto">
          <div id="modal-epreuve-body"></div>
        </div>
      </div>
      <!-- ═══ MODAL COURS ═══ -->
      <div id="modal-cours" class="fixed inset-0 z-50 hidden items-center justify-center p-4"
        style="background:rgba(0,0,0,.75);backdrop-filter:blur(4px)">
        <div class="w-full max-w-3xl rounded-2xl overflow-hidden"
          style="background:#0e1628;border:1px solid rgba(99,102,241,.2);max-height:90vh;overflow-y:auto">
          <div id="modal-cours-body"></div>
        </div>
      </div>

    </div>`;
    },

    // ─── Events ───────────────────────────────────
    _attachEvents() {
        window.ProfView = this;
        // Fermer modals au clic extérieur
        document.getElementById('modal-prof').onclick = (e) => {
            if (e.target.id === 'modal-prof') this._closeModal('modal-prof');
        };
        document.getElementById('modal-epreuve').onclick = (e) => {
            if (e.target.id === 'modal-epreuve') this._closeModal('modal-epreuve');
        };
        document.getElementById('modal-cours').onclick = (e) => {
            if (e.target.id === 'modal-cours') this._closeModal('modal-cours');
        };
    },

    // ─── Tab loader ───────────────────────────────
    async _loadTab(tab) {
        this._currentTab = tab;

        // Mettre à jour les boutons tabs
        document.querySelectorAll('[data-tab]').forEach(btn => {
            const active = btn.dataset.tab === tab;
            btn.style.background = active ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'transparent';
            btn.style.color = active ? '#fff' : '#64748b';
            btn.style.boxShadow = active ? '0 4px 12px rgba(99,102,241,.3)' : 'none';
        });

        const zone = document.getElementById('profs-content');
        zone.innerHTML = this._loadingHTML();

        if (tab === 'validation') await this._renderCandidatures(zone);
        if (tab === 'epreuves') await this._renderEpreuves(zone);
        if (tab === 'cours') await this._renderProposedCours(zone);
        if (tab === 'actifs') await this._renderActifs(zone);
        if (tab === 'paiements') await this._renderPaiements(zone);

        if (window.lucide) lucide.createIcons();
    },

    // ─────────────────────────────────────────────
    // TAB 1 — CANDIDATURES
    // ─────────────────────────────────────────────
    async _renderCandidatures(zone) {
        const { data, error } = await supabaseClient
            .from('professeurs')
            .select('id,nom,prenom,email,telephone,specialites,sous_systemes,annees_experience,etablissement,statut,created_at,taux_acceptation,epreuves_validees')
            .in('statut', ['en_attente', 'en_revision'])
            .order('created_at', { ascending: false });

        // Badge count
        const count = data?.length || 0;
        const badge = document.getElementById('badge-pending');
        document.getElementById('pending-count').textContent = count;
        badge.classList.toggle('hidden', count === 0);
        badge.classList.toggle('flex', count > 0);

        if (error || !data?.length) {
            zone.innerHTML = this._emptyHTML('smile', 'Aucune candidature en attente', 'Toutes les candidatures ont été traitées');
            return;
        }

        zone.innerHTML = `
      <div class="grid gap-4">
        ${data.map(p => this._candidatureCard(p)).join('')}
      </div>`;
    },

    _candidatureCard(p) {
        const initials = (p.prenom[0] + p.nom[0]).toUpperCase();
        const ssList = (p.sous_systemes || []).map(s =>
            `<span class="px-2 py-0.5 rounded-full text-xs" style="background:rgba(99,102,241,.15);color:#a5b4fc">${s}</span>`
        ).join('');
        const specs = (p.specialites || []).slice(0, 3).map(s =>
            `<span class="px-2 py-0.5 rounded-full text-xs" style="background:rgba(16,185,129,.1);color:#6ee7b7;border:1px solid rgba(16,185,129,.2)">${s}</span>`
        ).join('');

        return `
    <div class="rounded-xl p-5 flex items-start gap-4" style="background:rgba(14,22,40,.7);border:1px solid rgba(99,102,241,.12)">
      <!-- Avatar -->
      <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
        style="background:linear-gradient(135deg,#6366f1,#10b981);color:#fff">
        ${initials}
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-bold text-white" style="font-family:'Space Grotesk',sans-serif">
              ${p.prenom} ${p.nom}
            </div>
            <div class="text-sm" style="color:#64748b">${p.email}</div>
          </div>
          <div>${this._badgeStatut(p.statut)}</div>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2">
          ${ssList}
          ${specs}
        </div>
        <div class="flex items-center gap-4 mt-2 text-xs" style="color:#64748b">
          ${p.etablissement ? `<span class="flex items-center gap-1"><i data-lucide="school" class="w-3 h-3"></i> ${p.etablissement}</span>` : ''}
          ${p.annees_experience ? `<span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${p.annees_experience} ans exp.</span>` : ''}
          <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${this._fmtDate(p.created_at)}</span>
        </div>
      </div>
      <!-- Actions -->
      <div class="flex flex-col gap-2 flex-shrink-0">
        <button onclick="ProfView._openProfModal('${p.id}')"
          class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          style="background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);color:#a5b4fc">
          <i data-lucide="search" class="w-3.5 h-3.5"></i> Voir dossier
        </button>
        <button onclick="ProfView._approuver('${p.id}','${p.prenom} ${p.nom}')"
          class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7">
          <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Approuver
        </button>
        <button onclick="ProfView._rejeter('${p.id}','${p.prenom} ${p.nom}')"
          class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5">
          <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Rejeter
        </button>
      </div>
    </div>`;
    },

    // ─────────────────────────────────────────────
    // MODAL DOSSIER PROFESSEUR
    // ─────────────────────────────────────────────
    async _openProfModal(profId) {
        this._currentProfId = profId;
        const modal = document.getElementById('modal-prof');
        const body = document.getElementById('modal-prof-body');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        body.innerHTML = this._loadingHTML('Chargement du dossier...');
        if (window.lucide) lucide.createIcons();

        // Charger prof + documents
        const [{ data: prof }, { data: docs }] = await Promise.all([
            supabaseClient.from('professeurs').select('*').eq('id', profId).single(),
            supabaseClient.from('documents_verification').select('*').eq('prof_id', profId).order('soumis_le')
        ]);

        // Générer des URLs signées pour les documents (car bucket privé)
        if (docs && docs.length > 0) {
            for (let d of docs) {
                // Si c'est un chemin (nouvelle logique) ou une ancienne URL cassée
                // on génère une URL signée (valide 1h)
                const isPath = d.url_fichier && !d.url_fichier.startsWith('http');
                const bucket = 'prof-documents'; // Reverted to the original bucket name
                
                if (isPath) {
                    const { data } = await supabaseClient.storage.from(bucket).createSignedUrl(d.url_fichier, 3600);
                    d.url_view = data?.signedUrl || '#';
                } else {
                    // Pour la transition, on essaie quand même de signer si c'est une URL du bucket
                    // mais pour l'instant on garde l'originale si c'est déjà une URL
                    d.url_view = d.url_fichier;
                }
            }
        }

        if (!prof) { body.innerHTML = '<p class="p-8 text-center text-red-400">Erreur chargement</p>'; return; }

        const initials = (prof.prenom[0] + prof.nom[0]).toUpperCase();
        body.innerHTML = `
      <!-- Header modal -->
      <div class="flex items-center justify-between p-5" style="border-bottom:1px solid rgba(99,102,241,.15)">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style="background:linear-gradient(135deg,#6366f1,#10b981);color:#fff">${initials}</div>
          <div>
            <div class="font-bold text-white">${prof.prenom} ${prof.nom}</div>
            <div class="text-xs" style="color:#64748b">${prof.email}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${this._badgeStatut(prof.statut)}
          <button onclick="ProfView._closeModal('modal-prof')"
            class="p-1.5 rounded-lg" style="background:rgba(255,255,255,.05);border:none;color:#64748b;cursor:pointer;font-size:1.2rem">×</button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-5">

        <!-- Infos pro -->
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-3" style="color:#6366f1">Informations</div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            ${[
                ['phone', 'Téléphone', prof.telephone || '—'],
                ['school', 'Établissement', prof.etablissement || '—'],
                ['calendar', 'Expérience', prof.annees_experience ? prof.annees_experience + ' ans' : '—'],
                ['clock', 'Début', this._fmtDate(prof.created_at)],
            ].map(([ico, k, v]) => `
              <div class="p-3 rounded-lg flex items-center gap-3" style="background:rgba(6,11,22,.5);border:1px solid rgba(255,255,255,.05)">
                <i data-lucide="${ico}" class="w-4 h-4" style="color:#64748b"></i>
                <div>
                  <div class="text-xs mb-0.5" style="color:#64748b">${k}</div>
                  <div class="font-medium text-white">${v}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Spécialités -->
        ${prof.specialites?.length ? `
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-2" style="color:#6366f1">Spécialités</div>
          <div class="flex flex-wrap gap-1.5">
            ${prof.specialites.map(s => `<span class="px-2 py-1 rounded-full text-xs" style="background:rgba(16,185,129,.1);color:#6ee7b7;border:1px solid rgba(16,185,129,.2)">${s}</span>`).join('')}
          </div>
        </div>` : ''}

        <!-- Bio -->
        ${prof.bio ? `
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-2" style="color:#6366f1">Présentation</div>
          <p class="text-sm leading-relaxed p-3 rounded-lg" style="color:#94a3b8;background:rgba(6,11,22,.5);border:1px solid rgba(255,255,255,.05)">${prof.bio}</p>
        </div>` : ''}

        <!-- Documents KYC -->
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-3" style="color:#6366f1">Documents soumis</div>
          ${docs?.length ? `
            <div class="space-y-2">
              ${docs.map(d => `
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <i data-lucide="${this._docIcon(d.type_document)}" class="w-6 h-6"></i>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-white">${this._docLabel(d.type_document)}</div>
                    <div class="text-xs" style="color:#64748b">${d.nom_fichier} · ${this._fmtSize(d.taille_octets)}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  ${this._badgeDoc(d.statut)}
                  <a href="${d.url_view || d.url_fichier}" target="_blank"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    style="background:rgba(99,102,241,.15);color:#a5b4fc;text-decoration:none">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> Voir
                  </a>
                </div>
              </div>`).join('')}
            </div>
          ` : `<p class="text-sm" style="color:#64748b">Aucun document soumis</p>`}
        </div>

        <!-- Note admin si rejeté -->
        ${prof.statut === 'rejete' && prof.motif_rejet ? `
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-2" style="color:#ef4444">Motif de rejet</div>
          <p class="text-sm p-3 rounded-lg" style="color:#fca5a5;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2)">${prof.motif_rejet}</p>
        </div>` : ''}

      </div>

      <!-- Footer modal -->
      ${['en_attente', 'en_revision'].includes(prof.statut) ? `
      <div class="flex gap-3 p-5" style="border-top:1px solid rgba(99,102,241,.12)">
        <button onclick="ProfView._approuver('${prof.id}','${prof.prenom} ${prof.nom}')"
          class="flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7">
          <i data-lucide="check-circle" class="w-4 h-4"></i> Approuver le compte
        </button>
        <button onclick="ProfView._rejeter('${prof.id}','${prof.prenom} ${prof.nom}')"
          class="flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5">
          <i data-lucide="x-circle" class="w-4 h-4"></i> Rejeter la candidature
        </button>
      </div>` : ''}
    `;
    },

    // ─────────────────────────────────────────────
    // TAB 1.5 — COURS PROPOSÉS
    // ─────────────────────────────────────────────
    async _renderProposedCours(zone) {
        const { data: courses, error: cError } = await supabaseClient
            .from('cours')
            .select(`
                id, titre, matiere, chapitre, type_contenu, duree_lecture, 
                points_recompense, est_publie, created_at, soumis_par
            `)
            .eq('est_publie', false)
            .not('soumis_par', 'is', null)
            .order('created_at', { ascending: true });

        if (cError || !courses?.length) {
            zone.innerHTML = this._emptyHTML('book-x', 'Aucun cours en attente', 'Tous les cours proposés ont été traités');
            return;
        }

        // Fetch professors separately since no direct FK
        const profIds = [...new Set(courses.map(c => c.soumis_par))];
        const { data: profs } = await supabaseClient
            .from('professeurs')
            .select('id, nom, prenom, email')
            .in('id', profIds);

        const profMap = (profs || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

        zone.innerHTML = `
      <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(99,102,241,.12)">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(6,11,22,.6)">
              ${['Professeur', 'Titre', 'Matière', 'Chapitre', 'Type', 'XP', 'Soumis le', 'Actions']
                .map(h => `<th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style="color:#64748b;border-bottom:1px solid rgba(99,102,241,.1)">${h}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${courses.map((c, i) => {
                const prof = profMap[c.soumis_par] || { nom: 'Inconnu', prenom: '', email: '—' };
                return `
            <tr style="${i % 2 === 0 ? 'background:rgba(14,22,40,.4)' : 'background:rgba(14,22,40,.7)'}">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-white">${prof.prenom} ${prof.nom}</div>
                <div class="text-xs" style="color:#64748b">${prof.email}</div>
              </td>
              <td class="px-4 py-3 text-sm text-white" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.titre}</td>
              <td class="px-4 py-3 text-sm" style="color:#94a3b8">${c.matiere}</td>
              <td class="px-4 py-3 text-sm" style="color:#64748b">${c.chapitre || '—'}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-xs" style="background:rgba(99,102,241,.12);color:#a5b4fc">${c.type_contenu === 'video' ? '🎥 Vidéo' : '📄 Texte'}</span>
              </td>
              <td class="px-4 py-3 text-sm font-bold" style="color:#f59e0b">${c.points_recompense} XP</td>
              <td class="px-4 py-3 text-xs" style="color:#64748b">${this._fmtDate(c.created_at)}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1.5">
                  <button onclick="ProfView._openCoursModal('${c.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                    style="background:rgba(99,102,241,.12);border:none;color:#a5b4fc;cursor:pointer">
                    👁️ Voir
                  </button>
                  <button onclick="ProfView._validerCours('${c.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                    style="background:rgba(16,185,129,.12);border:none;color:#6ee7b7;cursor:pointer">
                    ✅
                  </button>
                  <button onclick="ProfView._rejeterCours('${c.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                    style="background:rgba(239,68,68,.1);border:none;color:#fca5a5;cursor:pointer">
                    ❌
                  </button>
                </div>
              </td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>`;
    },

    // ─────────────────────────────────────────────
    // MODAL COURS — Prévisualisation
    // ─────────────────────────────────────────────
    async _openCoursModal(coursId) {
        const modal = document.getElementById('modal-cours');
        const body = document.getElementById('modal-cours-body');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        body.innerHTML = this._loadingHTML('Chargement du cours...');

        const { data: c, error } = await supabaseClient
            .from('cours')
            .select(`
                *,
                sous_systeme:sous_systemes(nom_fr),
                serie:series_specialites(nom_fr, niveau:niveaux_scolaires(nom_fr))
            `)
            .eq('id', coursId)
            .single();

        if (error) {
            console.error('Erreur detal cours:', error);
            body.innerHTML = `<p class="p-8 text-center text-red-400">Erreur chargement: ${error.message}</p>`;
            return;
        }
        if (!c) {
            body.innerHTML = '<p class="p-8 text-center text-red-400">Cours introuvable</p>';
            return;
        }

        // Fetch professor separately
        const { data: prof } = await supabaseClient
            .from('professeurs')
            .select('nom, prenom, email')
            .eq('id', c.soumis_par)
            .single();

        body.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between p-5" style="border-bottom:1px solid rgba(99,102,241,.15)">
        <div>
          <div class="font-bold text-white text-lg" style="font-family:'Space Grotesk',sans-serif">${c.titre}</div>
          <div class="text-xs mt-1 flex items-center gap-2" style="color:#64748b">
            <span>Par ${prof?.prenom || ''} ${prof?.nom || 'Inconnu'}</span>
            <span>·</span>
            <span>${c.matiere}</span>
            <span>·</span>
            <span>${c.chapitre || '—'}</span>
          </div>
        </div>
        <button onclick="ProfView._closeModal('modal-cours')"
          style="background:rgba(255,255,255,.05);border:none;color:#64748b;cursor:pointer;font-size:1.2rem;padding:.3rem .5rem;border-radius:.4rem">×</button>
      </div>

      <div class="p-5 space-y-6">
        <!-- Infos -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${[
                ['📋 Type', c.type_contenu === 'video' ? 'Vidéo' : 'Texte'],
                ['🌍 Système', c.sous_systeme?.nom_fr],
                ['🎓 Niveau', c.serie?.niveau?.nom_fr],
                ['🎯 Série', c.serie?.nom_fr],
            ].filter(d => d[1]).map(([k, v]) => `
            <div class="p-3 rounded-lg" style="background:rgba(6,11,22,.5);border:1px solid rgba(255,255,255,.05)">
              <div class="text-[10px] uppercase font-bold tracking-wider mb-1" style="color:#64748b">${k}</div>
              <div class="text-sm font-semibold text-white">${v}</div>
            </div>`).join('')}
        </div>

        <!-- Media -->
        ${c.video_url ? `
        <div class="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5">
          <iframe src="${this._getEmbedUrl(c.video_url)}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
        </div>` : ''}

        ${c.image_url ? `
        <div class="w-full rounded-xl overflow-hidden border border-white/5">
          <img src="${c.image_url}" class="w-full h-auto" />
        </div>` : ''}

        <!-- Contenu -->
        <div class="p-5 rounded-xl border border-white/5 bg-white/5">
          <div class="text-xs font-bold uppercase tracking-widest mb-4" style="color:#6366f1">Contenu du cours</div>
          <div class="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed">
            ${c.contenu}
          </div>
        </div>

        ${c.pdf_url ? `
        <div class="flex items-center justify-between p-4 rounded-xl" style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2)">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <i data-lucide="file-text"></i>
            </div>
            <div>
              <div class="text-sm font-bold text-white">Support PDF joint</div>
              <div class="text-xs text-indigo-300/60">Documentation complémentaire</div>
            </div>
          </div>
          <a href="${c.pdf_url}" target="_blank" class="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition">Voir le PDF</a>
        </div>` : ''}

      </div>

      <!-- Footer -->
      <div class="p-5 flex gap-3" style="border-top:1px solid rgba(99,102,241,.12)">
        <button onclick="ProfView._validerCours('${c.id}')"
          class="flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7">
          <i data-lucide="check-circle" class="w-5 h-5"></i> Valider et Publier
        </button>
        <button onclick="ProfView._rejeterCours('${c.id}')"
          class="flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5">
          <i data-lucide="x-circle" class="w-5 h-5"></i> Rejeter
        </button>
      </div>
    `;
        if (window.lucide) lucide.createIcons();
    },

    async _validerCours(coursId) {
        if (!confirm('Voulez-vous valider et publier ce cours ?')) return;
        const { error } = await supabaseClient
            .from('cours')
            .update({ est_publie: true })
            .eq('id', coursId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');
        this._showAlert('✅ Cours validé et publié avec succès', 'success');
        this._closeModal('modal-cours');
        await this._loadTab('cours');
    },

    async _rejeterCours(coursId) {
        if (!confirm('Voulez-vous rejeter ce cours ? Il ne sera pas publié.')) return;
        // Pour l'instant on se contente de le laisser en est_publie: false
        // Mais on pourrait ajouter un champ statut_validation si dispo
        this._showAlert('ℹ️ Cours non publié (toujours en attente)', 'warning');
        this._closeModal('modal-cours');
    },

    _getEmbedUrl(url) {
        if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
        if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
        return url;
    },

    // ─────────────────────────────────────────────
    // TAB 2 — ÉPREUVES SOUMISES
    // ─────────────────────────────────────────────
    async _renderEpreuves(zone) {
        const { data, error } = await supabaseClient
            .from('soumissions_epreuves')
            .select(`
        id, titre, matiere, type_examen, sous_systeme_code, duree_minutes,
        note_totale, statut, soumis_le, remuneration_due, remuneration_versee,
        commentaire_admin,
        prof:professeurs(nom, prenom, email)
      `)
            .in('statut', ['soumis', 'en_revision'])
            .order('soumis_le', { ascending: true });

        if (error || !data?.length) {
            zone.innerHTML = this._emptyHTML('clipboard-x', 'Aucune épreuve en attente', 'Toutes les soumissions ont été traitées');
            return;
        }

        zone.innerHTML = `
      <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(99,102,241,.12)">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(6,11,22,.6)">
              ${['Professeur', 'Titre', 'Matière', 'Type', 'Durée', 'Barème', 'Rémun.', 'Soumis le', 'Actions']
                .map(h => `<th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style="color:#64748b;border-bottom:1px solid rgba(99,102,241,.1)">${h}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((e, i) => `
            <tr style="${i % 2 === 0 ? 'background:rgba(14,22,40,.4)' : 'background:rgba(14,22,40,.7)'}">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-white">${e.prof?.prenom} ${e.prof?.nom}</div>
                <div class="text-xs" style="color:#64748b">${e.prof?.email}</div>
              </td>
              <td class="px-4 py-3 text-sm text-white" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.titre}</td>
              <td class="px-4 py-3 text-sm" style="color:#94a3b8">${e.matiere}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium" style="background:rgba(99,102,241,.12);color:#a5b4fc">${e.type_examen}</span>
              </td>
              <td class="px-4 py-3 text-sm" style="color:#94a3b8">${e.duree_minutes} min</td>
              <td class="px-4 py-3 text-sm" style="color:#94a3b8">${e.note_totale}/20</td>
              <td class="px-4 py-3 text-sm font-bold" style="color:#f59e0b">${parseFloat(e.remuneration_due || 0).toLocaleString('fr-FR')} XAF</td>
              <td class="px-4 py-3 text-xs" style="color:#64748b">${this._fmtDate(e.soumis_le)}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1.5">
                  <button onclick="ProfView._openEpreuveModal('${e.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                    style="background:rgba(99,102,241,.12);border:none;color:#a5b4fc;cursor:pointer"
                    onmouseover="this.style.background='rgba(99,102,241,.25)'"
                    onmouseout="this.style.background='rgba(99,102,241,.12)'">
                    👁️ Voir
                  </button>
                  <button onclick="ProfView._validerEpreuve('${e.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                    style="background:rgba(16,185,129,.12);border:none;color:#6ee7b7;cursor:pointer"
                    onmouseover="this.style.background='rgba(16,185,129,.25)'"
                    onmouseout="this.style.background='rgba(16,185,129,.12)'">
                    ✅
                  </button>
                  <button onclick="ProfView._rejeterEpreuve('${e.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                    style="background:rgba(239,68,68,.1);border:none;color:#fca5a5;cursor:pointer"
                    onmouseover="this.style.background='rgba(239,68,68,.2)'"
                    onmouseout="this.style.background='rgba(239,68,68,.1)'">
                    ❌
                  </button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    },

    // ─────────────────────────────────────────────
    // MODAL ÉPREUVE — Prévisualisation complète
    // ─────────────────────────────────────────────
    async _openEpreuveModal(epreuveId) {
        const modal = document.getElementById('modal-epreuve');
        const body = document.getElementById('modal-epreuve-body');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        body.innerHTML = this._loadingHTML('Chargement de l\'épreuve...');

        const { data: ep, error } = await supabaseClient
            .from('soumissions_epreuves')
            .select('*, prof:professeurs(nom,prenom,email,specialites)')
            .eq('id', epreuveId)
            .single();

        if (error || !ep) { body.innerHTML = '<p class="p-8 text-center text-red-400">Erreur chargement</p>'; return; }

        const questions = ep.contenu_json?.questions || [];

        body.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between p-5" style="border-bottom:1px solid rgba(99,102,241,.15)">
        <div>
          <div class="font-bold text-white text-lg" style="font-family:'Space Grotesk',sans-serif">${ep.titre}</div>
          <div class="text-xs mt-1 flex items-center gap-2" style="color:#64748b">
            <span>Par ${ep.prof?.prenom} ${ep.prof?.nom}</span>
            <span>·</span>
            <span>${ep.matiere}</span>
            <span>·</span>
            <span>${ep.duree_minutes} min</span>
            <span>·</span>
            <span>${ep.note_totale} pts</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${this._badgeStatutEp(ep.statut)}
          <button onclick="ProfView._closeModal('modal-epreuve')"
            style="background:rgba(255,255,255,.05);border:none;color:#64748b;cursor:pointer;font-size:1.2rem;padding:.3rem .5rem;border-radius:.4rem">×</button>
        </div>
      </div>

      <div class="p-5 space-y-4">

        <!-- Meta chips -->
        <div class="flex flex-wrap gap-2">
          ${[
                ['📋', ep.type_examen],
                ['🌍', ep.sous_systeme_code],
                ep.niveau_code ? ['🎓', ep.niveau_code] : null,
                ep.serie_code ? ['🎯', ep.serie_code] : null,
            ].filter(Boolean).map(([ico, val]) =>
                `<span class="px-2.5 py-1 rounded-full text-xs font-semibold" style="background:rgba(99,102,241,.12);color:#a5b4fc">${ico} ${val}</span>`
            ).join('')}
        </div>

        <!-- Description -->
        ${ep.description ? `
        <div class="p-3 rounded-lg text-sm leading-relaxed" style="background:rgba(6,11,22,.5);color:#94a3b8;border:1px solid rgba(255,255,255,.05)">
          ${ep.description}
        </div>` : ''}

        <!-- Rémunération -->
        <div class="flex items-center justify-between p-3 rounded-lg" style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15)">
          <span class="text-sm font-semibold" style="color:#f59e0b">💰 Rémunération à verser</span>
          <span class="font-bold text-xl" style="color:#f59e0b">${parseFloat(ep.remuneration_due || 0).toLocaleString('fr-FR')} XAF</span>
        </div>

        <!-- Questions -->
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-3" style="color:#6366f1">
            Questions (${questions.length})
          </div>
          ${questions.length ? questions.map((q, i) => `
          <div class="mb-3 p-3 rounded-lg" style="background:rgba(6,11,22,.5);border:1px solid rgba(255,255,255,.05)">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="text-sm font-medium text-white"><span style="color:#6366f1">Q${i + 1}.</span> ${q.question_texte || '<em style="color:#64748b">Énoncé vide</em>'}</div>
              <div class="flex-shrink-0 flex items-center gap-1.5">
                <span class="text-xs px-2 py-0.5 rounded" style="background:rgba(245,158,11,.1);color:#f59e0b">${q.points || 1} pt${(q.points || 1) > 1 ? 's' : ''}</span>
                <span class="text-xs px-2 py-0.5 rounded" style="background:rgba(99,102,241,.1);color:#a5b4fc">${this._typeLabel(q.type_question)}</span>
              </div>
            </div>
            ${q.choix?.length ? `
            <div class="space-y-1 ml-4">
              ${q.choix.map(c => `
              <div class="flex items-center gap-2 text-sm">
                <span style="color:${c.est_correct ? '#10b981' : '#64748b'}">${c.est_correct ? '✅' : '○'}</span>
                <span style="color:${c.est_correct ? '#6ee7b7' : '#94a3b8'}">${c.texte || '—'}</span>
              </div>`).join('')}
            </div>` : ''}
          </div>`).join('') : `<p class="text-sm" style="color:#64748b">Aucune question dans cette épreuve</p>`}
        </div>

        <!-- Commentaire admin existant -->
        ${ep.commentaire_admin ? `
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-2" style="color:#64748b">Commentaire précédent</div>
          <p class="text-sm p-3 rounded-lg" style="color:#94a3b8;background:rgba(6,11,22,.5);border:1px solid rgba(255,255,255,.05)">${ep.commentaire_admin}</p>
        </div>` : ''}

      </div>

      <!-- Footer actions -->
      ${['soumis', 'en_revision'].includes(ep.statut) ? `
      <div class="p-5 space-y-3" style="border-top:1px solid rgba(99,102,241,.12)">
        <textarea id="ep-comment" placeholder="Commentaire pour le professeur (optionnel)..."
          class="w-full text-sm p-3 rounded-lg outline-none"
          style="background:rgba(6,11,22,.6);border:1px solid rgba(255,255,255,.07);color:#e2e8f0;min-height:70px;resize:vertical;font-family:'DM Sans',sans-serif"></textarea>
        <div class="flex gap-3">
          <button onclick="ProfView._validerEpreuve('${ep.id}')"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
            style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7">
            <i data-lucide="check-circle" class="w-4 h-4"></i> Valider l'épreuve
          </button>
          <button onclick="ProfView._rejeterEpreuve('${ep.id}')"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
            style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5">
            <i data-lucide="x-circle" class="w-4 h-4"></i> Rejeter l'épreuve
          </button>
        </div>
      </div>` : ''}
    `;
    },

    // ─────────────────────────────────────────────
    // TAB 3 — PROFESSEURS ACTIFS
    // ─────────────────────────────────────────────
    async _renderActifs(zone) {
        const { data, error } = await supabaseClient
            .from('professeurs')
            .select('id,nom,prenom,email,specialites,sous_systemes,statut,est_actif,est_verifie,gains_total,gains_en_attente,gains_verses,epreuves_soumises,epreuves_validees,taux_acceptation,created_at')
            .eq('statut', 'approuve')
            .order('created_at', { ascending: false });

        if (error || !data?.length) {
            zone.innerHTML = this._emptyHTML('users', 'Aucun professeur actif', 'Approuvez des candidatures pour les voir ici');
            return;
        }

        zone.innerHTML = `
      <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(99,102,241,.12)">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(6,11,22,.6)">
              ${['Professeur', 'Sous-système', 'Épreuves', 'Taux validation', 'Gains totaux', 'En attente', 'Actions']
                .map(h => `<th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style="color:#64748b;border-bottom:1px solid rgba(99,102,241,.1)">${h}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((p, i) => `
            <tr style="${i % 2 === 0 ? 'background:rgba(14,22,40,.4)' : 'background:rgba(14,22,40,.7)'}">
              <td class="px-4 py-3">
                <div class="text-sm font-bold text-white">${p.prenom} ${p.nom}</div>
                <div class="text-xs" style="color:#64748b">${p.email}</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  ${(p.sous_systemes || []).map(s => `<span class="px-1.5 py-0.5 rounded text-xs" style="background:rgba(99,102,241,.12);color:#a5b4fc">${s}</span>`).join('')}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-white">
                <span style="color:#6ee7b7">${p.epreuves_validees || 0}</span>
                <span style="color:#64748b"> / ${p.epreuves_soumises || 0}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 rounded-full" style="background:rgba(255,255,255,.06);max-width:80px">
                    <div class="h-1.5 rounded-full" style="background:#10b981;width:${Math.min(p.taux_acceptation || 0, 100)}%"></div>
                  </div>
                  <span class="text-xs font-bold" style="color:#6ee7b7">${p.taux_acceptation || 0}%</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm font-bold" style="color:#f59e0b">${parseFloat(p.gains_total || 0).toLocaleString('fr-FR')} XAF</td>
              <td class="px-4 py-3 text-sm" style="color:#94a3b8">${parseFloat(p.gains_en_attente || 0).toLocaleString('fr-FR')} XAF</td>
              <td class="px-4 py-3">
                <div class="flex gap-1.5">
                  <button onclick="ProfView._openProfModal('${p.id}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                    style="background:rgba(99,102,241,.12);border:none;color:#a5b4fc;cursor:pointer">
                    👁️
                  </button>
                  <button onclick="ProfView._toggleSuspend('${p.id}', ${p.est_actif}, '${p.prenom} ${p.nom}')"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                    style="background:${p.est_actif ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)'};border:none;color:${p.est_actif ? '#fca5a5' : '#6ee7b7'};cursor:pointer">
                    ${p.est_actif ? '🚫 Suspendre' : '✅ Réactiver'}
                  </button>
                  <button onclick="ProfView._openPaiementModal('${p.id}','${p.prenom} ${p.nom}',${p.gains_en_attente || 0})"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                    style="background:rgba(245,158,11,.1);border:none;color:#f59e0b;cursor:pointer">
                    💰 Payer
                  </button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    },

    // ─────────────────────────────────────────────
    // TAB 4 — PAIEMENTS ADMIN
    // ─────────────────────────────────────────────
    async _renderPaiements(zone) {
        const { data, error } = await supabaseClient
            .from('paiements_professeurs')
            .select('*, prof:professeurs(nom,prenom,email)')
            .order('date_paiement', { ascending: false })
            .limit(100);

        if (error || !data?.length) {
            zone.innerHTML = this._emptyHTML('banknote', 'Aucun paiement enregistré', 'Les paiements apparaîtront ici');
            return;
        }

        // Totaux
        const totalConfirme = data.filter(p => p.statut === 'confirme').reduce((s, p) => s + parseFloat(p.montant), 0);
        const totalAttente = data.filter(p => p.statut === 'en_attente').reduce((s, p) => s + parseFloat(p.montant), 0);

        zone.innerHTML = `
      <!-- Résumé -->
      <div class="grid grid-cols-3 gap-4 mb-5">
        ${[
                ['Total versé', totalConfirme, '#10b981'],
                ['En attente', totalAttente, '#f59e0b'],
                ['Nb paiements', data.length, '#818cf8'],
            ].map(([label, val, color]) => `
        <div class="p-4 rounded-xl" style="background:rgba(14,22,40,.7);border:1px solid rgba(99,102,241,.12)">
          <div class="text-xs mb-1" style="color:#64748b">${label}</div>
          <div class="font-bold text-xl" style="color:${color}">
            ${typeof val === 'number' && val > 99 ? val.toLocaleString('fr-FR') + ' XAF' : val}
          </div>
        </div>`).join('')}
      </div>

      <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(99,102,241,.12)">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(6,11,22,.6)">
              ${['Professeur', 'Montant', 'Mode', 'Référence', 'Statut', 'Période', 'Date', 'Actions']
                .map(h => `<th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style="color:#64748b;border-bottom:1px solid rgba(99,102,241,.1)">${h}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((p, i) => `
            <tr style="${i % 2 === 0 ? 'background:rgba(14,22,40,.4)' : 'background:rgba(14,22,40,.7)'}">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-white">${p.prof?.prenom} ${p.prof?.nom}</div>
              </td>
              <td class="px-4 py-3 text-sm font-bold" style="color:#f59e0b">${parseFloat(p.montant).toLocaleString('fr-FR')} ${p.devise}</td>
              <td class="px-4 py-3 text-xs" style="color:#94a3b8">${this._formatMode(p.mode_paiement)}</td>
              <td class="px-4 py-3 text-xs font-mono" style="color:#64748b">${p.reference || '—'}</td>
              <td class="px-4 py-3">${this._badgePay(p.statut)}</td>
              <td class="px-4 py-3 text-xs" style="color:#64748b">${p.periode_debut ? this._fmtDate(p.periode_debut) + ' → ' + this._fmtDate(p.periode_fin) : '—'}</td>
              <td class="px-4 py-3 text-xs" style="color:#64748b">${this._fmtDate(p.date_paiement)}</td>
              <td class="px-4 py-3">
                ${p.statut === 'traite' ? `
                <button onclick="ProfView._confirmerPaiement('${p.id}')"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-bold"
                  style="background:rgba(16,185,129,.12);border:none;color:#6ee7b7;cursor:pointer">
                  ✅ Confirmer
                </button>` : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    },

    // ─────────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────────
    async _approuver(profId, name) {
        if (!confirm(`Approuver le compte de ${name} ?`)) return;
        const { error } = await supabaseClient
            .from('professeurs')
            .update({ statut: 'approuve', est_verifie: true, verifie_le: new Date().toISOString() })
            .eq('id', profId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');
        this._showAlert(`✅ ${name} approuvé(e) — son compte est maintenant actif`, 'success');
        this._closeModal('modal-prof');
        await this._loadTab('validation');
    },

    async _rejeter(profId, name) {
        const motif = prompt(`Motif du rejet pour ${name} (sera envoyé au professeur) :`);
        if (motif === null) return;
        const { error } = await supabaseClient
            .from('professeurs')
            .update({ statut: 'rejete', motif_rejet: motif || 'Dossier incomplet' })
            .eq('id', profId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');
        this._showAlert(`❌ Candidature de ${name} rejetée`, 'warning');
        this._closeModal('modal-prof');
        await this._loadTab('validation');
    },

    async _validerEpreuve(epreuveId) {
        const comment = document.getElementById('ep-comment')?.value?.trim() || null;
        if (!confirm('Valider cette épreuve et déclencher la rémunération ?')) return;

        // Récupérer l'épreuve pour avoir remuneration_due et prof_id
        const { data: ep } = await supabaseClient
            .from('soumissions_epreuves')
            .select('prof_id, remuneration_due, titre')
            .eq('id', epreuveId)
            .single();

        const { error } = await supabaseClient
            .from('soumissions_epreuves')
            .update({
                statut: 'valide',
                commentaire_admin: comment,
                valide_le: new Date().toISOString()
            })
            .eq('id', epreuveId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');

        // Mettre à jour les gains du prof (RPC ou update direct)
        if (ep?.prof_id && ep?.remuneration_due > 0) {
            await supabaseClient.rpc('incrementer_gains_prof', {
                p_prof_id: ep.prof_id,
                p_montant: ep.remuneration_due
            }).catch(() => {
                // RPC optionnelle — fallback silencieux
            });
        }

        this._showAlert('✅ Épreuve validée et rémunération enregistrée', 'success');
        this._closeModal('modal-epreuve');
        await this._loadTab('epreuves');
    },

    async _rejeterEpreuve(epreuveId) {
        const comment = document.getElementById('ep-comment')?.value?.trim();
        if (!comment) {
            const c = prompt('Motif du rejet (obligatoire pour le professeur) :');
            if (!c) return;
            document.getElementById('ep-comment') && (document.getElementById('ep-comment').value = c);
        }
        const finalComment = document.getElementById('ep-comment')?.value?.trim() || comment;
        if (!confirm('Rejeter cette épreuve ?')) return;

        const { error } = await supabaseClient
            .from('soumissions_epreuves')
            .update({ statut: 'rejete', commentaire_admin: finalComment })
            .eq('id', epreuveId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');
        this._showAlert('❌ Épreuve rejetée — le professeur sera notifié', 'warning');
        this._closeModal('modal-epreuve');
        await this._loadTab('epreuves');
    },

    async _toggleSuspend(profId, estActif, name) {
        const action = estActif ? 'suspendre' : 'réactiver';
        if (!confirm(`Voulez-vous ${action} le compte de ${name} ?`)) return;
        const { error } = await supabaseClient
            .from('professeurs')
            .update({ est_actif: !estActif, statut: !estActif ? 'approuve' : 'suspendu' })
            .eq('id', profId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');
        this._showAlert('Compte de ' + name + (estActif ? ' suspendu' : ' réactivé'), 'success');
        await this._loadTab('actifs');
    },

    _openPaiementModal(profId, name, gainsEnAttente) {
        const montant = parseFloat(gainsEnAttente).toLocaleString('fr-FR');
        const mode = prompt(`Déclencher un paiement pour ${name}\nGains en attente : ${montant} XAF\n\nMode (mtn_mobile_money / orange_money / virement_bancaire / especes) :`);
        if (!mode) return;
        const ref = prompt('Référence de la transaction :') || null;
        this._creerPaiement(profId, gainsEnAttente, mode, ref);
    },

    async _creerPaiement(profId, montant, mode, reference) {
        if (montant <= 0) return this._showAlert('❌ Aucun gain en attente pour ce professeur', 'error');

        const { error } = await supabaseClient.from('paiements_professeurs').insert({
            prof_id: profId,
            montant: montant,
            devise: 'XAF',
            mode_paiement: mode,
            reference: reference || null,
            statut: 'traite'
        });

        if (error) return this._showAlert('❌ Erreur création paiement : ' + error.message, 'error');

        // Mettre à jour gains prof
        await supabaseClient.from('professeurs').update({
            gains_en_attente: 0,
            gains_verses: supabaseClient.rpc ? undefined : montant
        }).eq('id', profId).catch(() => { });

        this._showAlert('✅ Paiement enregistré — statut : Traité', 'success');
        await this._loadTab('paiements');
    },

    async _confirmerPaiement(paiementId) {
        if (!confirm('Confirmer ce paiement comme effectué ?')) return;
        const { error } = await supabaseClient
            .from('paiements_professeurs')
            .update({ statut: 'confirme', updated_at: new Date().toISOString() })
            .eq('id', paiementId);

        if (error) return this._showAlert('❌ Erreur : ' + error.message, 'error');
        this._showAlert('✅ Paiement confirmé', 'success');
        await this._loadTab('paiements');
    },

    // ─────────────────────────────────────────────
    // UI HELPERS
    // ─────────────────────────────────────────────
    _closeModal(id) {
        const m = document.getElementById(id);
        m.classList.add('hidden');
        m.classList.remove('flex');
    },

    _showAlert(msg, type = 'success') {
        const el = document.getElementById('profs-alert');
        if (!el) return;
        const colors = {
            success: 'rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:#6ee7b7',
            error: 'rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5',
            warning: 'rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#f59e0b',
        };
        el.style.cssText = `display:flex;align-items:center;gap:.6rem;padding:.8rem 1rem;border-radius:.6rem;font-size:.85rem;background:${colors[type]}`
        const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-circle' : 'x-circle';
        el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${msg}</span>`;
        if (window.lucide) lucide.createIcons();
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 5000);
    },

    _loadingHTML(text = 'Chargement...') {
        return `<div class="flex flex-col items-center justify-center py-16">
      <div style="width:36px;height:36px;border:3px solid rgba(99,102,241,.2);border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite"></div>
      <p class="mt-4 text-sm" style="color:#64748b">${text}</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
    },

    _emptyHTML(icon, title, sub) {
        return `<div class="flex flex-col items-center justify-center py-20 text-center" style="color:#64748b">
      <div class="mb-4 opacity-20"><i data-lucide="${icon}" class="w-16 h-16"></i></div>
      <div class="font-bold text-base mb-1" style="color:#94a3b8;font-family:'Space Grotesk',sans-serif">${title}</div>
      <div class="text-sm">${sub}</div>
    </div>`;
    },

    _badgeStatut(s) {
        const m = {
            en_attente: ['rgba(245,158,11,.12)', 'rgba(245,158,11,.3)', '#f59e0b', 'En attente'],
            en_revision: ['rgba(59,130,246,.12)', 'rgba(59,130,246,.3)', '#93c5fd', 'En révision'],
            approuve: ['rgba(16,185,129,.12)', 'rgba(16,185,129,.3)', '#6ee7b7', 'Approuvé'],
            suspendu: ['rgba(239,68,68,.1)', 'rgba(239,68,68,.25)', '#fca5a5', 'Suspendu'],
            rejete: ['rgba(239,68,68,.1)', 'rgba(239,68,68,.25)', '#fca5a5', 'Rejeté'],
        };
        const [bg, border, color, label] = m[s] || ['rgba(100,116,139,.1)', 'rgba(100,116,139,.2)', '#94a3b8', s];
        return `<span style="padding:.2rem .65rem;border-radius:99px;font-size:.72rem;font-weight:700;background:${bg};border:1px solid ${border};color:${color}">${label}</span>`;
    },

    _badgeStatutEp(s) {
        const m = {
            brouillon: ['#94a3b8', 'Brouillon'],
            soumis: ['#f59e0b', 'Soumis'],
            en_revision: ['#93c5fd', 'En révision'],
            valide: ['#6ee7b7', 'Validé'],
            rejete: ['#fca5a5', 'Rejeté'],
        };
        const [color, label] = m[s] || ['#94a3b8', s];
        return `<span style="font-size:.75rem;font-weight:700;color:${color}">${label}</span>`;
    },

    _badgeDoc(s) {
        const m = {
            soumis: ['#f59e0b', 'Soumis'],
            valide: ['#6ee7b7', 'Validé'],
            rejete: ['#fca5a5', 'Rejeté'],
            expire: ['#94a3b8', 'Expiré'],
        };
        const [color, label] = m[s] || ['#94a3b8', s];
        return `<span style="font-size:.7rem;font-weight:700;color:${color}">${label}</span>`;
    },

    _badgePay(s) {
        const m = {
            en_attente: ['#f59e0b', 'En attente'],
            traite: ['#93c5fd', 'Traité'],
            confirme: ['#6ee7b7', 'Confirmé'],
            echoue: ['#fca5a5', 'Échoué'],
            annule: ['#94a3b8', 'Annulé'],
        };
        const [color, label] = m[s] || ['#94a3b8', s];
        return `<span style="font-size:.72rem;font-weight:700;color:${color}">${label}</span>`;
    },

    _docIcon(t) { return { diplome: 'graduation-cap', carte_identite: 'contact-2', attestation: 'file-text', carte_professeur: 'school', autre: 'paperclip' }[t] || 'file'; },
    _docLabel(t) { return { diplome: 'Diplôme universitaire', carte_identite: 'Pièce d\'identité', attestation: 'Attestation d\'enseignement', carte_professeur: 'Carte professeur', autre: 'Autre document' }[t] || t; },
    _typeLabel(t) { return { qcm_unique: 'QCM unique', qcm_multiple: 'QCM multiple', vrai_faux: 'Vrai/Faux', texte_court: 'Réponse courte', texte_long: 'Question ouverte' }[t] || t; },
    _formatMode(m) { return { mtn_mobile_money: 'MTN MoMo', orange_money: 'Orange Money', virement_bancaire: 'Virement', especes: 'Espèces', autre: 'Autre' }[m] || m || '—'; },
    _fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); },
    _fmtSize(b) { if (!b) return ''; const k = 1024; return b < k ? b + ' B' : b < k * k ? Math.round(b / k) + ' KB' : Math.round(b / (k * k) * 10) / 10 + ' MB'; },
};

window.professeursView = professeursView;