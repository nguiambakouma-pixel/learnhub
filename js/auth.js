// ==========================================
// AUTH.JS - Module d'authentification
// ==========================================

import { supabase, APP_STATE } from './config.js';

const Auth = {
    async checkAdmin() {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            window.location.href = 'admin-login.html';
            return null;
        }
        
        const { data: admin, error } = await supabase
            .from('admins')
            .select('role, nom, est_actif')
            .eq('id', user.id)
            .single();
        
        if (error || !admin || !admin.est_actif) {
            await supabase.auth.signOut();
            window.location.href = 'admin-login.html';
            return null;
        }
        
        APP_STATE.currentUser = admin;
        this.displayUserInfo(admin);
        return admin;
    },
    
    displayUserInfo(admin) {
        document.getElementById('userName').textContent = admin.nom || 'Admin';
        const initials = admin.nom ? admin.nom.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD';
        document.getElementById('userInitials').textContent = initials;
    },
    
    async logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            await supabase.auth.signOut();
            window.location.href = 'admin-login.html';
        }
    }
};

export default Auth;