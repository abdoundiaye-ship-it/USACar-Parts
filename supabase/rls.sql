-- ============================================================
-- USA PARTS AUTO ERP — Row Level Security (RLS)
-- Coller ce script après schema.sql dans Supabase SQL Editor
-- ============================================================

-- Liste de toutes les tables de l'ERP
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'produits','clients','fournisseurs','ventes','lignes_ventes',
    'factures','achats','lignes_achats','mouvements','paiements',
    'price_list','parametres','utilisateurs','logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Activer RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- Supprimer les policies existantes
    EXECUTE format('DROP POLICY IF EXISTS "anon_select" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete" ON %I', t);

    -- Créer les 4 policies pour le rôle anon
    EXECUTE format('CREATE POLICY "anon_select" ON %I FOR SELECT TO anon USING (true)', t);
    EXECUTE format('CREATE POLICY "anon_insert" ON %I FOR INSERT TO anon WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon_update" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon_delete" ON %I FOR DELETE TO anon USING (true)', t);
  END LOOP;
END $$;

-- ============================================================
-- NOTE SÉCURITÉ
-- ============================================================
-- Les policies ci-dessus permettent à tout porteur de la clé
-- anon d'accéder aux données. C'est acceptable pour un ERP
-- interne où seuls les employés connaissent l'URL de l'app.
--
-- Pour plus de sécurité (Phase 5), migrez vers Supabase Auth
-- et remplacez "TO anon" par "TO authenticated" avec des
-- conditions sur auth.uid().
-- ============================================================
