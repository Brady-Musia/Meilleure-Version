/* Header: transparent while the hero owns the screen, solid afterwards.
   When a hero track exists the state is driven by the hero script below so
   both share one eased progress value; this listener is the fallback. */
(function () {
  var header = document.getElementById('siteHeader');
  if (!header) return;
  if (document.getElementById('heroVid')) return;   // hero script takes over
  var onScroll = function () {
    header.classList.toggle('solid', window.scrollY > 40);
    header.classList.toggle('on-hero', window.scrollY <= 40);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();



/* Hero video scrubbed by scroll position.
   The video is encoded all-keyframe (every frame is an I-frame) so seeking to
   an arbitrary time is cheap — that is what makes the scrub smooth.
   Smoothing is an exponential ease toward the scroll target, stepped by real
   elapsed time so 60 Hz and 120 Hz displays behave identically. */
(function () {
  var track  = document.getElementById('accueil');
  var vid    = document.getElementById('heroVid');
  var inner  = document.getElementById('heroInner');
  var cue    = document.getElementById('heroCue');
  var header = document.getElementById('siteHeader');
  if (!track || !vid) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var current = 0, target = 0, lastFrame = -1, lastT = 0;
  var FPS = 15;                 // must match the encode (see hero_scroll.mp4)

  function getProgress() {
    var total = track.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    var top = track.getBoundingClientRect().top;
    return Math.max(0, Math.min(1, -top / total));
  }

  // iOS/Safari paint the first frame only after a real play() — prime the
  // element (play then immediately pause) as soon as it is on screen.
  var primed = false, io = null;
  function prime() {
    if (primed) return;
    var p = vid.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        primed = true;
        vid.pause();
        if (vid.currentTime < 0.01) vid.currentTime = 0.001;
        if (io) io.disconnect();
      }).catch(function () { /* retried by the other triggers below */ });
    }
  }
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) prime(); });
    }, { threshold: 0.01 });
    io.observe(track);
  }
  vid.addEventListener('loadeddata', prime);
  vid.addEventListener('canplay', prime);
  ['touchstart', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, prime, { passive: true, once: false });
  });

  // ── the scripted sequence ────────────────────────────────────────────────
  // Each statement is given four scroll positions: start fading in, fully in,
  // start fading out, fully out. The closing block only fades in and stays.
  var msgs = [].map.call(document.querySelectorAll('.hero-msg'), function (el) {
    var b = (el.getAttribute('data-band') || '').split(',').map(Number);
    return { el: el, a: b[0], b: b[1], c: b[2], d: b[3] };
  });
  // The video finishes scrubbing as the closing block lands; the remaining
  // scroll is a hold so the headline and buttons stay readable on screen
  // instead of flashing past in the last few pixels of the track.
  var FINAL_IN = 0.76, FINAL_FULL = 0.85;
  var VID_SPAN = 0.78;

  function smooth(t) { return t * t * (3 - 2 * t); }

  // opacity + vertical travel for a four-point band
  function band(p, a, b, c, d) {
    if (p <= a || p >= d) return { o: 0, y: p <= a ? 18 : -18 };
    if (p < b) { var t = smooth((p - a) / (b - a)); return { o: t, y: 18 * (1 - t) }; }
    if (p <= c) return { o: 1, y: 0 };
    var u = smooth((p - c) / (d - c));
    return { o: 1 - u, y: -18 * u };
  }

  function paintOverlay(p) {
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i], s = band(p, m.a, m.b, m.c, m.d);
      m.el.style.opacity = s.o.toFixed(3);
      m.el.style.transform = 'translateY(' + s.y.toFixed(2) + 'px)';
    }
    if (inner) {
      var f = (p - FINAL_IN) / (FINAL_FULL - FINAL_IN);
      f = f < 0 ? 0 : (f > 1 ? 1 : f);
      f = smooth(f);
      inner.style.opacity = f.toFixed(3);
      inner.style.transform = 'translateY(' + (22 * (1 - f)).toFixed(2) + 'px)';
      inner.style.pointerEvents = f > 0.5 ? 'auto' : 'none';
    }
    // the cue retires as soon as the visitor starts scrolling
    if (cue) cue.style.opacity = Math.max(0, 1 - p * 10).toFixed(3);
  }

  // The bar reacts to the real scroll position, not the eased video value, so
  // it never lags behind the visitor leaving the hero.
  function paintHeader(rawP) {
    if (!header) return;
    var done = rawP >= 0.99;
    header.classList.toggle('solid', done);
    header.classList.toggle('on-hero', !done);
  }

  if (reduce) {
    // No scrub: skip the sequence and present the closing block straight away.
    msgs.forEach(function (m) { m.el.style.display = 'none'; });
    if (inner) { inner.style.opacity = '1'; inner.style.transform = 'none'; inner.style.pointerEvents = 'auto'; }
    if (cue) cue.style.display = 'none';
    if (header) header.classList.add('on-hero');
    var onSc = function () {
      var past = window.scrollY > (track.offsetHeight - window.innerHeight - 8);
      header.classList.toggle('solid', past);
      header.classList.toggle('on-hero', !past);
    };
    document.addEventListener('scroll', onSc, { passive: true });
    onSc();
    return;
  }

  function tick(now) {
    requestAnimationFrame(tick);

    var rawDt = lastT ? (now - lastT) / 1000 : 0.016;
    lastT = now;

    target = getProgress();

    // A long gap between frames means the loop was starved — a background
    // tab, a stall, a throttled window. Easing from there would crawl to
    // catch up, so snap straight to the real scroll position instead.
    if (rawDt > 0.12) {
      current = target;
    } else {
      var k = 1 - Math.pow(0.0001, rawDt);  // frame-rate independent easing
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) current = target;
    }

    paintOverlay(current);
    paintHeader(target);

    if (!vid.duration) return;
    if (vid.readyState < 2) return;
    if (vid.seeking) return;                // never queue seeks on the decoder

    // Snap to the nearest encoded frame: seeking between two positions inside
    // the same frame costs a decode but changes nothing on screen, and those
    // redundant seeks are what make the scrub feel laggy.
    var vp = current / VID_SPAN;
    if (vp > 1) vp = 1;
    var maxFrame = Math.max(0, Math.round(vid.duration * FPS) - 1);
    var frame = Math.round(vp * vid.duration * FPS);
    if (frame < 0) frame = 0;
    if (frame > maxFrame) frame = maxFrame;
    if (frame === lastFrame) return;
    lastFrame = frame;
    vid.currentTime = (frame + 0.5) / FPS;  // mid-frame: avoids boundary ambiguity
  }
  requestAnimationFrame(tick);
})();



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
