/* ============================================================
   MODULE: Factures — liste + impression A4
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

    const totalImpaye   = _all.filter(f => f.statut === 'Impayée').reduce((s, f) => s + (f.total_ttc || 0), 0);
    const totalPayee    = _all.filter(f => f.statut === 'Payée').reduce((s, f) => s + (f.total_ttc || 0), 0);
    const nbImpayees    = _all.filter(f => f.statut === 'Impayée').length;

    const tbl = buildTable([
      { key: 'id',        label: 'N° Facture' },
      { key: 'date',      label: 'Date',       render: r => fmtDate(r.date) },
      { key: 'client',    label: 'Client',     render: r => clientMap[r.client_id]?.nom || r.client_id },
      { key: 'vente_id',  label: 'N° Vente'   },
      { key: 'total_ht',  label: 'Total HT',   align: 'right', render: r => fmtCurrency(r.total_ht)  },
      { key: 'tva',       label: 'TVA (18%)',  align: 'right', render: r => fmtCurrency(r.tva)        },
      { key: 'total_ttc', label: 'Total TTC',  align: 'right', render: r => `<span class="font-bold">${fmtCurrency(r.total_ttc)}</span>` },
      { key: 'statut',    label: 'Statut',     render: r => statusBadge(r.statut || 'Impayée') },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-primary btn-sm" onclick="Factures.printFacture('${r.vente_id}')" title="Aperçu & Imprimer">🖨️ Imprimer</button>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Factures.toggleStatut('${r.id}')" title="${r.statut === 'Payée' ? 'Marquer Impayée' : 'Marquer Payée'}">💳</button>
        </div>`
      },
    ], filtered, 'Aucune facture trouvée');

    container.innerHTML = `
      <div class="page-header">
        <h2>Factures</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Factures.exportData()">⬇️ Exporter CSV</button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
        <div class="kpi-card blue">
          <div class="kpi-icon">🧾</div>
          <div class="kpi-label">Total Factures</div>
          <div class="kpi-value">${_all.length}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">✅</div>
          <div class="kpi-label">Total Encaissé</div>
          <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalPayee)}</div>
        </div>
        <div class="kpi-card red">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-label">Total Impayé</div>
          <div class="kpi-value" style="font-size:18px">${fmtCurrency(totalImpaye)}</div>
          <div class="kpi-sub">${nbImpayees} facture(s) en attente</div>
        </div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par N° facture ou client…" value="${_query}" oninput="Factures._onSearch(this.value)" />
          <select class="form-control" style="width:auto;min-width:150px" onchange="Factures._onStatus(this.value)">
            <option value="">Tous les statuts</option>
            <option value="Payée"   ${_statusFilter === 'Payée'   ? 'selected' : ''}>Payée</option>
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

  /* ── Build invoice HTML (used for both preview and print) ── */
  async function _buildFactureHtml(venteId) {
    const [ventes, lignesVentes, clients, produits, factures, parametres] = await Promise.all([
      DB.getAll('ventes'), DB.getAll('lignes_ventes'),
      DB.getAll('clients'), DB.getAll('produits'),
      DB.getAll('factures'), DB.getAll('parametres'),
    ]);

    const vente   = ventes.find(v => v.id === venteId);
    if (!vente) return null;
    const client  = clients.find(c => c.id === vente.client_id);
    const facture = factures.find(f => f.vente_id === venteId);
    const lignes  = lignesVentes.filter(l => l.vente_id === venteId);
    const prodMap = Object.fromEntries(produits.map(p => [p.id, p]));
    const pMap    = Object.fromEntries(parametres.map(p => [p.cle, p.valeur]));

    const entreprise = pMap['nom_entreprise'] || 'USA PARTS AUTO';
    const adresse    = pMap['adresse'] || 'Dakar, Sénégal';
    const email      = pMap['email']   || 'contact@usapartsauto.sn';
    const tel        = pMap['telephone'] || '';
    const ninea      = pMap['ninea'] || '';

    const lignesHtml = lignes.map((l, i) => `
      <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:10pt;white-space:nowrap">
          <code style="background:#f1f5f9;padding:2px 5px;border-radius:3px;font-size:9pt">${prodMap[l.produit_id]?.sku || l.produit_id}</code>
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:10pt">${prodMap[l.produit_id]?.nom || l.produit_id}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:10pt;font-weight:600">${l.quantite}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:10pt">${fmtCurrency(l.prix_applique_ht)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:10pt;color:#64748b">${l.remise ? l.remise + '%' : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:10pt;font-weight:700">${fmtCurrency(l.total_ht)}</td>
      </tr>`).join('');

    const statutColor = facture?.statut === 'Payée' ? '#16a34a' : '#dc2626';
    const statutBg    = facture?.statut === 'Payée' ? '#dcfce7'  : '#fee2e2';
    const statutLabel = facture?.statut || 'Impayée';

    return `
    <div class="facture-preview" style="background:#fff;font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;max-width:800px;margin:0 auto;padding:32px">

      <!-- ── HEADER ── -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #1a3a5c;margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:14px">
          <img src="assets/logo.png" alt="Logo" style="width:64px;height:64px;object-fit:contain;border-radius:8px" />
          <div>
            <div style="font-size:22px;font-weight:800;color:#1a3a5c;letter-spacing:-0.5px">${entreprise}</div>
            <div style="font-size:11px;color:#64748b;line-height:1.6">Pièces Détachées Automobiles<br>${adresse}${tel ? '<br>' + tel : ''}${email ? '<br>' + email : ''}</div>
            ${ninea ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">NINEA : ${ninea}</div>` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:30px;font-weight:900;color:#1a3a5c;letter-spacing:-1px">FACTURE</div>
          <div style="font-size:14px;color:#64748b;margin-top:4px">N° <strong style="color:#1a3a5c">${facture?.id || '—'}</strong></div>
          <div style="font-size:12px;color:#64748b">Réf. vente : ${venteId}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">Date : <strong>${fmtDate(vente.date)}</strong></div>
          <div style="margin-top:10px;display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${statutBg};color:${statutColor};border:1px solid ${statutColor}">${statutLabel}</div>
        </div>
      </div>

      <!-- ── ADDRESSES ── -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <div style="background:#f8fafc;border-radius:8px;padding:14px 16px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px">ÉMETTEUR</div>
          <div style="font-size:13px;line-height:1.7"><strong>${entreprise}</strong><br>${adresse}${tel ? '<br>' + tel : ''}${email ? '<br>' + email : ''}</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:14px 16px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px">FACTURÉ À</div>
          <div style="font-size:13px;line-height:1.7">
            <strong>${client?.nom || '—'}</strong>
            ${client?.adresse ? '<br>' + client.adresse : ''}
            ${client?.telephone ? '<br>' + client.telephone : ''}
            ${client?.email ? '<br>' + client.email : ''}
          </div>
        </div>
      </div>

      <!-- ── LINES TABLE ── -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0">
        <thead>
          <tr style="background:#1a3a5c">
            <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;color:#fff;white-space:nowrap">SKU</th>
            <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;color:#fff">Désignation</th>
            <th style="padding:10px 10px;text-align:center;font-size:11px;font-weight:600;color:#fff">Qté</th>
            <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#fff">P.U. HT</th>
            <th style="padding:10px 10px;text-align:center;font-size:11px;font-weight:600;color:#fff">Remise</th>
            <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#fff">Montant HT</th>
          </tr>
        </thead>
        <tbody>${lignesHtml}</tbody>
      </table>

      <!-- ── TOTALS ── -->
      <div style="display:flex;justify-content:flex-end">
        <div style="min-width:280px">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
            <span style="color:#64748b">Total HT</span>
            <span style="font-weight:600">${fmtCurrency(vente.total_ht)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
            <span style="color:#64748b">TVA (18%)</span>
            <span>${fmtCurrency(vente.tva)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:4px;border-top:2px solid #1a3a5c;font-size:16px;font-weight:800;color:#1a3a5c">
            <span>TOTAL TTC</span>
            <span>${fmtCurrency(vente.total_ttc)}</span>
          </div>
        </div>
      </div>

      <!-- ── FOOTER ── -->
      <div style="margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end">
        <div style="font-size:11px;color:#64748b;line-height:1.8">
          <div>Mode de paiement : <strong>${vente.paiement || 'Non spécifié'}</strong></div>
          <div style="margin-top:6px;color:#94a3b8;font-size:10px">Merci pour votre confiance. Pour toute réclamation, contactez-nous dans les 7 jours.</div>
        </div>
        <div style="font-size:10px;color:#94a3b8;text-align:right">
          ${entreprise} — ${fmtDate(vente.date)}<br>
          Facture générée par USA PARTS AUTO ERP
        </div>
      </div>

    </div>`;
  }

  /* ── Preview in modal + print button ── */
  async function printFacture(venteId) {
    const factures  = await DB.getAll('factures');
    const facture   = factures.find(f => f.vente_id === venteId);
    const factureHtml = await _buildFactureHtml(venteId);
    if (!factureHtml) { toast('Vente introuvable', 'error'); return; }

    openModal(`Facture ${facture?.id || venteId}`, factureHtml, {
      wide: true,
      confirmLabel: '🖨️ Imprimer',
      cancelLabel:  'Fermer',
      onConfirm: () => {
        closeModal();
        // Small delay so modal finishes closing before print dialog opens
        setTimeout(() => printElement(factureHtml), 120);
      },
    });
  }

  /* ── Direct print (no preview) ── */
  async function directPrint(venteId) {
    const factureHtml = await _buildFactureHtml(venteId);
    if (!factureHtml) { toast('Vente introuvable', 'error'); return; }
    printElement(factureHtml);
  }

  async function exportData() {
    await load();
    exportCSV('factures.csv', [
      { key: 'id', label: 'N° Facture' }, { key: 'date', label: 'Date' },
      { key: 'vente_id', label: 'N° Vente' }, { key: 'client_id', label: 'Client ID' },
      { key: 'total_ht', label: 'Total HT' }, { key: 'tva', label: 'TVA' },
      { key: 'total_ttc', label: 'Total TTC' }, { key: 'statut', label: 'Statut' },
    ], _all);
  }

  return { render, load, toggleStatut, printFacture, directPrint, exportData, _onSearch, _onStatus };
})();
