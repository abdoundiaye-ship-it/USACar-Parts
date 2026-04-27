/* =============================================
   USA PARTS AUTO ERP – IndexedDB Layer
   ============================================= */

const DB_NAME = 'usapartsauto_erp';
const DB_VERSION = 1;

const STORES = {
  produits:      { keyPath: 'id', indexes: [{ name: 'sku', unique: true }, { name: 'categorie', unique: false }] },
  mouvements:    { keyPath: 'id', indexes: [{ name: 'produit_id', unique: false }, { name: 'date', unique: false }] },
  ventes:        { keyPath: 'id', indexes: [{ name: 'client_id', unique: false }, { name: 'date', unique: false }] },
  lignes_ventes: { keyPath: 'id', indexes: [{ name: 'vente_id', unique: false }, { name: 'produit_id', unique: false }] },
  factures:      { keyPath: 'id', indexes: [{ name: 'vente_id', unique: false }, { name: 'client_id', unique: false }] },
  clients:       { keyPath: 'id', indexes: [{ name: 'nom', unique: false }] },
  fournisseurs:  { keyPath: 'id', indexes: [{ name: 'nom', unique: false }] },
  achats:        { keyPath: 'id', indexes: [{ name: 'fournisseur_id', unique: false }, { name: 'date', unique: false }] },
  lignes_achats: { keyPath: 'id', indexes: [{ name: 'achat_id', unique: false }, { name: 'produit_id', unique: false }] },
  paiements:     { keyPath: 'id', indexes: [{ name: 'reference', unique: false }, { name: 'date', unique: false }] },
  price_list:    { keyPath: 'produit_id', indexes: [] },
  parametres:    { keyPath: 'cle', indexes: [] },
  logs:          { keyPath: 'id', indexes: [{ name: 'date', unique: false }] },
};

class Database {
  constructor() {
    this.db = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const [name, cfg] of Object.entries(STORES)) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: cfg.keyPath });
            for (const idx of cfg.indexes) {
              store.createIndex(idx.name, idx.name, { unique: idx.unique });
            }
          }
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(this); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  _store(name, mode = 'readonly') {
    return this.db.transaction(name, mode).objectStore(name);
  }

  getAll(store) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  get(store, key) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  getByIndex(store, indexName, value) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).index(indexName).getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  put(store, obj) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(obj);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  add(store, obj) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).add(obj);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  delete(store, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  putMany(store, items) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      items.forEach(item => os.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  clear(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  count(store) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

const DB = new Database();
