/* ============================================================
   MODULE: Utilisateurs — Admin only
   ============================================================ */

const Utilisateurs = (() => {
  let _all = [];

  async function load() { _all = await DB.getAll('utilisateurs'); }

  async function render(container) {
    if (!Auth.isAdmin()) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>Accès réservé à l'Administrateur.</p></div>`;
      return;
    }
    await load();

    const rows = _all.map(u => {
      const prof = Auth.PROFILES[u.profil];
      return `<tr>
        <td class="font-bold" style="color:var(--primary)">${u.id}</td>
        <td class="font-bold">${u.nom}</td>
        <td><code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:12px">${u.username}</code></td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${prof?.bg || '#f1f5f9'};color:${prof?.color || '#64748b'}">
            ${prof?.icon || ''} ${prof?.label || u.profil}
          </span>
        </td>
        <td class="text-center">${u.actif ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-secondary">Inactif</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-ghost btn-icon" onclick="Utilisateurs.editForm('${u.id}')" title="Modifier">✏️</button>
            <button class="btn btn-sm btn-ghost btn-icon" onclick="Utilisateurs.changePassword('${u.id}')" title="Changer mot de passe">🔑</button>
            ${u.id !== Auth.getUser()?.id
              ? `<button class="btn btn-sm btn-ghost btn-icon" onclick="Utilisateurs.toggleActif('${u.id}')" title="${u.actif ? 'Désactiver' : 'Activer'}">${u.actif ? '🔒' : '🔓'}</button>
                 <button class="btn btn-sm btn-ghost btn-icon" onclick="Utilisateurs.deleteUser('${u.id}')" title="Supprimer">🗑️</button>`
              : '<span class="text-muted" style="font-size:11px;padding:0 6px">Vous</span>'}
          </div>
        </td>
      </tr>`;
    }).join('');

    const profilStats = Object.entries(Auth.PROFILES).map(([key, p]) => {
      const n = _all.filter(u => u.profil === key && u.actif).length;
      return `<div class="kpi-card" style="border-left-color:${p.color}">
        <div class="kpi-icon">${p.icon}</div>
        <div class="kpi-label">${p.label}</div>
        <div class="kpi-value">${n}</div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2>Gestion des Utilisateurs</h2>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="Utilisateurs.createForm()">+ Nouvel Utilisateur</button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">${profilStats}</div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Nom</th><th>Identifiant</th><th>Profil</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Aucun utilisateur</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="card mt-16" style="padding:16px 20px;font-size:13px;color:var(--text-muted)">
        <strong style="color:var(--primary)">Mots de passe par défaut :</strong>
        admin / <code>admin123</code> &nbsp;·&nbsp;
        vendeur / <code>vendeur123</code> &nbsp;·&nbsp;
        stock / <code>stock123</code> &nbsp;·&nbsp;
        control / <code>control123</code>
        <br><span style="color:var(--danger);font-weight:600">⚠️ Changez les mots de passe par défaut dès la première connexion.</span>
      </div>`;
  }

  function createForm() { _openForm(null); }
  async function editForm(id) { await load(); _openForm(_all.find(u => u.id === id)); }

  function _openForm(user) {
    const isNew  = !user;
    const profOpts = Object.entries(Auth.PROFILES).map(([key, p]) =>
      `<option value="${key}" ${user?.profil === key ? 'selected' : ''}>${p.icon} ${p.label}</option>`
    ).join('');

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
          <label class="form-label">Profil *</label>
          <select class="form-control" id="uProfil">${profOpts}</select>
        </div>
        ${isNew ? `
        <div class="form-group">
          <label class="form-label">Mot de passe *</label>
          <input type="password" class="form-control" id="uPwd" placeholder="••••••••" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmer mot de passe *</label>
          <input type="password" class="form-control" id="uPwd2" placeholder="••••••••" autocomplete="new-password" />
        </div>` : ''}
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-control" id="uActif">
            <option value="1" ${user?.actif !== false ? 'selected' : ''}>Actif</option>
            <option value="0" ${user?.actif === false ? 'selected' : ''}>Inactif</option>
          </select>
        </div>
      </div>
      ${!isNew ? `<div class="divider"></div>
        <p style="font-size:12.5px;color:var(--text-muted)">Pour changer le mot de passe, utilisez le bouton 🔑 dans la liste.</p>` : ''}`,
      { confirmLabel: isNew ? 'Créer' : 'Enregistrer', onConfirm: () => _save(user?.id) }
    );
  }

  async function _save(existingId) {
    const nom      = el('uNom')?.value.trim();
    const username = el('uUsername')?.value.trim().toLowerCase();
    const profil   = el('uProfil')?.value;
    const actif    = el('uActif')?.value === '1';
    const pwd      = el('uPwd')?.value;
    const pwd2     = el('uPwd2')?.value;

    if (!nom || !username || !profil) { toast('Veuillez remplir tous les champs obligatoires', 'error'); return; }

    const all = await DB.getAll('utilisateurs');
    const dupUsername = all.find(u => u.username.toLowerCase() === username && u.id !== existingId);
    if (dupUsername) { toast('Cet identifiant est déjà utilisé', 'error'); return; }

    if (!existingId) {
      if (!pwd) { toast('Le mot de passe est obligatoire', 'error'); return; }
      if (pwd !== pwd2) { toast('Les mots de passe ne correspondent pas', 'error'); return; }
      if (pwd.length < 6) { toast('Le mot de passe doit contenir au moins 6 caractères', 'error'); return; }
    }

    const id   = existingId || seqId('USR', all);
    const existing = all.find(u => u.id === existingId) || {};
    const hash = !existingId ? await Auth.hashPassword(pwd) : existing.password_hash;

    await DB.put('utilisateurs', { ...existing, id, nom, username, password_hash: hash, profil, actif });
    await logAction(existingId ? 'Modification' : 'Création', `Utilisateur ${username} (${profil})`);
    toast(`Utilisateur ${existingId ? 'modifié' : 'créé'}`, 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  function changePassword(id) {
    openModal('Changer le mot de passe', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Nouveau mot de passe *</label>
          <input type="password" class="form-control" id="cpPwd" placeholder="••••••••" autocomplete="new-password" />
        </div>
        <div class="form-group form-full">
          <label class="form-label">Confirmer le mot de passe *</label>
          <input type="password" class="form-control" id="cpPwd2" placeholder="••••••••" autocomplete="new-password" />
        </div>
      </div>`,
      { confirmLabel: 'Changer', onConfirm: () => _doChangePassword(id) }
    );
  }

  async function _doChangePassword(id) {
    const pwd  = el('cpPwd')?.value;
    const pwd2 = el('cpPwd2')?.value;
    if (!pwd) { toast('Veuillez saisir un mot de passe', 'error'); return; }
    if (pwd !== pwd2) { toast('Les mots de passe ne correspondent pas', 'error'); return; }
    if (pwd.length < 6) { toast('Minimum 6 caractères', 'error'); return; }

    const user = await DB.get('utilisateurs', id);
    if (!user) return;
    const hash = await Auth.hashPassword(pwd);
    await DB.put('utilisateurs', { ...user, password_hash: hash });
    await logAction('Sécurité', `Mot de passe changé pour ${user.username}`);
    toast('Mot de passe changé avec succès', 'success');
    closeModal();
  }

  async function toggleActif(id) {
    if (id === Auth.getUser()?.id) { toast('Vous ne pouvez pas vous désactiver vous-même', 'error'); return; }
    const user = await DB.get('utilisateurs', id);
    if (!user) return;
    await DB.put('utilisateurs', { ...user, actif: !user.actif });
    toast(`Utilisateur ${user.actif ? 'désactivé' : 'activé'}`, 'success');
    await load();
    render(el('mainContent'));
  }

  async function deleteUser(id) {
    if (id === Auth.getUser()?.id) { toast('Vous ne pouvez pas supprimer votre propre compte', 'error'); return; }
    const user = await DB.get('utilisateurs', id);
    if (!user) return;
    confirmDialog(`Supprimer l'utilisateur <b>${user.nom}</b> ?`, async () => {
      await DB.delete('utilisateurs', id);
      await logAction('Suppression', `Utilisateur ${user.username} supprimé`);
      toast('Utilisateur supprimé', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  return { render, load, createForm, editForm, changePassword, toggleActif, deleteUser };
})();
