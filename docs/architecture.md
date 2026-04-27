# USA PARTS AUTO ERP — Architecture

> This document describes the technical architecture of v1.0 and the intended evolution through v2.0.
> All diagrams use [Mermaid](https://mermaid.js.org/) syntax and render natively on GitHub.

---

## 1. System Overview

```mermaid
graph TB
    subgraph Client["🖥️  Browser (Chrome / Edge)"]
        direction TB
        HTML["index.html<br/>Shell + Navigation"]
        CSS["css/style.css<br/>Responsive UI"]

        subgraph JS["JavaScript Layer"]
            APP["app.js<br/>Router + Boot + Seed"]
            UTILS["utils.js<br/>Formatting · IDs · DOM · Export"]
            DB_MOD["db.js<br/>IndexedDB Wrapper"]
        end

        subgraph MODULES["Modules (IIFE Pattern)"]
            DASH["Dashboard"]
            PROD["Produits"]
            STOCK["Stocks + Mouvements"]
            VENTES["Ventes"]
            ACHATS["Achats"]
            CLIENTS["Clients"]
            FOURN["Fournisseurs"]
            FACT["Factures"]
            PAY["Paiements"]
            PRICE["Price List"]
            PARAM["Paramètres"]
            LOGS["Logs"]
        end

        subgraph STORAGE["💾  IndexedDB  (Browser Storage)"]
            IDB[("13 Object Stores")]
        end

        CHART["Chart.js v4<br/>(CDN)"]
    end

    HTML --> APP
    APP --> MODULES
    APP --> DB_MOD
    MODULES --> DB_MOD
    MODULES --> UTILS
    DB_MOD --> IDB
    DASH --> CHART
```

---

## 2. Module Dependency Graph

```mermaid
graph LR
    APP["app.js<br/>(Router)"]

    APP --> DASH
    APP --> PROD
    APP --> STOCK
    APP --> VENTES
    APP --> ACHATS
    APP --> CLIENTS
    APP --> FOURN
    APP --> FACT
    APP --> PAY
    APP --> PRICE
    APP --> PARAM
    APP --> LOGS

    VENTES -->|"stock sortie auto"| STOCK
    VENTES -->|"crée facture"| FACT
    VENTES -->|"update total_achats"| CLIENTS
    ACHATS -->|"stock entrée auto"| STOCK
    FACT -->|"lecture vente"| VENTES
    DASH -->|"loads all data"| STOCK
    DASH -->|"reads"| VENTES
    DASH -->|"reads"| ACHATS
    DASH -->|"reads"| FACT
    DASH -->|"reads"| PAY

    style VENTES fill:#2563a8,color:#fff
    style ACHATS fill:#2563a8,color:#fff
    style STOCK fill:#16a34a,color:#fff
    style DASH fill:#e63946,color:#fff
```

---

## 3. Data Model (Entity Relationships)

```mermaid
erDiagram
    PRODUITS {
        string id PK
        string nom
        string categorie
        string sku
        bool   actif
    }

    CLIENTS {
        string id PK
        string nom
        string telephone
        string email
        string adresse
        number total_achats
        number credit
    }

    FOURNISSEURS {
        string id PK
        string nom
        string telephone
        string email
        string adresse
    }

    VENTES {
        string id PK
        string date
        string client_id FK
        number total_ht
        number tva
        number total_ttc
        string paiement
        string statut
    }

    LIGNES_VENTES {
        string id PK
        string vente_id FK
        string produit_id FK
        number quantite
        number prix_base_ht
        number remise
        number prix_applique_ht
        number total_ht
    }

    FACTURES {
        string id PK
        string vente_id FK
        string client_id FK
        string date
        number total_ht
        number tva
        number total_ttc
        string statut
    }

    ACHATS {
        string id PK
        string date
        string fournisseur_id FK
        number total
        number autres_frais
        string statut
    }

    LIGNES_ACHATS {
        string id PK
        string achat_id FK
        string produit_id FK
        number quantite
        number prix_unitaire
        number cout_revient_unitaire
        number cout_revient_total
        number prix_plafond_ttc
    }

    MOUVEMENTS {
        string id PK
        string date
        string produit_id FK
        string type
        number quantite
        number prix_unitaire
        string reference
        string commentaire
    }

    PAIEMENTS {
        string id PK
        string date
        string type
        string reference
        number montant
        string mode
        string statut
    }

    PRICE_LIST {
        string produit_id PK
        number prix_plancher_ttc
        number prix_plafond_ht
        number prix_plafond_ttc
        number prix_senegal_ttc
    }

    PARAMETRES {
        string cle PK
        string valeur
    }

    LOGS {
        string id PK
        string date
        string action
        string utilisateur
        string description
    }

    CLIENTS        ||--o{ VENTES         : "passe"
    VENTES         ||--o{ LIGNES_VENTES  : "contient"
    PRODUITS       ||--o{ LIGNES_VENTES  : "figure dans"
    VENTES         ||--|| FACTURES       : "génère"
    CLIENTS        ||--o{ FACTURES       : "reçoit"
    FOURNISSEURS   ||--o{ ACHATS         : "fournit"
    ACHATS         ||--o{ LIGNES_ACHATS  : "contient"
    PRODUITS       ||--o{ LIGNES_ACHATS  : "figure dans"
    PRODUITS       ||--o{ MOUVEMENTS     : "suivi par"
    PRODUITS       ||--o| PRICE_LIST     : "a prix"
```

---

## 4. Key Business Logic Flows

### 4a. Cycle de Vente → Stock

```mermaid
sequenceDiagram
    actor Vendeur
    participant Ventes
    participant Stocks
    participant Factures
    participant Clients

    Vendeur->>Ventes: Crée vente (client, lignes, prix)
    Ventes->>Ventes: Calcul Total HT + TVA 18% + TTC
    alt Statut = "Livrée"
        Ventes->>Stocks: Mouvement Sortie (qty × produit)
    end
    Ventes->>Factures: Crée facture liée
    Ventes->>Clients: Incrémente total_achats
    Ventes-->>Vendeur: Confirmation + ID Vente
```

### 4b. Cycle d'Achat → Landed Cost → Stock

```mermaid
sequenceDiagram
    actor Gérant
    participant Achats
    participant Stocks
    participant PriceList

    Gérant->>Achats: Crée achat (fournisseur, lignes, prix USD)
    Gérant->>Achats: Saisit Autres Frais (transport, douane)
    Achats->>Achats: Alloue frais proportionnellement par ligne
    Achats->>Achats: Coût revient = (Prix ligne + Frais alloués) / Quantité
    Achats->>Achats: Prix Plafond TTC = Coût revient × 2 × 1.18
    alt Statut = "Reçu"
        Achats->>Stocks: Mouvement Entrée (qty × coût revient)
        Gérant->>PriceList: Met à jour Prix Plafond/Plancher
    end
```

### 4c. Calcul du Stock Actuel

```
Stock Actuel (produit X) =
    SUM(mouvements WHERE produit_id = X AND type = "Entrée").quantite
  − SUM(mouvements WHERE produit_id = X AND type = "Sortie").quantite
```

> Il n'y a pas de colonne "stock" en base. Le stock est **toujours recalculé** depuis le journal des mouvements. Cela garantit un audit trail complet et l'impossibilité de désynchronisation.

---

## 5. File Structure

```
USA-PARTS-AUTO-ERP/
├── index.html              Shell HTML — navigation + modales + zones print
├── .gitignore
├── assets/
│   └── logo.png
├── css/
│   └── style.css           Tous les styles — variables CSS, responsive, print
├── js/
│   ├── db.js               Abstraction IndexedDB (open, get, put, add, delete, putMany, clear)
│   ├── utils.js            Fonctions partagées : formatage, IDs, DOM, toast, modal, CSV export
│   ├── app.js              Routeur hash-based, boot, seed des données démo
│   └── modules/
│       ├── dashboard.js    KPIs + Chart.js
│       ├── produits.js
│       ├── stocks.js       renderStocks + renderMouvements + computeStocks
│       ├── ventes.js       + lignes_ventes inline
│       ├── achats.js       + lignes_achats + landed cost
│       ├── clients.js
│       ├── fournisseurs.js
│       ├── factures.js     + print HTML
│       ├── paiements.js
│       ├── pricelist.js
│       └── parametres.js   + Logs (dans le même fichier)
├── docs/
│   ├── phases.md           ← Ce document de roadmap
│   ├── architecture.md     ← Ce document
│   └── north-star.md       ← Vision produit
└── tests/
    ├── runner.html         Test runner navigateur
    ├── framework.js        Runner minimaliste (~60 lignes)
    ├── utils.test.js
    ├── db.test.js
    ├── stocks.test.js
    ├── ventes.test.js
    └── achats.test.js
```

---

## 6. Architectural Constraints & Rationale

| Constraint | Reason |
|---|---|
| **No build step** | Zero dev toolchain required. Any text editor + browser is enough. |
| **IIFE module pattern** | Encapsulation without ES modules (which require a server for `import`). Each module exposes a single object. |
| **IndexedDB, not localStorage** | localStorage is synchronous, limited to ~5MB, and stores only strings. IndexedDB handles large datasets and complex objects. |
| **Stock computed from movements** | A stored stock count can drift if any operation fails. Computing from the immutable movement log is always correct. |
| **No ORM** | Direct IndexedDB calls keep the data layer transparent and debuggable without abstraction overhead. |
| **Chart.js via CDN** | Single well-known dependency, no install, version-pinned URL. |

---

## 7. v2.0 Target Architecture

```mermaid
graph TB
    subgraph Cloud["☁️  Cloud Server"]
        API["Node.js API<br/>(Express / Hono)"]
        PG[("PostgreSQL")]
        WS["WebSocket<br/>(real-time sync)"]
        API --> PG
        API --> WS
    end

    subgraph Clients
        MOBILE["📱 Mobile<br/>(Vendeur terrain)"]
        DESK["🖥️ Desktop<br/>(Admin / Comptable)"]
        TAB["📊 Tablet<br/>(Magasin)"]
    end

    MOBILE -- HTTPS --> API
    DESK   -- HTTPS --> API
    TAB    -- HTTPS --> API
    WS     -- push  --> MOBILE
    WS     -- push  --> DESK
    WS     -- push  --> TAB
```
