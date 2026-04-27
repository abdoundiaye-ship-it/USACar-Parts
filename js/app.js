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
  rapports:     { title: 'Rapports',                  render: (c) => Rapports.render(c) },
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
    await _initFirstRun();
    navigate(window.location.hash || '#dashboard');
  } catch (err) {
    console.error('Boot error:', err);
    el('mainContent').innerHTML = `<div class="empty-state">
      <div class="empty-icon">💾</div>
      <p>Impossible d'ouvrir la base de données.<br><small>${err.message}</small></p>
    </div>`;
  }
}

/* Premier lancement : charge le workbook complet automatiquement */
async function _initFirstRun() {
  const count = await DB.count('produits');
  if (count > 0) return; // Données déjà présentes
  if (typeof importWorkbookData === 'function') {
    await importWorkbookData();
  }
}

boot();
