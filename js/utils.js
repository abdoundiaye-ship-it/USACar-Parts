/* =============================================
   USA PARTS AUTO ERP – Utilities
   ============================================= */

const TVA_RATE = 0.18;

/* ---- ID Generators ---- */
function genId(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${ts}${rand}`;
}

function seqId(prefix, existing, pad = 4) {
  if (!existing || existing.length === 0) return `${prefix}${String(1).padStart(pad, '0')}`;
  const nums = existing
    .map(e => parseInt((e.id || e).replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(pad, '0')}`;
}

/* ---- Formatting ---- */
function fmtCurrency(val, currency = 'FCFA') {
  if (val == null || isNaN(val)) return `0 ${currency}`;
  return `${Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}

function fmtUSD(val) {
  if (val == null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function fmtDate(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateInput(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '';
  return dt.toISOString().substring(0, 10);
}

function todayStr() {
  return new Date().toISOString().substring(0, 10);
}

function fmtNum(val, dec = 2) {
  if (val == null || isNaN(val)) return '0';
  return Number(val).toFixed(dec);
}

function pct(val) {
  if (val == null || isNaN(val)) return '0%';
  return `${Number(val * 100).toFixed(1)}%`;
}

/* ---- DOM Helpers ---- */
function el(id) { return document.getElementById(id); }

function html(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
}

function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

/* ---- Toast Notifications ---- */
function toast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = el('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, duration);
}

/* ---- Modal ---- */
function openModal(title, bodyHTML, opts = {}) {
  el('modalTitle').textContent = title;
  el('modalBody').innerHTML = bodyHTML;
  if (opts.wide) el('modalBox').classList.add('wide');
  else el('modalBox').classList.remove('wide');
  el('modalFooter').style.display = opts.noFooter ? 'none' : '';
  if (opts.confirmLabel) el('modalConfirmBtn').textContent = opts.confirmLabel;
  else el('modalConfirmBtn').textContent = 'Enregistrer';
  if (opts.cancelLabel) el('modalCancelBtn').textContent = opts.cancelLabel;
  else el('modalCancelBtn').textContent = 'Annuler';
  el('globalModal').style.display = 'flex';
  el('modalConfirmBtn')._handler = opts.onConfirm || null;
  if (opts.onOpen) opts.onOpen();
}

function closeModal() {
  el('globalModal').style.display = 'none';
  el('modalBox').classList.remove('wide');
}

/* ---- Confirm Dialog ---- */
function confirmDialog(msg, onYes) {
  openModal('Confirmation', `<p style="font-size:15px;color:#1e293b">${msg}</p>`, {
    confirmLabel: 'Confirmer',
    onConfirm: onYes,
  });
}

/* ---- Status Badges ---- */
function statusBadge(status) {
  const map = {
    'Livrée': 'success', 'Payée': 'success', 'Reçu': 'success', 'Actif': 'success',
    'En attente': 'warning', 'Partiel': 'warning', 'En cours': 'warning',
    'Impayée': 'danger', 'Annulée': 'danger', 'Inactif': 'secondary',
    'Entrée': 'info', 'Sortie': 'warning',
  };
  const cls = map[status] || 'secondary';
  return `<span class="badge badge-${cls}">${status}</span>`;
}

/* ---- Table Builder ---- */
function buildTable(cols, rows, emptyMsg = 'Aucune donnée') {
  if (!rows || rows.length === 0) return emptyState('📄', emptyMsg);
  const ths = cols.map(c => `<th>${c.label}</th>`).join('');
  const trs = rows.map(row => {
    const tds = cols.map(c => {
      const val = typeof c.render === 'function' ? c.render(row) : (row[c.key] ?? '');
      return `<td${c.align ? ` style="text-align:${c.align}"` : ''}>${val}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  return `<div class="table-container"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

/* ---- Search Filter ---- */
function filterRows(rows, query, fields) {
  if (!query) return rows;
  const q = query.toLowerCase();
  return rows.filter(r => fields.some(f => String(r[f] ?? '').toLowerCase().includes(q)));
}

/* ---- Calc Helpers ---- */
function calcTVA(ht) { return ht * TVA_RATE; }
function calcTTC(ht) { return ht * (1 + TVA_RATE); }
function calcHT(ttc) { return ttc / (1 + TVA_RATE); }
function applyRemise(prix, remise) { return prix * (1 - (remise || 0) / 100); }

/* ---- Logging ---- */
async function logAction(action, description, utilisateur = 'Système') {
  try {
    await DB.add('logs', {
      id: genId('LOG'),
      date: new Date().toISOString(),
      action,
      utilisateur,
      description,
    });
  } catch (_) {}
}

/* ---- Export CSV ---- */
function exportCSV(filename, cols, rows) {
  const headers = cols.map(c => `"${c.label}"`).join(',');
  const lines = rows.map(row =>
    cols.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers, ...lines].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---- Print Invoice ---- */
function printElement(html) {
  const area = el('printArea');
  area.innerHTML = html;
  window.print();
  area.innerHTML = '';
}

/* ---- Category Colors ---- */
const CAT_COLORS = [
  '#2563a8','#e63946','#2ecc71','#f39c12','#9b59b6',
  '#1abc9c','#e74c3c','#3498db','#e67e22','#16a085',
];

function catColor(i) { return CAT_COLORS[i % CAT_COLORS.length]; }
