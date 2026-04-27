/* ============================================================
   MODULE: Utilisateurs — Gestion complète (Admin only)
   Onglets : Utilisateurs · Permissions · Mon Compte
   ============================================================ */

const Utilisateurs = (() => {
  let _all  = [];
  let _tab  = 'liste';
  let _query = '';

  async function load() { _all = await DB.getAll('utilisateurs'); }

  /* ═══════════════════════════════════════════════════════════
     RENDER — shell
  ═══════════════════════════════════════════════════════════ */
  async function render(container) {
    if (!Auth.isAdmin()) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>Accès réservé à l'Administrateur.</p></div>`;
      return;
    }
    await load();

    const tabs = [
      { id:'liste',       label:'👥 Utilisateurs'      },
      { id:'permissions', label:'🔑 Profils & Permissions' },
      { id:'moncompte',   label:'👤 Mon Compte'         },
    ];

    container.innerHTML = `
      <div class="page-header">
        <h2>Gestion des Utilisateurs</h2>
        <div class="page-header-actions">
          ${_tab === 'liste' ? `<button class="btn btn-primary" onclick="Utilisateurs.createForm()">+ Nouvel Utilisateur</button>` : ''}
        </div>
      </div>
      <div class="tabs">
        ${tabs.map(t => `<button class="tab-btn ${_tab === t.id ? 'active' : ''}" onclick="Utilisateurs._setTab('${t.id}')">${t.label}</button>`).join('')}
      </div>
      <div id="utilisateursContent"></div>`;

    await _renderTab(document.getElementById('utilisateursContent'));
  }

  async function _setTab(id) {
    _tab = id;
    await render(el('mainContent'));
  }

  async function _renderTab(container) {
    switch (_tab) {
      case 'liste':       await _renderListe(container);       break;
      case 'permissions': await _renderPermissions(container); break;
      case 'moncompte':   await _renderMonCompte(container);   break;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 1 — LISTE DES UTILISATEURS
  ═══════════════════════════════════════════════════════════ */
  async function _renderListe(container) {
    const logs = await DB.getAll('logs');
    const currentId = Auth.getUser()?.id;

    /* Last login per user from logs */
    const lastLogin = {};
    for (const log of logs) {
      if (log.action === 'Connexion' && log.description) {
        const m = log.description.match(/^(.+?) \(/);
        if (m) {
          const nom = m[1];
          const u = _all.find(x => x.nom === nom);
          if (u && (!lastLogin[u.id] || log.date > lastLogin[u.id])) {
            lastLogin[u.id] = log.date;
          }
        }
      }
    }

    /* Profile stats */
    const statCards = Object.entries(Auth.PROFILES).map(([key, p]) => {
      const n = _all.filter(u => u.profil === key).length;
      const active = _all.filter(u => u.profil === key && u.actif).length;
      return `
        <div class="kpi-card" style="border-left-color:${p.color}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div class="kpi-label">${p.label}</div>
              <div class="kpi-value">${n}</div>
              <div class="kpi-sub">${active} actif(s)</div>
            </div>
            <span style="font-size:28px">${p.icon}</span>
          </div>
        </div>`;
    }).join('');

    /* Filter */
    let filtered = _all.filter(u => {
      if (!_query) return true;
      const q = _query.toLowerCase();
      return u.nom.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.profil.includes(q);
    });

    const rows = filtered.map(u => {
      const prof    = Auth.PROFILES[u.profil];
      const isMe    = u.id === currentId;
      const lastLog = lastLogin[u.id];
      return `
        <tr class="${!u.actif ? 'opacity-50' : ''}">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:38px;height:38px;border-radius:50%;background:${prof?.bg || '#f1f5f9'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${prof?.icon || '👤'}</div>
              <div>
                <div class="font-bold">${u.nom}${isMe ? ' <span style="font-size:10px;color:var(--primary-light);font-weight:400">(Vous)</span>' : ''}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">@${u.username}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${prof?.bg || '#f1f5f9'};color:${prof?.color || '#64748b'}">
              ${prof?.icon || ''} ${prof?.label || u.profil}
            </span>
          </td>
          <td class="text-center">${u.actif
            ? '<span class="badge badge-success">✅ Actif</span>'
            : '<span class="badge badge-secondary">🔒 Inactif</span>'}</td>
          <td style="font-size:12px;color:var(--text-muted)">${lastLog ? fmtDate(lastLog) : '<span style="opacity:0.5">Jamais</span>'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-ghost" onclick="Utilisateurs.editForm('${u.id}')" title="Modifier le profil">✏️ Modifier</button>
              <button class="btn btn-sm btn-ghost" onclick="Utilisateurs.changePassword('${u.id}')" title="Réinitialiser le mot de passe">🔑 MDP</button>
              ${!isMe ? `
              <button class="btn btn-sm btn-ghost" onclick="Utilisateurs.toggleActif('${u.id}')" title="${u.actif ? 'Désactiver' : 'Activer'}">${u.actif ? '🔒 Désactiver' : '🔓 Activer'}</button>
              <button class="btn btn-sm btn-ghost btn-icon" onclick="Utilisateurs.deleteUser('${u.id}')" title="Supprimer">🗑️</button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="5" class="text-center text-muted" style="padding:28px">Aucun utilisateur trouvé</td></tr>`;

    container.innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">${statCards}</div>
      <div class="card">
        <div class="search-bar" style="margin-bottom:0">
          <input class="search-input" placeholder="Rechercher par nom, identifiant ou profil…" value="${_query}" oninput="Utilisateurs._onSearch(this.value)" />
          <span style="font-size:13px;color:var(--text-muted);white-space:nowrap">${filtered.length} utilisateur(s)</span>
        </div>
        <div class="table-container" style="margin-top:12px">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Profil</th>
                <th style="text-align:center">Statut</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="card mt-16" style="padding:14px 20px;background:var(--surface2)">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:700;color:var(--primary)">⚠️ Mots de passe par défaut :</span>
          ${Object.entries({admin:'admin123',vendeur:'vendeur123',stock:'stock123',control:'control123'})
            .map(([u,p]) => `<code style="background:#fee2e2;color:#dc2626;padding:3px 8px;border-radius:5px;font-size:12px">${u} / ${p}</code>`)
            .join('')}
          <span style="font-size:12px;color:var(--danger);font-weight:600">Modifiez-les immédiatement !</span>
        </div>
      </div>`;
  }

  function _onSearch(v) { _query = v; _renderListe(el('utilisateursContent')); }

  /* ═══════════════════════════════════════════════════════════
     TAB 2 — PROFILS & PERMISSIONS
  ═══════════════════════════════════════════════════════════ */
  async function _renderPermissions(container) {
    const modules = [
      { id:'dashboard',    label:'📊 Tableau de Bord'   },
      { id:'ventes',       label:'🛒 Ventes'             },
      { id:'factures',     label:'🧾 Factures'           },
      { id:'clients',      label:'👥 Clients'            },
      { id:'paiements',    label:'💳 Paiements'          },
      { id:'produits',     label:'🔧 Produits'           },
      { id:'stocks',       label:'📋 Stocks'             },
      { id:'mouvements',   label:'🔄 Mouvements'         },
      { id:'achats',       label:'📦 Achats'             },
      { id:'fournisseurs', label:'🏭 Fournisseurs'       },
      { id:'pricelist',    label:'💰 Liste des Prix'     },
      { id:'rapports',     label:'📈 Rapports'           },
      { id:'utilisateurs', label:'👤 Utilisateurs'       },
      { id:'parametres',   label:'⚙️ Paramètres'        },
      { id:'logs',         label:'📝 Journaux'           },
    ];

    const profiles = Object.entries(Auth.PROFILES);

    const headerCols = profiles.map(([, p]) =>
      `<th style="text-align:center;min-width:110px;background:${p.color};color:#fff;padding:10px 8px">
        <div style="font-size:18px">${p.icon}</div>
        <div style="font-size:11px;font-weight:600;margin-top:4px">${p.label}</div>
      </th>`
    ).join('');

    const rows = modules.map(m => {
      const cells = profiles.map(([key, p]) => {
        const canAccess = p.pages === null || p.pages.includes(m.id);
        const canWrite  = p.write === null || p.write.includes(m.id);
        let cell, title;
        if (!canAccess) {
          cell = '🚫'; title = 'Pas d\'accès';
        } else if (canWrite) {
          cell = '✅'; title = 'Lecture + Écriture';
        } else {
          cell = '👁️'; title = 'Lecture seule';
        }
        return `<td style="text-align:center;padding:10px 8px" title="${title}">
          <span style="font-size:16px">${cell}</span>
        </td>`;
      }).join('');
      return `<tr><td style="padding:10px 14px;font-size:13px;white-space:nowrap">${m.label}</td>${cells}</tr>`;
    }).join('');

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;padding:14px 20px">
        <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px">
          <span>✅ <strong>Lecture + Écriture</strong> — peut créer, modifier, supprimer</span>
          <span>👁️ <strong>Lecture seule</strong> — peut voir et imprimer, pas modifier</span>
          <span>🚫 <strong>Pas d'accès</strong> — la page est inaccessible</span>
        </div>
      </div>
      <div class="card">
        <div class="table-container">
          <table style="border-collapse:collapse">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px 14px;background:var(--primary)">Module / Page</th>
                ${headerCols}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="card mt-16" style="padding:14px 20px">
        <div class="card-title" style="margin-bottom:12px">Description des profils</div>
        <div class="grid-2" style="gap:12px">
          ${profiles.map(([, p]) => `
            <div style="border-left:4px solid ${p.color};padding:12px 16px;background:${p.bg};border-radius:0 8px 8px 0">
              <div style="font-size:15px;font-weight:700;color:${p.color}">${p.icon} ${p.label}</div>
              <div style="font-size:12.5px;color:var(--text);margin-top:6px;line-height:1.6">${_profileDesc(p)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function _profileDesc(p) {
    if (p.write === null) return 'Accès complet à toutes les fonctionnalités. Peut gérer les utilisateurs, les paramètres et toutes les données.';
    if (p.write.includes('ventes')) return 'Peut enregistrer les ventes, gérer les clients et les paiements. Accès lecture seule aux produits et stocks.';
    if (p.write.includes('stocks')) return 'Peut réceptionner les achats, gérer les produits, les stocks, les mouvements et la liste des prix. Pas d\'accès aux ventes.';
    return 'Accès lecture seule sur toutes les pages. Peut visualiser les données et imprimer les factures et rapports. Aucune modification possible.';
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 3 — MON COMPTE
  ═══════════════════════════════════════════════════════════ */
  async function _renderMonCompte(container) {
    const user = Auth.getUser();
    if (!user) return;
    const prof = Auth.getProfile();
    const u = _all.find(x => x.id === user.id);

    container.innerHTML = `
      <div class="grid-2" style="gap:20px">
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Informations du compte</div>
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;background:${prof?.bg};border-radius:10px">
            <div style="width:60px;height:60px;border-radius:50%;background:${prof?.color};display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;flex-shrink:0">${prof?.icon}</div>
            <div>
              <div style="font-size:18px;font-weight:800;color:${prof?.color}">${user.nom}</div>
              <div style="font-size:13px;color:var(--text-muted)">@${user.username}</div>
              <div style="margin-top:4px">
                <span style="font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;background:${prof?.color};color:#fff">${prof?.label}</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nom complet</label>
            <input class="form-control" id="mcNom" value="${u?.nom || user.nom}" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Identifiant</label>
            <input class="form-control" value="${user.username}" readonly style="background:var(--surface2);color:var(--text-muted)" />
          </div>
          <button class="btn btn-primary" style="margin-top:16px;width:100%" onclick="Utilisateurs._saveMonNom()">💾 Enregistrer le nom</button>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:16px">🔑 Changer mon mot de passe</div>
          <div class="form-group">
            <label class="form-label">Mot de passe actuel *</label>
            <input type="password" class="form-control" id="mcOldPwd" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Nouveau mot de passe *</label>
            <input type="password" class="form-control" id="mcNewPwd" placeholder="Minimum 6 caractères" autocomplete="new-password" oninput="Utilisateurs._pwdStrength(this.value,'mcStrength')" />
            <div id="mcStrength" style="margin-top:6px"></div>
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Confirmer le nouveau mot de passe *</label>
            <input type="password" class="form-control" id="mcNewPwd2" placeholder="••••••••" autocomplete="new-password" />
          </div>
          <button class="btn btn-primary" style="margin-top:16px;width:100%" onclick="Utilisateurs._saveMonMdp()">🔐 Changer le mot de passe</button>
        </div>
      </div>`;
  }

  async function _saveMonNom() {
    const nom = el('mcNom')?.value.trim();
    if (!nom) { toast('Le nom ne peut pas être vide', 'error'); return; }
    const user = _all.find(u => u.id === Auth.getUser()?.id);
    if (!user) return;
    await DB.put('utilisateurs', { ...user, nom });
    await logAction('Modification', `Nom modifié → ${nom}`);
    /* Update session */
    const s = Auth.getUser();
    s.nom = nom;
    sessionStorage.setItem('upa_session', JSON.stringify(s));
    if (localStorage.getItem('upa_remember')) localStorage.setItem('upa_remember', JSON.stringify(s));
    Auth._updateTopbar();
    toast('Nom mis à jour', 'success');
    await load();
  }

  async function _saveMonMdp() {
    const oldPwd  = el('mcOldPwd')?.value;
    const newPwd  = el('mcNewPwd')?.value;
    const newPwd2 = el('mcNewPwd2')?.value;

    if (!oldPwd || !newPwd || !newPwd2) { toast('Veuillez remplir tous les champs', 'error'); return; }
    if (newPwd.length < 6) { toast('Le mot de passe doit contenir au moins 6 caractères', 'error'); return; }
    if (newPwd !== newPwd2) { toast('Les nouveaux mots de passe ne correspondent pas', 'error'); return; }

    const user = _all.find(u => u.id === Auth.getUser()?.id);
    if (!user) return;
    const oldHash = await Auth.hashPassword(oldPwd);
    if (oldHash !== user.password_hash) { toast('Mot de passe actuel incorrect', 'error'); return; }

    const newHash = await Auth.hashPassword(newPwd);
    await DB.put('utilisateurs', { ...user, password_hash: newHash });
    await logAction('Sécurité', `${user.username} a changé son mot de passe`);
    toast('Mot de passe changé avec succès ✅', 'success');
    el('mcOldPwd').value = '';
    el('mcNewPwd').value = '';
    el('mcNewPwd2').value = '';
    el('mcStrength').innerHTML = '';
  }

  /* ═══════════════════════════════════════════════════════════
     CREATE FORM
  ═══════════════════════════════════════════════════════════ */
  function createForm() {
    _openForm(null);
  }

  async function editForm(id) {
    await load();
    _openForm(_all.find(u => u.id === id));
  }

  function _openForm(user) {
    const isNew = !user;

    /* Visual profile selector */
    const profCards = Object.entries(Auth.PROFILES).map(([key, p]) => `
      <label style="cursor:pointer;display:block">
        <input type="radio" name="uProfil" value="${key}" ${(!isNew && user?.profil === key) ? 'checked' : key === 'vendeur' && isNew ? 'checked' : ''} style="display:none" />
        <div class="profil-card" data-profil="${key}" onclick="Utilisateurs._selectProfil(this)"
          style="border:2.5px solid ${user?.profil === key || (isNew && key === 'vendeur') ? p.color : 'var(--border)'};
                 background:${user?.profil === key || (isNew && key === 'vendeur') ? p.bg : 'var(--surface)'};
                 border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;transition:all 0.15s">
          <span style="font-size:22px">${p.icon}</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:${user?.profil === key || (isNew && key === 'vendeur') ? p.color : 'var(--text)'}">${p.label}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${_profileDesc(p)}</div>
          </div>
        </div>
      </label>`).join('');

    openModal(isNew ? 'Nouvel Utilisateur' : `Modifier — ${user.nom}`, `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Nom complet *</label>
          <input class="form-control" id="uNom" value="${user?.nom || ''}" placeholder="Ex: Moussa Diallo" />
        </div>
        <div class="form-group">
          <label class="form-label">Identifiant (login) *</label>
          <input class="form-control" id="uUsername" value="${user?.username || ''}" placeholder="Ex: moussa.diallo" autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-control" id="uActif">
            <option value="1" ${user?.actif !== false ? 'selected' : ''}>✅ Actif</option>
            <option value="0" ${user?.actif === false ? 'selected' : ''}>🔒 Inactif</option>
          </select>
        </div>
      </div>
      <div class="divider"></div>
      <div class="form-group">
        <label class="form-label">Profil *</label>
        <input type="hidden" id="uProfilValue" value="${user?.profil || 'vendeur'}" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">${profCards}</div>
      </div>
      ${isNew ? `
      <div class="divider"></div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Mot de passe *</label>
          <input type="password" class="form-control" id="uPwd" placeholder="Minimum 6 caractères" autocomplete="new-password" oninput="Utilisateurs._pwdStrength(this.value,'uStrength')" />
          <div id="uStrength" style="margin-top:6px"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirmer le mot de passe *</label>
          <input type="password" class="form-control" id="uPwd2" placeholder="••••••••" autocomplete="new-password" />
        </div>
      </div>` : ''}`,
      { wide: true, confirmLabel: isNew ? 'Créer l\'utilisateur' : 'Enregistrer', onConfirm: () => _save(user?.id) }
    );
  }

  function _selectProfil(card) {
    const key = card.dataset.profil;
    const p   = Auth.PROFILES[key];
    el('uProfilValue').value = key;
    /* Reset all cards */
    document.querySelectorAll('.profil-card').forEach(c => {
      const ck = c.dataset.profil;
      const cp = Auth.PROFILES[ck];
      c.style.border = `2.5px solid var(--border)`;
      c.style.background = 'var(--surface)';
      c.querySelector('div > div:first-child').style.color = 'var(--text)';
    });
    /* Highlight selected */
    card.style.border = `2.5px solid ${p.color}`;
    card.style.background = p.bg;
    card.querySelector('div > div:first-child').style.color = p.color;
    /* Sync radio */
    const radio = document.querySelector(`input[name="uProfil"][value="${key}"]`);
    if (radio) radio.checked = true;
  }

  /* ── Password strength indicator ── */
  function _pwdStrength(pwd, targetId) {
    const target = el(targetId);
    if (!target) return;
    if (!pwd) { target.innerHTML = ''; return; }

    let score = 0;
    const checks = [
      { test: pwd.length >= 8,          label: '8+ caractères' },
      { test: /[A-Z]/.test(pwd),         label: 'Majuscule'     },
      { test: /[0-9]/.test(pwd),         label: 'Chiffre'       },
      { test: /[^A-Za-z0-9]/.test(pwd),  label: 'Symbole'       },
    ];
    checks.forEach(c => { if (c.test) score++; });

    const levels = [
      { color:'#dc2626', label:'Très faible', width:'20%' },
      { color:'#f97316', label:'Faible',       width:'40%' },
      { color:'#eab308', label:'Moyen',        width:'60%' },
      { color:'#22c55e', label:'Fort',         width:'80%' },
      { color:'#16a34a', label:'Très fort',    width:'100%'},
    ];
    const lvl = levels[Math.min(score, 4)];

    target.innerHTML = `
      <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:5px">
        <div style="width:${lvl.width};height:100%;background:${lvl.color};border-radius:3px;transition:width 0.3s"></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${checks.map(c => `<span style="font-size:11px;color:${c.test ? '#16a34a' : '#94a3b8'}">${c.test ? '✓' : '○'} ${c.label}</span>`).join('')}
      </div>`;
  }

  /* ── Save user ── */
  async function _save(existingId) {
    const nom      = el('uNom')?.value.trim();
    const username = el('uUsername')?.value.trim().toLowerCase();
    const profil   = el('uProfilValue')?.value || el('uProfil')?.value;
    const actif    = el('uActif')?.value === '1';
    const pwd      = el('uPwd')?.value;
    const pwd2     = el('uPwd2')?.value;

    if (!nom || !username || !profil) { toast('Veuillez remplir tous les champs obligatoires', 'error'); return; }

    const all = await DB.getAll('utilisateurs');
    if (all.find(u => u.username.toLowerCase() === username && u.id !== existingId)) {
      toast('Cet identifiant est déjà utilisé', 'error'); return;
    }

    if (!existingId) {
      if (!pwd) { toast('Le mot de passe est obligatoire', 'error'); return; }
      if (pwd.length < 6) { toast('Minimum 6 caractères pour le mot de passe', 'error'); return; }
      if (pwd !== pwd2) { toast('Les mots de passe ne correspondent pas', 'error'); return; }
    }

    /* Prevent disabling the last active admin */
    if (existingId) {
      const existing = all.find(u => u.id === existingId);
      if (existing?.profil === 'admin' && profil !== 'admin') {
        const adminCount = all.filter(u => u.profil === 'admin' && u.actif && u.id !== existingId).length;
        if (adminCount === 0) { toast('Impossible : il doit rester au moins un administrateur actif', 'error'); return; }
      }
    }

    const id       = existingId || seqId('USR', all);
    const existing = all.find(u => u.id === existingId) || {};
    const hash     = !existingId ? await Auth.hashPassword(pwd) : existing.password_hash;

    await DB.put('utilisateurs', { ...existing, id, nom, username, password_hash: hash, profil, actif });
    await logAction(existingId ? 'Modification' : 'Création', `Utilisateur ${username} · profil: ${profil}`);
    toast(`Utilisateur ${existingId ? 'modifié' : 'créé'} avec succès`, 'success');
    closeModal();
    await load();
    _tab = 'liste';
    render(el('mainContent'));
  }

  /* ═══════════════════════════════════════════════════════════
     CHANGE PASSWORD (admin action on another user)
  ═══════════════════════════════════════════════════════════ */
  function changePassword(id) {
    const user = _all.find(u => u.id === id);
    if (!user) return;
    openModal(`Réinitialiser le mot de passe — ${user.nom}`, `
      <div style="background:var(--surface2);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">
        Vous définissez un nouveau mot de passe pour <strong style="color:var(--primary)">${user.nom}</strong> (@${user.username}).
        L'utilisateur devra le changer à sa prochaine connexion.
      </div>
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Nouveau mot de passe *</label>
          <input type="password" class="form-control" id="cpPwd" placeholder="Minimum 6 caractères" autocomplete="new-password" oninput="Utilisateurs._pwdStrength(this.value,'cpStrength')" />
          <div id="cpStrength" style="margin-top:6px"></div>
        </div>
        <div class="form-group form-full">
          <label class="form-label">Confirmer *</label>
          <input type="password" class="form-control" id="cpPwd2" placeholder="••••••••" autocomplete="new-password" />
        </div>
      </div>`,
      { confirmLabel: '🔑 Réinitialiser', onConfirm: () => _doChangePassword(id) }
    );
  }

  async function _doChangePassword(id) {
    const pwd  = el('cpPwd')?.value;
    const pwd2 = el('cpPwd2')?.value;
    if (!pwd) { toast('Veuillez saisir un mot de passe', 'error'); return; }
    if (pwd.length < 6) { toast('Minimum 6 caractères', 'error'); return; }
    if (pwd !== pwd2) { toast('Les mots de passe ne correspondent pas', 'error'); return; }
    const user = await DB.get('utilisateurs', id);
    if (!user) return;
    const hash = await Auth.hashPassword(pwd);
    await DB.put('utilisateurs', { ...user, password_hash: hash });
    await logAction('Sécurité', `Mot de passe réinitialisé pour ${user.username} par ${Auth.getUser()?.username}`);
    toast(`Mot de passe de ${user.nom} réinitialisé ✅`, 'success');
    closeModal();
  }

  /* ═══════════════════════════════════════════════════════════
     TOGGLE ACTIF / DELETE
  ═══════════════════════════════════════════════════════════ */
  async function toggleActif(id) {
    if (id === Auth.getUser()?.id) { toast('Vous ne pouvez pas vous désactiver', 'error'); return; }
    const user = await DB.get('utilisateurs', id);
    if (!user) return;
    /* Prevent deactivating last admin */
    if (user.profil === 'admin' && user.actif) {
      const admins = _all.filter(u => u.profil === 'admin' && u.actif && u.id !== id);
      if (admins.length === 0) { toast('Impossible : il doit rester au moins un administrateur actif', 'error'); return; }
    }
    await DB.put('utilisateurs', { ...user, actif: !user.actif });
    await logAction('Statut', `Utilisateur ${user.username} ${user.actif ? 'désactivé' : 'activé'}`);
    toast(`Utilisateur ${user.actif ? 'désactivé' : 'activé'}`, 'success');
    await load();
    _renderListe(el('utilisateursContent'));
  }

  async function deleteUser(id) {
    if (id === Auth.getUser()?.id) { toast('Vous ne pouvez pas supprimer votre propre compte', 'error'); return; }
    const user = await DB.get('utilisateurs', id);
    if (!user) return;
    /* Prevent deleting last admin */
    if (user.profil === 'admin') {
      const admins = _all.filter(u => u.profil === 'admin' && u.id !== id);
      if (admins.length === 0) { toast('Impossible : il doit rester au moins un administrateur', 'error'); return; }
    }
    confirmDialog(
      `Supprimer définitivement l'utilisateur <b>${user.nom}</b> (@${user.username}) ?<br>
       <small style="color:var(--text-muted)">Cette action est irréversible.</small>`,
      async () => {
        await DB.delete('utilisateurs', id);
        await logAction('Suppression', `Utilisateur ${user.username} supprimé par ${Auth.getUser()?.username}`);
        toast('Utilisateur supprimé', 'warning');
        closeModal();
        await load();
        _renderListe(el('utilisateursContent'));
      }
    );
  }

  return {
    render, load, createForm, editForm,
    changePassword, toggleActif, deleteUser,
    _setTab, _onSearch, _selectProfil, _pwdStrength,
    _saveMonNom, _saveMonMdp,
  };
})();
