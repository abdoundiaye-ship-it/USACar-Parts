/* ============================================================
   MODULE: Produits
   ============================================================ */

const Produits = (() => {
  let _all = [];
  let _query = '';
  let _catFilter = '';

  async function load() {
    _all = await DB.getAll('produits');
  }

  function getAll() { return _all; }
  function getById(id) { return _all.find(p => p.id === id); }
  function getActive() { return _all.filter(p => p.actif); }

  function cats() {
    return [...new Set(_all.map(p => p.categorie).filter(Boolean))].sort();
  }

  async function render(container) {
    await load();

    const filtered = _all.filter(p => {
      const q = _query.toLowerCase();
      const matchQ = !q || p.nom.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categorie.toLowerCase().includes(q);
      const matchCat = !_catFilter || p.categorie === _catFilter;
      return matchQ && matchCat;
    });

    const catOpts = cats().map(c => `<option value="${c}" ${_catFilter === c ? 'selected' : ''}>${c}</option>`).join('');

    const tbl = buildTable([
      { key: 'id', label: 'ID Produit' },
      { key: 'nom', label: 'Nom' },
      { key: 'categorie', label: 'Catégorie', render: r => `<span class="badge badge-primary">${r.categorie || ''}</span>` },
      { key: 'sku', label: 'SKU' },
      { key: 'actif', label: 'Actif', render: r => statusBadge(r.actif ? 'Actif' : 'Inactif'), align: 'center' },
      {
        key: '_actions', label: 'Actions', render: r =>
          `<div class="table-actions">
            <button class="btn btn-sm btn-ghost btn-icon" onclick="Produits.editForm('${r.id}')" title="Modifier">✏️</button>
            <button class="btn btn-sm btn-ghost btn-icon" onclick="Produits.deleteItem('${r.id}')" title="Supprimer">🗑️</button>
          </div>`
      },
    ], filtered, 'Aucun produit trouvé');

    container.innerHTML = `
      <div class="page-header">
        <h2>Produits</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Produits.exportData()">⬇️ Exporter</button>
          <button class="btn btn-primary" onclick="Produits.createForm()">+ Nouveau Produit</button>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" id="produitSearch" placeholder="Rechercher par nom, SKU, catégorie…" value="${_query}" oninput="Produits._onSearch(this.value)" />
          <select class="form-control" style="width:auto;min-width:160px" onchange="Produits._onCat(this.value)">
            <option value="">Toutes les catégories</option>
            ${catOpts}
          </select>
        </div>
        <div class="mb-16" style="font-size:13px;color:var(--text-muted)">${filtered.length} produit(s) affiché(s)</div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }
  function _onCat(v) { _catFilter = v; render(el('mainContent')); }

  function createForm() { _openForm(null); }
  async function editForm(id) {
    await load();
    _openForm(_all.find(p => p.id === id));
  }

  function _openForm(prod) {
    const isNew = !prod;
    const cats = ['Huile', 'Liquide de Transmission', 'Liquide de Freinage', 'Filtre', 'Batterie', 'Pneu', 'Pièce Moteur', 'Accessoire', 'Autre'];
    const catOpts = cats.map(c => `<option value="${c}" ${prod?.categorie === c ? 'selected' : ''}>${c}</option>`).join('');

    openModal(isNew ? 'Nouveau Produit' : 'Modifier le Produit', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Nom *</label>
          <input class="form-control" id="pNom" value="${prod?.nom || ''}" placeholder="Nom du produit" required />
        </div>
        <div class="form-group">
          <label class="form-label">SKU *</label>
          <input class="form-control" id="pSku" value="${prod?.sku || ''}" placeholder="Ex: GP-5W40-1L" required />
        </div>
        <div class="form-group">
          <label class="form-label">Catégorie *</label>
          <select class="form-control" id="pCat">
            <option value="">-- Sélectionner --</option>
            ${catOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-control" id="pActif">
            <option value="1" ${prod?.actif !== false ? 'selected' : ''}>Actif</option>
            <option value="0" ${prod?.actif === false ? 'selected' : ''}>Inactif</option>
          </select>
        </div>
      </div>`,
      {
        confirmLabel: isNew ? 'Créer' : 'Enregistrer',
        onConfirm: () => _save(prod?.id),
      }
    );
  }

  async function _save(existingId) {
    const nom = el('pNom')?.value.trim();
    const sku = el('pSku')?.value.trim();
    const cat = el('pCat')?.value;
    const actif = el('pActif')?.value === '1';

    if (!nom || !sku || !cat) { toast('Veuillez remplir tous les champs obligatoires', 'error'); return; }

    const allProds = await DB.getAll('produits');
    const dupSku = allProds.find(p => p.sku === sku && p.id !== existingId);
    if (dupSku) { toast('Ce SKU existe déjà', 'error'); return; }

    const id = existingId || seqId('PRD', allProds);
    const obj = { id, nom, sku, categorie: cat, actif };
    await DB.put('produits', obj);
    await logAction(existingId ? 'Modification' : 'Création', `Produit ${sku} – ${nom}`);
    toast(`Produit ${existingId ? 'modifié' : 'créé'} avec succès`, 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function deleteItem(id) {
    const prod = _all.find(p => p.id === id);
    confirmDialog(`Supprimer le produit <b>${prod?.nom}</b> ?<br><small>Cette action est irréversible.</small>`, async () => {
      await DB.delete('produits', id);
      await logAction('Suppression', `Produit ${id}`);
      toast('Produit supprimé', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  async function exportData() {
    await load();
    exportCSV('produits.csv',
      [{ key: 'id', label: 'ID' }, { key: 'nom', label: 'Nom' }, { key: 'categorie', label: 'Catégorie' }, { key: 'sku', label: 'SKU' }, { key: 'actif', label: 'Actif' }],
      _all
    );
  }

  return { render, load, getAll, getById, getActive, cats, createForm, editForm, deleteItem, exportData, _onSearch, _onCat };
})();
