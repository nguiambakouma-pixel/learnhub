-- ==============================================================
-- MIGRATION: Ajout de la table professeurs (Gestion Professeurs)
-- ==============================================================

-- 1. Création de la table 'professeurs'
CREATE TABLE IF NOT EXISTS public.professeurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'rejete')),
    date_soumission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    documents_kyc JSONB DEFAULT '{}'::jsonb, -- Ex: {"diplome": "url", "cni": "url"}
    specialite VARCHAR(255),
    raison_rejet TEXT,
    taux_acceptation DECIMAL(5,2) DEFAULT 0.00,
    gains_totaux DECIMAL(10,2) DEFAULT 0.00,
    -- champs d'audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- un utilisateur ne peut avoir qu'un seul profil professeur
    CONSTRAINT unique_utilisateur_professeur UNIQUE(utilisateur_id)
);

-- 2. Configuration RLS (Row Level Security)
ALTER TABLE public.professeurs ENABLE ROW LEVEL SECURITY;

-- Politique de LECTURE :
-- Les administrateurs peuvent tout lire.
-- Les professeurs peuvent lire uniquement leur propre profil.
CREATE POLICY "Admins can view all professeurs" 
    ON public.professeurs 
    FOR SELECT 
    USING ( EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) );

CREATE POLICY "Users can view own professeur profile" 
    ON public.professeurs 
    FOR SELECT 
    USING ( utilisateur_id = auth.uid() );

-- Politique de MISE À JOUR :
-- Seuls les admins peuvent changer le 'statut' ou 'raison_rejet'
CREATE POLICY "Admins can update professeurs" 
    ON public.professeurs 
    FOR UPDATE 
    USING ( EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) );

-- Politique d'INSERTION :
-- Un utilisateur authentifié peut soumettre sa candidature
CREATE POLICY "Users can submit professeur application" 
    ON public.professeurs 
    FOR INSERT 
    WITH CHECK ( auth.uid() = utilisateur_id );


-- ==============================================================
-- Storage Bucket: professeurs_documents
-- ==============================================================
-- (À exécuter si le bucket n'est pas encore créé)
INSERT INTO storage.buckets (id, name, public) VALUES ('professeurs_documents', 'professeurs_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Les utilisateurs peuvent uploader leurs propres documents KYC
CREATE POLICY "Users can upload KYC docs"
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'professeurs_documents' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Les admins peuvent lire tous les documents KYC
CREATE POLICY "Admins can read all KYC docs"
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'professeurs_documents' AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) );
