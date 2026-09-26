/* Mobile / tablet navigation: burger button + full-screen menu.
   Built from the page's own nav links, so every page stays in sync
   without repeating the markup. Loaded before booking.js so the
   menu's "Prendre rendez-vous" button is wired like the others. */
(function () {
  var header = document.getElementById('siteHeader');
  var nav = header && header.querySelector('nav.mainnav');
  if (!header || !nav) return;
  var bar = header.querySelector('.container');

  // burger button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'navtoggle';
  btn.setAttribute('aria-label', 'Ouvrir le menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobileMenu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  bar.appendChild(btn);

  // full-screen panel
  var menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobileMenu';
  menu.setAttribute('aria-hidden', 'true');
  var links = [].map.call(nav.querySelectorAll('a'), function (a, i) {
    var cur = a.getAttribute('aria-current') ? ' aria-current="page"' : '';
    return '<a href="' + a.getAttribute('href') + '"' + cur + ' style="--i:' + i + '">' + a.innerHTML + '</a>';
  }).join('');
  menu.innerHTML =
    '<nav class="mobile-menu-links" aria-label="Menu principal">' + links + '</nav>' +
    '<div class="mobile-menu-foot">' +
      '<a href="#reserver" data-booking class="btn btn-gold">Prendre rendez-vous</a>' +
      '<p>21 Place des Martyrs de la Résistance<br>Bordeaux — Chartrons</p>' +
    '</div>';
  document.body.appendChild(menu);

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  btn.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('menu-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  // back to desktop width: make sure the page isn't left locked
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1150) setOpen(false);
  });
})();
