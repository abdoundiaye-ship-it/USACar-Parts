-- ============================================================
-- USA PARTS AUTO ERP — Photos produits
-- Coller ce script dans : Supabase Dashboard → SQL Editor → Run
-- (nécessaire une seule fois : la clé anon ne peut pas faire de DDL)
-- ============================================================

-- 1. Colonne pour l'URL publique de la photo du produit
ALTER TABLE produits ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Bucket de stockage public pour les photos produits
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits-photos', 'produits-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policies de stockage (même logique que rls.sql : la clé anon a un
--    accès complet, acceptable pour cet ERP interne)
DROP POLICY IF EXISTS "anon_read_produits_photos" ON storage.objects;
DROP POLICY IF EXISTS "anon_write_produits_photos" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_produits_photos" ON storage.objects;

CREATE POLICY "anon_read_produits_photos" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'produits-photos');
CREATE POLICY "anon_write_produits_photos" ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'produits-photos');
CREATE POLICY "anon_update_produits_photos" ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'produits-photos');
