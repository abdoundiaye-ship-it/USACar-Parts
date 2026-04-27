/* ============================================================
   Tests — Ventes business logic
   (TVA calc, total HT, remise application)
   ============================================================ */

TEST.suite('Ventes — pricing calculations', () => {

  TEST.test('total HT from ligne: qty × prix_base = total sans remise', () => {
    const qty = 5, prix = 1000, remise = 0;
    const applique = applyRemise(prix, remise);
    const total = applique * qty;
    TEST.near(total, 5000);
  });

  TEST.test('total HT with 20% remise', () => {
    const qty = 10, prix = 2000, remise = 20;
    const applique = applyRemise(prix, remise);
    const total = applique * qty;
    TEST.near(applique, 1600, 0.01, 'Prix appliqué should be 1600');
    TEST.near(total, 16000, 0.01, 'Total should be 16000');
  });

  TEST.test('TVA 18% on total HT', () => {
    const totalHT = 10000;
    const tva = calcTVA(totalHT);
    TEST.near(tva, 1800);
  });

  TEST.test('total TTC = total HT + TVA', () => {
    const totalHT = 10000;
    const ttc = calcTTC(totalHT);
    TEST.near(ttc, 11800);
  });

  TEST.test('multi-ligne total HT aggregation', () => {
    const lignes = [
      { quantite: 3, prix_base_ht: 1000, remise: 0 },
      { quantite: 2, prix_base_ht: 2000, remise: 10 },
      { quantite: 5, prix_base_ht: 500,  remise: 50 },
    ];
    const totalHT = lignes.reduce((sum, l) => {
      return sum + applyRemise(l.prix_base_ht, l.remise) * l.quantite;
    }, 0);
    // 3×1000 + 2×1800 + 5×250 = 3000 + 3600 + 1250 = 7850
    TEST.near(totalHT, 7850, 0.01);
  });

  TEST.test('remise 100% results in 0 total', () => {
    const total = applyRemise(5000, 100) * 10;
    TEST.near(total, 0);
  });

  TEST.test('full invoice calculation', () => {
    const lignes = [
      { quantite: 12, prix_base_ht: 8500, remise: 5 },
    ];
    const totalHT = lignes.reduce((s, l) => s + applyRemise(l.prix_base_ht, l.remise) * l.quantite, 0);
    const tva = calcTVA(totalHT);
    const ttc = totalHT + tva;
    // 12 × 8075 = 96900 HT ; TVA = 17442 ; TTC = 114342
    TEST.near(totalHT, 96900, 0.1);
    TEST.near(tva, 17442, 0.1);
    TEST.near(ttc, 114342, 0.1);
  });
});

TEST.suite('Ventes — DB integration (create + read + delete)', () => {

  let venteId, ligneId, factureId;

  TEST.testAsync('setup — seed client and product', async () => {
    await DB.put('clients', { id: '__TV_CLIENT__', nom: 'Test Client Vente', telephone: '', email: '', adresse: '', total_achats: 0, credit: 0 });
    await DB.put('produits', { id: '__TV_PROD__', nom: 'Test Product Vente', categorie: 'Huile', sku: 'T-VENTE', actif: true });
    TEST.assert(true, 'Seed OK');
  });

  TEST.testAsync('create vente in DB', async () => {
    const allVentes = await DB.getAll('ventes');
    venteId = seqId('TVEN', allVentes);
    await DB.put('ventes', {
      id: venteId,
      date: '2026-04-26',
      client_id: '__TV_CLIENT__',
      total_ht: 8500,
      tva: calcTVA(8500),
      total_ttc: calcTTC(8500),
      paiement: 'Espèces',
      statut: 'Livrée',
    });
    const v = await DB.get('ventes', venteId);
    TEST.assert(v !== undefined, 'Vente should be persisted');
    TEST.near(v.tva, 1530);
    TEST.near(v.total_ttc, 10030);
  });

  TEST.testAsync('create ligne_vente in DB', async () => {
    ligneId = genId('TVL');
    await DB.add('lignes_ventes', {
      id: ligneId,
      vente_id: venteId,
      produit_id: '__TV_PROD__',
      quantite: 1,
      prix_base_ht: 8500,
      remise: 0,
      prix_applique_ht: 8500,
      total_ht: 8500,
    });
    const l = await DB.get('lignes_ventes', ligneId);
    TEST.eq(l.vente_id, venteId);
    TEST.eq(l.quantite, 1);
  });

  TEST.testAsync('getByIndex retrieves lignes by vente_id', async () => {
    const lignes = await DB.getByIndex('lignes_ventes', 'vente_id', venteId);
    TEST.assert(lignes.some(l => l.id === ligneId), 'Ligne should be found by vente_id index');
  });

  TEST.testAsync('cleanup — delete test vente, ligne, client, product', async () => {
    await DB.delete('lignes_ventes', ligneId);
    await DB.delete('ventes', venteId);
    await DB.delete('clients', '__TV_CLIENT__');
    await DB.delete('produits', '__TV_PROD__');
    TEST.assert(await DB.get('ventes', venteId) === undefined, 'Vente should be deleted');
  });
});

TEST.suite('Ventes — seqId monotonicity', () => {
  TEST.test('IDs are strictly increasing', () => {
    const existing = [{ id: 'V0001' }, { id: 'V0002' }, { id: 'V0004' }];
    const next = seqId('V', existing);
    TEST.eq(next, 'V0005');
  });

  TEST.test('no existing → V0001', () => {
    TEST.eq(seqId('V', []), 'V0001');
  });
});
