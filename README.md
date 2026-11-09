# Meilleure Version — site du salon

Site vitrine du salon **Meilleure Version** (coiffure, barbe, trichologie cosmétique et coworking), Bordeaux Chartrons.

Site statique : HTML, CSS et JavaScript, sans outil de compilation. La page d'accueil est `index.html`.

## Arborescence

- `*.html` : les pages du site (accueil, prestations, bilan, expérience, coworking, à propos, contact, pages légales)
- `assets/style.css` : toute la mise en forme
- `assets/*.js` : animations (vidéo, promo, objet 3D) et prise de rendez-vous
- `assets/booking.js` : boutons « Prendre rendez-vous » + fenêtre **Mon point capillaire**
- `CAHIER DES CHARGES RDV.docx` : le cahier des charges de « Mon point capillaire »
- `assets/vendor/` : afficheur 3D (model-viewer)
- `assets/svc/` : photos des prestations

## Réglages à faire avant la mise en ligne définitive

- **Prise de rendez-vous** : coller l'adresse Planity du salon dans `assets/booking.js` (ligne `var MV_BOOKING_URL = '';`). Tant que c'est vide, les boutons affichent un message au visiteur au lieu d'ouvrir Planity.
- **Formulaires** (contact, coworking, newsletter) : à relier à un service d'envoi d'e-mails.
- **Informations à confirmer** : téléphone, e-mail, horaires, Instagram (textes entre crochets).

## Mon point capillaire

Étape facultative qui s'ouvre sur **tous** les boutons `data-booking` du site, avant le
départ vers Planity : message d'accueil → questionnaire (11 préoccupations + « aucune
préoccupation », exclusive) → recommandation du bilan trichologique cosmétique.

Tout tient dans `assets/booking.js` (comportement) et `assets/style.css` (section
« Mon point capillaire »). Aucune page HTML n'a besoin d'être modifiée.

- Aucun compte, aucune base de données, aucune réponse enregistrée ni transmise :
  les cases cochées restent dans le navigateur et sont remises à zéro à chaque ouverture.
- Aucune prestation n'est présélectionnée sur Planity.
- Pour désactiver l'étape et aller droit à Planity : `var MV_POINT_CAPILLAIRE = false;`.

## Voir le site en local

Ouvrir `index.html` dans un navigateur, ou lancer un petit serveur depuis ce dossier :

```
npx serve .
```
