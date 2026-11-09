/* ==================================================================
   PRISE DE RENDEZ-VOUS + « MON POINT CAPILLAIRE »
   ------------------------------------------------------------------
   1) RÉGLAGE À FAIRE : collez entre les guillemets l'adresse de la
      page de réservation Planity du salon, par exemple :
        var MV_BOOKING_URL = 'https://www.planity.com/meilleure-version';
      Tous les boutons « Prendre rendez-vous » / « Réserver » du site
      (attribut data-booking) mènent alors à cette page.
      Tant que c'est vide, un petit message l'indique au visiteur.

   2) « Mon point capillaire » : avant d'aller sur Planity, une fenêtre
      facultative propose au visiteur de signaler une préoccupation
      capillaire et, le cas échéant, lui présente le bilan
      trichologique cosmétique du salon.
      Pour désactiver cette étape et aller droit à Planity,
      mettez MV_POINT_CAPILLAIRE à false.

   Aucune réponse n'est enregistrée ni transmise : tout reste dans le
   navigateur, le temps de la visite. Aucun diagnostic médical n'est
   posé, aucune prestation n'est présélectionnée sur Planity.
   ================================================================== */
var MV_BOOKING_URL = '';
var MV_POINT_CAPILLAIRE = true;

(function () {
  'use strict';

  var links = document.querySelectorAll('[data-booking]');
  if (!links.length) return;

  /* ---------- message si la réservation n'est pas encore configurée ---- */
  var toast;
  function showToast() {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'booking-toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML = 'La réservation en ligne ouvre très bientôt.<br>' +
        'En attendant, <a href="contact.html">écrivez-nous</a> ou appelez le salon.';
      document.body.appendChild(toast);
    }
    toast.classList.add('on');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.classList.remove('on'); }, 5200);
  }

  /* ---------- départ vers Planity ------------------------------------- */
  function goToBooking() {
    if (!MV_BOOKING_URL) { showToast(); return false; }
    var w = window.open(MV_BOOKING_URL, '_blank', 'noopener');
    if (!w) window.location.href = MV_BOOKING_URL;   // onglet bloqué : même onglet
    return true;
  }

  /* les liens restent de vrais liens (clic milieu, « ouvrir dans un onglet ») */
  if (MV_BOOKING_URL) {
    [].forEach.call(links, function (a) {
      a.href = MV_BOOKING_URL;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* ---------- sans le point capillaire : comportement direct ----------- */
  if (!MV_POINT_CAPILLAIRE) {
    if (!MV_BOOKING_URL) {
      [].forEach.call(links, function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); showToast(); });
      });
    }
    return;
  }

  /* ==================================================================
     LA FENÊTRE « MON POINT CAPILLAIRE »
     ================================================================== */

  var CONCERNS = [
    "J'ai des pellicules.",
    'Mon cuir chevelu me démange.',
    'Je ressens un inconfort au niveau du cuir chevelu.',
    'Mon cuir chevelu regraisse rapidement.',
    'Mes cheveux et/ou mon cuir chevelu sont gras.',
    'Je remarque une perte de cheveux.',
    'Mes cheveux deviennent plus fins.',
    'Mes cheveux sont secs ou cassants.',
    'Mon cuir chevelu présente des rougeurs.',
    'Mon cuir chevelu présente des plaies ou des saignements.',
    'Je souhaite mieux connaître les besoins de mes cheveux.'
  ];
  var NONE_LABEL = "Je n'ai aucune préoccupation particulière.";

  /* le dossier des images change selon la page ; on le déduit du logo */
  function assetsBase() {
    var ref = document.querySelector('header .brand img, link[rel="stylesheet"][href*="style.css"]');
    if (ref) {
      var src = ref.getAttribute('src') || ref.getAttribute('href') || '';
      var cut = src.indexOf('assets/');
      if (cut !== -1) return src.slice(0, cut) + 'assets/';
    }
    return 'assets/';
  }

  var overlay, dialogEl, lastFocus;

  function build() {
    var boxes = CONCERNS.map(function (label, i) {
      return '<label class="mv-pc__check">' +
               '<input type="checkbox" value="' + i + '" data-concern>' +
               '<span class="mv-pc__box" aria-hidden="true"></span>' +
               '<span class="mv-pc__label">' + label + '</span>' +
             '</label>';
    }).join('');

    overlay = document.createElement('div');
    overlay.className = 'mv-pc';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="mv-pc__sheet" role="dialog" aria-modal="true" aria-labelledby="mv-pc-title">' +
        '<button type="button" class="mv-pc__close" data-pc="close" aria-label="Fermer la fenêtre">' +
          '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '<div class="mv-pc__scroll">' +

          /* ---------- étape 1 : message d'accueil ---------- */
          '<section class="mv-pc__step" data-step="accueil">' +
            '<img class="mv-pc__emblem" src="' + assetsBase() + 'emblem.png" alt="" aria-hidden="true">' +
            '<p class="mv-pc__eyebrow">Meilleure Version</p>' +
            '<h2 class="mv-pc__title" id="mv-pc-title">Un mot sur vos cheveux&nbsp;?</h2>' +
            '<p class="mv-pc__text">Chez Meilleure Version, nous accordons une attention ' +
              'particulière à vos cheveux et à votre cuir chevelu.</p>' +
            '<p class="mv-pc__text">Avez-vous une préoccupation concernant vos cheveux ou ' +
              'votre cuir chevelu que vous souhaitez nous signaler aujourd\'hui&nbsp;?</p>' +
            '<div class="mv-pc__actions">' +
              '<button type="button" class="btn btn-gold" data-pc="start">Faire mon point capillaire</button>' +
              '<button type="button" class="btn btn-ghost-dark" data-pc="skip">Continuer vers la réservation</button>' +
            '</div>' +
            '<p class="mv-pc__note">Cette étape est entièrement facultative.</p>' +
          '</section>' +

          /* ---------- étape 2 : questionnaire ---------- */
          '<section class="mv-pc__step" data-step="questionnaire" hidden>' +
            '<p class="mv-pc__eyebrow">Mon point capillaire</p>' +
            '<h2 class="mv-pc__title">Quelles sont vos préoccupations&nbsp;?</h2>' +
            '<p class="mv-pc__text">Concernant vos cheveux ou votre cuir chevelu. ' +
              'Cochez une ou plusieurs réponses.</p>' +
            '<div class="mv-pc__checks">' +
              boxes +
              '<label class="mv-pc__check mv-pc__check--none">' +
                '<input type="checkbox" data-none>' +
                '<span class="mv-pc__box" aria-hidden="true"></span>' +
                '<span class="mv-pc__label">' + NONE_LABEL + '</span>' +
              '</label>' +
            '</div>' +
            '<p class="mv-pc__error" data-pc="error" role="alert" hidden>' +
              'Merci de sélectionner au moins une réponse.</p>' +
            '<div class="mv-pc__actions">' +
              '<button type="button" class="btn btn-gold" data-pc="validate">Valider mes réponses</button>' +
            '</div>' +
          '</section>' +

          /* ---------- étape 3 : recommandation ---------- */
          '<section class="mv-pc__step" data-step="recommandation" hidden>' +
            '<p class="mv-pc__eyebrow">Notre recommandation</p>' +
            '<h2 class="mv-pc__title">Le bilan trichologique cosmétique</h2>' +
            '<p class="mv-pc__text">Vous nous avez signalé une ou plusieurs préoccupations ' +
              'concernant vos cheveux ou votre cuir chevelu.</p>' +
            '<p class="mv-pc__text">Chez Meilleure Version, nous vous proposons un bilan ' +
              'trichologique cosmétique pour mieux comprendre vos besoins. Ce bilan comprend ' +
              'un échange personnalisé ainsi qu\'une observation visuelle et trichoscopique ' +
              'de vos cheveux et de votre cuir chevelu, afin de vous proposer des conseils et ' +
              'des solutions cosmétiques adaptés à votre situation.</p>' +
            '<p class="mv-pc__disclaimer">Le bilan ne remplace pas une consultation médicale.</p>' +
            '<div class="mv-pc__actions">' +
              '<button type="button" class="btn btn-gold" data-pc="finish">Continuer vers la réservation</button>' +
            '</div>' +
            '<p class="mv-pc__note">Vous choisirez librement votre prestation et votre ' +
              'créneau sur Planity. Aucune réponse n\'est transmise.</p>' +
          '</section>' +

        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    dialogEl = overlay.querySelector('.mv-pc__sheet');
    wire();
  }

  function steps() { return overlay.querySelectorAll('.mv-pc__step'); }

  function go(name) {
    [].forEach.call(steps(), function (s) {
      s.hidden = (s.getAttribute('data-step') !== name);
    });
    overlay.querySelector('.mv-pc__scroll').scrollTop = 0;
    var first = overlay.querySelector('.mv-pc__step:not([hidden]) button, ' +
                                     '.mv-pc__step:not([hidden]) input');
    if (first) first.focus();
  }

  function reset() {
    [].forEach.call(overlay.querySelectorAll('input[type="checkbox"]'), function (c) {
      c.checked = false;
    });
    overlay.querySelector('[data-pc="error"]').hidden = true;
  }

  function open() {
    lastFocus = document.activeElement;
    reset();
    overlay.hidden = false;
    document.body.classList.add('mv-pc-open');
    /* force le calcul de style pour que la transition d'entrée démarre
       (plus fiable qu'un requestAnimationFrame, mis en pause si l'onglet
       n'est pas au premier plan) */
    void overlay.offsetWidth;
    overlay.classList.add('is-on');
    go('accueil');
  }

  function close() {
    overlay.classList.remove('is-on');
    document.body.classList.remove('mv-pc-open');
    setTimeout(function () { overlay.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function leave() {
    /* on ferme la fenêtre puis on part sur Planity */
    close();
    goToBooking();
  }

  function wire() {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }        // clic sur le fond

      var btn = e.target.closest('[data-pc]');
      if (!btn) return;
      var act = btn.getAttribute('data-pc');

      if (act === 'close')    { close(); return; }
      if (act === 'skip')     { leave(); return; }
      if (act === 'start')    { go('questionnaire'); return; }
      if (act === 'finish')   { leave(); return; }

      if (act === 'validate') {
        var none = overlay.querySelector('input[data-none]');
        var picked = overlay.querySelectorAll('input[data-concern]:checked');
        var err = overlay.querySelector('[data-pc="error"]');

        if (!none.checked && !picked.length) {       // rien de coché
          err.hidden = false;
          return;
        }
        err.hidden = true;

        if (none.checked) { leave(); return; }            // aucune préoccupation
        go('recommandation');                              // sinon : recommandation
      }
    });

    /* « Je n'ai aucune préoccupation » est exclusif, dans les deux sens */
    var none = overlay.querySelector('input[data-none]');
    var concerns = overlay.querySelectorAll('input[data-concern]');
    none.addEventListener('change', function () {
      if (none.checked) {
        [].forEach.call(concerns, function (c) { c.checked = false; });
      }
      overlay.querySelector('[data-pc="error"]').hidden = true;
    });
    [].forEach.call(concerns, function (c) {
      c.addEventListener('change', function () {
        if (c.checked) none.checked = false;
        overlay.querySelector('[data-pc="error"]').hidden = true;
      });
    });

    /* clavier : Échap ferme, Tab reste dans la fenêtre */
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;

      var focusables = dialogEl.querySelectorAll(
        '.mv-pc__close, .mv-pc__step:not([hidden]) button, .mv-pc__step:not([hidden]) input');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- branchement sur tous les boutons du site ----------------- */
  build();
  [].forEach.call(links, function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;  // nouvel onglet voulu
      e.preventDefault();
      open();
    });
  });
})();
