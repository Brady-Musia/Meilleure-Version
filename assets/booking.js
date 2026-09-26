/* ==================================================================
   PRISE DE RENDEZ-VOUS — un seul endroit à modifier
   ------------------------------------------------------------------
   Collez entre les guillemets l'adresse de votre site de réservation
   en ligne (Planity, Treatwell, Calendly…), par exemple :
     var MV_BOOKING_URL = 'https://www.planity.com/meilleure-version';
   Tous les boutons « Prendre rendez-vous » / « Réserver » du site
   s'ouvriront alors sur cette page, dans un nouvel onglet.
   Tant que c'est vide, un petit message l'indique au visiteur.
   ================================================================== */
var MV_BOOKING_URL = '';

(function () {
  var links = document.querySelectorAll('[data-booking]');
  if (!links.length) return;

  if (MV_BOOKING_URL) {
    [].forEach.call(links, function (a) {
      a.href = MV_BOOKING_URL;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    return;
  }

  // not configured yet: say so politely instead of going nowhere
  var toast;
  function show() {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'booking-toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML = 'La réservation en ligne ouvre très bientôt.<br>' +
        'En attendant, <a href="contact.html">écrivez-nous</a> ou appelez le salon.';
      document.body.appendChild(toast);
    }
    toast.classList.add('on');
    clearTimeout(show.t);
    show.t = setTimeout(function () { toast.classList.remove('on'); }, 5200);
  }
  [].forEach.call(links, function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); show(); });
  });
})();
