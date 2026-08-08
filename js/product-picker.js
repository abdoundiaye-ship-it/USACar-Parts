/* ============================================================
   ProductPicker — sélecteur de produit avec photo miniature.
   Remplace les <select> de produit dans les lignes d'Achats et
   de Ventes pour que l'agent puisse confirmer visuellement
   l'article choisi. Le champ caché conserve la classe passée
   (ex. "al-produit" / "lv-produit") pour rester compatible avec
   le code de calcul existant qui fait querySelector('.al-produit').
   ============================================================ */

const ProductPicker = (() => {
  const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
       <rect width="32" height="32" rx="4" fill="#e2e8f0"/>
       <path d="M8 22l5-6 4 4 4-5 3 4v3H8z" fill="#94a3b8"/>
       <circle cx="12" cy="11" r="2.4" fill="#94a3b8"/>
     </svg>`
  );

  function _optionHtml(p, selectedId) {
    const label = `${p.sku} – ${p.nom}`;
    const thumb = p.photo_url || PLACEHOLDER;
    const search = `${p.sku} ${p.nom}`.toLowerCase();
    return `
      <div class="pp-option${p.id === selectedId ? ' is-selected' : ''}"
           data-id="${p.id}" data-label="${label}" data-thumb="${thumb}" data-search="${search}"
           onclick="ProductPicker.select(this)">
        <img class="photo-zoomable" src="${thumb}" alt="" onerror="this.src='${PLACEHOLDER}'">
        <span>${label}</span>
      </div>`;
  }

  /** Rend le HTML du sélecteur. fieldClass = classe attendue par le code appelant sur l'input caché. */
  function render(fieldClass, produits, selectedId) {
    const sel = selectedId ? produits.find(p => p.id === selectedId) : null;
    const label = sel ? `${sel.sku} – ${sel.nom}` : '-- Choisir un produit --';
    const thumb = (sel && sel.photo_url) || PLACEHOLDER;
    const optionsHtml = produits.map(p => _optionHtml(p, selectedId)).join('');
    return `
      <div class="prod-picker">
        <input type="hidden" class="${fieldClass}" value="${selectedId || ''}">
        <button type="button" class="prod-picker-trigger" onclick="ProductPicker.toggle(this)">
          <img class="prod-picker-thumb photo-zoomable" src="${thumb}" alt="" onerror="this.src='${PLACEHOLDER}'">
          <span class="prod-picker-label">${label}</span>
          <span class="prod-picker-caret">▾</span>
        </button>
        <div class="prod-picker-dropdown" hidden>
          <input type="text" class="prod-picker-search" placeholder="Rechercher un produit…"
                 oninput="ProductPicker.filter(this)" onclick="event.stopPropagation()">
          <div class="prod-picker-options">${optionsHtml || '<div class="pp-empty">Aucun produit</div>'}</div>
        </div>
      </div>`;
  }

  function closeAll(except) {
    document.querySelectorAll('.prod-picker-dropdown').forEach(dd => {
      if (dd !== except) dd.hidden = true;
    });
  }

  function toggle(btn) {
    const wrap = btn.closest('.prod-picker');
    const dd = wrap.querySelector('.prod-picker-dropdown');
    const willOpen = dd.hidden;
    closeAll();
    if (!willOpen) return;

    const rect = btn.getBoundingClientRect();
    const panelWidth = Math.max(rect.width, 280);
    dd.style.width = panelWidth + 'px';
    dd.style.left = Math.min(rect.left, window.innerWidth - panelWidth - 12) + 'px';

    dd.hidden = false;
    // Mesure après affichage pour décider d'ouvrir vers le haut ou le bas
    const ddHeight = dd.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < ddHeight + 12 && rect.top > ddHeight + 12) {
      dd.style.top = (rect.top - ddHeight - 4) + 'px';
    } else {
      dd.style.top = (rect.bottom + 4) + 'px';
    }

    const search = dd.querySelector('.prod-picker-search');
    search.value = '';
    dd.querySelectorAll('.pp-option').forEach(o => { o.style.display = ''; });
    search.focus();
  }

  function filter(input) {
    const q = input.value.trim().toLowerCase();
    const options = input.closest('.prod-picker-dropdown').querySelectorAll('.pp-option');
    options.forEach(o => {
      o.style.display = o.dataset.search.includes(q) ? '' : 'none';
    });
  }

  function select(optionEl) {
    const wrap = optionEl.closest('.prod-picker');
    const hidden = wrap.querySelector('input[type="hidden"]');
    const trigger = wrap.querySelector('.prod-picker-trigger');
    hidden.value = optionEl.dataset.id;
    trigger.querySelector('.prod-picker-label').textContent = optionEl.dataset.label;
    trigger.querySelector('.prod-picker-thumb').src = optionEl.dataset.thumb;
    wrap.querySelectorAll('.pp-option').forEach(o => o.classList.remove('is-selected'));
    optionEl.classList.add('is-selected');
    closeAll();
    // Déclenche le recalcul délégué existant (écouté au niveau du <tbody> parent)
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.prod-picker')) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
  window.addEventListener('resize', () => closeAll());

  return { render, toggle, filter, select, closeAll, PLACEHOLDER };
})();
