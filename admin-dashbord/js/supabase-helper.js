// ==========================================
// SUPABASE HELPER - LearnHub
// ==========================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://zbbulpomopfwkqipbehk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnVscG9tb3Bmd2txaXBiZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDM3NDksImV4cCI6MjA3ODk3OTc0OX0.Heak4t8B6vtUIX0SxlOW7W75cn1KD5UYe0lkoO1kW7A'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ==========================================
// AUTHENTIFICATION
// ==========================================

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUp(email, password, userData) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        })
        
        if (error) throw error
        
        // Créer le profil
        if (data.user) {
            await createUserProfile(data.user.id, {
                nom: userData.nom,
                email: email,
                type_parcours: userData.type_parcours,
                niveau_actuel: userData.niveau_actuel,
                classe_id: userData.classe_id || null
            })
        }
        
        return { success: true, user: data.user }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Connexion
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        
        if (error) throw error
        return { success: true, user: data.user, session: data.session }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Déconnexion
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Récupérer l'utilisateur actuel
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    } catch (error) {
        console.error('Erreur getCurrentUser:', error)
        return null
    }
}

/**
 * Réinitialisation du mot de passe
 */
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        })
        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ==========================================
// PROFILS UTILISATEURS
// ==========================================

/**
 * Créer un profil utilisateur
 */
async function createUserProfile(userId, profileData) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                ...profileData,
                created_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) throw error
        return data
    } catch (error) {
        console.error('Erreur createUserProfile:', error)
        throw error
    }
}

/**
 * Récupérer le profil d'un utilisateur
 */
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*, classe:classes(*)')
            .eq('id', userId)
            .single()
        
        if (error) throw error
        return data
    } catch (error) {
        console.error('Erreur getUserProfile:', error)
        return null
    }
}

/**
 * Mettre à jour le profil
 */
export async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()
        
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ==========================================
// COURS
// ==========================================

/**
 * Récupérer tous les cours d'un parcours
 */
export async function getCoursByParcours(typeParcours) {
    try {
        const { data, error } = await supabase
            .from('cours')
            .select(`
                *,
                chapitre:chapitres(
                    *,
                    matiere:matieres(*)
                )
            `)
            .eq('est_publie', true)
            .order('ordre', { ascending: true })
        
        if (error) throw error
        
        // Filtrer côté client car les jointures nested ne supportent pas eq directement
        return data.filter(cours => 
            cours.chapitre?.matiere?.type_parcours === typeParcours
        )
    } catch (error) {
        console.error('Erreur getCoursByParcours:', error)
        return []
    }
}

/**
 * Récupérer un cours spécifique
 */
export async function getCours(coursId) {
    try {
        const { data, error } = await supabase
            .from('cours')
            .select(`
                *,
                chapitre:chapitres(
                    *,
                    matiere:matieres(*)
                ),
                ressources(*)
            `)
            .eq('id', coursId)
            .single()
        
        if (error) throw error
        return data
    } catch (error) {
        console.error('Erreur getCours:', error)
        return null
    }
}

/**
 * Récupérer les cours populaires
 */
export async function getCoursPopulaires(limit = 6) {
    try {
        const { data, error } = await supabase
            .from('cours')
            .select(`
                *,
                chapitre:chapitres(
                    *,
                    matiere:matieres(*)
                )
            `)
            .eq('est_publie', true)
            .order('vues_total', { ascending: false })
            .limit(limit)
        
        if (error) throw error
        return data
    } catch (error) {
        console.error('Erreur getCoursPopulaires:', error)
        return []
    }
}

// ==========================================
// PROGRESSION
// ==========================================

/**
 * Récupérer la progression d'un utilisateur
 */
export async function getUserProgression(userId) {
    try {
        const { data, error } = await supabase
            .from('progressions_cours')
            .select(`
                *,
                cours:cours(
                    *,
                    chapitre:chapitres(
                        *,
                        matiere:matieres(*)
                    )
                )
            `)
            .eq('user_id', userId)
        
        if (error) throw error
        return data
    } catch (error) {
        console.error('Erreur getUserProgression:', error)
        return []
    }
}

/**
 * Mettre à jour la progression d'un cours
 */
export async function updateProgression(userId, coursId, progression) {
    try {
        const { data, error } = await supabase
            .from('progressions_cours')
            .upsert({
                user_id: userId,
                cours_id: coursId,
                progression_pourcentage: progression.pourcentage || 0,
                temps_passe: progression.temps_passe || 0,
                est_termine: progression.est_termine || false,
                derniere_position: progression.derniere_position || 0,
                date_fin: progression.est_termine ? new Date().toISOString() : null
            })
            .select()
        
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ==========================================
// STATISTIQUES
// ==========================================

/**
 * Récupérer les statistiques d'un utilisateur
 */
export async function getUserStats(userId) {
    try {
        const profile = await getUserProfile(userId)
        
        const { count: coursTermines } = await supabase
            .from('progressions_cours')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('est_termine', true)
        
        const { count: exercicesReussis } = await supabase
            .from('soumissions_exercices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('est_reussi', true)
        
        const { count: badgesObtenus } = await supabase
            .from('user_badges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
        
        const { data: progressions } = await supabase
            .from('progressions_cours')
            .select('temps_passe')
            .eq('user_id', userId)
        
        const tempsTotal = progressions?.reduce((acc, p) => acc + (p.temps_passe || 0), 0) || 0
        
        return {
            points_total: profile?.points_total || 0,
            streak_jours: profile?.streak_jours || 0,
            cours_termines: coursTermines || 0,
            exercices_reussis: exercicesReussis || 0,
            badges_obtenus: badgesObtenus || 0,
            temps_total_heures: Math.floor(tempsTotal / 3600)
        }
    } catch (error) {
        console.error('Erreur getUserStats:', error)
        return null
    }
}

// ==========================================
// FAVORIS
// ==========================================

/**
 * Ajouter un cours aux favoris
 */
export async function ajouterFavori(userId, coursId) {
    try {
        const { data, error } = await supabase
            .from('favoris')
            .insert({
                user_id: userId,
                cours_id: coursId,
                created_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Retirer un cours des favoris
 */
export async function retirerFavori(userId, coursId) {
    try {
        const { error } = await supabase
            .from('favoris')
            .delete()
            .eq('user_id', userId)
            .eq('cours_id', coursId)
        
        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Récupérer les favoris d'un utilisateur
 */
export async function getFavoris(userId) {
    try {
        const { data, error } = await supabase
            .from('favoris')
            .select(`
                *,
                cours:cours(
                    *,
                    chapitre:chapitres(
                        *,
                        matiere:matieres(*)
                    )
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    } catch (error) {
        console.error('Erreur getFavoris:', error)
        return []
    }
}

// ==========================================
// UTILITAIRES
// ==========================================

/**
 * Écouter les changements d'authentification
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
}

/**
 * Upload d'un fichier dans le storage
 */
export async function uploadFile(bucket, path, file) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file)
        
        if (error) throw error
        
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)
        
        return { success: true, url: urlData.publicUrl }
    } catch (error) {
        return { success: false, error: error.message }
    }
}