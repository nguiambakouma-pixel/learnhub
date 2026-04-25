// ================================================
// AUTH.JS - Gestion de l'authentification Admin
// ================================================

/**
 * Module central d'authentification pour l'espace Admin
 */
const AdminAuth = {
    /**
     * Authentification avec email et mot de passe
     */
    async login(email, password) {
        try {
            console.log('🔐 Tentative de connexion admin:', email);

            // 1. Authentification Supabase
            const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Vérifier si c'est bien un admin et s'il est actif
            const admin = await this.verifyAdminStatus(data.user.id);

            if (!admin) {
                await supabaseClient.auth.signOut();
                throw new Error("Accès refusé. Ce compte n'a pas les privilèges administrateur.");
            }

            if (!admin.est_actif) {
                await supabaseClient.auth.signOut();
                throw new Error("Ce compte administrateur est désactivé.");
            }

            console.log('✅ Connexion réussie pour:', admin.nom);

            // Stocker dans le localStorage pour une récupération rapide avant check session
            localStorage.setItem('ks_admin_token', 'active');

            return { user: data.user, admin };

        } catch (error) {
            console.error('❌ Erreur login:', error.message);
            throw error;
        }
    },

    /**
     * Vérifier le statut d'administrateur dans la table 'admins'
     */
    async verifyAdminStatus(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('admins')
                .select('role, nom, permissions, est_actif, avatar_url')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Erreur vérification admin:', error);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Exception verifyAdminStatus:', err);
            return null;
        }
    },

    /**
     * Initialiser/Vérifier la session actuelle
     * À utiliser au chargement de l'index.html
     */
    async checkSession() {
        try {
            console.log('🔍 Vérification de la session admin...');

            // 1. Récupérer l'utilisateur connecté
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

            if (userError || !user) {
                console.log('👋 Aucune session active');
                this.redirectToLogin();
                return null;
            }

            // 2. Vérifier le statut admin
            const admin = await this.verifyAdminStatus(user.id);

            if (!admin || !admin.est_actif) {
                console.warn('🚫 Utilisateur non autorisé ou inactif');
                await supabaseClient.auth.signOut();
                this.redirectToLogin();
                return null;
            }

            console.log('✅ Session admin valide:', admin.nom);

            // Stocker dans l'état global
            if (window.AppState) {
                window.AppState.currentUser = user;
                window.AppState.adminProfile = admin;
            }

            // Mettre à jour l'UI si nécessaire
            const nameEl = document.getElementById('adminNameHome');
            if (nameEl) nameEl.textContent = admin.nom;

            return { user, admin };

        } catch (error) {
            console.error('❌ Erreur checkSession:', error);
            this.redirectToLogin();
            return null;
        }
    },

    /**
     * Déconnexion
     */
    async logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            try {
                await supabaseClient.auth.signOut();
                localStorage.removeItem('ks_admin_token');
                console.log('🚪 Déconnexion réussie');
                this.redirectToLogin();
            } catch (error) {
                console.error('Erreur déconnexion:', error);
                alert('Erreur lors de la déconnexion');
            }
        }
    },

    /**
     * Redirection vers la page de login admin
     */
    redirectToLogin() {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('admin-login.html')) {
            // Utiliser un chemin absolu ou remonter si nécessaire
            // On assume que les fichiers admin sont dans /admin-dashbord/
            if (currentPath.includes('admin-dashbord')) {
                window.location.href = 'admin-login.html';
            } else {
                window.location.href = 'admin-dashbord/admin-login.html';
            }
        }
    }
};

// Compatibilité avec l'ancien code qui cherche "Auth"
window.Auth = AdminAuth;
window.AdminAuth = AdminAuth;