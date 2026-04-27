/* ============================================================
   Tests — Achats / Landed Cost business logic
   ============================================================ */

TEST.suite('Landed Cost — frais allocation', () => {

  /* Core formula:
     fraction_ligne = total_ligne / total_marchandise
     frais_alloues = fraction_ligne × autres_frais
     cout_revient_unitaire = (total_ligne + frais_alloues) / quantite
     prix_plafond_ttc = cout_revient_unitaire × 2 × 1.18
  */

  function computeLandedCost(lignes, autresFrais) {
    const totalMarch = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
    return lignes.map(l => {
      const totalLigne = l.quantite * l.prix_unitaire;
      const fraction = totalMarch > 0 ? totalLigne / totalMarch : 0;
      const fraisAlloues = fraction * autresFrais;
      const coutTotal = totalLigne + fraisAlloues;
      const coutUnit = l.quantite > 0 ? coutTotal / l.quantite : 0;
      const plafond = coutUnit * 2 * 1.18;
      return { ...l, totalLigne, fraction, fraisAlloues, coutUnit, plafond };
    });
  }

  TEST.test('single ligne — all frais allocated to it', () => {
    const lignes = [{ quantite: 10, prix_unitaire: 100 }];
    const result = computeLandedCost(lignes, 200);
    const l = result[0];
    TEST.near(l.fraction, 1.0);
    TEST.near(l.fraisAlloues, 200);
    TEST.near(l.coutUnit, (10 * 100 + 200) / 10); // (1000 + 200) / 10 = 120
    TEST.near(l.coutUnit, 120);
  });

  TEST.test('two equal lignes split frais 50/50', () => {
    const lignes = [
      { quantite: 10, prix_unitaire: 100 },
      { quantite: 10, prix_unitaire: 100 },
    ];
    const result = computeLandedCost(lignes, 400);
    TEST.near(result[0].fraisAlloues, 200);
    TEST.near(result[1].fraisAlloues, 200);
  });

  TEST.test('frais allocated proportionally by value, not quantity', () => {
    const lignes = [
      { quantite: 10, prix_unitaire: 100 }, // 1000 = 50% of total
      { quantite: 5,  prix_unitaire: 200 }, // 1000 = 50% of total
    ];
    const result = computeLandedCost(lignes, 1000);
    TEST.near(result[0].fraction, 0.5);
    TEST.near(result[1].fraction, 0.5);
    TEST.near(result[0].fraisAlloues, 500);
    TEST.near(result[1].fraisAlloues, 500);
  });

  TEST.test('frais proportional to ligne value — unequal split', () => {
    const lignes = [
      { quantite: 100, prix_unitaire: 30 }, // 3000 = 75% of 4000
      { quantite: 20,  prix_unitaire: 50 }, // 1000 = 25% of 4000
    ];
    const result = computeLandedCost(lignes, 400);
    TEST.near(result[0].fraction, 0.75, 0.001);
    TEST.near(result[1].fraction, 0.25, 0.001);
    TEST.near(result[0].fraisAlloues, 300, 0.01);
    TEST.near(result[1].fraisAlloues, 100, 0.01);
  });

  TEST.test('cout revient unitaire correct', () => {
    // 100 units at $30 + $300 allocated frais → $3300 / 100 = $33
    const lignes = [{ quantite: 100, prix_unitaire: 30 }];
    const result = computeLandedCost(lignes, 300);
    TEST.near(result[0].coutUnit, 33, 0.001);
  });

  TEST.test('prix plafond TTC = cout × 2 × 1.18', () => {
    const lignes = [{ quantite: 100, prix_unitaire: 30 }];
    const result = computeLandedCost(lignes, 300);
    // coutUnit = 33, plafond = 33 × 2 × 1.18 = 77.88
    TEST.near(result[0].plafond, 77.88, 0.01);
  });

  TEST.test('zero frais — cout revient = prix achat', () => {
    const lignes = [{ quantite: 50, prix_unitaire: 200 }];
    const result = computeLandedCost(lignes, 0);
    TEST.near(result[0].coutUnit, 200);
  });

  TEST.test('frais allocation sums to total autres_frais', () => {
    const lignes = [
      { quantite: 12, prix_unitaire: 45 },
      { quantite: 6,  prix_unitaire: 120 },
      { quantite: 3,  prix_unitaire: 220 },
    ];
    const autresFrais = 850;
    const result = computeLandedCost(lignes, autresFrais);
    const totalAlloues = result.reduce((s, l) => s + l.fraisAlloues, 0);
    TEST.near(totalAlloues, autresFrais, 0.01, `Sum of allocs (${totalAlloues}) should equal ${autresFrais}`);
  });

  TEST.test('fractions sum to 1.0', () => {
    const lignes = [
      { quantite: 10, prix_unitaire: 100 },
      { quantite: 20, prix_unitaire: 75 },
      { quantite: 5,  prix_unitaire: 300 },
    ];
    const result = computeLandedCost(lignes, 500);
    const totalFraction = result.reduce((s, l) => s + l.fraction, 0);
    TEST.near(totalFraction, 1.0, 0.0001);
  });

  TEST.test('empty frais — zero allocation', () => {
    const lignes = [{ quantite: 24, prix_unitaire: 15 }];
    const result = computeLandedCost(lignes, 0);
    TEST.near(result[0].fraisAlloues, 0);
    TEST.near(result[0].coutUnit, 15);
  });

  TEST.test('realistic GP 5W40 shipment scenario', () => {
    // 24 cases × $47.50, shipping/customs = $320
    // coutUnit = (24 × 47.50 + 320) / 24 = (1140 + 320) / 24 = 1460/24 ≈ 60.83
    // plafond  = 60.83 × 2 × 1.18 ≈ 143.57
    const lignes = [{ quantite: 24, prix_unitaire: 47.50 }];
    const result = computeLandedCost(lignes, 320);
    TEST.near(result[0].coutUnit, 60.833, 0.01);
    TEST.near(result[0].plafond, 143.57, 0.1);
  });
});

