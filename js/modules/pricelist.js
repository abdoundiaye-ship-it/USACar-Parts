/* ============================================================
   MODULE: Price List
   ============================================================ */

const PriceList = (() => {
  let _all = [];
  let _produits = [];
  let _query = '';

  async function load() {
    [_all, _produits] = await Promise.all([
      DB.getAll('price_list'),
      DB.getAll('produits'),
    ]);
  }

  async function render(container) {
    await load();
    const prodMap = Object.fromEntries(_produits.map(p => [p.id, p]));

    let rows = _produits.map(p => {
      const pl = _all.find(x => x.produit_id === p.id);
      return {
        ...p,
        prix_plancher_ttc: pl?.prix_plancher_ttc || 0,
        prix_plafond_ht: pl?.prix_plafond_ht || 0,
        prix_plafond_ttc: pl?.prix_plafond_ttc || 0,
        prix_senegal_ttc: pl?.prix_senegal_ttc || 0,
      };
    });

    if (_query) {
      const q = _query.toLowerCase();
      rows = rows.filter(r => r.nom.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
    }

    const tbl = buildTable([
      { key: 'sku', label: 'Code Produit' },
      { key: 'nom', label: 'Produit' },
      { key: 'categorie', label: 'Catégorie', render: r => `<span class="badge badge-primary">${r.categorie}</span>` },
      { key: 'prix_plancher_ttc', label: 'Prix Plancher TTC', align: 'right', render: r => r.prix_plancher_ttc ? fmtCurrency(r.prix_plancher_ttc) : '<span class="text-muted">—</span>' },
      { key: 'prix_plafond_ht', label: 'Prix Plafond HT', align: 'right', render: r => r.prix_plafond_ht ? fmtCurrency(r.prix_plafond_ht) : '<span class="text-muted">—</span>' },
      { key: 'prix_plafond_ttc', label: 'Prix Plafond TTC', align: 'right', render: r => r.prix_plafond_ttc ? `<span class="font-bold text-success">${fmtCurrency(r.prix_plafond_ttc)}</span>` : '<span class="text-muted">—</span>' },
      { key: 'prix_senegal_ttc', label: 'Prix Sénégal TTC', align: 'right', render: r => r.prix_senegal_ttc ? fmtCurrency(r.prix_senegal_ttc) : '<span class="text-muted">—</span>' },
      {
        key: '_actions', label: 'Actions',
        render: r => `<button class="btn btn-sm btn-ghost btn-icon" onclick="PriceList.editPrice('${r.id}')">✏️</button>`
      },
    ], rows, 'Aucun produit');

    container.innerHTML = `
      <div class="page-header">
        <h2>Liste des Prix</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="PriceList.exportData()">⬇️ Exporter</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px;padding:14px 20px;font-size:13px;color:var(--text-muted)">
        <strong style="color:var(--primary)">Guide tarifaire :</strong>
        &nbsp;Prix Plancher = minimum acceptable ·
        &nbsp;Prix Plafond = maximum conseillé ·
        &nbsp;Prix Sénégal = tarif standard du marché local
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par nom ou SKU…" value="${_query}" oninput="PriceList._onSearch(this.value)" />
        </div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }

  async function editPrice(produitId) {
    const prod = _produits.find(p => p.id === produitId);
    const existing = _all.find(x => x.produit_id === produitId);

    openModal(`Prix – ${prod?.sku || produitId}`, `
      <div style="margin-bottom:12px;color:var(--text-muted);font-size:13px">
        <strong style="color:var(--primary)">${prod?.nom || ''}</strong> · ${prod?.categorie || ''}
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Prix Plancher TTC (FCFA)</label>
          <input type="number" class="form-control" id="plPlancher" value="${existing?.prix_plancher_ttc || ''}" min="0" step="100" placeholder="Minimum acceptable" />
        </div>
        <div class="form-group">
          <label class="form-label">Prix Plafond HT (FCFA)</label>
          <input type="number" class="form-control" id="plPlafondHT" value="${existing?.prix_plafond_ht || ''}" min="0" step="100" placeholder="Maximum HT" oninput="PriceList._calcPlafondTTC()" />
        </div>
        <div class="form-group">
          <label class="form-label">Prix Plafond TTC (auto)</label>
          <input type="number" class="form-control" id="plPlafondTTC" value="${existing?.prix_plafond_ttc || ''}" placeholder="= HT × 1.18" />
        </div>
        <div class="form-group">
          <label class="form-label">Prix Sénégal TTC (FCFA)</label>
          <input type="number" class="form-control" id="plSenegal" value="${existing?.prix_senegal_ttc || ''}" min="0" step="100" placeholder="Prix marché local" />
        </div>
      </div>`,
      {
        confirmLabel: 'Enregistrer',
        onConfirm: () => _savePrice(produitId),
      }
    );
  }

  function _calcPlafondTTC() {
    const ht = parseFloat(el('plPlafondHT')?.value) || 0;
    const ttcEl = el('plPlafondTTC');
    if (ttcEl) ttcEl.value = Math.round(ht * 1.18);
  }

  async function _savePrice(produitId) {
    const prix_plancher_ttc = parseFloat(el('plPlancher')?.value) || 0;
    const prix_plafond_ht = parseFloat(el('plPlafondHT')?.value) || 0;
    const prix_plafond_ttc = parseFloat(el('plPlafondTTC')?.value) || Math.round(prix_plafond_ht * 1.18);
    const prix_senegal_ttc = parseFloat(el('plSenegal')?.value) || 0;
    await DB.put('price_list', { produit_id: produitId, prix_plancher_ttc, prix_plafond_ht, prix_plafond_ttc, prix_senegal_ttc });
    await logAction('Prix', `Mise à jour des prix pour ${produitId}`);
    toast('Prix mis à jour', 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function exportData() {
    await load();
    const rows = _produits.map(p => {
      const pl = _all.find(x => x.produit_id === p.id) || {};
      return { sku: p.sku, nom: p.nom, categorie: p.categorie, ...pl };
    });
    exportCSV('price_list.csv', [
      { key: 'sku', label: 'SKU' }, { key: 'nom', label: 'Produit' }, { key: 'categorie', label: 'Catégorie' },
      { key: 'prix_plancher_ttc', label: 'Prix Plancher TTC' }, { key: 'prix_plafond_ht', label: 'Prix Plafond HT' },
      { key: 'prix_plafond_ttc', label: 'Prix Plafond TTC' }, { key: 'prix_senegal_ttc', label: 'Prix Sénégal TTC' },
    ], rows);
  }

  return { render, load, editPrice, exportData, _onSearch, _calcPlafondTTC };
})();
