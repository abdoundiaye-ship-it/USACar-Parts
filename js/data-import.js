/* ============================================================
   USA PARTS AUTO ERP — Import Données Workbook Excel
   Source: Copy of USA_PARTS_AUTO_pro_stock_erp.xlsx
   Généré le: 2026-04-26
   ============================================================ */

const WORKBOOK_DATA = {

  produits: [
    { id:'GP-5W40-1L',      nom:'GP PETROGEN FULL SYNTHETIC 5W40 SP MOTOR OIL 12/1QTS (GOLD SERIES)',              categorie:'Huile',                    sku:'GP-5W40-1L',      actif:true  },
    { id:'CE-5W40-1L',      nom:'CASTROL EDGE 5W40 EURO MOTOR OIL 6/1 QTS',                                        categorie:'Huile',                    sku:'CE-5W40-1L',      actif:true  },
    { id:'MB1-5W40-1L',     nom:'MOBIL 1 FS EURO 5W40 MOTOR OIL 6/1 QUARTS',                                       categorie:'Huile',                    sku:'MB1-5W40-1L',     actif:true  },
    { id:'MC-LVTF-1L',      nom:'MOTORCRAFT MERCON LV TRANSMISSION FLUID 12/1 QTS',                                 categorie:'Liquide de Transmission',  sku:'MC-LVTF-1L',      actif:true  },
    { id:'PS--ATFTF-1L',    nom:'PRIME SERIES ATF DEXRON-3 TRANSMISSION FLUID 12/1 QTS',                            categorie:'Liquide de Transmission',  sku:'PS--ATFTF-1L',    actif:true  },
    { id:'GP-15W40-220L',   nom:'GP DEOGEN STANDARD 15W40 CI4 55 GAL',                                              categorie:'Huile',                    sku:'GP-15W40-220L',   actif:false },
    { id:'PS-5W40-1L',      nom:'PRIME SERIES FULL SYNTHETIC 5W40 MOTOR OIL 6/1 QTS',                               categorie:'Huile',                    sku:'PS-5W40-1L',      actif:true  },
    { id:'GP-10W40-1L',     nom:'GP PETROGEN SYNTHETIC BLEND 10W40 SL MOTOR OIL 12/1QTS (BLUE SERIES)',             categorie:'Huile',                    sku:'GP-10W40-1L',     actif:true  },
    { id:'GP-5W30-1L',      nom:'GP PETROGEN SYNTHETIC BLEND 5W30 SL MOTOR OIL 12/1QTS (BLUE SERIES)',              categorie:'Huile',                    sku:'GP-5W30-1L',      actif:true  },
    { id:'GP-SYNCU-CVTF-1L',nom:'GP SYNCROGEN UNIVERSAL CVT FLUID 12/1QTS',                                         categorie:'Liquide de Transmission',  sku:'GP-SYNCU-CVTF-1L',actif:true  },
    { id:'GP-SYNCD-ATF-1L', nom:'GP SYNCROGEN DEXRON-III TRANSMISSION FLUID 12/1 QTS',                              categorie:'Liquide de Transmission',  sku:'GP-SYNCD-ATF-1L', actif:true  },
    { id:'GP-15W40-1L',     nom:'GP DEOGEN SYNTHETIC BLEND 15W40 CK4 12/1QTS',                                      categorie:'Huile',                    sku:'GP-15W40-1L',     actif:true  },
    { id:'PS-5W30-1L',      nom:'PRIME SERIES SYNTHETIC BLEND 5W30 MOTOR OIL 12/1 QTS',                             categorie:'Huile',                    sku:'PS-5W30-1L',      actif:true  },
    { id:'GP-0W20',         nom:'GP PETROGEN FULL SYNTHETIC 0W20 SQ DEXOS-1 GEN3 MOTOR OIL 12/1QTS (GOLD SERIES)', categorie:'Huile',                    sku:'GP-0W20',         actif:true  },
    { id:'PZ-5W40',         nom:'PENNZOIL PLATINUM EURO FULL SYNTHETIC 5W40 MOTOR OIL 6/1 QTS',                     categorie:'Huile',                    sku:'PZ-5W40',         actif:true  },
    { id:'GP-15W40-5L',     nom:'GP DEOGEN SYNTHETIC BLEND 15W40 CI4 4/1 GAL',                                      categorie:'Huile',                    sku:'GP-15W40-5L',     actif:true  },
    { id:'PS-15W40-5L',     nom:'PRIME SERIES 15W40 CK-4 DIESEL MOTOR OIL 3/1 GALLON',                              categorie:'Huile',                    sku:'PS-15W40-5L',     actif:true  },
    { id:'GP-0W40-1L',      nom:'GP PETROGEN FULL SYNTHETIC 0W40 SP MOTOR OIL 12/1QTS (GOLD SERIES)',               categorie:'Huile',                    sku:'GP-0W40-1L',      actif:true  },
    { id:'MB1-0W40-1L',     nom:'MOBIL 1 FS EURO 0W40 MOTOR OIL 6/1 QTS',                                          categorie:'Huile',                    sku:'MB1-0W40-1L',     actif:true  },
    { id:'PZ-0W40-1L',      nom:'PENNZOIL PLATINUM EURO FULL SYNTHETIC 0W40 MOTOR OIL 6/1 QTS',                     categorie:'Huile',                    sku:'PZ-0W40-1L',      actif:true  },
    { id:'CE-0W40-1L',      nom:'CASTROL EDGE EURO 0W40 MOTOR OIL 6/1 QTS A3/B4',                                   categorie:'Huile',                    sku:'CE-0W40-1L',      actif:true  },
    { id:'MB1-0W20-1L',     nom:'MOBIL 1 ADVANCE FULL SYNTHETIC 0W20 DEXOS-1 GEN3 MOTOR OIL 6/1 QTS',              categorie:'Huile',                    sku:'MB1-0W20-1L',     actif:true  },
    { id:'CE-0W20-1L',      nom:'CASTROL EDGE 0W20 DEXOS-1 GEN3 MOTOR OIL 6/1 QTS',                                 categorie:'Huile',                    sku:'CE-0W20-1L',      actif:true  },
  ],

  clients: [
    { id:'CL0001', nom:'Client Ventes avant inventaire', telephone:'', email:'',                  adresse:'Dakar, Senegal',   total_achats:3483360, credit:0 },
  ],

  fournisseurs: [
    { id:'F001', nom:'Alioune Ndiaye', telephone:'', email:'loon19@gmail.com', adresse:'New Fairfax, CT – USA' },
  ],

  ventes: [
    { id:'V0001', date:'2026-04-17', client_id:'CL0001', total_ht:2952000, tva:531360, total_ttc:3483360, paiement:'', statut:'Livrée' },
  ],

  lignes_ventes: [
    { id:'VL001', vente_id:'V0001', produit_id:'GP-5W40-1L',       quantite:106, prix_base_ht:6150, remise:0, prix_applique_ht:6150, total_ht:651900 },
    { id:'VL002', vente_id:'V0001', produit_id:'MC-LVTF-1L',        quantite:95,  prix_base_ht:5740, remise:0, prix_applique_ht:5740, total_ht:545300 },
    { id:'VL003', vente_id:'V0001', produit_id:'GP-5W30-1L',        quantite:112, prix_base_ht:3280, remise:0, prix_applique_ht:3280, total_ht:367360 },
    { id:'VL004', vente_id:'V0001', produit_id:'GP-10W40-1L',       quantite:89,  prix_base_ht:2460, remise:0, prix_applique_ht:2460, total_ht:218940 },
    { id:'VL005', vente_id:'V0001', produit_id:'PS--ATFTF-1L',      quantite:48,  prix_base_ht:3280, remise:0, prix_applique_ht:3280, total_ht:157440 },
    { id:'VL006', vente_id:'V0001', produit_id:'PS-5W40-1L',        quantite:54,  prix_base_ht:5330, remise:0, prix_applique_ht:5330, total_ht:287820 },
    { id:'VL007', vente_id:'V0001', produit_id:'GP-SYNCU-CVTF-1L',  quantite:48,  prix_base_ht:7380, remise:0, prix_applique_ht:7380, total_ht:354240 },
    { id:'VL008', vente_id:'V0001', produit_id:'CE-5W40-1L',        quantite:30,  prix_base_ht:6150, remise:0, prix_applique_ht:6150, total_ht:184500 },
    { id:'VL009', vente_id:'V0001', produit_id:'MB1-5W40-1L',       quantite:30,  prix_base_ht:6150, remise:0, prix_applique_ht:6150, total_ht:184500 },
  ],

  factures: [
    { id:'F0001', vente_id:'V0001', client_id:'CL0001', date:'2026-04-17', total_ht:2952000, tva:531360, total_ttc:3483360, statut:'Payée' },
  ],

  achats: [
    { id:'AC0001', date:'2026-01-17', fournisseur_id:'F001', total:6853.55, autres_frais:1150, statut:'Reçu' },
    { id:'AC0002', date:'2026-04-18', fournisseur_id:'F001', total:15554.20, autres_frais:2800, statut:'Reçu' },
  ],

  lignes_achats: [
    /* ── AC0001 (Janv 17, 2026) ── prix en FCFA, coût revient calculé avec frais alloués ──────── */
    { id:'LA001', achat_id:'AC0001', produit_id:'GP-5W40-1L',       quantite:240, prix_unitaire:2275,  total:546000,  cout_revient_unitaire:2651.99, cout_revient_total:636478.66,  prix_plafond_ttc:5781.35  },
    { id:'LA002', achat_id:'AC0001', produit_id:'CE-5W40-1L',       quantite:60,  prix_unitaire:3080,  total:184800,  cout_revient_unitaire:3590.39, cout_revient_total:215423.55,  prix_plafond_ttc:7827.06  },
    { id:'LA003', achat_id:'AC0001', produit_id:'MB1-5W40-1L',      quantite:60,  prix_unitaire:3127,  total:187620,  cout_revient_unitaire:3645.18, cout_revient_total:218710.86,  prix_plafond_ttc:7946.49  },
    { id:'LA004', achat_id:'AC0001', produit_id:'MC-LVTF-1L',       quantite:120, prix_unitaire:3267,  total:392040,  cout_revient_unitaire:3808.38, cout_revient_total:457005.66,  prix_plafond_ttc:8302.27  },
    { id:'LA005', achat_id:'AC0001', produit_id:'PS--ATFTF-1L',     quantite:120, prix_unitaire:1353,  total:162360,  cout_revient_unitaire:1577.21, cout_revient_total:189264.97,  prix_plafond_ttc:3438.31  },
    { id:'LA006', achat_id:'AC0001', produit_id:'GP-15W40-220L',    quantite:440, prix_unitaire:1171,  total:515240,  cout_revient_unitaire:1365.05, cout_revient_total:600621.36,  prix_plafond_ttc:2975.81  },
    { id:'LA007', achat_id:'AC0001', produit_id:'PS-5W40-1L',       quantite:150, prix_unitaire:1769,  total:265350,  cout_revient_unitaire:2062.14, cout_revient_total:309321.63,  prix_plafond_ttc:4495.47  },
    { id:'LA008', achat_id:'AC0001', produit_id:'GP-10W40-1L',      quantite:180, prix_unitaire:1167,  total:210060,  cout_revient_unitaire:1360.39, cout_revient_total:244869.43,  prix_plafond_ttc:2965.64  },
    { id:'LA009', achat_id:'AC0001', produit_id:'GP-5W30-1L',       quantite:240, prix_unitaire:1167,  total:280080,  cout_revient_unitaire:1360.39, cout_revient_total:326492.57,  prix_plafond_ttc:2965.64  },
    { id:'LA010', achat_id:'AC0001', produit_id:'GP-SYNCU-CVTF-1L', quantite:180, prix_unitaire:3033,  total:545940,  cout_revient_unitaire:3535.60, cout_revient_total:636408.71,  prix_plafond_ttc:7707.62  },
    { id:'LA011', achat_id:'AC0001', produit_id:'GP-SYNCD-ATF-1L',  quantite:240, prix_unitaire:1353,  total:324720,  cout_revient_unitaire:1577.21, cout_revient_total:378529.94,  prix_plafond_ttc:3438.31  },
    { id:'LA012', achat_id:'AC0001', produit_id:'GP-15W40-1L',      quantite:120, prix_unitaire:1867,  total:224040,  cout_revient_unitaire:2176.38, cout_revient_total:261166.08,  prix_plafond_ttc:4744.52  },
    /* ── AC0002 (Avril 18, 2026) ── ────────────────────────────────────────────────────────────── */
    { id:'LA013', achat_id:'AC0002', produit_id:'GP-5W30-1L',       quantite:600, prix_unitaire:1167,  total:700200,  cout_revient_unitaire:1376.01, cout_revient_total:825603.89,  prix_plafond_ttc:2999.69  },
    { id:'LA014', achat_id:'AC0002', produit_id:'PS-5W30-1L',       quantite:600, prix_unitaire:1294,  total:776400,  cout_revient_unitaire:1525.75, cout_revient_total:915451.10,  prix_plafond_ttc:3326.14  },
    { id:'LA015', achat_id:'AC0002', produit_id:'GP-0W20',          quantite:600, prix_unitaire:1680,  total:1008000, cout_revient_unitaire:1980.88, cout_revient_total:1188530.02, prix_plafond_ttc:4318.33  },
    { id:'LA016', achat_id:'AC0002', produit_id:'MB1-5W40-1L',      quantite:120, prix_unitaire:3267,  total:392040,  cout_revient_unitaire:3852.11, cout_revient_total:462253.28,  prix_plafond_ttc:8397.60  },
    { id:'LA017', achat_id:'AC0002', produit_id:'CE-5W40-1L',       quantite:120, prix_unitaire:2893,  total:347160,  cout_revient_unitaire:3411.13, cout_revient_total:409335.40,  prix_plafond_ttc:7436.26  },
    { id:'LA018', achat_id:'AC0002', produit_id:'PZ-5W40',          quantite:120, prix_unitaire:3051,  total:366120,  cout_revient_unitaire:3597.43, cout_revient_total:431691.08,  prix_plafond_ttc:7842.39  },
    { id:'LA019', achat_id:'AC0002', produit_id:'GP-15W40-5L',      quantite:400, prix_unitaire:1470,  total:588000,  cout_revient_unitaire:1733.27, cout_revient_total:693309.18,  prix_plafond_ttc:3778.54  },
    { id:'LA020', achat_id:'AC0002', produit_id:'PS-15W40-5L',      quantite:300, prix_unitaire:1335,  total:400500,  cout_revient_unitaire:1574.09, cout_revient_total:472228.44,  prix_plafond_ttc:3431.53  },
    { id:'LA021', achat_id:'AC0002', produit_id:'GP-0W40-1L',       quantite:240, prix_unitaire:1971,  total:473040,  cout_revient_unitaire:2324.00, cout_revient_total:557760.16,  prix_plafond_ttc:5066.32  },
    { id:'LA022', achat_id:'AC0002', produit_id:'MB1-0W40-1L',      quantite:60,  prix_unitaire:2987,  total:179220,  cout_revient_unitaire:3521.96, cout_revient_total:211317.81,  prix_plafond_ttc:7677.88  },
    { id:'LA023', achat_id:'AC0002', produit_id:'PZ-0W40-1L',       quantite:60,  prix_unitaire:3051,  total:183060,  cout_revient_unitaire:3597.43, cout_revient_total:215845.54,  prix_plafond_ttc:7842.39  },
    { id:'LA024', achat_id:'AC0002', produit_id:'CE-0W40-1L',       quantite:60,  prix_unitaire:3799,  total:227940,  cout_revient_unitaire:4479.39, cout_revient_total:268763.42,  prix_plafond_ttc:9765.07  },
    { id:'LA025', achat_id:'AC0002', produit_id:'MB1-0W20-1L',      quantite:60,  prix_unitaire:2987,  total:179220,  cout_revient_unitaire:3521.96, cout_revient_total:211317.81,  prix_plafond_ttc:7677.88  },
    { id:'LA026', achat_id:'AC0002', produit_id:'CE-0W20-1L',       quantite:60,  prix_unitaire:2893,  total:173580,  cout_revient_unitaire:3411.13, cout_revient_total:204667.70,  prix_plafond_ttc:7436.26  },
    { id:'LA027', achat_id:'AC0002', produit_id:'GP-SYNCU-CVTF-1L', quantite:600, prix_unitaire:3033,  total:1819800, cout_revient_unitaire:3576.20, cout_revient_total:2145721.16, prix_plafond_ttc:7796.12  },
    { id:'LA028', achat_id:'AC0002', produit_id:'GP-SYNCD-ATF-1L',  quantite:600, prix_unitaire:1493,  total:895800,  cout_revient_unitaire:1760.39, cout_revient_total:1056235.31, prix_plafond_ttc:3837.65  },
  ],

  /* Entrées AC0001 (2026-01-17) + Entrées AC0002 (2026-04-18) + Sorties Vente V0001 (2026-04-17) */
  mouvements: [
    /* ── Entrées AC0001 ── */
    { id:'ME-AC001-01', date:'2026-01-17', produit_id:'GP-5W40-1L',       type:'Entrée', quantite:240, prix_unitaire:2651.99, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-02', date:'2026-01-17', produit_id:'CE-5W40-1L',       type:'Entrée', quantite:60,  prix_unitaire:3590.39, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-03', date:'2026-01-17', produit_id:'MB1-5W40-1L',      type:'Entrée', quantite:60,  prix_unitaire:3645.18, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-04', date:'2026-01-17', produit_id:'MC-LVTF-1L',       type:'Entrée', quantite:120, prix_unitaire:3808.38, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-05', date:'2026-01-17', produit_id:'PS--ATFTF-1L',     type:'Entrée', quantite:120, prix_unitaire:1577.21, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-06', date:'2026-01-17', produit_id:'GP-15W40-220L',    type:'Entrée', quantite:440, prix_unitaire:1365.05, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-07', date:'2026-01-17', produit_id:'PS-5W40-1L',       type:'Entrée', quantite:150, prix_unitaire:2062.14, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-08', date:'2026-01-17', produit_id:'GP-10W40-1L',      type:'Entrée', quantite:180, prix_unitaire:1360.39, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-09', date:'2026-01-17', produit_id:'GP-5W30-1L',       type:'Entrée', quantite:240, prix_unitaire:1360.39, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-10', date:'2026-01-17', produit_id:'GP-SYNCU-CVTF-1L', type:'Entrée', quantite:180, prix_unitaire:3535.60, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-11', date:'2026-01-17', produit_id:'GP-SYNCD-ATF-1L',  type:'Entrée', quantite:240, prix_unitaire:1577.21, reference:'AC0001', commentaire:'Réception AC0001' },
    { id:'ME-AC001-12', date:'2026-01-17', produit_id:'GP-15W40-1L',      type:'Entrée', quantite:120, prix_unitaire:2176.38, reference:'AC0001', commentaire:'Réception AC0001' },
    /* ── Sorties Vente V0001 (avant inventaire du 18/04) ── */
    { id:'M0001', date:'2026-04-17', produit_id:'GP-5W40-1L',       type:'Sortie', quantite:106, prix_unitaire:7000, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0002', date:'2026-04-17', produit_id:'MC-LVTF-1L',        type:'Sortie', quantite:95,  prix_unitaire:6000, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0003', date:'2026-04-17', produit_id:'GP-5W30-1L',        type:'Sortie', quantite:112, prix_unitaire:5000, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0004', date:'2026-04-17', produit_id:'GP-10W40-1L',       type:'Sortie', quantite:89,  prix_unitaire:3500, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0005', date:'2026-04-17', produit_id:'PS--ATFTF-1L',      type:'Sortie', quantite:48,  prix_unitaire:3500, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0006', date:'2026-04-17', produit_id:'PS-5W40-1L',        type:'Sortie', quantite:54,  prix_unitaire:7000, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0007', date:'2026-04-17', produit_id:'GP-SYNCU-CVTF-1L',  type:'Sortie', quantite:48,  prix_unitaire:9000, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0008', date:'2026-04-17', produit_id:'CE-5W40-1L',        type:'Sortie', quantite:30,  prix_unitaire:7000, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    { id:'M0009', date:'2026-04-17', produit_id:'MB1-5W40-1L',       type:'Sortie', quantite:30,  prix_unitaire:7500, reference:'V0001', commentaire:'Avant Inventaire du Saturday, April 18, 2026' },
    /* ── Entrées AC0002 (reçu le 18/04/2026) ── */
    { id:'ME-AC002-01', date:'2026-04-18', produit_id:'GP-5W30-1L',       type:'Entrée', quantite:600, prix_unitaire:1376.01, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-02', date:'2026-04-18', produit_id:'PS-5W30-1L',       type:'Entrée', quantite:600, prix_unitaire:1525.75, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-03', date:'2026-04-18', produit_id:'GP-0W20',          type:'Entrée', quantite:600, prix_unitaire:1980.88, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-04', date:'2026-04-18', produit_id:'MB1-5W40-1L',      type:'Entrée', quantite:120, prix_unitaire:3852.11, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-05', date:'2026-04-18', produit_id:'CE-5W40-1L',       type:'Entrée', quantite:120, prix_unitaire:3411.13, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-06', date:'2026-04-18', produit_id:'PZ-5W40',          type:'Entrée', quantite:120, prix_unitaire:3597.43, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-07', date:'2026-04-18', produit_id:'GP-15W40-5L',      type:'Entrée', quantite:400, prix_unitaire:1733.27, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-08', date:'2026-04-18', produit_id:'PS-15W40-5L',      type:'Entrée', quantite:300, prix_unitaire:1574.09, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-09', date:'2026-04-18', produit_id:'GP-0W40-1L',       type:'Entrée', quantite:240, prix_unitaire:2324.00, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-10', date:'2026-04-18', produit_id:'MB1-0W40-1L',      type:'Entrée', quantite:60,  prix_unitaire:3521.96, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-11', date:'2026-04-18', produit_id:'PZ-0W40-1L',       type:'Entrée', quantite:60,  prix_unitaire:3597.43, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-12', date:'2026-04-18', produit_id:'CE-0W40-1L',       type:'Entrée', quantite:60,  prix_unitaire:4479.39, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-13', date:'2026-04-18', produit_id:'MB1-0W20-1L',      type:'Entrée', quantite:60,  prix_unitaire:3521.96, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-14', date:'2026-04-18', produit_id:'CE-0W20-1L',       type:'Entrée', quantite:60,  prix_unitaire:3411.13, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-15', date:'2026-04-18', produit_id:'GP-SYNCU-CVTF-1L', type:'Entrée', quantite:600, prix_unitaire:3576.20, reference:'AC0002', commentaire:'Réception AC0002' },
    { id:'ME-AC002-16', date:'2026-04-18', produit_id:'GP-SYNCD-ATF-1L',  type:'Entrée', quantite:600, prix_unitaire:1760.39, reference:'AC0002', commentaire:'Réception AC0002' },
  ],

  /* Prix: PlafondHT, PlafondTTC, Sénégal, Plancher — tous en FCFA */
  price_list: [
    { produit_id:'GP-5W40-1L',       prix_plafond_ht:6150, prix_plafond_ttc:7500, prix_senegal_ttc:9000,  prix_plancher_ttc:5000 },
    { produit_id:'CE-5W40-1L',       prix_plafond_ht:6560, prix_plafond_ttc:8000, prix_senegal_ttc:9000,  prix_plancher_ttc:6000 },
    { produit_id:'MB1-5W40-1L',      prix_plafond_ht:6560, prix_plafond_ttc:8000, prix_senegal_ttc:9000,  prix_plancher_ttc:7000 },
    { produit_id:'MC-LVTF-1L',       prix_plafond_ht:5740, prix_plafond_ttc:7000, prix_senegal_ttc:8000,  prix_plancher_ttc:6000 },
    { produit_id:'PS--ATFTF-1L',     prix_plafond_ht:3280, prix_plafond_ttc:4000, prix_senegal_ttc:5000,  prix_plancher_ttc:3000 },
    { produit_id:'GP-15W40-220L',    prix_plafond_ht:2870, prix_plafond_ttc:3500, prix_senegal_ttc:5000,  prix_plancher_ttc:3000 },
    { produit_id:'PS-5W40-1L',       prix_plafond_ht:5330, prix_plafond_ttc:6500, prix_senegal_ttc:9000,  prix_plancher_ttc:4000 },
    { produit_id:'GP-10W40-1L',      prix_plafond_ht:2460, prix_plafond_ttc:3000, prix_senegal_ttc:5000,  prix_plancher_ttc:2500 },
    { produit_id:'GP-5W30-1L',       prix_plafond_ht:3280, prix_plafond_ttc:4000, prix_senegal_ttc:5000,  prix_plancher_ttc:2500 },
    { produit_id:'GP-SYNCU-CVTF-1L', prix_plafond_ht:7380, prix_plafond_ttc:9000, prix_senegal_ttc:11000, prix_plancher_ttc:7000 },
    { produit_id:'GP-SYNCD-ATF-1L',  prix_plafond_ht:4100, prix_plafond_ttc:5000, prix_senegal_ttc:7000,  prix_plancher_ttc:3000 },
    { produit_id:'GP-15W40-1L',      prix_plafond_ht:3280, prix_plafond_ttc:4000, prix_senegal_ttc:5000,  prix_plancher_ttc:3500 },
    { produit_id:'PS-5W30-1L',       prix_plafond_ht:3280, prix_plafond_ttc:4000, prix_senegal_ttc:5000,  prix_plancher_ttc:2500 },
    { produit_id:'GP-0W20',          prix_plafond_ht:5740, prix_plafond_ttc:7000, prix_senegal_ttc:9000,  prix_plancher_ttc:3500 },
    { produit_id:'PZ-5W40',          prix_plafond_ht:6560, prix_plafond_ttc:8000, prix_senegal_ttc:9000,  prix_plancher_ttc:6000 },
    { produit_id:'GP-15W40-5L',      prix_plafond_ht:2870, prix_plafond_ttc:3500, prix_senegal_ttc:5000,  prix_plancher_ttc:3000 },
    { produit_id:'PS-15W40-5L',      prix_plafond_ht:2870, prix_plafond_ttc:3500, prix_senegal_ttc:5000,  prix_plancher_ttc:3000 },
    { produit_id:'GP-0W40-1L',       prix_plafond_ht:6150, prix_plafond_ttc:7500, prix_senegal_ttc:9000,  prix_plancher_ttc:4000 },
    { produit_id:'MB1-0W40-1L',      prix_plafond_ht:6150, prix_plafond_ttc:7500, prix_senegal_ttc:9000,  prix_plancher_ttc:6000 },
    { produit_id:'PZ-0W40-1L',       prix_plafond_ht:6150, prix_plafond_ttc:7500, prix_senegal_ttc:9000,  prix_plancher_ttc:6000 },
    { produit_id:'CE-0W40-1L',       prix_plafond_ht:6560, prix_plafond_ttc:8000, prix_senegal_ttc:9000,  prix_plancher_ttc:7500 },
    { produit_id:'MB1-0W20-1L',      prix_plafond_ht:6560, prix_plafond_ttc:8000, prix_senegal_ttc:9000,  prix_plancher_ttc:6000 },
    { produit_id:'CE-0W20-1L',       prix_plafond_ht:6560, prix_plafond_ttc:8000, prix_senegal_ttc:9000,  prix_plancher_ttc:6000 },
  ],

  parametres: [
    { cle:'nom_entreprise', valeur:'USA PARTS AUTO' },
    { cle:'adresse',        valeur:'Dakar, Sénégal' },
    { cle:'telephone',      valeur:'' },
    { cle:'email',          valeur:'contact@usapartsauto.sn' },
    { cle:'tva_rate',       valeur:'18' },
    { cle:'devise',         valeur:'FCFA' },
    { cle:'usd_fcfa_rate',  valeur:'560' },
    { cle:'marge_cible',    valeur:'30' },
  ],
};

/* ============================================================
   Fonction d'importation principale
   ============================================================ */
async function importWorkbookData(onProgress) {
  const stores = ['produits','mouvements','ventes','lignes_ventes','factures',
                  'clients','fournisseurs','achats','lignes_achats',
                  'paiements','price_list','parametres','logs'];

  const report = (msg) => { if (typeof onProgress === 'function') onProgress(msg); };

  report('🗑️  Effacement des données existantes…');
  for (const s of stores) { await DB.clear(s); }

  const steps = [
    ['produits',      WORKBOOK_DATA.produits],
    ['clients',       WORKBOOK_DATA.clients],
    ['fournisseurs',  WORKBOOK_DATA.fournisseurs],
    ['achats',        WORKBOOK_DATA.achats],
    ['lignes_achats', WORKBOOK_DATA.lignes_achats],
    ['ventes',        WORKBOOK_DATA.ventes],
    ['lignes_ventes', WORKBOOK_DATA.lignes_ventes],
    ['factures',      WORKBOOK_DATA.factures],
    ['mouvements',    WORKBOOK_DATA.mouvements],
    ['price_list',    WORKBOOK_DATA.price_list],
    ['parametres',    WORKBOOK_DATA.parametres],
  ];

  for (const [store, items] of steps) {
    report(`📥  Import ${store} — ${items.length} enregistrement(s)…`);
    await DB.putMany(store, items);
  }

  await DB.add('logs', {
    id: genId('LOG'),
    date: new Date().toISOString(),
    action: 'Import Workbook',
    utilisateur: 'Système',
    description: `Import complet depuis USA_PARTS_AUTO_pro_stock_erp.xlsx — ${Object.values(WORKBOOK_DATA).flat().length} enregistrements`,
  });

  report('✅  Import terminé avec succès !');
  return {
    produits:     WORKBOOK_DATA.produits.length,
    mouvements:   WORKBOOK_DATA.mouvements.length,
    ventes:       WORKBOOK_DATA.ventes.length,
    lignes_ventes:WORKBOOK_DATA.lignes_ventes.length,
    achats:       WORKBOOK_DATA.achats.length,
    lignes_achats:WORKBOOK_DATA.lignes_achats.length,
    price_list:   WORKBOOK_DATA.price_list.length,
  };
}
