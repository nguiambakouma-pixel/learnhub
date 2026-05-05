-- SCRIPT DE MISE À JOUR DES CONTRAINTES DE LA TABLE MATIÈRES
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Nettoyage des anciennes contraintes pour éviter les blocages de suppression
ALTER TABLE public.annales DROP CONSTRAINT IF EXISTS annales_matiere_id_fkey;
ALTER TABLE public.chapitres DROP CONSTRAINT IF EXISTS chapitres_matiere_id_fkey;
ALTER TABLE public.classes_matieres DROP CONSTRAINT IF EXISTS classes_matieres_matiere_id_fkey;
ALTER TABLE public.examens DROP CONSTRAINT IF EXISTS examens_matiere_id_fkey;
ALTER TABLE public.matieres_series DROP CONSTRAINT IF EXISTS matieres_series_matiere_id_fkey;

-- 2. Création des nouvelles contraintes avec suppression intelligente
-- ON DELETE CASCADE : Supprime automatiquement les données liées (chapitres, etc.)
-- ON DELETE SET NULL : Garde les données historiques (examens, annales) mais détache la matière

ALTER TABLE public.annales 
ADD CONSTRAINT annales_matiere_id_fkey 
FOREIGN KEY (matiere_id) REFERENCES public.matieres(id) ON DELETE SET NULL;

ALTER TABLE public.chapitres 
ADD CONSTRAINT chapitres_matiere_id_fkey 
FOREIGN KEY (matiere_id) REFERENCES public.matieres(id) ON DELETE CASCADE;

ALTER TABLE public.classes_matieres 
ADD CONSTRAINT classes_matieres_matiere_id_fkey 
FOREIGN KEY (matiere_id) REFERENCES public.matieres(id) ON DELETE CASCADE;

ALTER TABLE public.examens 
ADD CONSTRAINT examens_matiere_id_fkey 
FOREIGN KEY (matiere_id) REFERENCES public.matieres(id) ON DELETE SET NULL;

ALTER TABLE public.matieres_series 
ADD CONSTRAINT matieres_series_matiere_id_fkey 
FOREIGN KEY (matiere_id) REFERENCES public.matieres(id) ON DELETE CASCADE;

-- 3. Prévention des doublons de noms au sein d'un même sous-système
-- On commence par nettoyer les doublons existants s'il y en a (Optionnel : l'admin devra le faire si erreur)
-- ALTER TABLE public.matieres ADD CONSTRAINT matieres_nom_ss_unique UNIQUE (nom, sous_systeme_id);

-- Note : Si vous avez déjà des doublons, la commande ci-dessus échouera. 
-- Il faudra d'abord fusionner les doublons manuellement.
