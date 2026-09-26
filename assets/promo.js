/* À propos — "La maison" promo block.
   A short text over three photos (white rules between them). Scrolling on,
   the middle photo opens to fill the screen, pushing the two side photos out
   towards the corners, then the brand line appears over it.

   Same technique as the home-page film: the full-size photo layer never
   changes size in the layout; a clip window (clip-path) opens from the
   middle slot to the whole stage, and the photo is scaled to stay framed in
   that window. A damped loop turns wheel steps into one smooth move. */
(function () {
  var track = document.getElementById('promoTrack');
  if (!track) return;
  var stage = track.querySelector('.promo-stage');
  var slot  = track.querySelector('.promo-slot');
  var full  = track.querySelector('.promo-full');
  var img   = full && full.querySelector('img');
  var copy  = track.querySelector('.promo-copy');
  var left  = track.querySelector('.promo-side.l');
  var right = track.querySelector('.promo-side.r');
  var slog  = track.querySelector('.promo-slogan');
  var scrim = track.querySelector('.promo-scrim');
  if (!stage || !slot || !full) return;

  var HOLD = 0.12, GROW_END = 0.72, SLOG_A = 0.70, SLOG_B = 0.86;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var G = null; // geometry of the resting layout, stage-relative
  function measure() {
    // measure with the side photos at rest
    if (left) left.style.transform = '';
    if (right) right.style.transform = '';
    var s = stage.getBoundingClientRect();
    var r = slot.getBoundingClientRect();
    G = {
      vw: s.width, vh: s.height,
      x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height,
      lr: left ? left.getBoundingClientRect().right - s.left : 0,
      rl: right ? right.getBoundingClientRect().left - s.left : 0
    };
    // the photo keeps its own proportions: a box of its native aspect that
    // just covers the stage; it is then scaled to cover the moving window,
    // so the small window shows the whole shot, even on a tall phone screen
    if (img) {
      var ar = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1672 / 941;
      G.bw = Math.max(G.vw, G.vh * ar); G.bh = G.bw / ar;
      img.style.width = G.bw + 'px'; img.style.height = G.bh + 'px';
    }
  }

  function progress() {
    var total = track.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp01(-track.getBoundingClientRect().top / total);
  }

  function paint(p) {
    if (!G || G.vw !== stage.clientWidth || G.vh !== stage.clientHeight) measure();
    var vw = G.vw, vh = G.vh;
    var t = ease(clamp01((p - HOLD) / (GROW_END - HOLD)));

    // the window: from the middle slot to the whole stage
    var x = G.x * (1 - t), y = G.y * (1 - t);
    var w = G.w + (vw - G.w) * t, h = G.h + (vh - G.h) * t;
    var rr = vw - x - w, bb = vh - y - h;
    full.style.clipPath = t > 0.999 ? 'none' :
      'inset(' + y.toFixed(1) + 'px ' + rr.toFixed(1) + 'px ' + bb.toFixed(1) + 'px ' + x.toFixed(1) + 'px)';
    if (img) {
      var k = Math.max(w / G.bw, h / G.bh);
      img.style.transform =
        'translate(' + (x + w / 2 - G.bw * k / 2).toFixed(1) + 'px,' + (y + h / 2 - G.bh * k / 2).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
    }

    // side photos are pushed out by the growing window, drifting to the corners
    var gapL = G.x - G.lr, gapR = G.rl - (G.x + G.w);
    if (left) {
      var dxL = x - gapL - G.lr;
      left.style.transform = 'translate(' + dxL.toFixed(1) + 'px,' + (-t * vh * 0.18).toFixed(1) + 'px) scale(' + (1 - 0.25 * t).toFixed(3) + ')';
      left.style.opacity = (1 - smooth(clamp01((t - 0.55) / 0.45))).toFixed(3);
    }
    if (right) {
      var dxR = (x + w) + gapR - G.rl;
      right.style.transform = 'translate(' + dxR.toFixed(1) + 'px,' + (t * vh * 0.18).toFixed(1) + 'px) scale(' + (1 - 0.25 * t).toFixed(3) + ')';
      right.style.opacity = (1 - smooth(clamp01((t - 0.55) / 0.45))).toFixed(3);
    }

    // the short copy lifts away as the photo starts to open
    if (copy) {
      var c = smooth(clamp01((p - HOLD) / 0.18));
      copy.style.opacity = (1 - c).toFixed(3);
      copy.style.transform = 'translateY(' + (-c * 40).toFixed(1) + 'px)';
    }

    // brand line over the full-screen photo
    var sl = smooth(clamp01((p - SLOG_A) / (SLOG_B - SLOG_A)));
    if (slog) {
      slog.style.opacity = sl.toFixed(3);
      slog.style.transform = 'translateY(' + ((1 - sl) * 24).toFixed(1) + 'px)';
    }
    if (scrim) scrim.style.opacity = sl.toFixed(3);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { track.classList.add('is-static'); return; }

  var cur = progress(), target = cur, running = false, last = 0, DAMP = 0.14;
  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    cur += (target - cur) * (1 - Math.exp(-dt / DAMP));
    if (Math.abs(target - cur) < 0.0004) cur = target;
    paint(cur);
    if (cur !== target) requestAnimationFrame(tick);
    else { running = false; last = 0; }
  }
  function onScroll() {
    target = progress();
    if (Math.abs(target - cur) > 0.5) cur = target;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function relayout() { G = null; paint(cur); onScroll(); }

  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (img && !img.complete) img.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  track.classList.add('is-live');
  paint(cur);
})();
