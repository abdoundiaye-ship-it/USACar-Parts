# USA PARTS AUTO ERP — Guide de déploiement Supabase

Ce guide vous explique comment connecter l'ERP à Supabase pour que **plusieurs utilisateurs** sur **plusieurs appareils** partagent les mêmes données en temps réel.

---

## Temps estimé : 20 minutes

---

## Étape 1 — Créer un compte Supabase

1. Allez sur **[supabase.com](https://supabase.com)** → cliquez **Start your project**
2. Connectez-vous avec votre compte GitHub (recommandé)
3. Cliquez **New Project**
4. Remplissez :
   - **Organization** : votre nom ou votre organisation
   - **Project name** : `usa-parts-auto-erp`
   - **Database password** : choisissez un mot de passe fort et **notez-le**
   - **Region** : West EU (Ireland) — le plus proche de Dakar
5. Cliquez **Create new project** — attendez ~2 minutes

---

## Étape 2 — Créer le schéma de base de données

1. Dans votre projet Supabase → menu gauche → **SQL Editor**
2. Cliquez **+ New query**
3. Copiez-collez le contenu du fichier **`supabase/schema.sql`**
4. Cliquez **Run** (bouton vert) → vous devriez voir `Success. No rows returned`

---

## Étape 3 — Configurer les permissions (RLS)

1. Dans **SQL Editor** → **+ New query**
2. Copiez-collez le contenu du fichier **`supabase/rls.sql`**
3. Cliquez **Run** → `Success. No rows returned`

---

## Étape 4 — Récupérer vos clés API

1. Dans Supabase → menu gauche → **Settings** (icône ⚙️) → **API**
2. Notez les deux valeurs :
   - **Project URL** : ressemble à `https://abcdefghij.supabase.co`
   - **anon public key** : longue chaîne commençant par `eyJ...`

---

## Étape 5 — Configurer l'application

1. Ouvrez le fichier **`js/config.js`** dans votre éditeur
2. Remplacez les valeurs par les vôtres :

```javascript
const SUPABASE_URL     = 'https://VOTRE_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';
```

Exemple réel :
```javascript
const SUPABASE_URL     = 'https://xyzabc1234.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...';
```

---

## Étape 6 — Tester l'application

1. Ouvrez `index.html` dans votre navigateur (ou l'URL GitHub Pages)
2. L'écran de connexion apparaît → connectez-vous avec `admin` / `admin123`
3. Au premier lancement, l'app charge automatiquement :
   - Les **23 produits** du catalogue
   - Les **2 achats** avec leurs lignes
   - La **vente V0001**
   - Les **utilisateurs par défaut**
4. Ouvrez l'app sur un **deuxième appareil** ou navigateur → vous verrez les mêmes données

> **Note :** Le premier chargement peut prendre 5 à 10 secondes — les données sont envoyées vers Supabase.

---

## Étape 7 — Déployer sur GitHub Pages

1. Poussez vos changements sur GitHub :
   ```
   git add js/config.js
   git commit -m "config: add Supabase credentials"
   git push
   ```
2. Allez sur **github.com/abdoundiaye-ship-it/USACar-Parts**
3. **Settings** → **Pages** → Source: `main` / `/ (root)` → **Save**
4. Votre app sera disponible sur :
   `https://abdoundiaye-ship-it.github.io/USACar-Parts/`

---

## Architecture finale

```
Téléphone vendeur (Dakar) ──┐
Tablette magasin (Dakar)   ──┤── HTTPS ──▶  Supabase (PostgreSQL)
PC admin (bureau)          ──┘                    │
                                                   └── Données partagées
                                                       en temps réel
```

---

## Changer les mots de passe par défaut

**Immédiatement après le premier déploiement :**

1. Connectez-vous en tant qu'**admin**
2. Menu → **👤 Utilisateurs** → bouton **🔑 MDP** pour chaque compte
3. Définissez des mots de passe sécurisés pour tous les utilisateurs

| Identifiant | Mot de passe par défaut | À changer |
|---|---|---|
| admin | admin123 | ✅ Obligatoire |
| vendeur | vendeur123 | ✅ Obligatoire |
| stock | stock123 | ✅ Obligatoire |
| control | control123 | ✅ Obligatoire |

---

## Vérification dans Supabase

Pour voir vos données en temps réel :
1. Supabase Dashboard → **Table Editor**
2. Sélectionnez une table (ex: `produits`)
3. Vous verrez toutes les lignes insérées par l'app

---

## Troubleshooting

| Problème | Solution |
|---|---|
| `Supabase non configuré` | Vérifiez `js/config.js` — URL et clé anon correctes |
| `getAll(...): relation does not exist` | Relancez `supabase/schema.sql` dans SQL Editor |
| `permission denied for table` | Relancez `supabase/rls.sql` dans SQL Editor |
| Les données ne s'affichent pas | Vérifiez l'onglet Network (F12) pour les erreurs API |
| `Failed to fetch` | Vérifiez votre connexion internet |
| Données vides après rechargement | L'import initial a peut-être échoué — allez dans Paramètres → Importer les données |

---

## Limites du plan gratuit Supabase

| Ressource | Limite gratuite | Usage ERP estimé |
|---|---|---|
| Stockage DB | 500 MB | ~50 MB pour 5 ans d'activité |
| Bande passante | 5 GB/mois | Largement suffisant |
| Requêtes API | Illimitées | ✅ |
| Utilisateurs actifs | 50 000/mois | ✅ |
| Projets | 2 | ✅ |

> Le plan gratuit est **suffisant** pour USA PARTS AUTO pendant plusieurs années.
> Passez au plan Pro (25$/mois) uniquement si vous dépassez 500 MB de données.

---

## Prochaines étapes (optionnel)

- **Sauvegardes automatiques** : Supabase Pro inclut des backups quotidiens
- **Domaine personnalisé** : configurez `erp.usapartsauto.sn` sur Cloudflare
- **Notifications email** : intégrez SendGrid ou Resend pour les alertes stock faible
