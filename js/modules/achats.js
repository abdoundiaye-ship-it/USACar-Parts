/* ============================================================
   MODULE: Achats
   ============================================================ */

const TAUX_USD_CFA = 560;

const Achats = (() => {
  let _achats = [];
  let _lignes = [];
  let _query = '';

  async function load() {
    [_achats, _lignes] = await Promise.all([
      DB.getAll('achats'),
      DB.getAll('lignes_achats'),
    ]);
  }

  async function render(container) {
    await load();
    const fournisseurs = await DB.getAll('fournisseurs');
    const fMap = Object.fromEntries(fournisseurs.map(f => [f.id, f]));

    let filtered = [..._achats].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (_query) {
      const q = _query.toLowerCase();
      filtered = filtered.filter(a => a.id.toLowerCase().includes(q) || (fMap[a.fournisseur_id]?.nom || '').toLowerCase().includes(q));
    }

    const tbl = buildTable([
      { key: 'id', label: 'ID Achat' },
      { key: 'date', label: 'Date', render: r => fmtDate(r.date) },
      { key: 'fournisseur', label: 'Fournisseur', render: r => fMap[r.fournisseur_id]?.nom || r.fournisseur_id },
      { key: 'total', label: 'Total Marchandise', align: 'right', render: r => fmtUSD(r.total) },
      { key: 'autres_frais', label: 'Autres Frais', align: 'right', render: r => r.autres_frais ? fmtUSD(r.autres_frais) : '—' },
      { key: 'cout_total', label: 'Coût Total', align: 'right', render: r => `<span class="font-bold">${fmtUSD((r.total || 0) + (r.autres_frais || 0))}</span>` },
      { key: 'statut', label: 'Statut', render: r => statusBadge(r.statut || 'En attente') },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Achats.viewAchat('${r.id}')" title="Détails">👁️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Achats.editAchat('${r.id}')" title="Modifier">✏️</button>
          ${r.statut !== 'Reçu' ? `<button class="btn btn-sm btn-success btn-sm" onclick="Achats.markRecu('${r.id}')">✅ Réceptionner</button>` : ''}
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Achats.deleteAchat('${r.id}')">🗑️</button>
        </div>`
      },
    ], filtered, 'Aucun achat enregistré');

    container.innerHTML = `
      <div class="page-header">
        <h2>Achats</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Achats.exportData()">⬇️ Exporter</button>
          <button class="btn btn-primary" onclick="Achats.createForm()">+ Nouvel Achat</button>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par ID ou fournisseur…" value="${_query}" oninput="Achats._onSearch(this.value)" />
        </div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }

  function createForm() { _openForm(null); }
  async function editAchat(id) { await load(); _openForm(_achats.find(a => a.id === id)); }

  async function _openForm(achat) {
    const isNew = !achat;
    const fournisseurs = await DB.getAll('fournisseurs');
    const produits = (await DB.getAll('produits')).filter(p => p.actif);
    const lignes = achat ? _lignes.filter(l => l.achat_id === achat.id) : [];
    const fOpts = fournisseurs.map(f => `<option value="${f.id}" ${achat?.fournisseur_id === f.id ? 'selected' : ''}>${f.nom}</option>`).join('');

    let lignesRows = lignes.map((l, i) => _achatLigneTr(i, l, produits)).join('');
    if (!lignesRows) lignesRows = _achatLigneTr(0, null, produits);

    openModal(isNew ? 'Nouvel Achat' : `Modifier Achat ${achat.id}`, `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-control" id="aDate" value="${achat?.date || todayStr()}" />
        </div>
        <div class="form-group">
          <label class="form-label">Fournisseur *</label>
          <select class="form-control" id="aFournisseur">
            <option value="">-- Sélectionner --</option>
            ${fOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Autres Frais USD (Transport, Douane…)</label>
          <input type="number" class="form-control" id="aAutresFrais" step="0.01" min="0" value="${achat?.autres_frais || 0}" placeholder="0.00" oninput="Achats._recalcAchat()" />
        </div>
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-control" id="aStatut">
            <option value="En attente" ${!achat || achat.statut === 'En attente' ? 'selected' : ''}>En attente</option>
            <option value="Reçu" ${achat?.statut === 'Reçu' ? 'selected' : ''}>Reçu</option>
          </select>
        </div>
      </div>
      <div class="divider"></div>
      <div class="card-title" style="margin-bottom:10px">Lignes d'Achat</div>
      <div class="table-container">
        <table class="lignes-table">
          <thead><tr>
            <th>Produit</th><th>Qté</th><th>Prix Unit. USD</th><th>Total USD</th><th>Coût Revient/U $</th><th>Coût Revient/U CFA</th><th>P.Plafond TTC</th><th></th>
          </tr></thead>
          <tbody id="lignesAchatBody">${lignesRows}</tbody>
        </table>
      </div>
      <button class="btn btn-ghost btn-sm add-ligne-btn" onclick="Achats._addAchatLigne()">+ Ajouter une ligne</button>
      <div class="divider"></div>
      <div style="text-align:right;line-height:2">
        <div>Total Marchandise : <span id="aTotalMarch" class="font-bold">$0.00</span></div>
        <div>Autres Frais : <span id="aTotalFrais">$0.00</span></div>
        <div style="font-size:16px">Coût Total : <span id="aTotalCout" class="font-bold" style="color:var(--primary)">$0.00</span></div>
      </div>`,
      {
        wide: true,
        confirmLabel: isNew ? 'Créer' : 'Enregistrer',
        onConfirm: () => _saveAchat(achat?.id),
        onOpen: () => _recalcAchat(),
      }
    );
    _recalcAchat();
    el('lignesAchatBody').addEventListener('input', _recalcAchat);
  }

  function _achatLigneTr(i, ligne, produits) {
    const prodOpts = produits.map(p =>
      `<option value="${p.id}" ${ligne?.produit_id === p.id ? 'selected' : ''}>${p.sku} – ${p.nom}</option>`
    ).join('');
    return `
      <tr class="al-row">
        <td><select class="form-control al-produit" onchange="Achats._recalcAchat()"><option value="">--</option>${prodOpts}</select></td>
        <td><input type="number" class="form-control al-qte" value="${ligne?.quantite || 1}" min="1" style="width:60px" /></td>
        <td><input type="number" class="form-control al-prix" value="${ligne?.prix_unitaire || ''}" step="0.01" min="0" style="width:90px" placeholder="0.00" /></td>
        <td><input type="number" class="form-control al-total" readonly style="width:90px" /></td>
        <td><input type="number" class="form-control al-cout" readonly style="width:100px" title="Coût revient unitaire en USD" /></td>
        <td><input type="number" class="form-control al-cout-cfa" readonly style="width:110px" title="Coût revient unitaire en CFA (× 560)" /></td>
        <td><input type="number" class="form-control al-plafond" readonly style="width:100px" title="Prix Plafond TTC = coût × 2 × 1.18" /></td>
        <td><button class="btn btn-icon btn-ghost" onclick="Achats._removeAchatLigne(this)">🗑️</button></td>
      </tr>`;
  }

  let _alIdx = 100;
  async function _addAchatLigne() {
    const produits = (await DB.getAll('produits')).filter(p => p.actif);
    const body = el('lignesAchatBody');
    if (!body) return;
    const tr = document.createElement('tr');
    tr.className = 'al-row';
    const prodOpts = produits.map(p => `<option value="${p.id}">${p.sku} – ${p.nom}</option>`).join('');
    tr.innerHTML = `
      <td><select class="form-control al-produit" onchange="Achats._recalcAchat()"><option value="">--</option>${prodOpts}</select></td>
      <td><input type="number" class="form-control al-qte" value="1" min="1" style="width:60px" /></td>
      <td><input type="number" class="form-control al-prix" step="0.01" min="0" style="width:90px" placeholder="0.00" /></td>
      <td><input type="number" class="form-control al-total" readonly style="width:90px" /></td>
      <td><input type="number" class="form-control al-cout" readonly style="width:100px" /></td>
      <td><input type="number" class="form-control al-cout-cfa" readonly style="width:110px" /></td>
      <td><input type="number" class="form-control al-plafond" readonly style="width:100px" /></td>
      <td><button class="btn btn-icon btn-ghost" onclick="Achats._removeAchatLigne(this)">🗑️</button></td>`;
    body.appendChild(tr);
    _recalcAchat();
  }

  function _removeAchatLigne(btn) { btn.closest('tr').remove(); _recalcAchat(); }

  function _recalcAchat() {
    const autresFrais = parseFloat(el('aAutresFrais')?.value) || 0;
    const rows = el('lignesAchatBody')?.querySelectorAll('.al-row') || [];
    let totalMarch = 0;
    const rowData = [];
    for (const row of rows) {
      const qte = parseFloat(row.querySelector('.al-qte')?.value) || 0;
      const prix = parseFloat(row.querySelector('.al-prix')?.value) || 0;
      const total = qte * prix;
      totalMarch += total;
      rowData.push({ row, qte, prix, total });
    }
    for (const { row, qte, total } of rowData) {
      const fraction = totalMarch > 0 ? total / totalMarch : 0;
      const fraisAlloues = fraction * autresFrais;
      const coutTotal = total + fraisAlloues;
      const coutUnit = qte > 0 ? coutTotal / qte : 0;
      const coutUnitCFA = coutUnit * TAUX_USD_CFA;
      const plafond = coutUnit * 2 * 1.18;
      const totEl = row.querySelector('.al-total'); if (totEl) totEl.value = fmtNum(total);
      const coutEl = row.querySelector('.al-cout'); if (coutEl) coutEl.value = fmtNum(coutUnit);
      const coutCFAEl = row.querySelector('.al-cout-cfa'); if (coutCFAEl) coutCFAEl.value = fmtNum(coutUnitCFA, 0);
      const plafEl = row.querySelector('.al-plafond'); if (plafEl) plafEl.value = fmtNum(plafond);
    }
    const tm = el('aTotalMarch'); if (tm) tm.textContent = fmtUSD(totalMarch);
    const tf = el('aTotalFrais'); if (tf) tf.textContent = fmtUSD(autresFrais);
    const tc = el('aTotalCout'); if (tc) tc.textContent = fmtUSD(totalMarch + autresFrais);
  }

  function _getLignesAchatFromForm() {
    const autresFrais = parseFloat(el('aAutresFrais')?.value) || 0;
    const rows = el('lignesAchatBody')?.querySelectorAll('.al-row') || [];
    let totalMarch = 0;
    const raw = Array.from(rows).map(row => ({
      row,
      produit_id: row.querySelector('.al-produit')?.value,
      quantite: parseFloat(row.querySelector('.al-qte')?.value) || 0,
      prix_unitaire: parseFloat(row.querySelector('.al-prix')?.value) || 0,
    })).filter(l => l.produit_id && l.quantite > 0 && l.prix_unitaire > 0);
    raw.forEach(l => totalMarch += l.quantite * l.prix_unitaire);
    return raw.map(l => {
      const totalLigne = l.quantite * l.prix_unitaire;
      const fraction = totalMarch > 0 ? totalLigne / totalMarch : 0;
      const fraisAlloues = fraction * autresFrais;
      const coutTotal = totalLigne + fraisAlloues;
      const coutUnit = l.quantite > 0 ? coutTotal / l.quantite : 0;
      const coutUnitCFA = coutUnit * TAUX_USD_CFA;
      const plafond = coutUnit * 2 * 1.18;
      return {
        produit_id: l.produit_id, quantite: l.quantite,
        prix_unitaire: l.prix_unitaire, total: totalLigne,
        cout_revient_unitaire: coutUnit, cout_revient_total: coutTotal,
        cout_revient_unitaire_cfa: coutUnitCFA,
        prix_plafond_ttc: plafond,
      };
    });
  }

  async function _saveAchat(existingId) {
    const date = el('aDate')?.value;
    const fournisseur_id = el('aFournisseur')?.value;
    const autres_frais = parseFloat(el('aAutresFrais')?.value) || 0;
    const statut = el('aStatut')?.value;
    const lignesData = _getLignesAchatFromForm();

    if (!date || !fournisseur_id) { toast('Date et fournisseur sont obligatoires', 'error'); return; }
    if (lignesData.length === 0) { toast('Ajoutez au moins une ligne', 'error'); return; }

    const total = lignesData.reduce((s, l) => s + l.total, 0);
    const allAchats = await DB.getAll('achats');
    const achat_id = existingId || seqId('ACH', allAchats);

    if (existingId) {
      const oldL = _lignes.filter(l => l.achat_id === existingId);
      for (const l of oldL) await DB.delete('lignes_achats', l.id);
      const allMvs = await DB.getAll('mouvements');
      for (const m of allMvs.filter(m => m.reference === existingId)) await DB.delete('mouvements', m.id);
    }

    await DB.put('achats', { id: achat_id, date, fournisseur_id, total, autres_frais, statut });

    const allLignes = await DB.getAll('lignes_achats');
    for (let i = 0; i < lignesData.length; i++) {
      const l = lignesData[i];
      const lid = genId('AL');
      await DB.add('lignes_achats', { id: lid, achat_id, ...l });
    }

    await logAction(existingId ? 'Modification' : 'Création', `Achat ${achat_id} – Total: ${fmtUSD(total + autres_frais)}`);
    toast(`Achat ${existingId ? 'modifié' : 'créé'} avec succès`, 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function markRecu(id) {
    confirmDialog(`Marquer l'achat <b>${id}</b> comme Reçu et mettre à jour le stock ?`, async () => {
      const achat = _achats.find(a => a.id === id);
      if (!achat) return;
      await DB.put('achats', { ...achat, statut: 'Reçu' });
      await logAction('Réception', `Achat ${id} marqué comme Reçu`);
      toast('Achat réceptionné – stock mis à jour', 'success');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  async function viewAchat(id) {
    await load();
    const achat = _achats.find(a => a.id === id);
    if (!achat) return;
    const fournisseurs = await DB.getAll('fournisseurs');
    const produits = await DB.getAll('produits');
    const f = fournisseurs.find(x => x.id === achat.fournisseur_id);
    const prodMap = Object.fromEntries(produits.map(p => [p.id, p]));
    const lignes = _lignes.filter(l => l.achat_id === id);

    const lignesHtml = lignes.map(l => `
      <tr>
        <td>${prodMap[l.produit_id]?.nom || l.produit_id}</td>
        <td class="text-center">${l.quantite}</td>
        <td class="text-right">${fmtUSD(l.prix_unitaire)}</td>
        <td class="text-right">${fmtUSD(l.total)}</td>
        <td class="text-right font-bold">${fmtUSD(l.cout_revient_unitaire)}</td>
        <td class="text-right">${fmtUSD(l.prix_plafond_ttc)}</td>
      </tr>`).join('');

    openModal(`Détails Achat ${id}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div><div class="form-label">Date</div><div>${fmtDate(achat.date)}</div></div>
        <div><div class="form-label">Fournisseur</div><div class="font-bold">${f?.nom || achat.fournisseur_id}</div></div>
        <div><div class="form-label">Statut</div><div>${statusBadge(achat.statut || 'En attente')}</div></div>
        <div><div class="form-label">Autres Frais</div><div>${fmtUSD(achat.autres_frais || 0)}</div></div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Produit</th><th>Qté</th><th>P.U.</th><th>Total</th><th>Coût Revient/U</th><th>Prix Plafond TTC</th></tr></thead>
          <tbody>${lignesHtml}</tbody>
        </table>
      </div>
      <div class="divider"></div>
      <div style="text-align:right;line-height:2">
        <div>Total Marchandise : <span class="font-bold">${fmtUSD(achat.total)}</span></div>
        <div>Autres Frais : ${fmtUSD(achat.autres_frais || 0)}</div>
        <div style="font-size:16px">Coût Total : <span class="font-bold" style="color:var(--primary)">${fmtUSD((achat.total || 0) + (achat.autres_frais || 0))}</span></div>
      </div>`,
      { wide: true, noFooter: true }
    );
  }

  async function deleteAchat(id) {
    confirmDialog(`Supprimer l'achat <b>${id}</b> ?`, async () => {
      const toDelete = _lignes.filter(l => l.achat_id === id);
      for (const l of toDelete) await DB.delete('lignes_achats', l.id);
      await DB.delete('achats', id);
      toast('Achat supprimé', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  async function exportData() {
    await load();
    exportCSV('achats.csv', [
      { key: 'id', label: 'ID' }, { key: 'date', label: 'Date' },
      { key: 'fournisseur_id', label: 'Fournisseur' }, { key: 'total', label: 'Total' },
      { key: 'autres_frais', label: 'Autres Frais' }, { key: 'statut', label: 'Statut' },
    ], _achats);
  }

  return { render, load, createForm, editAchat, viewAchat, markRecu, deleteAchat, exportData, _onSearch, _addAchatLigne, _removeAchatLigne, _recalcAchat };
})();
