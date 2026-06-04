/* ============================================================
   MODULE: Stocks + Mouvements
   ============================================================ */

const Stocks = (() => {
  let _mouvements = [];
  let _produits = [];
  let _query = '';

  async function load() {
    const [achats, lignesAchats, ventes, lignesVentes, manualMvs, prods] = await Promise.all([
      DB.getAll('achats'),
      DB.getAll('lignes_achats'),
      DB.getAll('ventes'),
      DB.getAll('lignes_ventes'),
      DB.getAll('mouvements'),
      DB.getAll('produits'),
    ]);

    _produits = prods;

    const achatIds = new Set(achats.map(a => a.id));
    const venteIds = new Set(ventes.map(v => v.id));
    const computed = [];

    // Entrées depuis Achats réceptionnés
    for (const a of achats.filter(a => a.statut === 'Reçu')) {
      for (const l of lignesAchats.filter(l => l.achat_id === a.id)) {
        computed.push({
          id: `${a.id}_${l.produit_id}`,
          date: a.date,
          produit_id: l.produit_id,
          type: 'Entrée',
          quantite: l.quantite,
          prix_unitaire: l.cout_revient_unitaire || l.prix_unitaire,
          reference: a.id,
          commentaire: `Achat ${a.id}`,
        });
      }
    }

    // Sorties depuis Ventes livrées
    for (const v of ventes.filter(v => v.statut === 'Livrée')) {
      for (const l of lignesVentes.filter(l => l.vente_id === v.id)) {
        computed.push({
          id: `${v.id}_${l.produit_id}`,
          date: v.date,
          produit_id: l.produit_id,
          type: 'Sortie',
          quantite: l.quantite,
          prix_unitaire: l.prix_applique_ht,
          reference: v.id,
          commentaire: `Vente ${v.id}`,
        });
      }
    }

    // Ajustements manuels uniquement (non liés à un achat ou une vente)
    for (const m of manualMvs.filter(m => !achatIds.has(m.reference) && !venteIds.has(m.reference))) {
      computed.push(m);
    }

    _mouvements = computed;
  }

  /* Compute stock per product from mouvements */
  function computeStocks() {
    const map = {};
    for (const p of _produits) {
      map[p.id] = { produit: p, entree: 0, sortie: 0, valeurEntrees: 0 };
    }
    for (const m of _mouvements) {
      if (!map[m.produit_id]) continue;
      if (m.type === 'Entrée') {
        map[m.produit_id].entree     += (m.quantite || 0);
        map[m.produit_id].valeurEntrees += (m.quantite || 0) * (m.prix_unitaire || 0);
      } else {
        map[m.produit_id].sortie += (m.quantite || 0);
      }
    }
    return Object.values(map).map(s => {
      const actuel    = s.entree - s.sortie;
      const prixMoyen = s.entree > 0 ? s.valeurEntrees / s.entree : 0;
      return { ...s, actuel, prixMoyen, valeur: actuel > 0 ? actuel * prixMoyen : 0 };
    });
  }

  function getStock(produit_id) {
    const mouvs = _mouvements.filter(m => m.produit_id === produit_id);
    const entree = mouvs.filter(m => m.type === 'Entrée').reduce((s, m) => s + (m.quantite || 0), 0);
    const sortie = mouvs.filter(m => m.type === 'Sortie').reduce((s, m) => s + (m.quantite || 0), 0);
    return entree - sortie;
  }

  async function renderStocks(container) {
    await load();
    const stocks = computeStocks();

    const filtered = stocks.filter(s => {
      const q = _query.toLowerCase();
      return !q || s.produit.nom.toLowerCase().includes(q) || s.produit.sku.toLowerCase().includes(q);
    });

    const totalValeur = filtered.reduce((s, x) => s + (x.actuel > 0 ? x.valeur : 0), 0);

    const tbl = buildTable([
      { key: 'sku', label: 'SKU', render: r => r.produit.sku },
      { key: 'nom', label: 'Produit', render: r => r.produit.nom },
      { key: 'categorie', label: 'Catégorie', render: r => `<span class="badge badge-primary">${r.produit.categorie}</span>` },
      { key: 'entree', label: 'Entrées', render: r => r.entree, align: 'center' },
      { key: 'sortie', label: 'Sorties', render: r => r.sortie, align: 'center' },
      {
        key: 'actuel', label: 'Stock Actuel', align: 'center',
        render: r => {
          const cls = r.actuel <= 0 ? 'badge-danger' : r.actuel <= 5 ? 'badge-warning' : 'badge-success';
          return `<span class="badge ${cls}">${r.actuel}</span>`;
        }
      },
      { key: 'valeur', label: 'Valeur Stock', align: 'right', render: r => r.actuel > 0 ? fmtCurrency(r.valeur) : '<span class="text-muted">—</span>' },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Stocks.ajusterStock('${r.produit.id}')" title="Ajustement">⚖️</button>
        </div>`
      },
    ], filtered, 'Aucun produit en stock');

    container.innerHTML = `
      <div class="page-header">
        <h2>Stocks</h2>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="Stocks.ajusterStock()">+ Mouvement Manuel</button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="kpi-card blue">
          <div class="kpi-icon">📦</div>
          <div class="kpi-label">Total Produits</div>
          <div class="kpi-value">${_produits.length}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">✅</div>
          <div class="kpi-label">En Stock</div>
          <div class="kpi-value">${stocks.filter(s => s.actuel > 0).length}</div>
        </div>
        <div class="kpi-card orange">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label">Valeur du Stock</div>
          <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalValeur)}</div>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher un produit…" value="${_query}" oninput="Stocks._onSearch(this.value)" />
        </div>
        ${tbl}
      </div>`;
  }

  async function renderMouvements(container) {
    await load();
    const sorted = [..._mouvements].sort((a, b) => new Date(b.date) - new Date(a.date));
    const prodMap = Object.fromEntries(_produits.map(p => [p.id, p]));

    const tbl = buildTable([
      { key: 'id', label: 'ID' },
      { key: 'date', label: 'Date', render: r => fmtDate(r.date) },
      { key: 'produit', label: 'Produit', render: r => prodMap[r.produit_id]?.nom || r.produit_id },
      { key: 'type', label: 'Type', render: r => statusBadge(r.type), align: 'center' },
      { key: 'quantite', label: 'Qté', align: 'center' },
      { key: 'prix_unitaire', label: 'P.U.', align: 'right', render: r => r.prix_unitaire ? fmtCurrency(r.prix_unitaire) : '—' },
      { key: 'montant', label: 'Montant', align: 'right', render: r => r.prix_unitaire && r.quantite ? fmtCurrency(r.quantite * r.prix_unitaire) : '—' },
      { key: 'reference', label: 'Référence' },
      { key: 'commentaire', label: 'Commentaire', render: r => `<span class="text-muted">${r.commentaire || ''}</span>` },
      {
        key: '_del', label: '', render: r =>
          `<button class="btn btn-sm btn-ghost btn-icon" onclick="Stocks.deleteMouvement('${r.id}')">🗑️</button>`
      },
    ], sorted, 'Aucun mouvement enregistré');

    container.innerHTML = `
      <div class="page-header">
        <h2>Mouvements de Stock</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Stocks.exportMouvements()">⬇️ Exporter</button>
          <button class="btn btn-primary" onclick="Stocks.ajusterStock()">+ Nouveau Mouvement</button>
        </div>
      </div>
      <div class="card">${tbl}</div>`;
  }

  function _onSearch(v) { _query = v; renderStocks(el('mainContent')); }

  async function ajusterStock(produitIdPrefill) {
    await load();
    const prodOpts = _produits
      .filter(p => p.actif)
      .map(p => `<option value="${p.id}" ${p.id === produitIdPrefill ? 'selected' : ''}>${p.sku} – ${p.nom}</option>`)
      .join('');

    openModal('Mouvement de Stock', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Produit *</label>
          <select class="form-control" id="mvProduit">
            <option value="">-- Sélectionner --</option>
            ${prodOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-control" id="mvType">
            <option value="Entrée">Entrée</option>
            <option value="Sortie">Sortie</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-control" id="mvDate" value="${todayStr()}" />
        </div>
        <div class="form-group">
          <label class="form-label">Quantité *</label>
          <input type="number" class="form-control" id="mvQte" min="1" value="1" />
        </div>
        <div class="form-group">
          <label class="form-label">Prix Unitaire (FCFA)</label>
          <input type="number" class="form-control" id="mvPrix" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">Référence</label>
          <input class="form-control" id="mvRef" placeholder="Ex: ACH001, V0001" />
        </div>
        <div class="form-group form-full">
          <label class="form-label">Commentaire</label>
          <input class="form-control" id="mvComment" placeholder="Note optionnelle" />
        </div>
      </div>`,
      { confirmLabel: 'Enregistrer', onConfirm: _saveMouvement }
    );
  }

  async function _saveMouvement() {
    const produit_id = el('mvProduit')?.value;
    const type = el('mvType')?.value;
    const date = el('mvDate')?.value;
    const quantite = parseFloat(el('mvQte')?.value);
    const prix_unitaire = parseFloat(el('mvPrix')?.value) || 0;
    const reference = el('mvRef')?.value.trim();
    const commentaire = el('mvComment')?.value.trim();

    if (!produit_id || !type || !date || !quantite || quantite <= 0) {
      toast('Veuillez remplir tous les champs obligatoires', 'error'); return;
    }

    if (type === 'Sortie') {
      const stockActuel = getStock(produit_id);
      if (quantite > stockActuel) {
        toast(`Stock insuffisant. Stock actuel : ${stockActuel}`, 'error'); return;
      }
    }

    const all = await DB.getAll('mouvements');
    const id = seqId('MV', all);
    await DB.add('mouvements', { id, date, produit_id, type, quantite, prix_unitaire, reference, commentaire });
    await logAction('Mouvement', `${type} – ${quantite} unité(s) du produit ${produit_id}`);
    toast('Mouvement enregistré', 'success');
    closeModal();
    await load();

    const page = window.location.hash;
    if (page === '#mouvements') renderMouvements(el('mainContent'));
    else renderStocks(el('mainContent'));
  }

  async function deleteMouvement(id) {
    confirmDialog('Supprimer ce mouvement de stock ?', async () => {
      await DB.delete('mouvements', id);
      toast('Mouvement supprimé', 'warning');
      closeModal();
      await load();
      const page = window.location.hash;
      if (page === '#mouvements') renderMouvements(el('mainContent'));
      else renderStocks(el('mainContent'));
    });
  }

  async function exportMouvements() {
    await load();
    const prodMap = Object.fromEntries(_produits.map(p => [p.id, p]));
    const rows = _mouvements.map(m => ({ ...m, produit_nom: prodMap[m.produit_id]?.nom || m.produit_id }));
    exportCSV('mouvements.csv', [
      { key: 'id', label: 'ID' }, { key: 'date', label: 'Date' },
      { key: 'produit_nom', label: 'Produit' }, { key: 'type', label: 'Type' },
      { key: 'quantite', label: 'Quantité' }, { key: 'prix_unitaire', label: 'Prix Unitaire' },
      { key: 'reference', label: 'Référence' }, { key: 'commentaire', label: 'Commentaire' },
    ], rows);
  }

  return { renderStocks, renderMouvements, load, computeStocks, getStock, ajusterStock, deleteMouvement, exportMouvements, _onSearch };
})();
