# La Dernière Forge

Jeu de forgeron scénarisé pour navigateur mobile, par **Keismey Studio**.
Fonds les minerais, forge et trempe tes lames, descends à la mine, chasse les créatures de la Rouille,
tiens ton échoppe et brise la malédiction en cinq chapitres. Français et anglais.

Jouer : https://keismey.github.io/La-Derniere-Forge/
(`?lang=fr` ou `?lang=en` force la langue, sinon celle du téléphone.)

Installable sur l'écran d'accueil (PWA), jouable hors ligne une fois chargé.

## Installer sur le téléphone

- **Android (Chrome)** : ouvre l'adresse, menu ⋮ → *Installer l'application*.
- **iPhone (Safari)** : ouvre l'adresse, bouton Partager → *Sur l'écran d'accueil*.

## Mettre à jour

1. Pousse les fichiers modifiés sur `main` (GitHub Pages republie tout seul en 1 à 2 minutes).
2. Change `VERSION` en haut de `sw.js` (ex. `forge-v1.0.1`) pour que les téléphones
   récupèrent la nouvelle version au lieu de garder l'ancienne en cache.
3. Si des images ou musiques ont été ajoutées ou retirées dans `assets/`, régénère la liste
   `js/assets.js` (le jeu ne charge que les fichiers qui y figurent).

## Sauvegarde

Dans le navigateur (`localStorage`, clé `derniere-forge-save-v1`). Le hub Keismey Studio la lit
pour afficher la progression, sans jamais l'écrire.

## Fichiers

| Chemin | Rôle |
|---|---|
| `index.html` | écrans du jeu, ordre de chargement des scripts |
| `css/style.css` | toute la mise en page |
| `js/i18n.js` | choix de la langue, `G.L('fr', 'en')` |
| `js/data.js` / `js/data_en.js` | tout le contenu (objets, recettes, mine, monstres, histoire), puis sa version anglaise |
| `js/assets.js` | liste des images et musiques présentes |
| `js/core.js` | état, sauvegarde, sons, fenêtres, statistiques du joueur |
| `js/smelt.js` | fonderie |
| `js/forge.js` | forgeage et trempe |
| `js/mine.js` | mine |
| `js/combat.js` | chasse (tour par tour) et mode difficile |
| `js/shop.js` | échoppe et marchandage |
| `js/refine.js` | raffinage : aiguisage et sertissage |
| `js/main.js` | logo du studio, écran titre, village, journal, chapitres |
| `assets/img/` | décors, monstres, portraits, icônes, effets, logo du studio |
| `assets/musique/` | musiques par lieu |
| `sw.js` | mode hors ligne |
