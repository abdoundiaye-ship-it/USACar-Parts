/* ============================================================
   MODULE: Factures
   ============================================================ */

const Factures = (() => {
  let _all = [];
  let _query = '';
  let _statusFilter = '';

  async function load() { _all = await DB.getAll('factures'); }

  async function render(container) {
    await load();
    const clients = await DB.getAll('clients');
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

    let filtered = [..._all].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (_query) {
      const q = _query.toLowerCase();
      filtered = filtered.filter(f => f.id.toLowerCase().includes(q) || (clientMap[f.client_id]?.nom || '').toLowerCase().includes(q));
    }
    if (_statusFilter) filtered = filtered.filter(f => f.statut === _statusFilter);

    const totalImpaye = _all.filter(f => f.statut === 'Impayée').reduce((s, f) => s + (f.total_ttc || 0), 0);

    const tbl = buildTable([
      { key: 'id', label: 'N° Facture' },
      { key: 'date', label: 'Date', render: r => fmtDate(r.date) },
      { key: 'client', label: 'Client', render: r => clientMap[r.client_id]?.nom || r.client_id },
      { key: 'vente_id', label: 'N° Vente' },
      { key: 'total_ht', label: 'Total HT', align: 'right', render: r => fmtCurrency(r.total_ht) },
      { key: 'tva', label: 'TVA', align: 'right', render: r => fmtCurrency(r.tva) },
      { key: 'total_ttc', label: 'Total TTC', align: 'right', render: r => `<span class="font-bold">${fmtCurrency(r.total_ttc)}</span>` },
      { key: 'statut', label: 'Statut', render: r => statusBadge(r.statut || 'Impayée') },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Factures.printFacture('${r.vente_id}')" title="Imprimer">🖨️</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Factures.toggleStatut('${r.id}')" title="Changer statut">💳</button>
        </div>`
      },
    ], filtered, 'Aucune facture trouvée');

    container.innerHTML = `
      <div class="page-header">
        <h2>Factures</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Factures.exportData()">⬇️ Exporter</button>
        </div>
      </div>
      ${totalImpaye > 0 ? `
      <div class="card" style="margin-bottom:16px;padding:12px 20px;border-left:4px solid var(--danger)">
        <span style="color:var(--danger);font-weight:700">⚠️ Factures Impayées : <span style="font-size:16px">${fmtCurrency(totalImpaye)}</span></span>
      </div>` : ''}
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par N° ou client…" value="${_query}" oninput="Factures._onSearch(this.value)" />
          <select class="form-control" style="width:auto;min-width:150px" onchange="Factures._onStatus(this.value)">
            <option value="">Tous les statuts</option>
            <option value="Payée" ${_statusFilter === 'Payée' ? 'selected' : ''}>Payée</option>
            <option value="Impayée" ${_statusFilter === 'Impayée' ? 'selected' : ''}>Impayée</option>
          </select>
        </div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }
  function _onStatus(v) { _statusFilter = v; render(el('mainContent')); }

  async function toggleStatut(id) {
    const f = _all.find(x => x.id === id);
    if (!f) return;
    const newStatut = f.statut === 'Payée' ? 'Impayée' : 'Payée';
    await DB.put('factures', { ...f, statut: newStatut });
    await logAction('Mise à jour', `Facture ${id} → ${newStatut}`);
    toast(`Facture marquée comme ${newStatut}`, 'success');
    await load();
    render(el('mainContent'));
  }

  async function printFacture(venteId) {
    const ventes = await DB.getAll('ventes');
    const lignesVentes = await DB.getAll('lignes_ventes');
    const clients = await DB.getAll('clients');
    const produits = await DB.getAll('produits');
    const factures = await DB.getAll('factures');

    const vente = ventes.find(v => v.id === venteId);
    if (!vente) { toast('Vente introuvable', 'error'); return; }
    const client = clients.find(c => c.id === vente.client_id);
    const facture = factures.find(f => f.vente_id === venteId);
    const lignes = lignesVentes.filter(l => l.vente_id === venteId);
    const prodMap = Object.fromEntries(produits.map(p => [p.id, p]));

    const lignesHtml = lignes.map(l => `
      <tr>
        <td>${prodMap[l.produit_id]?.sku || ''}</td>
        <td>${prodMap[l.produit_id]?.nom || l.produit_id}</td>
        <td style="text-align:center">${l.quantite}</td>
        <td style="text-align:right">${fmtCurrency(l.prix_applique_ht)}</td>
        <td style="text-align:right">${l.remise ? l.remise + '%' : '—'}</td>
        <td style="text-align:right"><strong>${fmtCurrency(l.total_ht)}</strong></td>
      </tr>`).join('');

    const factureHtml = `
      <div class="facture-preview">
        <div class="facture-header">
          <div class="facture-logo">
            <img src="assets/logo.png" alt="Logo" />
            <div class="facture-company">USA PARTS AUTO</div>
            <div class="facture-company-sub">Pièces Détachées Automobiles<br>Dakar, Sénégal</div>
          </div>
          <div>
            <div class="facture-title">FACTURE</div>
            <div class="facture-num">N° ${facture?.id || 'F-XXXX'}</div>
            <div class="facture-num">Vente : ${venteId}</div>
            <div class="facture-num">Date : ${fmtDate(vente.date)}</div>
            <div style="margin-top:8px">${statusBadge(facture?.statut || 'Impayée')}</div>
          </div>
        </div>
        <div class="facture-addresses">
          <div class="facture-address-block">
            <label>Émetteur</label>
            <p><strong>USA PARTS AUTO</strong><br>Dakar, Sénégal<br>contact@usapartsauto.sn</p>
          </div>
          <div class="facture-address-block">
            <label>Facturé à</label>
            <p><strong>${client?.nom || '—'}</strong><br>${client?.adresse || ''}<br>${client?.telephone || ''}<br>${client?.email || ''}</p>
          </div>
        </div>
        <table class="facture-table">
          <thead>
            <tr><th>SKU</th><th>Description</th><th>Qté</th><th>P.U. HT</th><th>Remise</th><th>Total HT</th></tr>
          </thead>
          <tbody>${lignesHtml}</tbody>
        </table>
        <div class="facture-totals">
          <div class="facture-total-line"><span>Total HT</span><span>${fmtCurrency(vente.total_ht)}</span></div>
          <div class="facture-total-line"><span>TVA (18%)</span><span>${fmtCurrency(vente.tva)}</span></div>
          <div class="facture-total-line grand"><span>Total TTC</span><span>${fmtCurrency(vente.total_ttc)}</span></div>
        </div>
        <div style="margin-top:32px;font-size:12px;color:#64748b;border-top:1px solid #dde3ed;padding-top:16px">
          <p>Mode de paiement : ${vente.paiement || '—'} &nbsp;|&nbsp; Statut : ${facture?.statut || '—'}</p>
          <p style="margin-top:8px">Merci pour votre confiance. Pour toute question, contactez-nous.</p>
        </div>
      </div>`;

    openModal(`Facture ${facture?.id || venteId}`, factureHtml, {
      wide: true,
      confirmLabel: '🖨️ Imprimer',
      onConfirm: () => { closeModal(); printElement(factureHtml); },
      cancelLabel: 'Fermer',
    });
  }

  async function exportData() {
    await load();
    exportCSV('factures.csv', [
      { key: 'id', label: 'N° Facture' }, { key: 'date', label: 'Date' },
      { key: 'vente_id', label: 'N° Vente' }, { key: 'client_id', label: 'Client' },
      { key: 'total_ht', label: 'Total HT' }, { key: 'tva', label: 'TVA' },
      { key: 'total_ttc', label: 'Total TTC' }, { key: 'statut', label: 'Statut' },
    ], _all);
  }

  return { render, load, toggleStatut, printFacture, exportData, _onSearch, _onStatus };
})();
