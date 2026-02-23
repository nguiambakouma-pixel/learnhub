// ================================================
// AUTH.JS - Gestion de l'authentification
// ================================================

const Auth = {
    /**
     * Initialiser l'authentification
     */
    async init() {
        console.log('🔐 Vérification authentification...');

        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            window.location.href = '../login.html';
            return null;
        }

        AppState.currentUser = user;
        await this.loadUserProfile();
        return user;
    },

    /**
     * Charger le profil utilisateur
     */
    async loadUserProfile() {
        try {
            const { data: profile, error } = await supabaseClient
                .from('admins')
                .select('nom, avatar_url')
                .eq('id', AppState.currentUser.id)
                .maybeSingle();

            if (error) throw error;

            if (!profile) {
                console.warn('Profil admin non trouvé pour cet utilisateur.');
                return;
            }

            if (error) throw error;

            if (profile) {
                document.getElementById('adminNameHome').textContent = profile.nom;
                // Mettre à jour d'autres éléments du profil si nécessaire
            }
        } catch (error) {
            console.error('Erreur profil:', error);
            Utils.showToast('Erreur chargement profil', 'error');
        }
    },

    /**
     * Déconnexion
     */
    async logout() {
        if (confirm('Se déconnecter ?')) {
            await supabaseClient.auth.signOut();
            window.location.href = '../login.html';
        }
    }
};