# P2A Maps V0.1

Application React et TypeScript avec moteur cartographique WebGL2 natif. Aucune bibliothèque de moteur cartographique, clé API ou compte n'est nécessaire.

## Utilisation

```sh
npm install
npm run dev
npm run build
npm run test
```

Le dépôt initial est vide : `public/data/p2a.geojson` contient une collection vide, sans géographie inventée. Ajoutez les données officielles à ce fichier ou importez un GeoJSON depuis le site. L'import remplace le jeu de données de la session, sans modifier le fichier d'origine. L'export permet de conserver le jeu importé.

## Fonctionnalités

- Projection équirectangulaire, longitude bouclée, limites polaires, zoom continu 0–7.
- Navigation souris, molette, trackpad, tactile à deux doigts et clavier (flèches, +, -, Home).
- Buffers GPU réutilisés entre les images, rendu à la demande, résolution plafonnée à 1,5.
- Points, multipoints, lignes, multilignes, polygones et multipolygones avec trous (triangulation earcut).
- Import validé (20 Mo maximum), identifiants conservés ou dérivés du contenu, recherche locale et sélection géométrique.
- Calques, grille, styles Plan et Physique, panneaux des lieux, import/export, plein écran.
- Gestion de l'absence et de la perte du contexte WebGL2.

La propriété `layer` détermine le calque : oceans, continents, islands, terrain, vegetation, rivers, borders, roads, cities, buildings, poi. Les noms proviennent de `name` ou `nom`. Sans propriété layer, les surfaces deviennent continents, les lignes rivers, les points poi.

## Limites explicites

Satellite et Politique sont indisponibles tant que leurs données officielles n'existent pas. Le style Physique colore les géométries disponibles ; il ne crée pas d'altitudes ni de bathymétrie. La grille et le fond représentent un système de coordonnées, pas les océans officiellement délimités.

Le calcul des tuiles visibles est implémenté et testé. Le chargement demeure un seul GeoJSON local : pipeline de tuiles multi-résolution, cache LRU, chargement progressif et éviction GPU restent à développer. Pas d'éditeur exposé. La validation contrôle la structure et les coordonnées, sans détecter toutes les auto-intersections topologiques. Les étiquettes sont limitées aux 300 premières entités, sans moteur anticollision. Pas de mesures sur Chromebook réel ni de validation navigateur dans cet environnement.

## Architecture

`src/engine/camera.ts` : coordonnées, caméra et calcul des tuiles.
`src/engine/renderer.ts` : shaders, buffers, triangulation, bouclage et sélection.
`src/engine/layers.ts` : calques et styles.
`src/data/geojson.ts` : validation, identifiants et index des propriétés.
`src/App.tsx` : interface et événements de navigation.
`src/tests/core.test.ts` : tests des fondations.

Les futures commandes d'édition devront remplacer les collections immuables, valider avant application et garder un historique avant/après. Elles ne doivent pas modifier directement les buffers GPU ni les fichiers officiels.
