/* ============================================================
   PhotoZoom — agrandit une miniature produit (28-36px, trop petite
   pour distinguer la pièce) au survol de la souris. Délégué sur
   document car les miniatures (.photo-zoomable) sont recréées en
   continu via innerHTML dans Achats/Ventes/ProductPicker.
   ============================================================ */

(() => {
  const SIZE = 260;
  let previewEl = null;

  function ensurePreview() {
    if (previewEl) return previewEl;
    previewEl = document.createElement('div');
    previewEl.className = 'photo-zoom-preview';
    previewEl.innerHTML = '<img alt="">';
    document.body.appendChild(previewEl);
    return previewEl;
  }

  function show(img) {
    if (!img.src || img.src.startsWith('data:')) return; // rien à agrandir (placeholder)
    const rect = img.getBoundingClientRect();
    const preview = ensurePreview();
    preview.querySelector('img').src = img.src;

    let left = rect.right + 12;
    if (left + SIZE + 12 > window.innerWidth) left = rect.left - SIZE - 12;
    left = Math.max(8, Math.min(left, window.innerWidth - SIZE - 8));

    let top = rect.top + rect.height / 2 - SIZE / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - SIZE - 8));

    preview.style.left = left + 'px';
    preview.style.top = top + 'px';
    preview.style.display = 'block';
  }

  function hide() {
    if (previewEl) previewEl.style.display = 'none';
  }

  document.addEventListener('mouseover', (e) => {
    const img = e.target.closest('img.photo-zoomable');
    if (img) show(img);
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('img.photo-zoomable')) hide();
  });
  // Les listes de résultats du picker défilent en interne (overflow-y) ; le
  // scroll n'y "bubble" pas, mais une écoute en phase de capture le détecte
  // quand même pour repositionner/masquer l'aperçu.
  window.addEventListener('scroll', hide, true);
  document.addEventListener('click', hide);
})();
