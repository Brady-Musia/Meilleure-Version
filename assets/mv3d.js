/* Coworking page — the 3D clippers travel down the page with the scroll.

   Three invisible anchors mark where the object rests:
     0  bottom-right corner of the hero (large)
     1  under the opening paragraphs of "Le concept" (small)
     2  the empty space beside the professional form (medium)
   Each anchor "owns" the scroll position at which it sits mid-screen. Between
   two such positions the object glides from one anchor to the next (page
   coordinates, eased), so it seems to follow the reader down and land in
   each spot. A damped loop smooths wheel steps into one continuous move. */
(function () {
  var fly = document.getElementById('mv3d');
  if (!fly) return;
  var viewer = fly.querySelector('model-viewer');
  var anchors = [].slice.call(document.querySelectorAll('[data-mv3d]'))
    .sort(function (a, b) { return +a.dataset.mv3d - +b.dataset.mv3d; });
  if (!anchors.length) return;

  // Browsers won't fetch a .glb from a page opened straight from disk:
  // fall back to the inlined copy in that case.
  if (viewer) {
    if (location.protocol === 'file:') {
      var s = document.createElement('script');
      s.src = 'assets/objet-mv.glb.js';
      s.onload = function () { if (window.MV3D_SRC) viewer.setAttribute('src', window.MV3D_SRC); };
      document.head.appendChild(s);
    } else {
      viewer.setAttribute('src', 'assets/objet-mv.glb');
    }
  }

  var A = [], keys = [], baseW = 1, baseH = 1;

  function measure() {
    var sy = window.scrollY, vh = window.innerHeight;
    A = anchors.map(function (el) {
      var r = el.getBoundingClientRect();
      var boost = parseFloat(getComputedStyle(el).getPropertyValue('--mv3d-boost')) || 1;
      // a boosted spot keeps its top edge and swells downward / sideways
      var w = r.width * boost, h = r.height * boost;
      return { x: r.left + window.scrollX - (w - r.width) / 2, y: r.top + sy, w: w, h: h,
               cy: r.top + sy + r.height / 2 };
    });
    baseW = 1; baseH = 1;
    A.forEach(function (a) { if (a.h > baseH) { baseH = a.h; baseW = a.w; } });
    fly.style.width = baseW + 'px';
    fly.style.height = baseH + 'px';
    // scroll position at which each anchor sits mid-screen, kept increasing
    var maxScroll = document.documentElement.scrollHeight - vh;
    keys = A.map(function (a, i) {
      return i === 0 ? 0 : Math.min(maxScroll, Math.max(0, a.cy - vh / 2));
    });
    for (var i = 1; i < keys.length; i++) if (keys[i] <= keys[i - 1]) keys[i] = keys[i - 1] + 1;
  }

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function paint(s) {
    if (!A.length) return;
    var i = 0;
    while (i < keys.length - 1 && s > keys[i + 1]) i++;
    var a = A[i], b = A[Math.min(i + 1, A.length - 1)];
    var raw = i >= keys.length - 1 ? 0 : (s - keys[i]) / (keys[i + 1] - keys[i]);
    raw = Math.max(0, Math.min(1, raw));
    var t = ease(raw);
    var x = a.x + (b.x - a.x) * t;
    var y = a.y + (b.y - a.y) * t;
    var h = a.h + (b.h - a.h) * t;
    var w = a.w + (b.w - a.w) * t;
    var k = h / baseH;
    // centre the (base-size) box on the interpolated rect
    x += (w - baseW * k) / 2;
    // a gentle tilt while travelling, level again on landing
    var tilt = Math.sin(Math.PI * t) * (b.x < a.x ? -9 : 9);
    fly.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' +
      k.toFixed(4) + ') rotate(' + tilt.toFixed(2) + 'deg)';
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = window.scrollY, target = cur, running = false, last = 0;
  var DAMP = 0.16;

  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    cur += (target - cur) * (1 - Math.exp(-dt / DAMP));
    if (Math.abs(target - cur) < 0.5) cur = target;
    paint(cur);
    if (cur !== target) requestAnimationFrame(tick);
    else { running = false; last = 0; }
  }
  function onScroll() {
    target = reduce ? 0 : window.scrollY;
    if (Math.abs(target - cur) > window.innerHeight * 2) cur = target;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function relayout() { measure(); cur = target = reduce ? 0 : window.scrollY; paint(cur); }

  relayout();
  fly.classList.add('ready');
  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
})();
