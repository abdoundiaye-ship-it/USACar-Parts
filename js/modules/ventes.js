/* ============================================================
   MODULE: Ventes
   ============================================================ */

const Ventes = (() => {
  let _ventes = [];
  let _lignes = [];
  let _query = '';
  let _statusFilter = '';

  async function load() {
    [_ventes, _lignes] = await Promise.all([
      DB.getAll('ventes'),
      DB.getAll('lignes_ventes'),
    ]);
  }

  function getAll() { return _ventes; }

  async function render(container) {
    await load();
    const clients = await DB.getAll('clients');
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

    let filtered = [..._ventes].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (_query) {
      const q = _query.toLowerCase();
      filtered = filtered.filter(v => v.id.toLowerCase().includes(q) || (clientMap[v.client_id]?.nom || '').toLowerCase().includes(q));
    }
    if (_statusFilter) filtered = filtered.filter(v => v.statut === _statusFilter);

    const tbl = buildTable([
      { key: 'id', label: 'ID Vente' },
      { key: 'date', label: 'Date', render: r => fmtDate(r.date) },
      { key: 'client', label: 'Client', render: r => clientMap[r.client_id]?.nom || r.client_id },
      { key: 'total_ht', label: 'Total HT', align: 'right', render: r => fmtCurrency(r.total_ht) },
      { key: 'tva', label: 'TVA (18%)', align: 'right', render: r => fmtCurrency(r.tva) },
      { key: 'total_ttc', label: 'Total TTC', align: 'right', render: r => `<span class="font-bold">${fmtCurrency(r.total_ttc)}</span>` },
      { key: 'paiement', label: 'Paiement', render: r => r.paiement ? `<span class="badge badge-secondary">${r.paiement}</span>` : '' },
      { key: 'statut', label: 'Statut', render: r => statusBadge(r.statut) },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Ventes.viewVente('${r.id}')" title="Voir détails">👁️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Ventes.editVente('${r.id}')" title="Modifier">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Factures.printFacture('${r.id}')" title="Imprimer facture">🖨️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Ventes.deleteVente('${r.id}')" title="Supprimer">🗑️</button>
        </div>`
      },
    ], filtered, 'Aucune vente enregistrée');

    const totalCA = filtered.reduce((s, v) => s + (v.total_ttc || 0), 0);

    container.innerHTML = `
      <div class="page-header">
        <h2>Ventes</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Ventes.exportData()">⬇️ Exporter</button>
          <button class="btn btn-primary" onclick="Ventes.createForm()">+ Nouvelle Vente</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px;padding:14px 20px">
        <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:center">
          <div><span class="text-muted" style="font-size:12px">VENTES FILTRÉES</span><div class="font-bold" style="font-size:18px">${filtered.length}</div></div>
          <div><span class="text-muted" style="font-size:12px">CA TTC</span><div class="font-bold" style="font-size:18px;color:var(--primary)">${fmtCurrency(totalCA)}</div></div>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par ID ou client…" value="${_query}" oninput="Ventes._onSearch(this.value)" />
          <select class="form-control" style="width:auto;min-width:160px" onchange="Ventes._onStatus(this.value)">
            <option value="">Tous les statuts</option>
            <option value="En attente" ${_statusFilter === 'En attente' ? 'selected' : ''}>En attente</option>
            <option value="Livrée" ${_statusFilter === 'Livrée' ? 'selected' : ''}>Livrée</option>
            <option value="Annulée" ${_statusFilter === 'Annulée' ? 'selected' : ''}>Annulée</option>
          </select>
        </div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }
  function _onStatus(v) { _statusFilter = v; render(el('mainContent')); }

  async function createForm() {
    await load();
    _openVenteForm(null);
  }

  async function editVente(id) {
    await load();
    _openVenteForm(_ventes.find(v => v.id === id));
  }

  async function _openVenteForm(vente) {
    const isNew = !vente;
    const clients = await DB.getAll('clients');
    const produits = (await DB.getAll('produits')).filter(p => p.actif);
    const lignes = vente ? _lignes.filter(l => l.vente_id === vente.id) : [];

    const clientOpts = clients.map(c => `<option value="${c.id}" ${vente?.client_id === c.id ? 'selected' : ''}>${c.nom}</option>`).join('');
    const prodOpts = produits.map(p => `<option value="${p.id}">${p.sku} – ${p.nom}</option>`).join('');

    let lignesRows = lignes.map((l, i) => _ligneTr(i, l, produits)).join('');
    if (!lignesRows) lignesRows = _ligneTr(0, null, produits);

    openModal(isNew ? 'Nouvelle Vente' : `Modifier Vente ${vente.id}`, `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-control" id="vDate" value="${vente?.date || todayStr()}" />
        </div>
        <div class="form-group">
          <label class="form-label">Client *</label>
          <select class="form-control" id="vClient">
            <option value="">-- Sélectionner --</option>
            ${clientOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Mode de Paiement</label>
          <select class="form-control" id="vPaiement">
            <option value="Espèces" ${vente?.paiement === 'Espèces' ? 'selected' : ''}>Espèces</option>
            <option value="Virement" ${vente?.paiement === 'Virement' ? 'selected' : ''}>Virement</option>
            <option value="Chèque" ${vente?.paiement === 'Chèque' ? 'selected' : ''}>Chèque</option>
            <option value="Mobile Money" ${vente?.paiement === 'Mobile Money' ? 'selected' : ''}>Mobile Money</option>
            <option value="Crédit" ${vente?.paiement === 'Crédit' ? 'selected' : ''}>Crédit</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-control" id="vStatut">
            <option value="En attente" ${vente?.statut === 'En attente' ? 'selected' : ''}>En attente</option>
            <option value="Livrée" ${!vente || vente?.statut === 'Livrée' ? 'selected' : ''}>Livrée</option>
            <option value="Annulée" ${vente?.statut === 'Annulée' ? 'selected' : ''}>Annulée</option>
          </select>
        </div>
      </div>
      <div class="divider"></div>
      <div class="card-title mb-16" style="margin-bottom:10px">Lignes de Vente</div>
      <div class="table-container">
        <table class="lignes-table">
          <thead><tr>
            <th>Produit</th><th>Qté</th><th>Prix Base HT</th><th>Remise %</th><th>P.Appliqué HT</th><th>Total HT</th><th></th>
          </tr></thead>
          <tbody id="lignesVenteBody">${lignesRows}</tbody>
        </table>
      </div>
      <button class="btn btn-ghost btn-sm add-ligne-btn" onclick="Ventes._addLigne()">+ Ajouter une ligne</button>
      <div class="divider"></div>
      <div style="text-align:right;line-height:2">
        <div>Total HT : <span id="vTotalHT" class="font-bold">0 FCFA</span></div>
        <div>TVA (18%) : <span id="vTVA">0 FCFA</span></div>
        <div style="font-size:16px">Total TTC : <span id="vTotalTTC" class="font-bold" style="color:var(--primary)">0 FCFA</span></div>
      </div>`,
      {
        wide: true,
        confirmLabel: isNew ? 'Créer la Vente' : 'Enregistrer',
        onConfirm: () => _saveVente(vente?.id),
        onOpen: () => _recalc(),
      }
    );
    _recalc();

    // Live recalc on input
    el('lignesVenteBody').addEventListener('input', _recalc);
  }

  function _ligneTr(i, ligne, produits) {
    const prodOpts = produits.map(p =>
      `<option value="${p.id}" ${ligne?.produit_id === p.id ? 'selected' : ''}>${p.sku} – ${p.nom}</option>`
    ).join('');
    return `
      <tr class="ligne-row" data-idx="${i}">
        <td><select class="form-control lv-produit" onchange="Ventes._recalc()">
          <option value="">--</option>${prodOpts}
        </select></td>
        <td><input type="number" class="form-control lv-qte" value="${ligne?.quantite || 1}" min="1" style="width:60px" onchange="Ventes._recalc()" /></td>
        <td><input type="number" class="form-control lv-prix" value="${ligne?.prix_base_ht || ''}" step="0.01" min="0" style="width:100px" placeholder="Prix" onchange="Ventes._recalc()" /></td>
        <td><input type="number" class="form-control lv-remise" value="${ligne?.remise || 0}" min="0" max="100" style="width:60px" onchange="Ventes._recalc()" /></td>
        <td><input type="number" class="form-control lv-applique" readonly style="width:100px" /></td>
        <td><input type="number" class="form-control lv-total" readonly style="width:110px" /></td>
        <td><button class="btn btn-icon btn-ghost" onclick="Ventes._removeLigne(this)">🗑️</button></td>
      </tr>`;
  }

  let _ligneIdx = 100;
  async function _addLigne() {
    const produits = (await DB.getAll('produits')).filter(p => p.actif);
    const body = el('lignesVenteBody');
    if (!body) return;
    const i = _ligneIdx++;
    const tr = document.createElement('tr');
    tr.className = 'ligne-row';
    tr.dataset.idx = i;
    const prodOpts = produits.map(p => `<option value="${p.id}">${p.sku} – ${p.nom}</option>`).join('');
    tr.innerHTML = `
      <td><select class="form-control lv-produit" onchange="Ventes._recalc()"><option value="">--</option>${prodOpts}</select></td>
      <td><input type="number" class="form-control lv-qte" value="1" min="1" style="width:60px" onchange="Ventes._recalc()" /></td>
      <td><input type="number" class="form-control lv-prix" step="0.01" min="0" style="width:100px" placeholder="Prix" onchange="Ventes._recalc()" /></td>
      <td><input type="number" class="form-control lv-remise" value="0" min="0" max="100" style="width:60px" onchange="Ventes._recalc()" /></td>
      <td><input type="number" class="form-control lv-applique" readonly style="width:100px" /></td>
      <td><input type="number" class="form-control lv-total" readonly style="width:110px" /></td>
      <td><button class="btn btn-icon btn-ghost" onclick="Ventes._removeLigne(this)">🗑️</button></td>`;
    body.appendChild(tr);
    _recalc();
  }

  function _removeLigne(btn) {
    btn.closest('tr').remove();
    _recalc();
  }

  function _recalc() {
    const rows = el('lignesVenteBody')?.querySelectorAll('.ligne-row') || [];
    let totalHT = 0;
    for (const row of rows) {
      const prix = parseFloat(row.querySelector('.lv-prix')?.value) || 0;
      const qte = parseFloat(row.querySelector('.lv-qte')?.value) || 0;
      const remise = parseFloat(row.querySelector('.lv-remise')?.value) || 0;
      const applique = prix * (1 - remise / 100);
      const total = applique * qte;
      const apEl = row.querySelector('.lv-applique');
      const totEl = row.querySelector('.lv-total');
      if (apEl) apEl.value = fmtNum(applique);
      if (totEl) totEl.value = fmtNum(total);
      totalHT += total;
    }
    const tva = calcTVA(totalHT);
    const ttc = totalHT + tva;
    const htEl = el('vTotalHT'); if (htEl) htEl.textContent = fmtCurrency(totalHT);
    const tvaEl = el('vTVA'); if (tvaEl) tvaEl.textContent = fmtCurrency(tva);
    const ttcEl = el('vTotalTTC'); if (ttcEl) ttcEl.textContent = fmtCurrency(ttc);
  }

  function _getLignesFromForm() {
    const rows = el('lignesVenteBody')?.querySelectorAll('.ligne-row') || [];
    return Array.from(rows).map(row => ({
      produit_id: row.querySelector('.lv-produit')?.value,
      quantite: parseFloat(row.querySelector('.lv-qte')?.value) || 0,
      prix_base_ht: parseFloat(row.querySelector('.lv-prix')?.value) || 0,
      remise: parseFloat(row.querySelector('.lv-remise')?.value) || 0,
      prix_applique_ht: parseFloat(row.querySelector('.lv-applique')?.value) || 0,
      total_ht: parseFloat(row.querySelector('.lv-total')?.value) || 0,
    })).filter(l => l.produit_id && l.quantite > 0 && l.prix_base_ht > 0);
  }

  async function _saveVente(existingId) {
    const date = el('vDate')?.value;
    const client_id = el('vClient')?.value;
    const paiement = el('vPaiement')?.value;
    const statut = el('vStatut')?.value;
    const lignesData = _getLignesFromForm();

    if (!date || !client_id) { toast('Date et client sont obligatoires', 'error'); return; }
    if (lignesData.length === 0) { toast('Ajoutez au moins une ligne de vente', 'error'); return; }

    const total_ht = lignesData.reduce((s, l) => s + l.total_ht, 0);
    const tva = calcTVA(total_ht);
    const total_ttc = total_ht + tva;

    const allVentes = await DB.getAll('ventes');
    const vente_id = existingId || seqId('V', allVentes);

    // Delete old lignes and mouvements if editing
    if (existingId) {
      const oldLignes = _lignes.filter(l => l.vente_id === existingId);
      for (const l of oldLignes) await DB.delete('lignes_ventes', l.id);
      const allMvs = await DB.getAll('mouvements');
      for (const m of allMvs.filter(m => m.reference === existingId)) await DB.delete('mouvements', m.id);
    }

    await DB.put('ventes', { id: vente_id, date, client_id, total_ht, tva, total_ttc, paiement, statut });

    // Save lignes & update stock
    for (let i = 0; i < lignesData.length; i++) {
      const l = lignesData[i];
      const lid = genId('VL');
      await DB.add('lignes_ventes', { id: lid, vente_id, ...l });
    }

    // Create/update facture
    const allFactures = await DB.getAll('factures');
    const existingFacture = allFactures.find(f => f.vente_id === vente_id);
    const facture_id = existingFacture?.id || seqId('F', allFactures);
    await DB.put('factures', {
      id: facture_id, vente_id, client_id, date,
      total_ht, tva, total_ttc,
      statut: paiement === 'Crédit' ? 'Impayée' : 'Payée',
    });

    await Clients.updateTotalAchats(client_id, total_ttc);
    await logAction(existingId ? 'Modification' : 'Création', `Vente ${vente_id} – Total: ${fmtCurrency(total_ttc)}`);
    toast(`Vente ${existingId ? 'modifiée' : 'créée'} avec succès`, 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function viewVente(id) {
    await load();
    const vente = _ventes.find(v => v.id === id);
    if (!vente) return;
    const clients = await DB.getAll('clients');
    const produits = await DB.getAll('produits');
    const client = clients.find(c => c.id === vente.client_id);
    const lignes = _lignes.filter(l => l.vente_id === id);
    const prodMap = Object.fromEntries(produits.map(p => [p.id, p]));

    const lignesHtml = lignes.map(l => `
      <tr>
        <td>${prodMap[l.produit_id]?.nom || l.produit_id}</td>
        <td class="text-center">${l.quantite}</td>
        <td class="text-right">${fmtCurrency(l.prix_base_ht)}</td>
        <td class="text-center">${l.remise || 0}%</td>
        <td class="text-right">${fmtCurrency(l.prix_applique_ht)}</td>
        <td class="text-right font-bold">${fmtCurrency(l.total_ht)}</td>
      </tr>`).join('');

    openModal(`Détails Vente ${id}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div><div class="form-label">Date</div><div>${fmtDate(vente.date)}</div></div>
        <div><div class="form-label">Client</div><div class="font-bold">${client?.nom || vente.client_id}</div></div>
        <div><div class="form-label">Statut</div><div>${statusBadge(vente.statut)}</div></div>
        <div><div class="form-label">Paiement</div><div>${vente.paiement || '—'}</div></div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Produit</th><th>Qté</th><th>Prix Base</th><th>Remise</th><th>P.Appliqué</th><th>Total HT</th></tr></thead>
          <tbody>${lignesHtml}</tbody>
        </table>
      </div>
      <div class="divider"></div>
      <div style="text-align:right;line-height:2">
        <div>Total HT : <span class="font-bold">${fmtCurrency(vente.total_ht)}</span></div>
        <div>TVA (18%) : ${fmtCurrency(vente.tva)}</div>
        <div style="font-size:16px">Total TTC : <span class="font-bold" style="color:var(--primary)">${fmtCurrency(vente.total_ttc)}</span></div>
      </div>`,
      { wide: true, noFooter: true }
    );
  }

  async function deleteVente(id) {
    confirmDialog(`Supprimer la vente <b>${id}</b> et toutes ses lignes ?`, async () => {
      const toDelete = _lignes.filter(l => l.vente_id === id);
      for (const l of toDelete) await DB.delete('lignes_ventes', l.id);
      await DB.delete('ventes', id);
      const allF = await DB.getAll('factures');
      const f = allF.find(x => x.vente_id === id);
      if (f) await DB.delete('factures', f.id);
      await logAction('Suppression', `Vente ${id}`);
      toast('Vente supprimée', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  async function exportData() {
    await load();
    exportCSV('ventes.csv', [
      { key: 'id', label: 'ID' }, { key: 'date', label: 'Date' },
      { key: 'client_id', label: 'Client ID' }, { key: 'total_ht', label: 'Total HT' },
      { key: 'tva', label: 'TVA' }, { key: 'total_ttc', label: 'Total TTC' },
      { key: 'paiement', label: 'Paiement' }, { key: 'statut', label: 'Statut' },
    ], _ventes);
  }

  return { render, load, getAll, createForm, editVente, viewVente, deleteVente, exportData, _onSearch, _onStatus, _addLigne, _removeLigne, _recalc };
})();
