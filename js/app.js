/* ============================================================
   USA PARTS AUTO ERP – Main Application Router
   ============================================================ */

const PAGES = {
  dashboard:    { title: 'Tableau de Bord',          render: (c) => Dashboard.render(c) },
  produits:     { title: 'Produits',                  render: (c) => Produits.render(c) },
  stocks:       { title: 'Stocks',                    render: (c) => Stocks.renderStocks(c) },
  mouvements:   { title: 'Mouvements de Stock',       render: (c) => Stocks.renderMouvements(c) },
  ventes:       { title: 'Ventes',                    render: (c) => Ventes.render(c) },
  factures:     { title: 'Factures',                  render: (c) => Factures.render(c) },
  clients:      { title: 'Clients',                   render: (c) => Clients.render(c) },
  paiements:    { title: 'Paiements',                 render: (c) => Paiements.render(c) },
  achats:       { title: 'Achats',                    render: (c) => Achats.render(c) },
  fournisseurs: { title: 'Fournisseurs',              render: (c) => Fournisseurs.render(c) },
  pricelist:    { title: 'Liste des Prix',            render: (c) => PriceList.render(c) },
  parametres:   { title: 'Paramètres',                render: (c) => Parametres.render(c) },
  logs:         { title: 'Journal d\'Activité',       render: (c) => Logs.render(c) },
};

async function navigate(hash) {
  const page = (hash || '').replace('#', '') || 'dashboard';
  const cfg = PAGES[page];
  if (!cfg) return navigate('dashboard');

  // Update active nav
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  el('pageTitle').textContent = cfg.title;

  const content = el('mainContent');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    await cfg.render(content);
  } catch (err) {
    console.error('Page render error:', err);
    content.innerHTML = `<div class="empty-state">
      <div class="empty-icon">❌</div>
      <p>Erreur lors du chargement de la page.<br><small style="color:var(--text-muted)">${err.message}</small></p>
    </div>`;
  }

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 900) {
    el('sidebar').classList.remove('open');
  }
}

/* ---- Event Listeners ---- */
window.addEventListener('hashchange', () => navigate(window.location.hash));

el('sidebarToggle').addEventListener('click', () => {
  el('sidebar').classList.toggle('open');
});

