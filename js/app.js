/* ============================================================
   USA PARTS AUTO ERP – Main Application Router
   ============================================================ */

const PAGES = {
  dashboard:    { title: 'Tableau de Bord',       render: (c) => Dashboard.render(c)          },
  produits:     { title: 'Produits',               render: (c) => Produits.render(c)           },
  stocks:       { title: 'Stocks',                 render: (c) => Stocks.renderStocks(c)       },
  mouvements:   { title: 'Mouvements de Stock',    render: (c) => Stocks.renderMouvements(c)   },
  ventes:       { title: 'Ventes',                 render: (c) => Ventes.render(c)             },
  factures:     { title: 'Factures',               render: (c) => Factures.render(c)           },
  clients:      { title: 'Clients',                render: (c) => Clients.render(c)            },
  paiements:    { title: 'Paiements',              render: (c) => Paiements.render(c)          },
  achats:       { title: 'Achats',                 render: (c) => Achats.render(c)             },
  fournisseurs: { title: 'Fournisseurs',           render: (c) => Fournisseurs.render(c)       },
  pricelist:    { title: 'Liste des Prix',         render: (c) => PriceList.render(c)          },
  rapports:     { title: 'Rapports',               render: (c) => Rapports.render(c)           },
  utilisateurs: { title: 'Utilisateurs',           render: (c) => Utilisateurs.render(c)       },
  parametres:   { title: 'Paramètres',             render: (c) => Parametres.render(c)         },
  logs:         { title: "Journal d'Activité",     render: (c) => Logs.render(c)               },
};

/* ── Navigation (with auth guard) ── */
async function navigate(hash) {
  if (!Auth.isLoggedIn()) { Auth.showLoginScreen(); return; }

  _applyNavVisibility();   /* always refresh sidebar on every navigation */

  const page = (hash || '').replace('#', '') || 'dashboard';
  const cfg  = PAGES[page];
  if (!cfg) return navigate('dashboard');

  /* Access control */
  if (!Auth.canAccess(page)) {
    el('mainContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <p style="font-size:15px">Accès refusé</p>
        <p style="font-size:13px;color:var(--text-muted)">Votre profil <strong>${Auth.getProfile()?.label}</strong> n'a pas accès à cette section.</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('#dashboard')">← Retour au tableau de bord</button>
      </div>`;
    el('pageTitle').textContent = 'Accès refusé';
    return;
  }

  /* Highlight active nav link */
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  el('pageTitle').textContent = cfg.title;
  const content = el('mainContent');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    await cfg.render(content);
    Auth.enforcePermissions(page, content);
  } catch (err) {
    console.error('Page render error:', err);
    content.innerHTML = `<div class="empty-state">
      <div class="empty-icon">❌</div>
      <p>Erreur lors du chargement de la page.<br><small style="color:var(--text-muted)">${err.message}</small></p>
    </div>`;
  }

  if (window.innerWidth <= 900) el('sidebar').classList.remove('open');
}

/* ── Show/hide nav items based on profile ── */
function _applyNavVisibility() {
  /* Utilisateurs link: admin only */
  const navU = el('navUtilisateurs');
  if (navU) navU.style.display = Auth.isAdmin() ? '' : 'none';

  /* Dim/hide nav links the current user can't access */
  document.querySelectorAll('.nav-link[data-page]').forEach(a => {
    const p = a.dataset.page;
    const accessible = Auth.canAccess(p);
    a.style.opacity = accessible ? '' : '0.35';
    a.style.pointerEvents = accessible ? '' : 'none';
  });
}

/* ---- Event Listeners ---- */
window.addEventListener('hashchange', () => navigate(window.location.hash));

el('sidebarToggle').addEventListener('click', () => el('sidebar').classList.toggle('open'));

document.addEventListener('click', (e) => {
  if (window.innerWidth <= 900) {
    const sidebar = el('sidebar');
    if (!sidebar.contains(e.target) && !el('sidebarToggle').contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

el('modalClose').addEventListener('click', closeModal);
el('modalCancelBtn').addEventListener('click', closeModal);
el('modalConfirmBtn').addEventListener('click', async () => {
  const handler = el('modalConfirmBtn')._handler;
  if (typeof handler !== 'function') return;
  try {
    await handler();
  } catch (err) {
    console.error(err);
    toast(`Erreur lors de l'enregistrement : ${err.message}`, 'error');
  }
});
el('globalModal').addEventListener('click', (e) => {
  if (e.target === el('globalModal')) closeModal();
});

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

    Auth.init();   /* Restore session from storage */

    if (!Auth.isLoggedIn()) {
      Auth.showLoginScreen();
    } else {
      Auth._updateTopbar();
      _applyNavVisibility();
      navigate(window.location.hash || '#dashboard');
    }
  } catch (err) {
    console.error('Boot error:', err);
    el('mainContent').innerHTML = `<div class="empty-state">
      <div class="empty-icon">💾</div>
      <p>Impossible d'ouvrir la base de données.<br><small>${err.message}</small></p>
    </div>`;
  }
}

/* ── Patch Auth.login so the app wires up after login ── */
const _origLogin = Auth.login.bind(Auth);
Auth.login = async (username, password, remember) => {
  const result = await _origLogin(username, password, remember);
  if (result.ok) {
    _applyNavVisibility();
    Auth._updateTopbar();
  }
  return result;
};

/* ── Patch Auth.logout so login screen is shown cleanly ── */
const _origLogout = Auth.logout.bind(Auth);
Auth.logout = async () => {
  await _origLogout();
  _applyNavVisibility();
  const badge = el('userBadge');
  if (badge) badge.innerHTML = '';
};

/* Premier lancement : charge le workbook + crée les utilisateurs par défaut */
async function _initFirstRun() {
  const countProd  = await DB.count('produits');
  const countUsers = await DB.count('utilisateurs');

  if (countProd === 0 && typeof importWorkbookData === 'function') {
    await importWorkbookData();
  }
  if (countUsers === 0) {
    await Auth.seedDefaultUsers();
  }
}

boot();
