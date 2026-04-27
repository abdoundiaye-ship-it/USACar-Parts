# USA PARTS AUTO ERP — Versioned Phases

> Every phase has a clear scope, a measurable exit criterion, and a named owner of each deliverable.
> A phase is **complete** only when its exit criteria are fully met.

---

## Phase 1 — Core ERP (v1.0) ✅ SHIPPED — April 2026

**Goal:** Replace the Google Sheets workbook with a working web application that covers all daily operations.

### Scope Delivered
| Module | Status | Notes |
|---|---|---|
| Catalogue Produits (23 SKUs) | ✅ | Seeded from Excel workbook |
| Stocks + Mouvements | ✅ | Calcul temps réel : Entrées − Sorties |
| Ventes + Lignes de Vente | ✅ | TVA 18%, remises, stock sortie automatique |
| Factures + Impression | ✅ | Impression navigateur, statut Payée/Impayée |
| Clients CRM | ✅ | Historique achats, suivi crédit |
| Achats + Landed Cost | ✅ | Frais distribués → coût revient unitaire |
| Fournisseurs | ✅ | Annuaire CRUD |
| Paiements | ✅ | Multi-mode (espèces, virement, mobile money…) |
| Liste des Prix | ✅ | Prix Plancher / Plafond HT+TTC / Sénégal |
| Dashboard (KPIs + 4 graphiques) | ✅ | Chart.js, calculs en temps réel |
| Paramètres + Backup JSON | ✅ | Export/import complet de toutes les données |
| Journal d'activité (Logs) | ✅ | Audit trail automatique |

### Tech Stack
- **Frontend:** HTML5 / CSS3 / JavaScript ES6+ (vanilla, zéro dépendance installée)
- **Persistance:** IndexedDB (navigateur, offline-first)
- **Graphiques:** Chart.js v4 (CDN)
- **Hébergement:** Fichier local `index.html` — aucun serveur requis

### Exit Criteria Met
- [x] Tous les onglets Excel ont un équivalent fonctionnel dans l'app
- [x] Stock calculé correctement à partir des mouvements
- [x] Facture imprimable depuis le navigateur
- [x] Données persistées entre les sessions (IndexedDB)
- [x] Code versionné sur GitHub

---

## Phase 2 — Robustesse & UX (v1.1) 🔜 NEXT — Q3 2026

**Goal:** Rendre l'application fiable pour un usage quotidien intensif. Combler les lacunes UX identifiées à l'usage.

### Scope Planned
- [ ] **Validation stricte des formulaires** — erreurs inline sur chaque champ
- [ ] **Vérification stock avant vente** — bloquer si stock insuffisant avec avertissement clair
- [ ] **Recherche globale** — barre de recherche universelle (Ctrl+K) traversant tous les modules
- [ ] **Raccourcis clavier** — navigation rapide (N = Nouveau, S = Sauvegarder, Esc = Fermer)
- [ ] **Pagination** — tables tronquées à 50 lignes avec pagination pour les grands volumes
- [ ] **Filtres de date** — filtre période (7j / 30j / 3mois / année / personnalisé) sur toutes les listes
- [ ] **Duplication de vente** — bouton "Dupliquer" pour réutiliser une commande existante
- [ ] **PWA (Progressive Web App)** — icône sur l'écran d'accueil mobile, fonctionnement hors ligne garanti
- [ ] **Export PDF natif** — génération PDF réelle (jsPDF) sans dépendre de l'impression navigateur
- [ ] **Thème sombre** — mode nuit pour une utilisation prolongée

### Exit Criteria
- [ ] Zéro perte de données possible par erreur de saisie
- [ ] App installable sur téléphone Android/iOS comme une app native
- [ ] 100% des tests unitaires Phase 2 passent

---

## Phase 3 — Reporting Avancé (v1.2) — Q4 2026

**Goal:** Donner à la direction des outils d'analyse suffisamment précis pour piloter les décisions d'achat et de tarification.

