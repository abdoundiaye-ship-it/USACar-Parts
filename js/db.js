/* ============================================================
   USA PARTS AUTO ERP — Couche de données Supabase
   Remplace IndexedDB par PostgreSQL via l'API Supabase.
   Interface identique à l'ancienne version IndexedDB —
   tous les modules (ventes.js, stocks.js, etc.) fonctionnent
   sans aucune modification.
   ============================================================ */

/* ── Colonnes clé primaire par table (hors 'id' standard) ── */
const PK = {
  price_list:  'produit_id',
  parametres:  'cle',
};

function _pk(store) {
  return PK[store] || 'id';
}

/* ── Fallback : noms de colonnes d'index pour getByIndex ── */

class Database {
  constructor() {
    this.client = null;
    this._ready = false;
  }

  /* ── Initialisation ── */
  open() {
    if (
      typeof SUPABASE_URL === 'undefined' ||
      SUPABASE_URL.includes('VOTRE_PROJECT_ID') ||
      typeof SUPABASE_ANON_KEY === 'undefined' ||
      SUPABASE_ANON_KEY.includes('VOTRE_ANON_KEY')
    ) {
      return Promise.reject(new Error(
        'Supabase non configuré.\n' +
        'Éditez js/config.js et renseignez SUPABASE_URL et SUPABASE_ANON_KEY.\n' +
        'Consultez SETUP.md pour les instructions détaillées.'
      ));
    }

    try {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      this._ready = true;
      return Promise.resolve(this);
    } catch (e) {
      return Promise.reject(new Error('Impossible de créer le client Supabase : ' + e.message));
    }
  }

  _check() {
    if (!this._ready || !this.client) throw new Error('Base de données non initialisée. Appelez DB.open() d\'abord.');
  }

  /* ── READ ALL ── */
  async getAll(store) {
    this._check();
    const { data, error } = await this.client.from(store).select('*');
    if (error) throw new Error(`getAll(${store}): ${error.message}`);
    return data || [];
  }

  /* ── READ ONE ── */
  async get(store, key) {
    this._check();
    const pk = _pk(store);
    const { data, error } = await this.client
      .from(store).select('*').eq(pk, key).maybeSingle();
    if (error) throw new Error(`get(${store}, ${key}): ${error.message}`);
    return data ?? undefined;
  }

  /* ── READ BY INDEX (colonne secondaire) ── */
  async getByIndex(store, colName, value) {
    this._check();
    const { data, error } = await this.client
      .from(store).select('*').eq(colName, value);
    if (error) throw new Error(`getByIndex(${store}, ${colName}): ${error.message}`);
    return data || [];
  }

  /* ── UPSERT (insert ou update) ── */
  async put(store, obj) {
    this._check();
    const pk = _pk(store);
    const { error } = await this.client
      .from(store).upsert(obj, { onConflict: pk });
    if (error) throw new Error(`put(${store}): ${error.message}`);
    return obj[pk];
  }

  /* ── INSERT STRICT (échoue si doublon) ── */
  async add(store, obj) {
    this._check();
    const pk = _pk(store);
    const { error } = await this.client.from(store).insert(obj);
    if (error) throw new Error(`add(${store}): ${error.message}`);
    return obj[pk];
  }

  /* ── DELETE ONE ── */
  async delete(store, key) {
    this._check();
    const pk = _pk(store);
    const { error } = await this.client.from(store).delete().eq(pk, key);
    if (error) throw new Error(`delete(${store}, ${key}): ${error.message}`);
  }

  /* ── UPSERT MANY ── */
  async putMany(store, items) {
    this._check();
    if (!items || items.length === 0) return;
    const pk = _pk(store);
    /* Découper en lots de 500 pour éviter les limites de l'API */
    const BATCH = 500;
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      const { error } = await this.client
        .from(store).upsert(batch, { onConflict: pk });
      if (error) throw new Error(`putMany(${store}) batch ${i}: ${error.message}`);
    }
  }

  /* ── DELETE ALL (vider une table) ── */
  async clear(store) {
    this._check();
    const pk = _pk(store);
    /* "NOT pk IS NULL" correspond à toutes les lignes (PK jamais null) */
    const { error } = await this.client
      .from(store).delete().not(pk, 'is', null);
    if (error) throw new Error(`clear(${store}): ${error.message}`);
  }

  /* ── COUNT ── */
  async count(store) {
    this._check();
    const { count, error } = await this.client
      .from(store).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`count(${store}): ${error.message}`);
    return count ?? 0;
  }
}

const DB = new Database();
