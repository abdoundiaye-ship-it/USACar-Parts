/* ============================================================
   MODULE: Paramètres + Logs
   ============================================================ */

const Parametres = (() => {
  async function render(container) {
    const params = await DB.getAll('parametres');
    const paramMap = Object.fromEntries(params.map(p => [p.cle, p.valeur]));

    container.innerHTML = `
      <div class="page-header">
        <h2>Paramètres</h2>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="Parametres.saveAll()">💾 Enregistrer</button>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-title mb-16">Informations Entreprise</div>
          <div class="form-group">
            <label class="form-label">Nom de l'entreprise</label>
            <input class="form-control" id="paramNomEntreprise" value="${paramMap['nom_entreprise'] || 'USA PARTS AUTO'}" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Adresse</label>
            <input class="form-control" id="paramAdresse" value="${paramMap['adresse'] || 'Dakar, Sénégal'}" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Téléphone</label>
            <input class="form-control" id="paramTel" value="${paramMap['telephone'] || ''}" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Email</label>
            <input class="form-control" id="paramEmail" value="${paramMap['email'] || ''}" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">NINEA / N° Fiscal</label>
            <input class="form-control" id="paramNinea" value="${paramMap['ninea'] || ''}" />
          </div>
        </div>
        <div class="card">
          <div class="card-title mb-16">Paramètres Financiers</div>
          <div class="form-group">
            <label class="form-label">Taux TVA (%)</label>
            <input type="number" class="form-control" id="paramTVA" value="${paramMap['tva_rate'] || '18'}" min="0" max="100" step="0.5" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Devise principale</label>
            <select class="form-control" id="paramDevise">
              <option value="FCFA" ${(paramMap['devise'] || 'FCFA') === 'FCFA' ? 'selected' : ''}>FCFA (Franc CFA)</option>
              <option value="USD" ${paramMap['devise'] === 'USD' ? 'selected' : ''}>USD (Dollar US)</option>
              <option value="EUR" ${paramMap['devise'] === 'EUR' ? 'selected' : ''}>EUR (Euro)</option>
            </select>
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Marge cible (%)</label>
            <input type="number" class="form-control" id="paramMarge" value="${paramMap['marge_cible'] || '30'}" min="0" max="200" />
          </div>
          <div class="form-group mt-8">
            <label class="form-label">Taux de change (1 USD → FCFA)</label>
            <input type="number" class="form-control" id="paramRate" value="${paramMap['usd_fcfa_rate'] || '600'}" min="1" step="1" />
          </div>
        </div>
      </div>
      <div class="card mt-16" style="border-left:4px solid var(--danger)">
        <div class="card-title mb-16" style="color:var(--danger)">Zone Dangereuse</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-ghost" onclick="Parametres.exportBackup()">📦 Exporter sauvegarde (JSON)</button>
          <button class="btn btn-ghost" onclick="Parametres.importBackup()">📥 Importer sauvegarde</button>
          <button class="btn btn-danger" onclick="Parametres.resetDB()">🗑️ Réinitialiser toutes les données</button>
        </div>
      </div>`;
  }

  async function saveAll() {
    const params = [
      { cle: 'nom_entreprise', valeur: el('paramNomEntreprise')?.value.trim() },
      { cle: 'adresse', valeur: el('paramAdresse')?.value.trim() },
      { cle: 'telephone', valeur: el('paramTel')?.value.trim() },
      { cle: 'email', valeur: el('paramEmail')?.value.trim() },
      { cle: 'ninea', valeur: el('paramNinea')?.value.trim() },
      { cle: 'tva_rate', valeur: el('paramTVA')?.value.trim() },
      { cle: 'devise', valeur: el('paramDevise')?.value },
      { cle: 'marge_cible', valeur: el('paramMarge')?.value.trim() },
      { cle: 'usd_fcfa_rate', valeur: el('paramRate')?.value.trim() },
    ];
    for (const p of params) await DB.put('parametres', p);
    await logAction('Paramètres', 'Paramètres système mis à jour');
    toast('Paramètres enregistrés', 'success');
  }

  async function exportBackup() {
    const stores = ['produits', 'mouvements', 'ventes', 'lignes_ventes', 'factures', 'clients', 'fournisseurs', 'achats', 'lignes_achats', 'paiements', 'price_list', 'parametres'];
    const backup = {};
    for (const s of stores) backup[s] = await DB.getAll(s);
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usapartsauto_backup_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Sauvegarde exportée', 'success');
  }

  function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        confirmDialog('Importer cette sauvegarde ? Les données actuelles seront remplacées.', async () => {
          for (const [store, items] of Object.entries(data)) {
            try {
              await DB.clear(store);
              if (items && items.length) await DB.putMany(store, items);
            } catch (_) {}
          }
          toast('Sauvegarde importée avec succès', 'success');
          closeModal();
          window.location.reload();
        });
      } catch (_) {
        toast('Fichier invalide', 'error');
      }
    };
    input.click();
  }

  function resetDB() {
    confirmDialog('⚠️ <strong>Attention !</strong><br>Cette action supprimera TOUTES les données. Cette opération est irréversible.<br><br>Êtes-vous certain(e) ?', async () => {
      const stores = ['produits', 'mouvements', 'ventes', 'lignes_ventes', 'factures', 'clients', 'fournisseurs', 'achats', 'lignes_achats', 'paiements', 'price_list', 'logs'];
      for (const s of stores) await DB.clear(s);
      toast('Données réinitialisées', 'warning');
      closeModal();
      window.location.reload();
    });
  }

  return { render, saveAll, exportBackup, importBackup, resetDB };
})();

/* ============================================================
   MODULE: Logs
   ============================================================ */

const Logs = (() => {
  async function render(container) {
    const logs = (await DB.getAll('logs')).sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbl = buildTable([
      { key: 'id', label: 'ID' },
      { key: 'date', label: 'Date & Heure', render: r => {
        const d = new Date(r.date);
        return `${fmtDate(d)} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      }},
      { key: 'action', label: 'Action', render: r => `<span class="badge badge-info">${r.action}</span>` },
      { key: 'utilisateur', label: 'Utilisateur' },
      { key: 'description', label: 'Description' },
    ], logs, 'Aucune entrée dans le journal');

    container.innerHTML = `
      <div class="page-header">
        <h2>Journal d'Activité</h2>
        <div class="page-header-actions">
          <button class="btn btn-danger btn-sm" onclick="Logs.clearLogs()">🗑️ Vider le journal</button>
        </div>
      </div>
      <div class="card">${tbl}</div>`;
  }

  function clearLogs() {
    confirmDialog('Vider tout le journal d\'activité ?', async () => {
      await DB.clear('logs');
      toast('Journal vidé', 'warning');
      closeModal();
      render(el('mainContent'));
    });
  }

  return { render, clearLogs };
})();
