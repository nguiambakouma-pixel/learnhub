-- FONCTION RPC POUR RÉCUPÉRER LES NIVEAUX FILTRÉS PAR LE SOUS-SYSTÈME DU PROFESSEUR
-- À exécuter dans l'éditeur SQL de Supabase

CREATE OR REPLACE FUNCTION get_niveaux_for_prof(p_prof_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    code TEXT,
    nom_fr TEXT,
    nom_en TEXT,
    nom_court TEXT,
    est_classe_examen BOOLEAN,
    type_examen TEXT,
    sous_systeme_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ss_codes TEXT[];
    v_ss_ids UUID[];
BEGIN
    -- Récupérer les codes de sous-systèmes du professeur
    IF p_prof_id IS NOT NULL THEN
        SELECT sous_systemes INTO v_ss_codes FROM professeurs WHERE id = p_prof_id;
    END IF;

    -- Si le prof a des sous-systèmes, on récupère les IDs correspondants
    IF v_ss_codes IS NOT NULL AND array_length(v_ss_codes, 1) > 0 THEN
        SELECT array_agg(ss.id) INTO v_ss_ids FROM sous_systemes ss WHERE ss.code = ANY(v_ss_codes);
    END IF;

    RETURN QUERY
    SELECT 
        n.id, 
        n.code, 
        n.nom_fr, 
        n.nom_en, 
        n.nom_court, 
        n.est_classe_examen, 
        n.type_examen,
        c.sous_systeme_id
    FROM 
        niveaux_scolaires n
    JOIN 
        cycles c ON n.cycle_id = c.id
    WHERE 
        (v_ss_ids IS NULL OR c.sous_systeme_id = ANY(v_ss_ids))
    ORDER BY 
        n.ordre;
END;
$$;
