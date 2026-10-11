# P2A — Pack planète physique raster V0.2 (pour Work)

## Contenu
- `P2A_planete_physique_8192x4096.png`: rendu physique raster complet, sans routes/pays/villes.
- `calques/terres.png`: masque des terres (RGBA)
- `calques/vegetation_forets.png`: végétation (RGBA)
- `calques/zones_desertiques.png`: déserts (RGBA)
- `calques/neige_haute_montagne.png`: neiges (RGBA)
- `calques/eaux_douces.png`: fleuves et lacs schématiques (RGBA)
- `calques/traits_cotes.png`: côtes, trait léger (RGBA)
- `calques/altitude_16bits.png`: heightmap 16 bits (0..65535 = 0..8000 mètres dans ce prototype)
- `calques/bathymetrie_16bits.png`: profondeur 16 bits (0..65535 = 0..10000 mètres dans ce prototype)
- `tuiles/{z}/{x}/{y}.png`: pyramide de tuiles PNG 256 px, cinq niveaux pour moteur personnalisé
- `donnees/contours_planete.geojson`: polygones C1, I01..I25, île indépendante de O4 ; **coordonnées de dessin** et non GPS
- `donnees/manifest.json`: métadonnées et mode d'emploi des tuiles

## À utiliser dans Work
Importe l'archive, puis demande : « Décompresse ce pack P2A et construis un visualiseur interactif à calques avec moteur WebGL personnalisé, chargement de tuiles et zoom progressif. N'ajoute pas de pays, de routes ni de données inventées sans mon accord. »

## Précisions essentielles
- Ce pack est un **prototype cartographique procédural V0.2**. Les reliefs, forêts, rivières, bathymétrie et côtes sont des estimations visuelles, pas des données topographiques vérifiées ou issues d'une simulation climatique.
- Les 25 îles de C2 et l'île indépendante de O4 sont représentées distinctement. Les 5 grandes îles correspondent à I01..I05.
- Les « calques » sont des raster RGBA, pas de formes SVG.
- Pour une simulation planétaire réelle, il faudra ultérieurement valider latitude/longitude, géométrie sphérique, altitude, écoulement et cohérence des climats.
- Aucune frontière de pays ni route n'est incluse.
