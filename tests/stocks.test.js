/* ============================================================
   Tests — Stocks module (computeStocks, getStock)
   ============================================================ */

TEST.suite('Stocks.computeStocks — stock calculation', () => {

  /* Helper: inject test data into the Stocks module's private state
     by temporarily overriding DB.getAll, then calling load() */

  const P1 = { id: 'TPRD1', nom: 'Test Oil A', categorie: 'Huile', sku: 'T-OIL-A', actif: true };
  const P2 = { id: 'TPRD2', nom: 'Test Oil B', categorie: 'Huile', sku: 'T-OIL-B', actif: true };

  TEST.testAsync('setup — seed test products and mouvements', async () => {
    await DB.put('produits', P1);
    await DB.put('produits', P2);
    await DB.put('mouvements', { id: 'TMV001', date: '2026-01-01', produit_id: 'TPRD1', type: 'Entrée', quantite: 100, prix_unitaire: 10 });
    await DB.put('mouvements', { id: 'TMV002', date: '2026-01-10', produit_id: 'TPRD1', type: 'Sortie', quantite: 30,  prix_unitaire: 15 });
    await DB.put('mouvements', { id: 'TMV003', date: '2026-01-15', produit_id: 'TPRD1', type: 'Sortie', quantite: 20,  prix_unitaire: 15 });
    await DB.put('mouvements', { id: 'TMV004', date: '2026-01-01', produit_id: 'TPRD2', type: 'Entrée', quantite: 50,  prix_unitaire: 8 });
    TEST.assert(true, 'Seed complete');
  });

  TEST.testAsync('stock P1 = 100 - 30 - 20 = 50', async () => {
    await Stocks.load();
    const stock = Stocks.getStock('TPRD1');
    TEST.eq(stock, 50, `Expected 50, got ${stock}`);
  });

  TEST.testAsync('stock P2 = 50 (no sortie)', async () => {
    const stock = Stocks.getStock('TPRD2');
    TEST.eq(stock, 50, `Expected 50, got ${stock}`);
  });

  TEST.testAsync('computeStocks includes all test products', async () => {
    const stocks = Stocks.computeStocks();
    const s1 = stocks.find(s => s.produit.id === 'TPRD1');
    const s2 = stocks.find(s => s.produit.id === 'TPRD2');
    TEST.assert(s1 !== undefined, 'P1 should appear in computeStocks');
    TEST.assert(s2 !== undefined, 'P2 should appear in computeStocks');
    TEST.eq(s1.actuel, 50);
    TEST.eq(s2.actuel, 50);
    TEST.eq(s1.entree, 100);
    TEST.eq(s1.sortie, 50);
  });

  TEST.testAsync('valeur = entree qty × prix_unitaire for P2', async () => {
    const stocks = Stocks.computeStocks();
    const s2 = stocks.find(s => s.produit.id === 'TPRD2');
    TEST.near(s2.valeur, 400); // 50 × 8
  });

  TEST.testAsync('stock of unknown product is 0', async () => {
    const stock = Stocks.getStock('NONEXISTENT_ID');
    TEST.eq(stock, 0);
  });

  TEST.testAsync('adding more entrée increases stock', async () => {
    await DB.put('mouvements', { id: 'TMV005', date: '2026-02-01', produit_id: 'TPRD1', type: 'Entrée', quantite: 10, prix_unitaire: 10 });
    await Stocks.load();
    const stock = Stocks.getStock('TPRD1');
    TEST.eq(stock, 60, `Expected 60 after new entrée, got ${stock}`);
  });

  TEST.testAsync('cleanup — remove test data', async () => {
    for (const id of ['TMV001','TMV002','TMV003','TMV004','TMV005']) {
      await DB.delete('mouvements', id);
    }
    await DB.delete('produits', 'TPRD1');
    await DB.delete('produits', 'TPRD2');
    TEST.assert(true, 'Cleanup complete');
  });
});

TEST.suite('Stocks — edge cases', () => {
  TEST.testAsync('product with only sorties has negative stock', async () => {
    // Represents an import/correction edge case
    const pid = 'TPRD_NEG';
    await DB.put('produits', { id: pid, nom: 'Edge Case', categorie: 'Test', sku: 'T-EDGE', actif: true });
    await DB.put('mouvements', { id: 'TMV_NEG', date: '2026-01-01', produit_id: pid, type: 'Sortie', quantite: 5, prix_unitaire: 0 });
    await Stocks.load();
    const stock = Stocks.getStock(pid);
    TEST.eq(stock, -5, 'Negative stock should be computed as-is (not clamped)');
    await DB.delete('mouvements', 'TMV_NEG');
    await DB.delete('produits', pid);
  });

  TEST.testAsync('product with no mouvements has stock = 0', async () => {
    const pid = 'TPRD_ZERO';
    await DB.put('produits', { id: pid, nom: 'Zero Stock', categorie: 'Test', sku: 'T-ZERO', actif: true });
    await Stocks.load();
    const stock = Stocks.getStock(pid);
    TEST.eq(stock, 0);
    await DB.delete('produits', pid);
  });
});
