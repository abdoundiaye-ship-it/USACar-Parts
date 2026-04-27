/* ============================================================
   USA PARTS AUTO ERP — Auth Module
   Gestion des sessions, profils et permissions
   ============================================================ */

const Auth = (() => {

  /* ── Profile definitions ── */
  const PROFILES = {
    admin: {
      label: 'Administrateur',
      icon:  '👑',
      color: '#e63946',
      bg:    '#fee2e2',
      /* null = accès total */
      pages: null,
      write: null,
    },
    vendeur: {
      label: 'Vendeur',
      icon:  '🛒',
      color: '#2563a8',
      bg:    '#dbeafe',
      pages: ['dashboard','ventes','factures','clients','paiements','produits','stocks','rapports','logs'],
      write: ['ventes','clients','paiements','factures'],
    },
    stock: {
      label: 'Gestion de Stock',
      icon:  '📦',
      color: '#16a34a',
      bg:    '#dcfce7',
      pages: ['dashboard','produits','stocks','mouvements','achats','fournisseurs','pricelist','rapports','logs'],
      write: ['produits','stocks','mouvements','achats','fournisseurs','pricelist'],
    },
    control: {
      label: 'Contrôle (Lecture)',
      icon:  '👁️',
      color: '#d97706',
      bg:    '#fef3c7',
      pages: ['dashboard','ventes','factures','clients','paiements','produits','stocks',
              'mouvements','achats','fournisseurs','pricelist','rapports','logs'],
      write: [],   /* lecture seule */
    },
  };

  let _user = null;  /* {id, nom, username, profil} */

  /* ── Password hashing (Web Crypto SHA-256 + salt) ── */
  const SALT = 'usa_parts_auto_erp_2026';

  async function hashPassword(pwd) {
    const data = new TextEncoder().encode(pwd + SALT);
    const buf  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Session ── */
  function _saveSession(user, remember) {
    const s = JSON.stringify(user);
    sessionStorage.setItem('upa_session', s);
    if (remember) localStorage.setItem('upa_remember', s);
  }

  function init() {
    const s = sessionStorage.getItem('upa_session') || localStorage.getItem('upa_remember');
    if (s) { try { _user = JSON.parse(s); } catch (_) { _user = null; } }
  }

  /* ── Queries ── */
  function isLoggedIn()   { return _user !== null; }
  function getUser()      { return _user; }
  function isAdmin()      { return _user?.profil === 'admin'; }
  function getProfile()   { return _user ? PROFILES[_user.profil] : null; }

  function canAccess(page) {
    if (!_user) return false;
    const p = PROFILES[_user.profil];
    if (!p) return false;
    if (p.pages === null) return true;
    return p.pages.includes(page);
  }

  function canWrite(module) {
    if (!_user) return false;
    const p = PROFILES[_user.profil];
    if (!p) return false;
    if (p.write === null) return true;
    return p.write.includes(module);
  }

  /* ── Login ── */
  async function login(username, password, remember) {
    const users = await DB.getAll('utilisateurs');
    const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.actif);
    if (!user) return { ok: false, msg: 'Identifiant ou mot de passe incorrect.' };

    const hash = await hashPassword(password);
    if (hash !== user.password_hash) return { ok: false, msg: 'Identifiant ou mot de passe incorrect.' };

    _user = { id: user.id, nom: user.nom, username: user.username, profil: user.profil };
    _saveSession(_user, remember);
    await logAction('Connexion', `${user.nom} (${PROFILES[user.profil]?.label}) s'est connecté`);
    return { ok: true };
  }

  /* ── Logout ── */
  async function logout() {
    if (_user) await logAction('Déconnexion', `${_user.nom} s'est déconnecté`);
    _user = null;
    sessionStorage.removeItem('upa_session');
    localStorage.removeItem('upa_remember');
    showLoginScreen();
  }

  /* ── Enforce read-only mode after page render ── */
  function enforcePermissions(page, container) {
    if (!_user) return;
    if (isAdmin()) return;

    const write = canWrite(page);
    if (write) return;

    /* Hide all create / edit / delete buttons in page header */
    container.querySelectorAll('.page-header-actions .btn-primary, .page-header-actions .btn-danger, .page-header-actions .btn-success, .page-header-actions .btn-warning').forEach(btn => {
      const txt = btn.textContent;
      const safe = txt.includes('Imprimer') || txt.includes('Exporter') || txt.includes('Exporter CSV') || txt.includes('🖨') || txt.includes('⬇');
      if (!safe) btn.style.display = 'none';
    });

    /* Hide action buttons in table rows — keep print & view */
    container.querySelectorAll('.table-actions').forEach(div => {
      div.querySelectorAll('.btn').forEach(btn => {
        const txt = btn.textContent.trim();
        const safe = txt.includes('🖨') || txt.includes('👁') || txt.includes('Imprimer') || txt.includes('Voir');
        if (!safe) btn.style.display = 'none';
      });
    });

    /* Hide form inputs in cards (e.g. paramètres) */
    if (page === 'parametres') {
      container.querySelectorAll('input, select, button.btn-primary, button.btn-danger, button.btn-success').forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
      });
    }

    /* Add "Lecture seule" badge to page title */
    const h2 = container.querySelector('.page-header h2');
    if (h2 && !h2.querySelector('.readonly-badge')) {
      h2.insertAdjacentHTML('beforeend',
        ' <span class="badge badge-warning readonly-badge" style="font-size:11px;vertical-align:middle;margin-left:8px">👁️ Lecture seule</span>');
    }
  }

  /* ── Login Screen ── */
  function showLoginScreen() {
    let overlay = document.getElementById('loginOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loginOverlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="login-card">
        <div class="login-logo">
          <img src="assets/logo.png" alt="Logo" />
          <div class="login-brand">USA PARTS AUTO</div>
          <div class="login-sub">ERP Pro — Pièces Détachées Automobiles</div>
        </div>
        <div class="login-form">
          <div class="form-group">
            <label class="form-label">Identifiant</label>
            <input class="form-control" id="loginUsername" placeholder="Votre identifiant" autocomplete="username" />
          </div>
          <div class="form-group" style="margin-top:14px">
            <label class="form-label">Mot de passe</label>
            <div style="position:relative">
              <input class="form-control" id="loginPassword" type="password" placeholder="••••••••" autocomplete="current-password" />
              <button type="button" onclick="Auth._togglePwd()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:#64748b" id="togglePwdBtn">👁</button>
            </div>
          </div>
          <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="loginRemember" style="width:16px;height:16px;cursor:pointer" />
            <label for="loginRemember" style="font-size:13px;color:var(--text-muted);cursor:pointer">Rester connecté</label>
          </div>
          <div id="loginError" class="login-error" style="display:none"></div>
          <button class="btn btn-primary login-btn" id="loginBtn" onclick="Auth._submitLogin()">Se connecter</button>
        </div>
        <div class="login-footer">
          © 2026 USA PARTS AUTO · Système ERP
        </div>
      </div>`;
    overlay.style.display = 'flex';

    /* Enter key submits */
    ['loginUsername','loginPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') Auth._submitLogin(); });
    });

    /* Auto-focus */
    setTimeout(() => document.getElementById('loginUsername')?.focus(), 100);
  }

  function hideLoginScreen() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function _togglePwd() {
    const input = document.getElementById('loginPassword');
    const btn   = document.getElementById('togglePwdBtn');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    if (btn) btn.textContent = input.type === 'password' ? '👁' : '🙈';
  }

  async function _submitLogin() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const remember = document.getElementById('loginRemember')?.checked || false;
    const errEl    = document.getElementById('loginError');
    const btn      = document.getElementById('loginBtn');

    if (!username || !password) {
      if (errEl) { errEl.textContent = 'Veuillez remplir tous les champs.'; errEl.style.display = 'block'; }
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Connexion…'; }

    const result = await login(username, password, remember);

    if (result.ok) {
      hideLoginScreen();
      _updateTopbar();
      /* Reload app to current page */
      if (typeof navigate === 'function') navigate(window.location.hash || '#dashboard');
    } else {
      if (errEl) { errEl.textContent = result.msg; errEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Se connecter'; }
      const pwdEl = document.getElementById('loginPassword');
      if (pwdEl) { pwdEl.value = ''; pwdEl.focus(); }
    }
  }

  /* ── Topbar user badge ── */
  function _updateTopbar() {
    if (!_user) return;
    const prof = PROFILES[_user.profil];
    let badge = document.getElementById('userBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'userBadge';
      badge.style.cssText = 'display:flex;align-items:center;gap:10px;flex-shrink:0';
      const topbarActions = document.querySelector('.topbar-actions');
      if (topbarActions) topbarActions.prepend(badge);
    }
    badge.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 12px;background:${prof?.bg || '#f1f5f9'};border-radius:20px;cursor:pointer" onclick="Auth._showUserMenu()" title="Profil utilisateur">
        <span style="font-size:15px">${prof?.icon || '👤'}</span>
        <span style="font-size:12.5px;font-weight:600;color:${prof?.color || '#1e293b'}">${_user.nom}</span>
        <span style="font-size:10.5px;color:${prof?.color || '#64748b'};opacity:0.8">${prof?.label || ''}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" title="Déconnexion" style="padding:5px 10px">🚪</button>`;
  }

  function _showUserMenu() {
    /* Simple toast showing user info */
    const prof = PROFILES[_user?.profil];
    toast(`${prof?.icon} ${_user?.nom} · ${prof?.label}`, 'info', 2500);
  }

  /* ── Seed default users ── */
  async function seedDefaultUsers() {
    const existing = await DB.getAll('utilisateurs');
    if (existing.length > 0) return;

    const adminHash   = await hashPassword('admin123');
    const vendeurHash = await hashPassword('vendeur123');
    const stockHash   = await hashPassword('stock123');
    const ctrlHash    = await hashPassword('control123');

    await DB.putMany('utilisateurs', [
      { id:'USR0001', nom:'Administrateur',  username:'admin',   password_hash: adminHash,   profil:'admin',   actif:true },
      { id:'USR0002', nom:'Vendeur Demo',    username:'vendeur', password_hash: vendeurHash, profil:'vendeur', actif:true },
      { id:'USR0003', nom:'Responsable Stock', username:'stock', password_hash: stockHash,   profil:'stock',   actif:true },
      { id:'USR0004', nom:'Contrôleur',      username:'control', password_hash: ctrlHash,    profil:'control', actif:true },
    ]);
  }

  return {
    PROFILES,
    hashPassword,
    init,
    isLoggedIn,
    getUser,
    isAdmin,
    getProfile,
    canAccess,
    canWrite,
    login,
    logout,
    enforcePermissions,
    showLoginScreen,
    hideLoginScreen,
    seedDefaultUsers,
    _updateTopbar,
    _showUserMenu,
    _submitLogin,
    _togglePwd,
  };
})();
