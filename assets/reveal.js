/* Reveal-on-scroll for the editorial sections. The hero and the beard
   sequence are left out — they already have their own scroll choreography and
   a second layer of motion there would fight it. Elements are tagged from
   here rather than in the markup, so the HTML stays clean and the page is
   never left hidden when this script does not run. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // groups whose children come in one after the other
  var STAGGERED = [
    '.triptych', '.p-grid', '.steps', '.pro-grid', '.cw-grid', '.reviews-grid'
  ];
  // single blocks that simply rise into place
  var SINGLES = [
    '#univers .sec-head', '#prestations .sec-head', '#experience .sec-head',
    '#professionnels .sec-head', '.reviews-head',
    '.pub-photo', '.pub-copy',
    '.bilan-photo', '.bilan > div:last-child',
    '.founder-mark', '.founder > div:last-child',
    '.cw-intro > div', '.cw-foot', '.pro-foot', '.p-grid-foot',
    '.practical > div', '.reviews-note', '.reviews-foot'
  ];

  var items = [];
  SINGLES.forEach(function (sel) {
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      items.push({ el: el, delay: 0 });
    });
  });
  STAGGERED.forEach(function (sel) {
    [].forEach.call(document.querySelectorAll(sel), function (group) {
      [].forEach.call(group.children, function (child, i) {
        items.push({ el: child, delay: Math.min(i * 90, 450) });
      });
    });
  });
  if (!items.length) return;

  document.documentElement.classList.add('has-reveal');
  items.forEach(function (it) {
    it.el.classList.add('reveal');
    if (it.delay) it.el.style.transitionDelay = it.delay + 'ms';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);                 // reveal once, then stop watching
      // drop the delay afterwards so a later hover/transition is not held back
      setTimeout(function () { e.target.style.transitionDelay = ''; }, 1200);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach(function (it) { io.observe(it.el); });

  // anything already on screen at load reveals immediately rather than waiting
  requestAnimationFrame(function () {
    items.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) it.el.classList.add('in');
    });
  });
})();
