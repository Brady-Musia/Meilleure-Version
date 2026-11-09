/* Home "Notre concept": the razor-cut sequence.
   The section pins a full-screen stage; scrolling slices each pillar in
   over the previous one along a slanted line, with a gold blade riding the
   cut. Copy and the giant numeral move in after the cut. Damped like the
   other scroll scenes, so wheel steps become one smooth gesture. */
(function () {
  var root = document.getElementById('razor');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;                      // plain stacked panels

  var slides = [].slice.call(root.querySelectorAll('.razor-slide'));
  var line = root.querySelector('.razor-blade line');
  var rail = [].slice.call(root.querySelectorAll('.razor-rail li'));
  var N = slides.length;
  root.classList.add('is-live');
  slides.forEach(function (s, i) { s.style.zIndex = i + 1; });

  var SLANT = 22;                          // horizontal offset of the cut, in %
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function progress() {
    var total = root.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp01(-root.getBoundingClientRect().top / total);
  }

  function paint(p) {
    var seg = p * (N - 1);                 // 0 … N-1
    var bladeShown = false, current = 0;
    for (var i = 0; i < N; i++) {
      var s = slides[i];
      var img = s.querySelector('.razor-img');
      var num = s.querySelector('.razor-num');
      var copy = s.querySelector('.razor-copy');
      // cut-in amount for this slide (slide 0 is always in)
      var t = i === 0 ? 1 : ease(clamp01((seg - (i - 1) - 0.22) / 0.62));
      if (i > 0) {
        // the cut line runs from (a%,0) to (a-SLANT %,100); a: 100+SLANT → 0
        var a = (100 + SLANT) * (1 - t);
        s.style.clipPath = t >= 1 ? 'none' : (t <= 0 ? 'polygon(100% 0,100% 0,100% 100%,100% 100%)' :
          'polygon(' + a.toFixed(2) + '% 0,100% 0,100% 100%,' + (a - SLANT).toFixed(2) + '% 100%)');
        if (t > 0 && t < 1 && line) {
          line.setAttribute('x1', a.toFixed(2)); line.setAttribute('x2', (a - SLANT).toFixed(2));
          bladeShown = true;
        }
      }
      if (t >= 0.5) current = i;
      // how far this slide has been covered by the next one
      var out = i < N - 1 ? ease(clamp01((seg - i - 0.22) / 0.62)) : 0;
      // photo: settles from a slight zoom; drifts left as it is covered
      img.style.transform = 'scale(' + (1.12 - 0.12 * t).toFixed(4) + ') translateX(' + (-4 * out).toFixed(2) + '%)';
      // numeral: slides in from the right after the cut
      var nIn = smooth(clamp01((t - 0.45) / 0.55));
      num.style.opacity = (nIn * (1 - out)).toFixed(3);
      num.style.translate = ((1 - nIn) * 18 - out * 10).toFixed(2) + '% 0';
      // copy: rises in last, fades as the next cut arrives
      var cIn = smooth(clamp01((t - 0.6) / 0.4));
      copy.style.opacity = (cIn * (1 - smooth(clamp01(out / 0.6)))).toFixed(3);
      copy.style.transform = 'translateY(' + ((1 - cIn) * 34).toFixed(1) + 'px)';
    }
    if (line) line.parentNode.style.opacity = bladeShown ? '1' : '0';
    rail.forEach(function (li, k) { li.classList.toggle('on', k === current); });
  }

  var cur = progress(), target = cur, running = false, last = 0, DAMP = 0.12;
  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    cur += (target - cur) * (1 - Math.exp(-dt / DAMP));
    if (Math.abs(target - cur) < 0.0004) cur = target;
    paint(cur);
    if (cur !== target) requestAnimationFrame(tick); else { running = false; last = 0; }
  }
  function onScroll() {
    target = progress();
    if (Math.abs(target - cur) > 0.5) cur = target;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint(cur);
})();
