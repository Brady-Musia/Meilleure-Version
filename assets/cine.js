/* The beard sequence below the founder: a small corner inset that opens to
   full bleed on scroll, then lets three statements arrive in the corner.

   Cinematic version: the frame never changes size in the layout. It is always
   full-stage; what moves is a clip window (clip-path, cheap to animate) and a
   matching transform on the footage, so the whole shot stays framed inside
   the small window and then "dollies" out to fill the screen. Scroll sets a
   target and a damped rAF loop glides towards it, so wheel steps and
   trackpad jitter turn into one continuous, eased camera move. */
(function () {
  var track = document.getElementById('geste');
  if (!track) return;
  var stage    = track.querySelector('.cine-stage');
  var box      = document.getElementById('cineBox');
  var vid      = box && box.querySelector('video');
  var scrim    = box && box.querySelector('.cine-scrim');
  var intro    = document.getElementById('cineIntro');
  var vidTitle = document.getElementById('cineVidTitle');
  if (!stage || !box) return;

  var caps = [].map.call(track.querySelectorAll('.cine-cap'), function (el) {
    var b = (el.getAttribute('data-band') || '').split(',').map(Number);
    return { el: el, a: b[0], b: b[1], c: b[2], d: b[3] };
  });

  // Choreography, in scroll progress: the copy is read first, then fades out
  // completely, and only then does the frame open — so the growing frame can
  // never cover copy that is still on screen.
  var HOLD       = 0.12;        // copy fully readable until here
  var FADE_END   = 0.19;        // copy gone by here
  var GROW_START = 0.19;        // frame starts opening here
  var GROW_END   = 0.44;        // the frame is full bleed by here
  var LOW        = 0.04;        // inset sits this low (share of stage height)
  var SMALL_MAX  = 460;         // starting width never exceeds this, in px
  var RADIUS     = 10;          // inset corner radius, eases to 0
  var PUSH       = 0.10;        // extra zoom on the footage in the small state
  var DAMP       = 0.14;        // glide time constant, seconds
  // a 30% inset is a postage stamp on a phone, so start proportionally bigger
  function smallFraction(vw) { return vw < 700 ? 0.62 : 0.30; }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  // slow start, long soft landing: reads like a camera move, not a slider
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function band(p, a, b, c, d) {
    if (p <= a || p >= d) return 0;
    if (p < b) return smooth((p - a) / (b - a));
    if (p <= c) return 1;
    return 1 - smooth((p - c) / (d - c));
  }

  var copy = intro && intro.querySelector('.cine-intro-copy');
  var L = { vw: -1, vh: -1, bottom: 0, right: 0 };

  // Measure the opening copy once per viewport size. If it is taller than the
  // screen allows (small phones, short laptops), shrink it just enough to fit,
  // so its last line is never cut off.
  function layout(vw, vh) {
    L.vw = vw; L.vh = vh;
    if (!copy) return;
    copy.style.transform = '';
    var top = copy.offsetTop, hgt = copy.offsetHeight;
    var room = vh - Math.max(12, vh * LOW) - top;
    var sc = hgt > room && room > 0 ? room / hgt : 1;
    if (sc < 1) {
      copy.style.transformOrigin = 'left top';
      copy.style.transform = 'scale(' + sc.toFixed(4) + ')';
    }
    var introLeft = intro.getBoundingClientRect().left - stage.getBoundingClientRect().left;
    L.bottom = top + hgt * sc;
    L.right  = introLeft + copy.offsetLeft + copy.offsetWidth * sc;
  }

  function progress() {
    var total = track.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp01(-track.getBoundingClientRect().top / total);
  }

  function paint(p) {
    var vw = stage.clientWidth, vh = stage.clientHeight;
    if (vw !== L.vw || vh !== L.vh) layout(vw, vh);
    var t = ease(clamp01((p - GROW_START) / (GROW_END - GROW_START)));

    var smallW = Math.min(vw * smallFraction(vw), SMALL_MAX);
    var smallH = smallW * 9 / 16;

    // The inset must start clear of the copy: where they share the same
    // columns (phones), cap its height to the room left under the copy.
    var hideLabel = false;
    if (vw - vw * 0.06 - smallW < L.right + 16) {
      var labelH = vidTitle ? vidTitle.offsetHeight + 16 : 0;
      var avail = vh - vh * LOW - labelH - L.bottom - 16;
      if (smallH > avail) {
        if (avail < 60) { smallH = 0; hideLabel = true; }
        else smallH = avail;
        smallW = smallH * 16 / 9;
      }
    }

    // the window, in stage pixels
    var w = smallW + (vw - smallW) * t;
    var h = smallH + (vh - smallH) * t;
    var right  = vw * 0.06 * (1 - t);
    var bottom = vh * LOW * (1 - t);
    var left = vw - right - w, top = vh - bottom - h;

    if (t > 0.999) {
      box.style.clipPath = 'none';
    } else {
      var r = (RADIUS * (1 - t)).toFixed(1);
      box.style.clipPath = 'inset(' + top.toFixed(2) + 'px ' + right.toFixed(2) + 'px ' +
        bottom.toFixed(2) + 'px ' + left.toFixed(2) + 'px round ' + r + 'px)';
    }

    // Keep the whole shot framed inside the window: scale the full-stage
    // footage down to cover the window (plus a gentle push-in that settles as
    // the frame opens), centred on it.
    var k = Math.max(w / vw, h / vh) * (1 + PUSH * (1 - t));
    var cx = left + w / 2, cy = top + h / 2;
    var tf = t > 0.999 ? 'none'
      : 'translate(' + (cx - vw * k / 2).toFixed(2) + 'px,' + (cy - vh * k / 2).toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
    if (vid) vid.style.transform = tf;
    if (scrim) scrim.style.transform = tf;

    // the opening copy and the label clear out before the frame opens
    var fade = 1 - smooth(clamp01((p - HOLD) / (FADE_END - HOLD)));
    if (intro) {
      intro.style.opacity = fade.toFixed(3);
      intro.style.transform = 'translateX(-50%) translateY(' + ((1 - fade) * -18).toFixed(1) + 'px)';
    }
    if (vidTitle) {
      vidTitle.style.opacity = (hideLabel ? 0 : fade).toFixed(3);
      vidTitle.style.right   = right.toFixed(1) + 'px';
      vidTitle.style.bottom  = (bottom + h + 16).toFixed(1) + 'px';
    }

    for (var i = 0; i < caps.length; i++) {
      var c = caps[i], o = band(p, c.a, c.b, c.c, c.d);
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
    }
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    paint(1);
    caps.forEach(function (c, i) { c.el.style.opacity = i === caps.length - 1 ? '1' : '0'; });
  } else {
    // damped follow: cur glides to the scroll target with a fixed time
    // constant, independent of frame rate
    var cur = progress(), target = cur, running = false, last = 0;
    var tick = function (now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      cur += (target - cur) * (1 - Math.exp(-dt / DAMP));
      if (Math.abs(target - cur) < 0.0004) cur = target;
      paint(cur);
      if (cur !== target) requestAnimationFrame(tick);
      else { running = false; last = 0; }
    };
    var onScroll = function () {
      target = progress();
      // far jumps (anchor links, page load mid-section) snap instead of gliding
      if (Math.abs(target - cur) > 0.35) cur = target;
      if (!running) { running = true; requestAnimationFrame(tick); }
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { L.vw = -1; onScroll(); });
    // web fonts change the copy's height: re-measure once they are in
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { L.vw = -1; onScroll(); });
    }
    paint(cur);
  }

  // only let the clip run while it is actually on screen
  if (vid && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); }
        else vid.pause();
      });
    }, { threshold: 0.12 }).observe(track);
  }
})();