### Scope Planned
- [ ] **Rapport Rentabilité par Produit** — marge brute, marge nette, ROI par SKU
- [ ] **Rapport Rentabilité par Catégorie** — comparaison huiles vs liquides vs autres
- [ ] **Rapport Fournisseur** — délais, volumes, coûts moyens par fournisseur
- [ ] **Rapport Clients** — top clients par CA, clients inactifs, encours de crédit
- [ ] **Taux de rotation des stocks** — DSI (Days Sales of Inventory) par produit
- [ ] **Alertes automatiques** — stock sous seuil configurable → notification visuelle
- [ ] **Conversions de devises live** — API taux de change USD/FCFA/EUR
- [ ] **Graphiques comparatifs** — N vs N-1, objectifs vs réalisé
- [ ] **Export Excel/CSV enrichi** — rapports formatés avec totaux et sous-totaux

### Exit Criteria
- [ ] Direction peut générer un rapport complet en < 30 secondes
- [ ] Taux de rotation visible pour chacun des 23+ SKUs

---

## Phase 4 — Backend & Multi-Utilisateurs (v2.0) — 2027 H1

**Goal:** Passer d'une app mono-poste à une solution multi-utilisateurs avec données centralisées.

### Scope Planned
- [ ] **Backend API** — Node.js + Express (ou Hono)
- [ ] **Base de données serveur** — PostgreSQL (production) / SQLite (dev)
- [ ] **Authentification** — connexion par rôle (Administrateur, Vendeur, Comptable, Vue seule)
- [ ] **Sync en temps réel** — plusieurs vendeurs sur le terrain simultanément
- [ ] **Hébergement cloud** — Railway / Render / VPS Hetzner (≤ 15 €/mois)
- [ ] **Migration des données** — import automatique de l'IndexedDB v1 vers la base SQL
- [ ] **Audit trail renforcé** — qui a fait quoi, depuis quelle adresse IP
- [ ] **2FA** — authentification à deux facteurs pour l'admin

### Architecture Cible
```
Mobile (Vendeur)  ─┐
Desktop (Admin)   ─┤── HTTPS ──▶  API Node.js  ──▶  PostgreSQL
Tablette (Stock)  ─┘                   │
                                       └──▶  WebSocket (real-time sync)
```

### Exit Criteria
- [ ] 3 utilisateurs simultanés sans conflit de données
- [ ] Données sauvegardées sur serveur (zéro dépendance au navigateur local)
- [ ] Temps de réponse API < 200ms pour toutes les requêtes courantes

---

## Phase 5 — Intelligence & Automatisation (v3.0) — 2027 H2+

**Goal:** Automatiser les décisions répétitives et anticiper les besoins.

### Scope Envisagé
- [ ] **Prévision des réapprovisionnements** — ML simple basé sur l'historique de vente
- [ ] **Suggestion de prix de vente** — basé sur le coût revient + marge cible + prix marché
- [ ] **Application mobile native** — React Native ou PWA installable
- [ ] **Intégration comptabilité** — export au format Wave / Sage / fichier FEC
- [ ] **Notifications SMS/WhatsApp** — alerte client quand commande prête
- [ ] **QR Code sur factures** — vérification d'authenticité et paiement rapide

---

## Décisions de Design Durables

Ces décisions s'appliquent à toutes les phases et ne doivent pas être remises en question sans raison forte.

| Décision | Raison |
|---|---|
| **Français comme langue unique** | 100% des utilisateurs sont francophones |
| **Offline-first** | Connexion internet non fiable à Dakar |
| **FCFA comme devise d'affichage** | Marché local sénégalais |
| **USD pour les achats** | Fournisseurs américains, prix d'achat en USD |
| **TVA fixe à 18%** | Taux légal sénégalais |
| **IDs lisibles** (PRD0001, V0001…) | Facilite le support téléphonique et la référence orale |
| **Zéro framework JS (v1)** | Zéro dépendance = zéro rupture de build |
