/* ============================================================
   MODULE: Fournisseurs
   ============================================================ */

const Fournisseurs = (() => {
  let _all = [];
  let _query = '';

  async function load() { _all = await DB.getAll('fournisseurs'); }
  function getAll() { return _all; }
  function getById(id) { return _all.find(f => f.id === id); }

  async function render(container) {
    await load();

    const filtered = _all.filter(f => {
      const q = _query.toLowerCase();
      return !q || f.nom.toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
    });

    const tbl = buildTable([
      { key: 'id', label: 'ID' },
      { key: 'nom', label: 'Nom' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'email', label: 'Email' },
      { key: 'adresse', label: 'Adresse' },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Fournisseurs.editForm('${r.id}')">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Fournisseurs.deleteItem('${r.id}')">🗑️</button>
        </div>`
      },
    ], filtered, 'Aucun fournisseur trouvé');

    container.innerHTML = `
      <div class="page-header">
        <h2>Fournisseurs</h2>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="Fournisseurs.createForm()">+ Nouveau Fournisseur</button>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher…" value="${_query}" oninput="Fournisseurs._onSearch(this.value)" />
        </div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }
  function createForm() { _openForm(null); }
  async function editForm(id) { await load(); _openForm(_all.find(f => f.id === id)); }

  function _openForm(f) {
    const isNew = !f;
    openModal(isNew ? 'Nouveau Fournisseur' : 'Modifier le Fournisseur', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Nom *</label>
          <input class="form-control" id="fNom" value="${f?.nom || ''}" placeholder="Nom du fournisseur" required />
        </div>
        <div class="form-group">
          <label class="form-label">Téléphone</label>
          <input class="form-control" id="fTel" value="${f?.telephone || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="fEmail" value="${f?.email || ''}" />
        </div>
        <div class="form-group form-full">
          <label class="form-label">Adresse</label>
          <input class="form-control" id="fAdresse" value="${f?.adresse || ''}" placeholder="Ville, Pays" />
        </div>
      </div>`,
      { confirmLabel: isNew ? 'Créer' : 'Enregistrer', onConfirm: () => _save(f?.id) }
    );
  }

  async function _save(existingId) {
    const nom = el('fNom')?.value.trim();
    if (!nom) { toast('Le nom est obligatoire', 'error'); return; }
    const all = await DB.getAll('fournisseurs');
    const id = existingId || seqId('FRN', all);
    await DB.put('fournisseurs', {
      id, nom,
      telephone: el('fTel')?.value.trim(),
      email: el('fEmail')?.value.trim(),
      adresse: el('fAdresse')?.value.trim(),
    });
    await logAction(existingId ? 'Modification' : 'Création', `Fournisseur ${nom}`);
    toast(`Fournisseur ${existingId ? 'modifié' : 'créé'}`, 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function deleteItem(id) {
    const f = _all.find(x => x.id === id);
    confirmDialog(`Supprimer le fournisseur <b>${f?.nom}</b> ?`, async () => {
      await DB.delete('fournisseurs', id);
      toast('Fournisseur supprimé', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  return { render, load, getAll, getById, createForm, editForm, deleteItem, _onSearch };
})();
