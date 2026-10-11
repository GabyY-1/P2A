# P2A Maps V0.1

Application React et TypeScript avec moteur cartographique WebGL2 natif. Aucune bibliothèque de moteur cartographique, clé API ou compte n'est nécessaire.

## Utilisation

```sh
npm install
npm run dev
npm run build
npm run test
```

La carte physique V0.1 fournie par Gab est intégrée : C1, 25 îles de C2 et l’île indépendante O4. Les SVG et données JSON originaux sont conservés dans `public/data/official/`. Les calques SVG sont chargés comme textures WebGL2 indépendantes, avec conservation des contours, couleurs et positions. Le GeoJSON sert à la recherche et à la sélection. La correspondance dessin → repères de navigation est affine : longitude = x/1600×360−180, latitude = 90−(y+25)/900×180. Les 25 pixels de marge verticale conservent les proportions originales du dessin dans un monde 2:1. Ces repères ne constituent pas un géoréférencement officiel. Ajoutez les données officielles à ce fichier ou importez un GeoJSON depuis le site. L'import remplace le jeu de données de la session, sans modifier le fichier d'origine. L'export permet de conserver le jeu importé.

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

Les textures physiques sont rasterisées par le navigateur à 3200×1800 ; leur netteté est donc limitée aux forts zooms. Le mode Physique est initialement sélectionné. Les modes Plan et Physique partagent les contours fournis, sans pays ni villes ajoutés.

## Pack raster V0.2

La nouvelle archive de Gab est conservée intégralement dans `public/data/raster-v02/` (8192×4096, 682 tuiles, cartes 16 bits, masques et contours originaux). Le mode Physique utilise désormais ces tuiles PNG, sans reprendre les textures SVG V0.1. La caméra conserve un plan 2:1 ; les contours locaux sont convertis par x/1600×360−180 et 90−y/850×180, sans certification GPS.

Le moteur choisit parmi cinq niveaux, charge six images au maximum simultanément, conserve jusqu’à 192 textures de 256 px et affiche les niveaux parents durant le chargement. Le niveau demandé est réduit si le viewport nécessiterait plus de 128 tuiles. Les erreurs de chargement ont une temporisation de 30 secondes. Les images sources 16 bits restent disponibles mais ne sont pas interprétées comme des altitudes certifiées.

Le fond Physique contient déjà terres, reliefs, végétation et eaux : il est masquable en bloc. Les contrôles de ses composants fusionnés sont désactivés et expliqués. Plan conserve les contours sélectionnables et affiche les calques RGBA indépendants de végétation, déserts, neige et eaux ; ces images sont réduites à 2048×1024 pour limiter la mémoire GPU. Les SVG V0.1 sont conservés pour historique mais ne servent plus au rendu.

GitHub : la carte de bathymétrie de 25 Mo est stockée en quatre morceaux binaires dans `source-data/` pour respecter la taille maximale du transfert. `npm install` exécute `scripts/restore-source.mjs`, qui la reconstitue dans son chemin original et vérifie son empreinte SHA-256. Le site hébergé contient le fichier complet.