// Close sidebar clicking outside (mobile)
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 900) {
    const sidebar = el('sidebar');
    if (!sidebar.contains(e.target) && !el('sidebarToggle').contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

// Modal buttons
el('modalClose').addEventListener('click', closeModal);
el('modalCancelBtn').addEventListener('click', closeModal);
el('modalConfirmBtn').addEventListener('click', () => {
  const handler = el('modalConfirmBtn')._handler;
  if (typeof handler === 'function') handler();
});
el('globalModal').addEventListener('click', (e) => {
  if (e.target === el('globalModal')) closeModal();
});

// Date in topbar
function updateTopbarDate() {
  const d = new Date();
  el('topbarDate').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
updateTopbarDate();
setInterval(updateTopbarDate, 60000);

/* ---- Boot ---- */
async function boot() {
  try {
    await DB.open();
    await _seedDemoData();
    navigate(window.location.hash || '#dashboard');
  } catch (err) {
    console.error('Boot error:', err);
    el('mainContent').innerHTML = `<div class="empty-state">
      <div class="empty-icon">💾</div>
      <p>Impossible d'ouvrir la base de données.<br><small>${err.message}</small></p>
    </div>`;
  }
}

/* ---- Seed Demo Data ---- */
async function _seedDemoData() {
  const count = await DB.count('produits');
  if (count > 0) return; // Already seeded

  const produits = [
    { id: 'PRD0001', nom: 'GP PETROGEN FULL SYNTHETIC 5W40 SP MOTOR OIL 12/1QTS', categorie: 'Huile', sku: 'GP-5W40-1L', actif: true },
    { id: 'PRD0002', nom: 'CASTROL EDGE 5W40 EURO MOTOR OIL 6/1 QTS', categorie: 'Huile', sku: 'CE-5W40-1L', actif: true },
    { id: 'PRD0003', nom: 'MOBIL 1 FS EURO 5W40 MOTOR OIL 6/1 QUARTS', categorie: 'Huile', sku: 'MB1-5W40-1L', actif: true },
    { id: 'PRD0004', nom: 'MOTORCRAFT MERCON LV TRANSMISSION FLUID 12/1 QTS', categorie: 'Liquide de Transmission', sku: 'MC-LVTF-1L', actif: true },
    { id: 'PRD0005', nom: 'PRIME SERIES ATF DEXRON-3 TRANSMISSION FLUID 12/1 QTS', categorie: 'Liquide de Transmission', sku: 'PS--ATFTF-1L', actif: true },
    { id: 'PRD0006', nom: 'GP DEOGEN STANDARD 15W40 CI4 55 GAL', categorie: 'Huile', sku: 'GP-15W40-220L', actif: true },
    { id: 'PRD0007', nom: 'PRIME SERIES FULL SYNTHETIC 5W40 MOTOR OIL 6/1 QTS', categorie: 'Huile', sku: 'PS-5W40-1L', actif: true },
    { id: 'PRD0008', nom: 'GP PETROGEN SYNTHETIC BLEND 10W40 SL MOTOR OIL 12/1QTS', categorie: 'Huile', sku: 'GP-10W40-1L', actif: true },
    { id: 'PRD0009', nom: 'GP PETROGEN SYNTHETIC BLEND 5W30 SL MOTOR OIL 12/1QTS', categorie: 'Huile', sku: 'GP-5W30-1L', actif: true },
    { id: 'PRD0010', nom: 'GP SYNCROGEN UNIVERSAL CVT FLUID 12/1QTS', categorie: 'Liquide de Transmission', sku: 'GP-SYNCU-CVTF-1L', actif: true },
    { id: 'PRD0011', nom: 'GP DEOGEN SYNTHETIC BLEND 15W40 CK4 12/1QTS', categorie: 'Huile', sku: 'GP-15W40-1L', actif: true },
    { id: 'PRD0012', nom: 'PRIME SERIES SYNTHETIC BLEND 5W30 MOTOR OIL 12/1 QTS', categorie: 'Huile', sku: 'PS-5W30-1L', actif: true },
    { id: 'PRD0013', nom: 'GP PETROGEN FULL SYNTHETIC 0W20 SQ DEXOS-1 GEN3 MOTOR OIL', categorie: 'Huile', sku: 'GP-0W20', actif: true },
    { id: 'PRD0014', nom: 'PENNZOIL PLATINUM EURO FULL SYNTHETIC 5W40 MOTOR OIL', categorie: 'Huile', sku: 'PZ-5W40', actif: true },
    { id: 'PRD0015', nom: 'GP DEOGEN SYNTHETIC BLEND 15W40 CI4 4/1 GAL', categorie: 'Huile', sku: 'GP-15W40-5L', actif: true },
    { id: 'PRD0016', nom: 'PRIME SERIES 15W40 CK-4 DIESEL MOTOR OIL 3/1 GALLON', categorie: 'Huile', sku: 'PS-15W40-5L', actif: true },
    { id: 'PRD0017', nom: 'GP PETROGEN FULL SYNTHETIC 0W40 SP MOTOR OIL 12/1QTS', categorie: 'Huile', sku: 'GP-0W40-1L', actif: true },
    { id: 'PRD0018', nom: 'MOBIL 1 FS EURO 0W40 MOTOR OIL 6/1 QTS', categorie: 'Huile', sku: 'MB1-0W40-1L', actif: true },
    { id: 'PRD0019', nom: 'PENNZOIL PLATINUM EURO FULL SYNTHETIC 0W40 MOTOR OIL', categorie: 'Huile', sku: 'PZ-0W40-1L', actif: true },
    { id: 'PRD0020', nom: 'CASTROL EDGE EURO 0W40 MOTOR OIL 6/1 QTS A3/B4', categorie: 'Huile', sku: 'CE-0W40-1L', actif: true },
    { id: 'PRD0021', nom: 'MOBIL 1 ADVANCE FULL SYNTHETIC 0W20 DEXOS-1 GEN3 MOTOR OIL', categorie: 'Huile', sku: 'MB1-0W20-1L', actif: true },
    { id: 'PRD0022', nom: 'CASTROL EDGE 0W20 DEXOS-1 GEN3 MOTOR OIL 6/1 QTS', categorie: 'Huile', sku: 'CE-0W20-1L', actif: true },
    { id: 'PRD0023', nom: 'GP SYNCROGEN DEXRON-III TRANSMISSION FLUID 12/1 QTS', categorie: 'Liquide de Transmission', sku: 'GP-SYNCD-ATF-1L', actif: true },
  ];

  const clients = [
    { id: 'CL0001', nom: 'Client Ventes avant inventaire', telephone: '', email: '', adresse: 'Dakar, Senegal', total_achats: 0, credit: 0 },
    { id: 'CL0002', nom: 'Alioune Ndiaye', telephone: '', email: 'loon19@gmail.com', adresse: 'New Fairfax, CT', total_achats: 0, credit: 0 },
  ];

  const fournisseurs = [
    { id: 'FRN0001', nom: 'USA Auto Parts Supplier', telephone: '', email: '', adresse: 'United States' },
  ];

  const parametres = [
    { cle: 'nom_entreprise', valeur: 'USA PARTS AUTO' },
    { cle: 'adresse', valeur: 'Dakar, Sénégal' },
    { cle: 'tva_rate', valeur: '18' },
    { cle: 'devise', valeur: 'FCFA' },
    { cle: 'usd_fcfa_rate', valeur: '600' },
    { cle: 'marge_cible', valeur: '30' },
  ];

  await DB.putMany('produits', produits);
  await DB.putMany('clients', clients);
  await DB.putMany('fournisseurs', fournisseurs);
  await DB.putMany('parametres', parametres);
  await logAction('Initialisation', 'Données de démo chargées depuis le catalogue ERP');
}

boot();
