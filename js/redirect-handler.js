// ==========================================
// REDIRECT HANDLER - Redirection intelligente
// ==========================================

/**
 * Redirige l'utilisateur vers son dashboard approprié
 * Appelé après connexion réussie
 */
export async function redirectToDashboard(supabase) {
    try {
        console.log('🔄 Checking user profile for redirect...')
        
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            console.error('❌ No user found:', userError)
            window.location.href = 'login.html'
            return
        }
        
        console.log('👤 User found:', user.id)
        
        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('type_parcours, niveau_actuel, nom')
            .eq('id', user.id)
            .single()
        
        if (profileError) {
            console.error('❌ Profile error:', profileError)
            // Si pas de profil, rediriger vers page de configuration
            window.location.href = 'setup-profile.html'
            return
        }
        
        console.log('📊 Profile loaded:', profile)
        
        // Redirection selon le type de parcours
        switch(profile.type_parcours) {
            case 'eleve':
                console.log('🎓 Redirecting to student dashboard')
                window.location.href = 'dashboard-eleve.html'
                break
                
            case 'dev-web':
                console.log('💻 Redirecting to dev dashboard')
                window.location.href = 'dashboard-dev.html'
                break
                
            case 'designer':
                console.log('🎨 Redirecting to designer dashboard')
                window.location.href = 'dashboard-designer.html'
                break
                
            default:
                console.warn('⚠️ Unknown parcours type:', profile.type_parcours)
                window.location.href = 'index.html'
        }
        
    } catch (error) {
        console.error('❌ Redirect error:', error)
        window.location.href = 'index.html'
    }
}

/**
 * Vérifier si l'utilisateur a accès à cette page
 * @param {string} requiredType - Type de parcours requis ('eleve', 'dev-web', 'designer')
 */
export async function checkPageAccess(supabase, requiredType) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            window.location.href = 'login.html'
            return false
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('type_parcours')
            .eq('id', user.id)
            .single()
        
        if (!profile || profile.type_parcours !== requiredType) {
            console.warn('❌ Access denied. Required:', requiredType, 'Got:', profile?.type_parcours)
            window.location.href = 'index.html'
            return false
        }
        
        return true
        
    } catch (error) {
        console.error('Access check error:', error)
        window.location.href = 'login.html'
        return false
    }
}