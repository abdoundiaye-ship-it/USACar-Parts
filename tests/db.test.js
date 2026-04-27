/* ============================================================
   Tests — db.js  (IndexedDB operations)
   All async — run via TEST.testAsync
   ============================================================ */

TEST.suite('Database.open', () => {
  TEST.testAsync('opens without error', async () => {
    TEST.assert(DB.db !== null, 'DB.db should be non-null after boot');
  });
});

TEST.suite('Database CRUD — produits store', () => {
  const TEST_ID = '__TEST_PROD_CRUD__';

  TEST.testAsync('put and get', async () => {
    await DB.put('produits', { id: TEST_ID, nom: 'Test Oil', categorie: 'Huile', sku: 'TEST-SKU', actif: true });
    const result = await DB.get('produits', TEST_ID);
    TEST.assert(result !== undefined, 'Record should exist after put');
    TEST.eq(result.nom, 'Test Oil');
    TEST.eq(result.categorie, 'Huile');
  });

  TEST.testAsync('getAll returns array', async () => {
    const all = await DB.getAll('produits');
    TEST.assert(Array.isArray(all), 'getAll must return an array');
    TEST.assert(all.length >= 1, 'Should have at least the test record');
  });

  TEST.testAsync('put updates existing record', async () => {
    await DB.put('produits', { id: TEST_ID, nom: 'Updated Oil', categorie: 'Huile', sku: 'TEST-SKU', actif: false });
    const result = await DB.get('produits', TEST_ID);
    TEST.eq(result.nom, 'Updated Oil');
    TEST.eq(result.actif, false);
  });

  TEST.testAsync('delete removes record', async () => {
    await DB.delete('produits', TEST_ID);
    const result = await DB.get('produits', TEST_ID);
    TEST.assert(result === undefined, 'Record should be undefined after delete');
  });
});

TEST.suite('Database CRUD — clients store', () => {
  const TEST_CLIENT_ID = '__TEST_CLIENT_CRUD__';

  TEST.testAsync('add client and retrieve', async () => {
    await DB.put('clients', { id: TEST_CLIENT_ID, nom: 'Test Client', telephone: '77000000', email: 'test@test.sn', adresse: 'Dakar', total_achats: 0, credit: 0 });
    const c = await DB.get('clients', TEST_CLIENT_ID);
    TEST.eq(c.nom, 'Test Client');
    TEST.eq(c.credit, 0);
  });

  TEST.testAsync('getByIndex on nom', async () => {
    const results = await DB.getByIndex('clients', 'nom', 'Test Client');
    TEST.assert(Array.isArray(results), 'getByIndex must return array');
    TEST.assert(results.some(r => r.id === TEST_CLIENT_ID), 'Test client should be in results');
  });

  TEST.testAsync('cleanup test client', async () => {
    await DB.delete('clients', TEST_CLIENT_ID);
    const c = await DB.get('clients', TEST_CLIENT_ID);
    TEST.assert(c === undefined, 'Should be deleted');
  });
});

TEST.suite('Database — putMany', () => {
  TEST.testAsync('inserts multiple records atomically', async () => {
    const items = [
      { id: '__MV_BULK_1__', date: '2026-01-01', produit_id: 'PRD0001', type: 'Entrée', quantite: 10, prix_unitaire: 5, reference: 'TEST', commentaire: '' },
      { id: '__MV_BULK_2__', date: '2026-01-02', produit_id: 'PRD0001', type: 'Sortie', quantite: 3, prix_unitaire: 5, reference: 'TEST', commentaire: '' },
    ];
    await DB.putMany('mouvements', items);
    const r1 = await DB.get('mouvements', '__MV_BULK_1__');
    const r2 = await DB.get('mouvements', '__MV_BULK_2__');
    TEST.assert(r1 !== undefined, 'First bulk record should exist');
    TEST.assert(r2 !== undefined, 'Second bulk record should exist');
  });

  TEST.testAsync('cleanup bulk mouvements', async () => {
    await DB.delete('mouvements', '__MV_BULK_1__');
    await DB.delete('mouvements', '__MV_BULK_2__');
    TEST.assert(await DB.get('mouvements', '__MV_BULK_1__') === undefined);
    TEST.assert(await DB.get('mouvements', '__MV_BULK_2__') === undefined);
  });
});

TEST.suite('Database — count', () => {
  TEST.testAsync('count returns a number', async () => {
    const n = await DB.count('produits');
    TEST.assert(typeof n === 'number', 'count must return number');
    TEST.assert(n >= 0, 'count must be non-negative');
  });
});

TEST.suite('Database — parametres (string keyPath)', () => {
  TEST.testAsync('put and get by string key', async () => {
    await DB.put('parametres', { cle: '__TEST_PARAM__', valeur: 'test_value' });
    const p = await DB.get('parametres', '__TEST_PARAM__');
    TEST.eq(p.valeur, 'test_value');
    await DB.delete('parametres', '__TEST_PARAM__');
  });
});
