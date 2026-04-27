/* ============================================================
   MODULE: Paiements
   ============================================================ */

const Paiements = (() => {
  let _all = [];
  let _query = '';

  async function load() { _all = await DB.getAll('paiements'); }

  async function render(container) {
    await load();
    let filtered = [..._all].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (_query) {
      const q = _query.toLowerCase();
      filtered = filtered.filter(p => p.id.toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q) || (p.mode || '').toLowerCase().includes(q));
    }

    const totalEncaisse = filtered.reduce((s, p) => s + (p.montant || 0), 0);

    const tbl = buildTable([
      { key: 'id', label: 'ID' },
      { key: 'date', label: 'Date', render: r => fmtDate(r.date) },
      { key: 'type', label: 'Type', render: r => statusBadge(r.type || 'Entrée') },
      { key: 'reference', label: 'Référence' },
      { key: 'montant', label: 'Montant', align: 'right', render: r => `<span class="font-bold">${fmtCurrency(r.montant)}</span>` },
      { key: 'mode', label: 'Mode', render: r => `<span class="badge badge-info">${r.mode || '—'}</span>` },
      { key: 'statut', label: 'Statut', render: r => statusBadge(r.statut || 'Enregistré') },
      {
        key: '_actions', label: 'Actions',
        render: r => `<div class="table-actions">
          <button class="btn btn-sm btn-ghost btn-icon" onclick="Paiements.deleteItem('${r.id}')">🗑️</button>
        </div>`
      },
    ], filtered, 'Aucun paiement enregistré');

    container.innerHTML = `
      <div class="page-header">
        <h2>Paiements</h2>
        <div class="page-header-actions">
          <button class="btn btn-ghost btn-sm" onclick="Paiements.exportData()">⬇️ Exporter</button>
          <button class="btn btn-primary" onclick="Paiements.createForm()">+ Nouveau Paiement</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px;padding:12px 20px">
        <span class="text-muted" style="font-size:12px">TOTAL ENCAISSÉ (FILTRÉ)</span>
        <div class="font-bold" style="font-size:20px;color:var(--success)">${fmtCurrency(totalEncaisse)}</div>
      </div>
      <div class="card">
        <div class="search-bar">
          <input class="search-input" placeholder="Rechercher par ID, référence, mode…" value="${_query}" oninput="Paiements._onSearch(this.value)" />
        </div>
        ${tbl}
      </div>`;
  }

  function _onSearch(v) { _query = v; render(el('mainContent')); }

  function createForm() {
    openModal('Nouveau Paiement', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-control" id="payDate" value="${todayStr()}" />
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-control" id="payType">
            <option value="Entrée">Entrée (Encaissement)</option>
            <option value="Sortie">Sortie (Décaissement)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Référence (N° Facture / Vente)</label>
          <input class="form-control" id="payRef" placeholder="Ex: F0001, V0001" />
        </div>
        <div class="form-group">
          <label class="form-label">Montant (FCFA) *</label>
          <input type="number" class="form-control" id="payMontant" min="0" step="100" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Mode de Paiement *</label>
          <select class="form-control" id="payMode">
            <option value="Espèces">Espèces</option>
            <option value="Virement">Virement Bancaire</option>
            <option value="Chèque">Chèque</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select class="form-control" id="payStatut">
            <option value="Enregistré">Enregistré</option>
            <option value="Confirmé">Confirmé</option>
          </select>
        </div>
      </div>`,
      { confirmLabel: 'Enregistrer', onConfirm: _save }
    );
  }

  async function _save() {
    const date = el('payDate')?.value;
    const type = el('payType')?.value;
    const reference = el('payRef')?.value.trim();
    const montant = parseFloat(el('payMontant')?.value);
    const mode = el('payMode')?.value;
    const statut = el('payStatut')?.value;

    if (!date || !montant || montant <= 0 || !mode) {
      toast('Veuillez remplir les champs obligatoires', 'error'); return;
    }

    const all = await DB.getAll('paiements');
    const id = seqId('PAY', all);
    await DB.add('paiements', { id, date, type, reference, montant, mode, statut });
    await logAction('Paiement', `${type} – ${fmtCurrency(montant)} via ${mode} – Réf: ${reference || '—'}`);
    toast('Paiement enregistré', 'success');
    closeModal();
    await load();
    render(el('mainContent'));
  }

  async function deleteItem(id) {
    confirmDialog(`Supprimer ce paiement ?`, async () => {
      await DB.delete('paiements', id);
      toast('Paiement supprimé', 'warning');
      closeModal();
      await load();
      render(el('mainContent'));
    });
  }

  async function exportData() {
    await load();
    exportCSV('paiements.csv', [
      { key: 'id', label: 'ID' }, { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }, { key: 'reference', label: 'Référence' },
      { key: 'montant', label: 'Montant' }, { key: 'mode', label: 'Mode' }, { key: 'statut', label: 'Statut' },
    ], _all);
  }

  return { render, load, createForm, deleteItem, exportData, _onSearch };
})();
