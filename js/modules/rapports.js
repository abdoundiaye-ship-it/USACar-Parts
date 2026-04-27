/* ============================================================
   MODULE: Rapports — Reporting & Analytics
   5 onglets : Ventes · Achats · Stock · Marges · Clients
   ============================================================ */

const Rapports = (() => {

  let _tab = 'ventes';

  /* ── Shared filter state per tab ── */
  const _f = {
    ventes:  { dateFrom: '', dateTo: '', clientId: '',       categorie: '' },
    achats:  { dateFrom: '', dateTo: '', fournisseurId: ''                 },
    stock:   { categorie: '', statut: ''                                    },
    marges:  { dateFrom: '', dateTo: '', categorie: ''                     },
    clients: { clientId: ''                                                 },
  };

  /* ── Helpers ── */
  const _num  = (v, d = 0) => (v == null || isNaN(v)) ? d : +v;
  const _inRange = (dateStr, from, to) => {
    if (!dateStr) return true;
    if (from && dateStr < from) return false;
    if (to   && dateStr > to  ) return false;
    return true;
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER — shell + tabs
  ═══════════════════════════════════════════════════════════ */
  async function render(container) {
    const tabs = [
      { id: 'ventes',  label: '🛒 Ventes'    },
      { id: 'achats',  label: '📦 Achats'    },
      { id: 'stock',   label: '📋 Stock'     },
      { id: 'marges',  label: '📈 Marges'    },
      { id: 'clients', label: '👥 Clients'   },
    ];

    const tabsHtml = tabs.map(t =>
      `<button class="tab-btn ${_tab === t.id ? 'active' : ''}" onclick="Rapports._setTab('${t.id}')">${t.label}</button>`
    ).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2>Rapports</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Rapports._printCurrent()">🖨️ Imprimer</button>
          <button class="btn btn-ghost btn-sm" onclick="Rapports._exportCurrent()">⬇️ CSV</button>
        </div>
      </div>
      <div class="tabs">${tabsHtml}</div>
      <div id="rapportContent"></div>`;

    await _renderTab(document.getElementById('rapportContent'));
  }

  async function _setTab(id) {
    _tab = id;
    const container = el('rapportContent');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(id) || b.onclick?.toString().includes(`'${id}'`)));
    await _renderTab(container);
  }

  async function _renderTab(container) {
    switch (_tab) {
      case 'ventes':  await _renderVentes(container);  break;
      case 'achats':  await _renderAchats(container);  break;
      case 'stock':   await _renderStock(container);   break;
      case 'marges':  await _renderMarges(container);  break;
      case 'clients': await _renderClients(container); break;
    }
  }

  /* ── Filter bar builder ── */
  function _filterBar(fields, onApply) {
    const parts = fields.map(f => {
      if (f.type === 'date') return `
        <div class="form-group" style="flex:1;min-width:130px">
          <label class="form-label">${f.label}</label>
          <input type="date" class="form-control" id="rf_${f.id}" value="${f.value || ''}" />
        </div>`;
      if (f.type === 'select') return `
        <div class="form-group" style="flex:1;min-width:160px">
          <label class="form-label">${f.label}</label>
          <select class="form-control" id="rf_${f.id}">
            <option value="">— Tous —</option>
            ${f.options.map(o => `<option value="${o.v}" ${o.v === f.value ? 'selected' : ''}>${o.l}</option>`).join('')}
          </select>
        </div>`;
      return '';
    }).join('');

    return `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          ${parts}
          <div class="form-group" style="align-self:flex-end">
            <button class="btn btn-primary" onclick="${onApply}">🔍 Filtrer</button>
            <button class="btn btn-ghost" style="margin-left:6px" onclick="Rapports._resetFilter()">✕ Reset</button>
          </div>
        </div>
      </div>`;
  }

  function _resetFilter() { Object.keys(_f[_tab]).forEach(k => _f[_tab][k] = ''); _setTab(_tab); }

  function _readFilters(fields) {
    fields.forEach(f => { const e = el(`rf_${f.id}`); if (e) _f[_tab][f.id] = e.value; });
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 1 — VENTES
  ═══════════════════════════════════════════════════════════ */
  async function _renderVentes(container) {
    const [ventes, lignesVentes, clients, produits] = await Promise.all([
      DB.getAll('ventes'), DB.getAll('lignes_ventes'),
      DB.getAll('clients'), DB.getAll('produits'),
    ]);
    const clientMap  = Object.fromEntries(clients.map(c => [c.id, c]));
    const produitMap = Object.fromEntries(produits.map(p => [p.id, p]));
    const f = _f.ventes;

    const clientOpts = clients.map(c => ({ v: c.id, l: c.nom }));
    const catOpts    = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort().map(c => ({ v: c, l: c }));

    // Filter ventes
    let filteredV = ventes.filter(v =>
      _inRange(v.date, f.dateFrom, f.dateTo) &&
      (!f.clientId || v.client_id === f.clientId)
    );

    // If category filter: only keep ventes that have at least one ligne in that category
    if (f.categorie) {
      const venteIds = new Set(
        lignesVentes
          .filter(l => produitMap[l.produit_id]?.categorie === f.categorie)
          .map(l => l.vente_id)
      );
      filteredV = filteredV.filter(v => venteIds.has(v.id));
    }

    filteredV.sort((a, b) => b.date.localeCompare(a.date));

    const totalHT  = filteredV.reduce((s, v) => s + _num(v.total_ht), 0);
    const totalTTC = filteredV.reduce((s, v) => s + _num(v.total_ttc), 0);
    const totalTVA = filteredV.reduce((s, v) => s + _num(v.tva), 0);
    const ticket   = filteredV.length ? totalTTC / filteredV.length : 0;

    const rows = filteredV.map(v => {
      const client  = clientMap[v.client_id];
      const nbLigne = lignesVentes.filter(l => l.vente_id === v.id).length;
      return `<tr>
        <td><span class="font-bold" style="color:var(--primary)">${v.id}</span></td>
        <td>${fmtDate(v.date)}</td>
        <td>${client?.nom || v.client_id}</td>
        <td class="text-center">${nbLigne}</td>
        <td class="text-right">${fmtCurrency(v.total_ht)}</td>
        <td class="text-right">${fmtCurrency(v.tva)}</td>
        <td class="text-right font-bold">${fmtCurrency(v.total_ttc)}</td>
        <td>${statusBadge(v.statut)}</td>
        <td>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Factures.printFacture('${v.id}')" title="Imprimer facture">🖨️</button>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="9" class="text-center text-muted" style="padding:24px">Aucune vente pour ces critères</td></tr>`;

    container.innerHTML = `
      ${_filterBar([
        { id:'dateFrom', type:'date',   label:'Du',         value:f.dateFrom },
        { id:'dateTo',   type:'date',   label:'Au',         value:f.dateTo   },
        { id:'clientId', type:'select', label:'Client',     value:f.clientId,    options:clientOpts },
        { id:'categorie',type:'select', label:'Catégorie',  value:f.categorie,   options:catOpts    },
      ], "Rapports._applyVentes()")}
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="kpi-card blue">  <div class="kpi-icon">🛒</div><div class="kpi-label">Nb Ventes</div><div class="kpi-value">${filteredV.length}</div></div>
        <div class="kpi-card green"> <div class="kpi-icon">💵</div><div class="kpi-label">CA HT</div>    <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalHT)}</div></div>
        <div class="kpi-card blue">  <div class="kpi-icon">🧾</div><div class="kpi-label">CA TTC</div>   <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalTTC)}</div></div>
        <div class="kpi-card orange"><div class="kpi-icon">🎫</div><div class="kpi-label">Ticket Moyen</div><div class="kpi-value" style="font-size:18px">${fmtCurrency(ticket)}</div></div>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr><th>N° Vente</th><th>Date</th><th>Client</th><th>Lignes</th><th>Total HT</th><th>TVA</th><th>Total TTC</th><th>Statut</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot style="background:var(--surface2)">
              <tr>
                <td colspan="4" class="font-bold" style="padding:10px 14px">TOTAL (${filteredV.length} vente(s))</td>
                <td class="text-right font-bold" style="padding:10px 14px">${fmtCurrency(totalHT)}</td>
                <td class="text-right" style="padding:10px 14px">${fmtCurrency(totalTVA)}</td>
                <td class="text-right font-bold" style="padding:10px 14px;color:var(--primary)">${fmtCurrency(totalTTC)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>`;

    Rapports._currentData = { title: 'Rapport Ventes', rows: filteredV, cols: [
      {key:'id',label:'N° Vente'},{key:'date',label:'Date'},{key:'client_id',label:'Client'},
      {key:'total_ht',label:'Total HT'},{key:'tva',label:'TVA'},{key:'total_ttc',label:'Total TTC'},{key:'statut',label:'Statut'}
    ]};
  }

  function _applyVentes() {
    _readFilters([{id:'dateFrom'},{id:'dateTo'},{id:'clientId'},{id:'categorie'}]);
    _setTab('ventes');
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 2 — ACHATS
  ═══════════════════════════════════════════════════════════ */
  async function _renderAchats(container) {
    const [achats, lignesAchats, fournisseurs] = await Promise.all([
      DB.getAll('achats'), DB.getAll('lignes_achats'), DB.getAll('fournisseurs'),
    ]);
    const fMap = Object.fromEntries(fournisseurs.map(f => [f.id, f]));
    const f = _f.achats;

    const fOpts = fournisseurs.map(x => ({ v: x.id, l: x.nom }));

    let filteredA = achats.filter(a =>
      _inRange(a.date, f.dateFrom, f.dateTo) &&
      (!f.fournisseurId || a.fournisseur_id === f.fournisseurId)
    ).sort((a, b) => b.date.localeCompare(a.date));

    const totalMarch = filteredA.reduce((s, a) => s + _num(a.total), 0);
    const totalFrais = filteredA.reduce((s, a) => s + _num(a.autres_frais), 0);
    const totalCout  = totalMarch + totalFrais;

    const rows = filteredA.map(a => {
      const fourn   = fMap[a.fournisseur_id];
      const nbLigne = lignesAchats.filter(l => l.achat_id === a.id).length;
      const cout    = _num(a.total) + _num(a.autres_frais);
      return `<tr>
        <td><span class="font-bold" style="color:var(--primary)">${a.id}</span></td>
        <td>${fmtDate(a.date)}</td>
        <td>${fourn?.nom || a.fournisseur_id}</td>
        <td class="text-center">${nbLigne}</td>
        <td class="text-right">${fmtUSD(a.total)}</td>
        <td class="text-right">${a.autres_frais ? fmtUSD(a.autres_frais) : '—'}</td>
        <td class="text-right font-bold">${fmtUSD(cout)}</td>
        <td>${statusBadge(a.statut || 'En attente')}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="8" class="text-center text-muted" style="padding:24px">Aucun achat pour ces critères</td></tr>`;

    container.innerHTML = `
      ${_filterBar([
        { id:'dateFrom',      type:'date',   label:'Du',           value:f.dateFrom },
        { id:'dateTo',        type:'date',   label:'Au',           value:f.dateTo   },
        { id:'fournisseurId', type:'select', label:'Fournisseur',  value:f.fournisseurId, options:fOpts },
      ], "Rapports._applyAchats()")}
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="kpi-card blue">  <div class="kpi-icon">📦</div><div class="kpi-label">Nb Achats</div>         <div class="kpi-value">${filteredA.length}</div></div>
        <div class="kpi-card green"> <div class="kpi-icon">🛍️</div><div class="kpi-label">Total Marchandise</div><div class="kpi-value" style="font-size:18px">${fmtUSD(totalMarch)}</div></div>
        <div class="kpi-card orange"><div class="kpi-icon">✈️</div><div class="kpi-label">Frais (Transport…)</div><div class="kpi-value" style="font-size:18px">${fmtUSD(totalFrais)}</div></div>
        <div class="kpi-card red">   <div class="kpi-icon">💰</div><div class="kpi-label">Coût Total</div>        <div class="kpi-value" style="font-size:18px">${fmtUSD(totalCout)}</div></div>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr><th>N° Achat</th><th>Date</th><th>Fournisseur</th><th>Lignes</th><th>Marchandise</th><th>Frais</th><th>Coût Total</th><th>Statut</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot style="background:var(--surface2)">
              <tr>
                <td colspan="4" class="font-bold" style="padding:10px 14px">TOTAL (${filteredA.length})</td>
                <td class="text-right font-bold" style="padding:10px 14px">${fmtUSD(totalMarch)}</td>
                <td class="text-right" style="padding:10px 14px">${fmtUSD(totalFrais)}</td>
                <td class="text-right font-bold" style="padding:10px 14px;color:var(--primary)">${fmtUSD(totalCout)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>`;

    Rapports._currentData = { title: 'Rapport Achats', rows: filteredA, cols: [
      {key:'id',label:'N° Achat'},{key:'date',label:'Date'},{key:'fournisseur_id',label:'Fournisseur'},
      {key:'total',label:'Marchandise USD'},{key:'autres_frais',label:'Frais USD'},{key:'statut',label:'Statut'}
    ]};
  }

  function _applyAchats() {
    _readFilters([{id:'dateFrom'},{id:'dateTo'},{id:'fournisseurId'}]);
    _setTab('achats');
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 3 — STOCK
  ═══════════════════════════════════════════════════════════ */
  async function _renderStock(container) {
    await Stocks.load();
    const produits = await DB.getAll('produits');
    const stockData = Stocks.computeStocks();
    const f = _f.stock;
    const catOpts = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort().map(c => ({ v: c, l: c }));
    const statutOpts = [{ v:'en_stock', l:'En stock' }, { v:'faible', l:'Stock faible (≤ 5)' }, { v:'rupture', l:'Rupture (= 0)' }];

    let filtered = stockData.filter(s => {
      if (f.categorie && s.produit.categorie !== f.categorie) return false;
      if (f.statut === 'en_stock' && s.actuel <= 0)  return false;
      if (f.statut === 'faible'   && s.actuel > 5)   return false;
      if (f.statut === 'rupture'  && s.actuel !== 0)  return false;
      return true;
    });

    filtered.sort((a, b) => a.actuel - b.actuel); // ruptures en premier

    const totalValeur   = filtered.reduce((s, x) => s + (x.actuel > 0 ? x.valeur : 0), 0);
    const nbEnStock     = filtered.filter(s => s.actuel > 0).length;
    const nbRupture     = filtered.filter(s => s.actuel <= 0).length;
    const nbFaible      = filtered.filter(s => s.actuel > 0 && s.actuel <= 5).length;

    const rows = filtered.map(s => {
      const statCls = s.actuel <= 0 ? 'badge-danger' : s.actuel <= 5 ? 'badge-warning' : 'badge-success';
      const valRow  = s.actuel > 0 ? fmtUSD(s.valeur) : '<span class="text-muted">—</span>';
      return `<tr>
        <td><code style="font-size:12px;background:var(--surface2);padding:2px 6px;border-radius:4px">${s.produit.sku}</code></td>
        <td>${s.produit.nom}</td>
        <td><span class="badge badge-primary">${s.produit.categorie}</span></td>
        <td class="text-center">${s.entree}</td>
        <td class="text-center">${s.sortie}</td>
        <td class="text-center"><span class="badge ${statCls} font-bold">${s.actuel}</span></td>
        <td class="text-right">${valRow}</td>
        <td>${s.actuel <= 0 ? '<span class="badge badge-danger">Rupture</span>' : s.actuel <= 5 ? '<span class="badge badge-warning">Faible</span>' : '<span class="badge badge-success">OK</span>'}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="8" class="text-center text-muted" style="padding:24px">Aucun résultat</td></tr>`;

    container.innerHTML = `
      ${_filterBar([
        { id:'categorie', type:'select', label:'Catégorie',   value:f.categorie, options:catOpts    },
        { id:'statut',    type:'select', label:'Statut Stock', value:f.statut,    options:statutOpts },
      ], "Rapports._applyStock()")}
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="kpi-card blue">  <div class="kpi-icon">📦</div><div class="kpi-label">Total Produits</div><div class="kpi-value">${filtered.length}</div></div>
        <div class="kpi-card green"> <div class="kpi-icon">✅</div><div class="kpi-label">En Stock</div>      <div class="kpi-value">${nbEnStock}</div></div>
        <div class="kpi-card orange"><div class="kpi-icon">⚠️</div><div class="kpi-label">Stock Faible</div> <div class="kpi-value">${nbFaible}</div></div>
        <div class="kpi-card red">   <div class="kpi-icon">🚫</div><div class="kpi-label">Ruptures</div>     <div class="kpi-value">${nbRupture}</div></div>
      </div>
      <div class="card" style="margin-bottom:12px;padding:12px 20px">
        <span class="text-muted" style="font-size:12px">VALEUR TOTALE DU STOCK (coût revient)</span>
        <span class="font-bold" style="font-size:20px;margin-left:16px;color:var(--primary)">${fmtUSD(totalValeur)}</span>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr><th>SKU</th><th>Produit</th><th>Catégorie</th><th>Entrées</th><th>Sorties</th><th>Stock Actuel</th><th>Valeur Stock</th><th>Alerte</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    Rapports._currentData = { title: 'Rapport Stock', rows: filtered.map(s => ({
      sku: s.produit.sku, nom: s.produit.nom, categorie: s.produit.categorie,
      entree: s.entree, sortie: s.sortie, actuel: s.actuel, valeur: s.valeur,
    })), cols: [
      {key:'sku',label:'SKU'},{key:'nom',label:'Produit'},{key:'categorie',label:'Catégorie'},
      {key:'entree',label:'Entrées'},{key:'sortie',label:'Sorties'},{key:'actuel',label:'Stock Actuel'},{key:'valeur',label:'Valeur'}
    ]};
  }

  function _applyStock() {
    _readFilters([{id:'categorie'},{id:'statut'}]);
    _setTab('stock');
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 4 — MARGES (par produit)
  ═══════════════════════════════════════════════════════════ */
  async function _renderMarges(container) {
    const [lignesVentes, lignesAchats, produits, ventes] = await Promise.all([
      DB.getAll('lignes_ventes'), DB.getAll('lignes_achats'),
      DB.getAll('produits'),     DB.getAll('ventes'),
    ]);
    const prodMap  = Object.fromEntries(produits.map(p => [p.id, p]));
    const venteMap = Object.fromEntries(ventes.map(v => [v.id, v]));
    const f = _f.marges;
    const catOpts = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort().map(c => ({ v: c, l: c }));

    // Latest coût revient per produit from lignes_achats
    const coutMap = {};
    for (const la of lignesAchats) {
      if (la.cout_revient_unitaire) coutMap[la.produit_id] = _num(la.cout_revient_unitaire);
    }

    // Aggregate lignes_ventes filtered by date + category
    const agg = {}; // produit_id → { nom, cat, qteVendue, caHT, coutTotal, marge }
    for (const lv of lignesVentes) {
      const vente = venteMap[lv.vente_id];
      if (!vente) continue;
      if (!_inRange(vente.date, f.dateFrom, f.dateTo)) continue;
      const prod = prodMap[lv.produit_id];
      if (!prod) continue;
      if (f.categorie && prod.categorie !== f.categorie) continue;

      if (!agg[lv.produit_id]) {
        agg[lv.produit_id] = { sku: prod.sku, nom: prod.nom, cat: prod.categorie, qte: 0, caHT: 0 };
      }
      agg[lv.produit_id].qte  += _num(lv.quantite);
      agg[lv.produit_id].caHT += _num(lv.total_ht);
    }

    const lines = Object.entries(agg).map(([pid, a]) => {
      const cout     = _num(coutMap[pid], 0);
      const coutTot  = cout * a.qte;
      const marge    = a.caHT - coutTot;
      const tauxMarge = a.caHT > 0 ? marge / a.caHT : 0;
      return { ...a, cout, coutTot, marge, tauxMarge };
    }).sort((a, b) => b.marge - a.marge);

    const totalCA    = lines.reduce((s, l) => s + l.caHT, 0);
    const totalCout  = lines.reduce((s, l) => s + l.coutTot, 0);
    const totalMarge = lines.reduce((s, l) => s + l.marge, 0);
    const tauxGlobal = totalCA > 0 ? totalMarge / totalCA : 0;

    const rows = lines.map(l => {
      const cls = l.tauxMarge >= 0.3 ? 'text-success' : l.tauxMarge >= 0.1 ? 'text-warning' : 'text-danger';
      return `<tr>
        <td><code style="font-size:12px;background:var(--surface2);padding:2px 6px;border-radius:4px">${l.sku}</code></td>
        <td>${l.nom}</td>
        <td><span class="badge badge-primary">${l.cat}</span></td>
        <td class="text-center">${l.qte}</td>
        <td class="text-right">${fmtCurrency(l.caHT)}</td>
        <td class="text-right">${l.cout > 0 ? fmtCurrency(l.cout) : '<span class="text-muted">—</span>'}</td>
        <td class="text-right">${l.coutTot > 0 ? fmtCurrency(l.coutTot) : '<span class="text-muted">—</span>'}</td>
        <td class="text-right font-bold ${cls}">${fmtCurrency(l.marge)}</td>
        <td class="text-right font-bold ${cls}">${pct(l.tauxMarge)}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="9" class="text-center text-muted" style="padding:24px">Aucune vente pour ces critères</td></tr>`;

    const tauxCls = tauxGlobal >= 0.3 ? 'green' : tauxGlobal >= 0.1 ? 'orange' : 'red';

    container.innerHTML = `
      ${_filterBar([
        { id:'dateFrom',  type:'date',   label:'Du',        value:f.dateFrom },
        { id:'dateTo',    type:'date',   label:'Au',        value:f.dateTo   },
        { id:'categorie', type:'select', label:'Catégorie', value:f.categorie, options:catOpts },
      ], "Rapports._applyMarges()")}
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="kpi-card blue">    <div class="kpi-icon">💵</div><div class="kpi-label">CA HT Total</div>      <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalCA)}</div></div>
        <div class="kpi-card red">     <div class="kpi-icon">🛒</div><div class="kpi-label">Coût Revient Total</div><div class="kpi-value" style="font-size:18px">${fmtCurrency(totalCout)}</div></div>
        <div class="kpi-card green">   <div class="kpi-icon">📈</div><div class="kpi-label">Marge Brute</div>      <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalMarge)}</div></div>
        <div class="kpi-card ${tauxCls}"><div class="kpi-icon">%</div><div class="kpi-label">Taux de Marge</div>  <div class="kpi-value">${pct(tauxGlobal)}</div></div>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr><th>SKU</th><th>Produit</th><th>Catégorie</th><th>Qté Vendue</th><th>CA HT</th><th>Coût/U</th><th>Coût Total</th><th>Marge Brute</th><th>Taux</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot style="background:var(--surface2)">
              <tr>
                <td colspan="4" class="font-bold" style="padding:10px 14px">TOTAL (${lines.length} produit(s))</td>
                <td class="text-right font-bold" style="padding:10px 14px">${fmtCurrency(totalCA)}</td>
                <td></td>
                <td class="text-right font-bold" style="padding:10px 14px">${fmtCurrency(totalCout)}</td>
                <td class="text-right font-bold" style="padding:10px 14px;color:var(--success)">${fmtCurrency(totalMarge)}</td>
                <td class="text-right font-bold" style="padding:10px 14px">${pct(tauxGlobal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>`;

    Rapports._currentData = { title: 'Rapport Marges', rows: lines, cols: [
      {key:'sku',label:'SKU'},{key:'nom',label:'Produit'},{key:'cat',label:'Catégorie'},
      {key:'qte',label:'Qté Vendue'},{key:'caHT',label:'CA HT'},{key:'cout',label:'Coût/U'},
      {key:'coutTot',label:'Coût Total'},{key:'marge',label:'Marge Brute'},{key:'tauxMarge',label:'Taux Marge'}
    ]};
  }

  function _applyMarges() {
    _readFilters([{id:'dateFrom'},{id:'dateTo'},{id:'categorie'}]);
    _setTab('marges');
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 5 — CLIENTS
  ═══════════════════════════════════════════════════════════ */
  async function _renderClients(container) {
    const [clients, ventes, factures, paiements] = await Promise.all([
      DB.getAll('clients'), DB.getAll('ventes'),
      DB.getAll('factures'), DB.getAll('paiements'),
    ]);
    const f = _f.clients;
    const clientOpts = clients.map(c => ({ v: c.id, l: c.nom }));

    const filtered = clients.filter(c => !f.clientId || c.id === f.clientId);

    const rows = filtered.map(c => {
      const clientVentes   = ventes.filter(v => v.client_id === c.id);
      const clientFactures = factures.filter(fac => fac.client_id === c.id);
      const nbVentes       = clientVentes.length;
      const caHT           = clientVentes.reduce((s, v) => s + _num(v.total_ht), 0);
      const caTTC          = clientVentes.reduce((s, v) => s + _num(v.total_ttc), 0);
      const nbImpayees     = clientFactures.filter(fac => fac.statut === 'Impayée').length;
      const montantImapye  = clientFactures.filter(fac => fac.statut === 'Impayée').reduce((s, fac) => s + _num(fac.total_ttc), 0);
      const credit         = _num(c.credit);
      const lastVente      = clientVentes.sort((a, b) => b.date.localeCompare(a.date))[0];

      return `<tr>
        <td class="font-bold" style="color:var(--primary)">${c.id}</td>
        <td class="font-bold">${c.nom}</td>
        <td>${c.telephone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td class="text-center">${nbVentes}</td>
        <td class="text-right">${fmtCurrency(caHT)}</td>
        <td class="text-right font-bold">${fmtCurrency(caTTC)}</td>
        <td class="text-center">${lastVente ? fmtDate(lastVente.date) : '—'}</td>
        <td class="text-right">${nbImpayees > 0 ? `<span class="badge badge-danger">${nbImpayees} (${fmtCurrency(montantImapye)})</span>` : '<span class="text-muted">—</span>'}</td>
        <td class="text-right">${credit > 0 ? `<span class="text-danger font-bold">${fmtCurrency(credit)}</span>` : '<span class="text-muted">—</span>'}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="10" class="text-center text-muted" style="padding:24px">Aucun client</td></tr>`;

    const totalCA      = filtered.reduce((s, c) => s + _num(c.total_achats), 0);
    const totalCredit  = filtered.reduce((s, c) => s + _num(c.credit), 0);
    const nbActifs     = filtered.filter(c => ventes.some(v => v.client_id === c.id)).length;

    container.innerHTML = `
      ${_filterBar([
        { id:'clientId', type:'select', label:'Client', value:f.clientId, options:clientOpts },
      ], "Rapports._applyClients()")}
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="kpi-card blue">  <div class="kpi-icon">👥</div><div class="kpi-label">Total Clients</div>   <div class="kpi-value">${filtered.length}</div></div>
        <div class="kpi-card green"> <div class="kpi-icon">🏃</div><div class="kpi-label">Clients Actifs</div>  <div class="kpi-value">${nbActifs}</div></div>
        <div class="kpi-card blue">  <div class="kpi-icon">💵</div><div class="kpi-label">CA Total TTC</div>    <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalCA)}</div></div>
        <div class="kpi-card red">   <div class="kpi-icon">⚠️</div><div class="kpi-label">Total Crédits Dûs</div><div class="kpi-value" style="font-size:18px">${fmtCurrency(totalCredit)}</div></div>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr><th>ID</th><th>Nom</th><th>Téléphone</th><th>Email</th><th>Nb Ventes</th><th>CA HT</th><th>CA TTC</th><th>Dernière Vente</th><th>Factures Impayées</th><th>Crédit Dû</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    Rapports._currentData = { title: 'Rapport Clients', rows: filtered, cols: [
      {key:'id',label:'ID'},{key:'nom',label:'Nom'},{key:'telephone',label:'Téléphone'},
      {key:'email',label:'Email'},{key:'total_achats',label:'CA TTC'},{key:'credit',label:'Crédit Dû'}
    ]};
  }

  function _applyClients() {
    _readFilters([{id:'clientId'}]);
    _setTab('clients');
  }

  /* ═══════════════════════════════════════════════════════════
     PRINT CURRENT REPORT
  ═══════════════════════════════════════════════════════════ */
  function _printCurrent() {
    const content = document.getElementById('rapportContent');
    if (!content) return;

    const tabLabels = { ventes:'Ventes', achats:'Achats', stock:'Stock', marges:'Marges', clients:'Clients' };
    const title = `Rapport ${tabLabels[_tab] || _tab}`;
    const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

    // Clone the report content, strip action buttons
    const clone = content.cloneNode(true);
    clone.querySelectorAll('button, .btn, input, select').forEach(e => e.remove());
    clone.querySelectorAll('.form-group').forEach(e => e.remove());

    const html = `
      <div class="rapport-print">
        <div class="rapport-print-header">
          <div>
            <div style="font-size:22px;font-weight:800;color:#1a3a5c">USA PARTS AUTO</div>
            <div style="font-size:12px;color:#64748b">Pièces Détachées Automobiles · Dakar, Sénégal</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:700;color:#1a3a5c">${title}</div>
            <div style="font-size:12px;color:#64748b">Généré le ${today}</div>
          </div>
        </div>
        <hr style="border:none;border-top:2px solid #1a3a5c;margin:12px 0 20px" />
        ${clone.innerHTML}
        <div style="margin-top:32px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px">
          USA PARTS AUTO ERP — ${title} — ${today}
        </div>
      </div>`;

    printElement(html);
  }

  /* ═══════════════════════════════════════════════════════════
     EXPORT CSV
  ═══════════════════════════════════════════════════════════ */
  function _exportCurrent() {
    const d = Rapports._currentData;
    if (!d || !d.rows || !d.rows.length) { toast('Aucune donnée à exporter', 'warning'); return; }
    const tabLabels = { ventes:'ventes', achats:'achats', stock:'stock', marges:'marges', clients:'clients' };
    exportCSV(`rapport_${tabLabels[_tab]}_${todayStr()}.csv`, d.cols, d.rows);
  }

  Rapports._currentData = null;

  return {
    render,
    _setTab,
    _applyVentes, _applyAchats, _applyStock, _applyMarges, _applyClients,
    _resetFilter, _printCurrent, _exportCurrent,
  };
})();
