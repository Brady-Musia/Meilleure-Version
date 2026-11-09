/* Home "Notre concept" carousel: arrows + dots drive a native scroll-snap
   track (swipe works on touch); "Lire la suite" unfolds a card's full text. */
(function () {
  var track = document.getElementById('pgrid');
  var ctrl = document.getElementById('pctrl');
  if (!track || !ctrl) return;
  var cards = [].slice.call(track.querySelectorAll('.ptile'));
  var dotsBox = ctrl.querySelector('.carousel-dots');
  var prev = ctrl.querySelector('[data-dir="-1"]');
  var next = ctrl.querySelector('[data-dir="1"]');
  // side buttons over the track edges
  var sides = [].slice.call(document.querySelectorAll('.caro-side'));

  var dots = [];
  // one dot per reachable scroll position (depends on how many cards fit)
  function buildDots() {
    var n = Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / step()) + 1);
    if (n === dots.length) return;
    dotsBox.innerHTML = ''; dots = [];
    for (var i = 0; i < n; i++) (function (i) {
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Position ' + (i + 1) + ' sur ' + n);
      d.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(d); dots.push(d);
    })(i);
    ctrl.hidden = n < 2;
  }
  function step() { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; }
  function index() { return Math.round(track.scrollLeft / step()); }
  function go(i) { track.scrollTo({ left: Math.max(0, i) * step(), behavior: 'smooth' }); }
  function update() {
    buildDots();
    var max = track.scrollWidth - track.clientWidth - 2;
    var i = track.scrollLeft >= max ? dots.length - 1 : Math.min(dots.length - 1, index());
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); d.setAttribute('aria-selected', k === i); });
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
    sides.forEach(function (b) { b.disabled = +b.dataset.dir < 0 ? prev.disabled : next.disabled; });
  }
  prev.addEventListener('click', function () { go(index() - 1); });
  sides.forEach(function (b) {
    b.hidden = false;
    b.addEventListener('click', function () { go(index() + (+b.dataset.dir)); });
  });
  next.addEventListener('click', function () { go(index() + 1); });
  track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
  });

  // "Lire la suite": one card open at a time
  cards.forEach(function (c) {
    var b = c.querySelector('.ptile-more');
    if (!b) return;
    b.addEventListener('click', function () {
      var open = !c.classList.contains('is-open');
      cards.forEach(function (o) { o.classList.remove('is-open'); var ob = o.querySelector('.ptile-more'); if (ob) ob.setAttribute('aria-expanded', 'false'); });
      c.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open);
    });
  });
  // tapping the open card's copy area closes it again on touch screens
  track.addEventListener('click', function (e) {
    var c = e.target.closest('.ptile.is-open');
    if (c && !e.target.closest('a,.ptile-more')) c.classList.remove('is-open');
  });

  update();
})();
