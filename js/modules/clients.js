/* ============================================================
   MODULE: Clients
   ============================================================ */

const Clients = (() => {
  let _all = [];
  let _query = '';

  async function load() {
    _all = await DB.getAll('clients');
  }

  function getAll() { return _all; }
  function getById(id) { return _all.find(c => c.id === id); }

  async function render(container) {
    await load();

    const filtered = _all.filter(c => {
      const q = _query.toLowerCase();
      return !q || c.nom.toLowerCase().includes(q) || (c.telephone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
    });

    const tbl = buildTable([
      { key: 'id', label: 'ID' },
      { key: 'nom', label: 'Nom' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'email', label: 'Email' },
      { key: 'adresse', label: 'Adresse' },
      { key: 'total_achats', label: 'Total Achats', align: 'right', render: r => fmtCurrency(r.total_achats || 0) },
      {
        key: 'credit', label: 'Crédit Dû', align: 'right',
        render: r => {
          const c = r.credit || 0;
          return c > 0 ? `<span class="text-danger font-bold">${fmtCurrency(c)}</span>` : `<span class="text-muted">—</span>`;
        }
      },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Clients.editForm('${r.id}')" title="Modifier">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Clients.deleteItem('${r.id}')" title="Supprimer">🗑️</button>
        </div>`
      },
    ], filtered, 'Aucun client trouvé');

    container.innerHTML = `
      <div class="page-header">
        <h2>Clients</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Clients.exportData()">⬇️ Exporter</button>
          <button class="btn btn-primary" onclick="Clients.createForm()">+ Nouveau Client</button>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par nom, téléphone, email…" value="${_query}" oninput="Clients._onSearch(this.value)" />
        </div>
        <div class="mb-16" style="font-size:13px;color:var(--text-muted)">${filtered.length} client(s) affiché(s)</div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }

  function createForm() { _openForm(null); }
  async function editForm(id) {
    await load();
    _openForm(_all.find(c => c.id === id));
  }

  function _openForm(client) {
    const isNew = !client;
    openModal(isNew ? 'Nouveau Client' : 'Modifier le Client', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Nom complet *</label>
          <input class="form-control" id="cNom" value="${client?.nom || ''}" placeholder="Ex: Moussa Diallo" required />
        </div>
        <div class="form-group">
          <label class="form-label">Téléphone</label>
          <input class="form-control" id="cTel" value="${client?.telephone || ''}" placeholder="+221 77 000 00 00" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="cEmail" value="${client?.email || ''}" placeholder="exemple@mail.com" />
        </div>
        <div class="form-group form-full">
          <label class="form-label">Adresse</label>
          <input class="form-control" id="cAdresse" value="${client?.adresse || ''}" placeholder="Ville, Pays" />
        </div>
        <div class="form-group">
          <label class="form-label">Crédit Dû (FCFA)</label>
          <input type="number" class="form-control" id="cCredit" value="${client?.credit || 0}" min="0" step="100" />
        </div>
      </div>`,
      { confirmLabel: isNew ? 'Créer' : 'Enregistrer', onConfirm: () => _save(client?.id) }
    );
  }

  async function _save(existingId) {
    const nom = el('cNom')?.value.trim();
    const telephone = el('cTel')?.value.trim();
    const email = el('cEmail')?.value.trim();
    const adresse = el('cAdresse')?.value.trim();
    const credit = parseFloat(el('cCredit')?.value) || 0;

    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }

    const all = await DB.getAll('clients');
    const id = existingId || seqId('CL', all);
    const existing = all.find(c => c.id === existingId) || {};
    await DB.put('clients', { ...existing, id, nom, telephone, email, adresse, credit, total_achats: existing.total_achats || 0 });
    await logAction(existingId ? 'Modification' : 'Création', `Client ${nom}`);
    toast(`Client ${existingId ? 'modifié' : 'créé'} avec succès`, 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function deleteItem(id) {
    const client = _all.find(c => c.id === id);
    confirmDialog(`Supprimer le client <b>${client?.nom}</b> ?`, async () => {
      await DB.delete('clients', id);
      await logAction('Suppression', `Client ${id}`);
      toast('Client supprimé', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  async function updateTotalAchats(clientId, montant) {
    const c = await DB.get('clients', clientId);
    if (!c) return;
    await DB.put('clients', { ...c, total_achats: (c.total_achats || 0) + montant });
    _all = await DB.getAll('clients');
  }

  async function exportData() {
    await load();
    exportCSV('clients.csv', [
      { key: 'id', label: 'ID' }, { key: 'nom', label: 'Nom' },
      { key: 'telephone', label: 'Téléphone' }, { key: 'email', label: 'Email' },
      { key: 'adresse', label: 'Adresse' }, { key: 'total_achats', label: 'Total Achats' }, { key: 'credit', label: 'Crédit' },
    ], _all);
  }

  return { render, load, getAll, getById, createForm, editForm, deleteItem, updateTotalAchats, exportData, _onSearch };
})();
