/* ============================================================
   MODULE: Dashboard
   ============================================================ */

const Dashboard = (() => {
  let _charts = {};

  function _destroyCharts() {
    for (const c of Object.values(_charts)) { try { c.destroy(); } catch (_) {} }
    _charts = {};
  }

  async function render(container) {
    _destroyCharts();
    await Stocks.load();

    const [ventes, lignesVentes, factures, produits, mouvements, achats, paiements] = await Promise.all([
      DB.getAll('ventes'),
      DB.getAll('lignes_ventes'),
      DB.getAll('factures'),
      DB.getAll('produits'),
      DB.getAll('mouvements'),
      DB.getAll('achats'),
      DB.getAll('paiements'),
    ]);

    const stocks = Stocks.computeStocks ? Stocks.computeStocks() : [];
    const totalValeurStock = stocks.reduce((s, x) => s + (x.actuel > 0 ? x.valeur : 0), 0);
    const totalCA_TTC = ventes.reduce((s, v) => s + (v.total_ttc || 0), 0);
    const totalCA_HT = ventes.reduce((s, v) => s + (v.total_ht || 0), 0);
    const totalAchatsCoût = achats.reduce((s, a) => s + (a.total || 0) + (a.autres_frais || 0), 0);
    const margeNette = totalCA_HT - totalAchatsCoût;
    const facturesImpayees = factures.filter(f => f.statut === 'Impayée').reduce((s, f) => s + (f.total_ttc || 0), 0);
    const ventesAujourdhui = ventes.filter(v => v.date === todayStr()).reduce((s, v) => s + (v.total_ttc || 0), 0);
    const nbClients = (await DB.getAll('clients')).length;

    // Ventes par mois (12 derniers mois)
    const now = new Date();
    const monthLabels = [];
    const monthData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthLabels.push(label);
      const total = ventes.filter(v => {
        const vd = new Date(v.date);
        return vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth();
      }).reduce((s, v) => s + (v.total_ttc || 0), 0);
      monthData.push(total);
    }

    // Ventes par catégorie
    const catMap = {};
    for (const prod of produits) {
      const lignes = lignesVentes.filter(l => l.produit_id === prod.id);
      const total = lignes.reduce((s, l) => s + (l.total_ht || 0), 0);
      if (total > 0) {
        const cat = prod.categorie || 'Autre';
        catMap[cat] = (catMap[cat] || 0) + total;
      }
    }
    const catLabels = Object.keys(catMap);
    const catData = Object.values(catMap);

    // Top 5 produits par quantité vendue
    const prodQty = {};
    for (const l of lignesVentes) {
      prodQty[l.produit_id] = (prodQty[l.produit_id] || 0) + (l.quantite || 0);
    }
    const top5 = Object.entries(prodQty)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, qty]) => ({ prod: produits.find(p => p.id === pid), qty }));

    // Encaissements par mode
    const modeMap = {};
    for (const p of paiements) {
      if (p.type !== 'Sortie') modeMap[p.mode || 'Autre'] = (modeMap[p.mode || 'Autre'] || 0) + (p.montant || 0);
    }

    container.innerHTML = `
      <div class="page-header">
        <h2>Tableau de Bord</h2>
        <div class="page-header-actions">
          <span style="font-size:13px;color:var(--text-muted)">Mis à jour : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <button class="btn btn-ghost btn-sm" onclick="Dashboard.render(document.getElementById('mainContent'))">🔄 Actualiser</button>
        </div>
      </div>

      <!-- KPI GRID -->
      <div class="kpi-grid">
        <div class="kpi-card blue">
          <div class="kpi-icon">💵</div>
          <div class="kpi-label">Chiffre d'Affaires TTC</div>
          <div class="kpi-value" style="font-size:20px">${fmtCurrency(totalCA_TTC)}</div>
          <div class="kpi-sub">Aujourd'hui : ${fmtCurrency(ventesAujourdhui)}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">📈</div>
          <div class="kpi-label">Marge Nette Brute</div>
          <div class="kpi-value" style="font-size:20px">${fmtCurrency(margeNette)}</div>
          <div class="kpi-sub">${totalCA_HT > 0 ? pct(margeNette / totalCA_HT) : '0%'} du CA HT</div>
        </div>
        <div class="kpi-card orange">
          <div class="kpi-icon">📦</div>
          <div class="kpi-label">Valeur du Stock</div>
          <div class="kpi-value" style="font-size:20px">${fmtCurrency(totalValeurStock)}</div>
          <div class="kpi-sub">${produits.length} références · ${stocks.filter(s => s.actuel > 0).length} en stock</div>
        </div>
        <div class="kpi-card red">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-label">Factures Impayées</div>
          <div class="kpi-value" style="font-size:20px">${fmtCurrency(facturesImpayees)}</div>
          <div class="kpi-sub">${factures.filter(f => f.statut === 'Impayée').length} facture(s) en attente</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-icon">🛒</div>
          <div class="kpi-label">Total Ventes</div>
          <div class="kpi-value">${ventes.length}</div>
          <div class="kpi-sub">${ventes.filter(v => v.statut === 'Livrée').length} livrée(s)</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon">👥</div>
          <div class="kpi-label">Clients</div>
          <div class="kpi-value">${nbClients}</div>
          <div class="kpi-sub">${(await DB.getAll('fournisseurs')).length} fournisseur(s)</div>
        </div>
      </div>

      <!-- CHARTS ROW 1 -->
      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Évolution des Ventes (12 mois)</div>
          </div>
          <div class="chart-container">
            <canvas id="chartVentes"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Répartition par Catégorie</div>
          </div>
          <div class="chart-container">
            <canvas id="chartCategories"></canvas>
          </div>
        </div>
      </div>

      <!-- CHARTS ROW 2 -->
      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Top 5 Produits Vendus</div>
          </div>
          <div class="chart-container">
            <canvas id="chartTop5"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Encaissements par Mode</div>
          </div>
          <div class="chart-container">
            <canvas id="chartPaiements"></canvas>
          </div>
        </div>
      </div>

      <!-- RECENT TABLES -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Dernières Ventes</div>
            <a href="#ventes" class="btn btn-ghost btn-sm">Voir tout →</a>
          </div>
          ${_recentVentes(ventes)}
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Alertes Stock Faible</div>
            <a href="#stocks" class="btn btn-ghost btn-sm">Voir stock →</a>
          </div>
          ${_alertesStock(stocks, produits)}
        </div>
      </div>`;

    // Draw charts after DOM is ready
    setTimeout(() => {
      _drawVentesChart(monthLabels, monthData);
      _drawCategoriesChart(catLabels, catData);
      _drawTop5Chart(top5);
      _drawPaiementsChart(modeMap);
    }, 50);
  }

  function _recentVentes(ventes) {
    const recent = [...ventes].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    if (!recent.length) return emptyState('🛒', 'Aucune vente récente');
    return `<table style="width:100%;font-size:13px">
      <tbody>${recent.map(v => `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px 4px;font-weight:600;color:var(--primary)">${v.id}</td>
          <td style="padding:8px 4px;color:var(--text-muted)">${fmtDate(v.date)}</td>
          <td style="padding:8px 4px;text-align:right;font-weight:700">${fmtCurrency(v.total_ttc)}</td>
          <td style="padding:8px 4px">${statusBadge(v.statut)}</td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function _alertesStock(stocks, produits) {
    const faible = stocks.filter(s => s.actuel >= 0 && s.actuel <= 5);
    const rupture = stocks.filter(s => s.actuel <= 0);
    const alertes = [...rupture, ...faible.filter(s => s.actuel > 0)].slice(0, 6);
    if (!alertes.length) return `<div class="empty-state"><div class="empty-icon">✅</div><p>Tous les stocks sont suffisants</p></div>`;
    return `<table style="width:100%;font-size:13px">
      <tbody>${alertes.map(s => `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px 4px;font-size:11px;color:var(--text-muted)">${s.produit.sku}</td>
          <td style="padding:8px 4px;font-weight:600">${s.produit.nom.substring(0, 40)}${s.produit.nom.length > 40 ? '…' : ''}</td>
          <td style="padding:8px 4px;text-align:center">
            <span class="badge ${s.actuel <= 0 ? 'badge-danger' : 'badge-warning'}">${s.actuel}</span>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function _drawVentesChart(labels, data) {
    const ctx = document.getElementById('chartVentes');
    if (!ctx) return;
    _charts.ventes = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ventes TTC (FCFA)',
          data,
          backgroundColor: 'rgba(37,99,168,0.75)',
          borderColor: 'rgba(37,99,168,1)',
          borderWidth: 1,
          borderRadius: 5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => (v / 1000).toFixed(0) + 'k' } } },
      },
    });
  }

  function _drawCategoriesChart(labels, data) {
    const ctx = document.getElementById('chartCategories');
    if (!ctx) return;
    if (!labels.length) { ctx.parentElement.innerHTML = emptyState('📊', 'Aucune donnée de vente'); return; }
    _charts.categories = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_, i) => catColor(i)),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } },
      },
    });
  }

  function _drawTop5Chart(top5) {
    const ctx = document.getElementById('chartTop5');
    if (!ctx) return;
    if (!top5.length) { ctx.parentElement.innerHTML = emptyState('🏆', 'Aucune vente'); return; }
    _charts.top5 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top5.map(x => x.prod?.sku || '?'),
        datasets: [{
          label: 'Quantité vendue',
          data: top5.map(x => x.qty),
          backgroundColor: top5.map((_, i) => catColor(i + 2)),
          borderRadius: 5,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  function _drawPaiementsChart(modeMap) {
    const ctx = document.getElementById('chartPaiements');
    if (!ctx) return;
    const labels = Object.keys(modeMap);
    if (!labels.length) { ctx.parentElement.innerHTML = emptyState('💳', 'Aucun paiement'); return; }
    _charts.paiements = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: Object.values(modeMap),
          backgroundColor: labels.map((_, i) => catColor(i + 4)),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } },
      },
    });
  }

  return { render };
})();
