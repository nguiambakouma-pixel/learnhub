// ==========================================
// AUTH-CHECK.JS - Protection des pages
// À inclure en haut de chaque dashboard
// ==========================================

const SUPABASE_URL = 'https://zbbulpomopfwkqipbehk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Vérifie l'authentification et le type de parcours
 * @param {string} requiredType - Type de parcours requis ('eleve', 'dev-web', 'designer')
 * @returns {Object} { user, profile } ou null si accès refusé
 */
async function checkAuth(requiredType) {
    try {
        console.log('🔐 Vérification de l\'authentification...')

        // 1. Vérifier si utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.log('❌ Non authentifié, redirection vers login')
            window.location.href = 'login.html'
            return null
        }

        console.log('✅ Utilisateur authentifié:', user.id)

        // 2. Récupérer le profil
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('❌ Profil introuvable:', profileError)
            alert('Erreur: Profil introuvable. Veuillez vous réinscrire.')
            await supabase.auth.signOut()
            window.location.href = 'register.html'
            return null
        }

        console.log('✅ Profil chargé:', profile.type_parcours)

        // 3. Vérifier le type de parcours
        if (requiredType && profile.type_parcours !== requiredType) {
            console.warn('❌ Accès refusé. Type requis:', requiredType, 'Type actuel:', profile.type_parcours)
            alert(`Accès refusé. Cette page est réservée aux ${getParcoursLabel(requiredType)}.`)
            redirectToCorrectDashboard(profile.type_parcours)
            return null
        }

        console.log('✅ Accès autorisé!')
        return { user, profile }

    } catch (error) {
        console.error('❌ Erreur vérification auth:', error)
        window.location.href = 'login.html'
        return null
    }
}

/**
 * Redirige vers le bon dashboard selon le type de parcours
 */
function redirectToCorrectDashboard(typeParcours) {
    const dashboards = {
        'eleve': 'Dashboard-eleves/dashboard-eleve.html',
        'dev-web': 'Dashboard-Dev/dashboard-dev.html',
        'designer': 'Dashboard-designer/dashboard-designer.html'
    }

    const dashboard = dashboards[typeParcours] || 'index.html'
    window.location.href = dashboard
}

/**
 * Retourne le label d'un type de parcours
 */
function getParcoursLabel(type) {
    const labels = {
        'eleve': 'élèves',
        'dev-web': 'développeurs web',
        'designer': 'designers'
    }
    return labels[type] || 'utilisateurs'
}

/**
 * Déconnexion
 */
async function logout() {
    try {
        await supabase.auth.signOut()
        window.location.href = 'login.html'
    } catch (error) {
        console.error('Erreur déconnexion:', error)
        alert('Erreur lors de la déconnexion')
    }
}

// Exporter pour utilisation globale
window.AuthCheck = {
    checkAuth,
    logout,
    supabase
}