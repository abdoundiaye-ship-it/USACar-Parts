-- ============================================================
-- USA PARTS AUTO ERP — Supabase Schema
-- Coller ce script dans : Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Extension pour UUID (optionnel, on utilise des TEXT IDs) ──
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP (pour réinitialiser proprement si besoin)
-- ============================================================
DROP TABLE IF EXISTS logs          CASCADE;
DROP TABLE IF EXISTS utilisateurs  CASCADE;
DROP TABLE IF EXISTS parametres    CASCADE;
DROP TABLE IF EXISTS price_list    CASCADE;
DROP TABLE IF EXISTS paiements     CASCADE;
DROP TABLE IF EXISTS lignes_achats CASCADE;
DROP TABLE IF EXISTS achats        CASCADE;
DROP TABLE IF EXISTS lignes_ventes CASCADE;
DROP TABLE IF EXISTS factures      CASCADE;
DROP TABLE IF EXISTS ventes        CASCADE;
DROP TABLE IF EXISTS mouvements    CASCADE;
DROP TABLE IF EXISTS clients       CASCADE;
DROP TABLE IF EXISTS fournisseurs  CASCADE;
DROP TABLE IF EXISTS produits      CASCADE;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE produits (
  id         TEXT PRIMARY KEY,
  nom        TEXT NOT NULL,
  categorie  TEXT,
  sku        TEXT UNIQUE,
  actif      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
  id           TEXT PRIMARY KEY,
  nom          TEXT NOT NULL,
  telephone    TEXT,
  email        TEXT,
  adresse      TEXT,
  total_achats NUMERIC DEFAULT 0,
  credit       NUMERIC DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fournisseurs (
  id         TEXT PRIMARY KEY,
  nom        TEXT NOT NULL,
  telephone  TEXT,
  email      TEXT,
  adresse    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ventes (
  id         TEXT PRIMARY KEY,
  date       TEXT,
  client_id  TEXT,
  total_ht   NUMERIC DEFAULT 0,
  tva        NUMERIC DEFAULT 0,
  total_ttc  NUMERIC DEFAULT 0,
  paiement   TEXT,
  statut     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lignes_ventes (
  id               TEXT PRIMARY KEY,
  vente_id         TEXT,
  produit_id       TEXT,
  quantite         NUMERIC DEFAULT 0,
  prix_base_ht     NUMERIC DEFAULT 0,
  remise           NUMERIC DEFAULT 0,
  prix_applique_ht NUMERIC DEFAULT 0,
  total_ht         NUMERIC DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE factures (
  id         TEXT PRIMARY KEY,
  vente_id   TEXT,
  client_id  TEXT,
  date       TEXT,
  total_ht   NUMERIC DEFAULT 0,
  tva        NUMERIC DEFAULT 0,
  total_ttc  NUMERIC DEFAULT 0,
  statut     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achats (
  id             TEXT PRIMARY KEY,
  date           TEXT,
  fournisseur_id TEXT,
  total          NUMERIC DEFAULT 0,
  autres_frais   NUMERIC DEFAULT 0,
  statut         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lignes_achats (
  id                    TEXT PRIMARY KEY,
  achat_id              TEXT,
  produit_id            TEXT,
  quantite              NUMERIC DEFAULT 0,
  prix_unitaire         NUMERIC DEFAULT 0,
  total                 NUMERIC DEFAULT 0,
  cout_revient_unitaire NUMERIC DEFAULT 0,
  cout_revient_total    NUMERIC DEFAULT 0,
  prix_plafond_ttc      NUMERIC DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mouvements (
  id            TEXT PRIMARY KEY,
  date          TEXT,
  produit_id    TEXT,
  type          TEXT,
  quantite      NUMERIC DEFAULT 0,
  prix_unitaire NUMERIC DEFAULT 0,
  reference     TEXT,
  commentaire   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paiements (
  id         TEXT PRIMARY KEY,
  date       TEXT,
  type       TEXT,
  reference  TEXT,
  montant    NUMERIC DEFAULT 0,
  mode       TEXT,
  statut     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_list (
  produit_id       TEXT PRIMARY KEY,
  prix_plafond_ht  NUMERIC DEFAULT 0,
  prix_plafond_ttc NUMERIC DEFAULT 0,
  prix_senegal_ttc NUMERIC DEFAULT 0,
  prix_plancher_ttc NUMERIC DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parametres (
  cle    TEXT PRIMARY KEY,
  valeur TEXT
);

CREATE TABLE utilisateurs (
  id            TEXT PRIMARY KEY,
  nom           TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  profil        TEXT NOT NULL DEFAULT 'vendeur',
  actif         BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE logs (
  id          TEXT PRIMARY KEY,
  date        TIMESTAMPTZ DEFAULT NOW(),
  action      TEXT,
  utilisateur TEXT,
  description TEXT
);

-- ============================================================
-- INDEX pour les requêtes fréquentes
-- ============================================================
CREATE INDEX idx_mouvements_produit   ON mouvements(produit_id);
CREATE INDEX idx_mouvements_date      ON mouvements(date);
CREATE INDEX idx_lignes_ventes_vente  ON lignes_ventes(vente_id);
CREATE INDEX idx_lignes_ventes_produit ON lignes_ventes(produit_id);
CREATE INDEX idx_lignes_achats_achat  ON lignes_achats(achat_id);
CREATE INDEX idx_lignes_achats_produit ON lignes_achats(produit_id);
CREATE INDEX idx_ventes_client        ON ventes(client_id);
CREATE INDEX idx_ventes_date          ON ventes(date);
CREATE INDEX idx_factures_vente       ON factures(vente_id);
CREATE INDEX idx_achats_date          ON achats(date);
CREATE INDEX idx_logs_date            ON logs(date);
