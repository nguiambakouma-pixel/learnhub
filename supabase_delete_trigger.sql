-- =========================================================================
-- SQL MIGRATION: Trigger de suppression automatique et irrévocable
-- Cible : Supprimer de 'auth.users' quand un profil est supprimé de 'public.profiles'
-- =========================================================================

-- 1. Création de la fonction avec privilèges superutilisateur (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Supprime l'utilisateur de la table d'authentification interne de Supabase
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Liaison de la fonction au trigger de suppression sur la table public.profiles
CREATE OR REPLACE TRIGGER trigger_delete_auth_user
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- =========================================================================
-- NOTE POUR L'ADMINISTRATEUR :
-- Copiez et collez ce script dans l'onglet "SQL Editor" de votre console Supabase.
-- Cliquez sur "Run" pour l'exécuter. Une fois ce script exécuté :
-- Chaque suppression d'élève depuis le Dashboard Admin sera INSTANTANÉE,
-- EFFECTIVE et TOTALEMENT IRRÉVOCABLE (le compte auth.users et le profil public
-- seront supprimés simultanément, libérant ainsi l'adresse e-mail pour une réinscription).
-- =========================================================================
