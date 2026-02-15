// auth.js - Fichier utilitaire pour l'authentification KMERSCHOOL

// Configuration Supabase
const SUPABASE_CONFIG = {
    url: 'https://zbbulpomopfwkqipbehk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'
}

// Initialiser Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {Promise<Object|null>} L'utilisateur connecté ou null
 */
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser()
    return user
}

/**
 * Récupère le profil complet de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} Le profil de l'utilisateur
 */
async function getUserProfile(userId) {
    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) throw error
        return profile
    } catch (error) {
        console.error('Erreur récupération profil:', error)
        return null
    }
}

/**
 * Redirige vers le bon dashboard selon le type de parcours
 * @param {string} userId - ID de l'utilisateur
 */
async function redirectToDashboard(userId) {
    const profile = await getUserProfile(userId)

    if (!profile) {
        console.error('Profil non trouvé')
        window.location.href = 'login.html'
        return
    }

    const dashboardUrls = {
        'eleve': 'Dashboard-eleves/dashboard-eleve.html',
        'dev-web': 'Dashboard-Dev/dashboard-dev.html',
        'designer': 'Dashboard-designer/dashboard-designer.html'
    }

    const dashboardUrl = dashboardUrls[profile.type_parcours]

    if (dashboardUrl) {
        window.location.href = dashboardUrl
    } else {
        console.error('Type de parcours inconnu:', profile.type_parcours)
        window.location.href = 'index.html'
    }
}

/**
 * Protège une page - redirige vers login si non connecté
 * @param {string} requiredParcours - Type de parcours requis (optionnel)
 */
async function protectPage(requiredParcours = null) {
    const user = await getCurrentUser()

    if (!user) {
        console.log('❌ Non connecté - redirection vers login')
        window.location.href = 'login.html'
        return false
    }

    if (requiredParcours) {
        const profile = await getUserProfile(user.id)

        if (!profile || profile.type_parcours !== requiredParcours) {
            console.log('⚠️ Mauvais parcours - redirection')
            await redirectToDashboard(user.id)
            return false
        }
    }

    return true
}

/**
 * Déconnecte l'utilisateur
 */
async function logout() {
    try {
        await supabaseClient.auth.signOut()
        window.location.href = 'index.html'
    } catch (error) {
        console.error('Erreur déconnexion:', error)
    }
}

/**
 * Connexion utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Résultat de la connexion
 */
async function login(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error
        return { success: true, user: data.user }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Inscription utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'inscription
 */
async function register(userData) {
    try {
        // 1. Créer le compte Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom: userData.nom,
                    type_parcours: userData.parcours
                }
            }
        })

        if (authError) throw authError

        // 2. Créer le profil
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                nom: userData.nom,
                email: userData.email,
                type_parcours: userData.parcours,
                niveau_actuel: userData.niveau || null,
                points_total: 0,
                streak_jours: 0,
                created_at: new Date().toISOString()
            })

        if (profileError) throw profileError

        return { success: true, user: authData.user }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Vérifie si l'email existe déjà
 * @param {string} email - Email à vérifier
 * @returns {Promise<boolean>} True si l'email existe
 */
async function emailExists(email) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single()

        return !error && data !== null
    } catch (error) {
        return false
    }
}

/**
 * Met à jour le profil utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} updates - Données à mettre à jour
 */
async function updateProfile(userId, updates) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId)

        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error('Erreur mise à jour profil:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Récupère les statistiques utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
async function getUserStats(userId) {
    try {
        // Récupérer le profil
        const profile = await getUserProfile(userId)

        // Récupérer les cours complétés
        const { data: coursCompleted } = await supabaseClient
            .from('progressions_cours')
            .select('id')
            .eq('user_id', userId)
            .eq('est_termine', true)

        // Récupérer les exercices réussis
        const { data: exercicesReussis } = await supabaseClient
            .from('soumissions_exercices')
            .select('id')
            .eq('user_id', userId)
            .eq('est_reussi', true)

        return {
            points: profile?.points_total || 0,
            streak: profile?.streak_jours || 0,
            coursCompletes: coursCompleted?.length || 0,
            exercicesReussis: exercicesReussis?.length || 0
        }
    } catch (error) {
        console.error('Erreur récupération stats:', error)
        return {
            points: 0,
            streak: 0,
            coursCompletes: 0,
            exercicesReussis: 0
        }
    }
}

// Exporter pour utilisation globale
window.KMERSCHOOLAuth = {
    supabase: supabaseClient,
    getCurrentUser,
    getUserProfile,
    redirectToDashboard,
    protectPage,
    logout,
    login,
    register,
    emailExists,
    updateProfile,
    getUserStats
}

console.log('✅ LearnHub Auth chargé')