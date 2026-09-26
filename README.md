# Meilleure Version — site du salon

Site vitrine du salon **Meilleure Version** (coiffure, barbe, trichologie cosmétique et coworking), Bordeaux Chartrons.

Site statique : HTML, CSS et JavaScript, sans outil de compilation. La page d'accueil est `index.html`.

## Arborescence

- `*.html` : les pages du site (accueil, prestations, bilan, expérience, coworking, à propos, contact, pages légales)
- `assets/style.css` : toute la mise en forme
- `assets/*.js` : animations (vidéo, promo, objet 3D) et prise de rendez-vous
- `assets/vendor/` : afficheur 3D (model-viewer)
- `assets/svc/` : photos des prestations

## Réglages à faire avant la mise en ligne définitive

- **Prise de rendez-vous** : coller l'adresse du site de réservation dans `assets/booking.js` (ligne `var MV_BOOKING_URL = '';`).
- **Formulaires** (contact, coworking, newsletter) : à relier à un service d'envoi d'e-mails.
- **Informations à confirmer** : téléphone, e-mail, horaires, Instagram (textes entre crochets).

## Voir le site en local

Ouvrir `index.html` dans un navigateur, ou lancer un petit serveur depuis ce dossier :

```
npx serve .
```
