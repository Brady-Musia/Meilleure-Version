/* Home "Notre concept": show two pillars at a time with a small pager.
   Without the script every tile stays visible. */
(function () {
  var grid = document.getElementById('pgrid');
  var pager = document.getElementById('pager');
  if (!grid || !pager) return;
  var tiles = [].slice.call(grid.querySelectorAll('.ptile'));
  var PER = 2, pages = Math.ceil(tiles.length / PER), page = 0;
  var btns = [].slice.call(pager.querySelectorAll('.pager-page'));
  var prev = pager.querySelector('[data-dir="-1"]');
  var next = pager.querySelector('[data-dir="1"]');

  function show(p, scroll) {
    page = Math.max(0, Math.min(pages - 1, p));
    tiles.forEach(function (t, i) {
      var on = Math.floor(i / PER) === page;
      t.classList.toggle('is-off', !on);
      if (on) { t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
    });
    btns.forEach(function (b, i) {
      b.classList.toggle('is-on', i === page);
      if (i === page) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    prev.disabled = page === 0;
    next.disabled = page === pages - 1;
    // keep the tiles in view when paging from the bottom of a tall stack (phones)
    if (scroll) {
      var r = grid.getBoundingClientRect();
      if (r.top < 0) window.scrollBy({ top: r.top - 90, behavior: 'smooth' });
    }
  }
  grid.classList.add('is-paged');
  pager.hidden = false;
  btns.forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.page, true); }); });
  prev.addEventListener('click', function () { show(page - 1, true); });
  next.addEventListener('click', function () { show(page + 1, true); });
  show(0, false);
})();