TEST.suite('Achats — DB integration (create + mark received)', () => {
  let achatId;

  TEST.testAsync('setup seed product and supplier', async () => {
    await DB.put('produits', { id: '__TA_PROD__', nom: 'Test Achat Prod', categorie: 'Huile', sku: 'T-ACHAT', actif: true });
    await DB.put('fournisseurs', { id: '__TA_FOURN__', nom: 'Test Supplier', telephone: '', email: '', adresse: 'USA' });
    TEST.assert(true);
  });

  TEST.testAsync('create achat in DB', async () => {
    const all = await DB.getAll('achats');
    achatId = seqId('TACH', all);
    await DB.put('achats', {
      id: achatId,
      date: '2026-04-26',
      fournisseur_id: '__TA_FOURN__',
      total: 1000,
      autres_frais: 100,
      statut: 'En attente',
    });
    const a = await DB.get('achats', achatId);
    TEST.eq(a.statut, 'En attente');
    TEST.eq(a.total, 1000);
  });

  TEST.testAsync('create ligne_achat in DB', async () => {
    const lid = genId('TAL');
    await DB.add('lignes_achats', {
      id: lid,
      achat_id: achatId,
      produit_id: '__TA_PROD__',
      quantite: 20,
      prix_unitaire: 50,
      total: 1000,
      cout_revient_unitaire: 55,
      cout_revient_total: 1100,
      prix_plafond_ttc: 129.8,
    });
    const lignes = await DB.getByIndex('lignes_achats', 'achat_id', achatId);
    TEST.assert(lignes.length === 1, `Expected 1 ligne, got ${lignes.length}`);
    TEST.near(lignes[0].cout_revient_unitaire, 55);

    // cleanup ligne
    await DB.delete('lignes_achats', lid);
  });

  TEST.testAsync('mark achat as Reçu', async () => {
    const a = await DB.get('achats', achatId);
    await DB.put('achats', { ...a, statut: 'Reçu' });
    const updated = await DB.get('achats', achatId);
    TEST.eq(updated.statut, 'Reçu');
  });

  TEST.testAsync('cleanup test achat, product, supplier', async () => {
    await DB.delete('achats', achatId);
    await DB.delete('produits', '__TA_PROD__');
    await DB.delete('fournisseurs', '__TA_FOURN__');
    TEST.assert(await DB.get('achats', achatId) === undefined);
  });
});
