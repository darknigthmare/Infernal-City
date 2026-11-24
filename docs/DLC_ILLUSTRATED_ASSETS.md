# Domaines DLC illustrés — 24 novembre 2026

Ce pack poursuit `main` au commit `85bfec3adb18eacc810f8dcd28da2681c1f3f1cd`,
après la fusion du premier pack de sprites. Il apporte **82 PNG natifs** dans
`assets/dlc/illustrated-v1/` : **70 atlas animés et 12 décors**. Six atlas
historiques supplémentaires rejoignent séparément `completion-v1`.

La livraison ajoute donc **88 fichiers d’image**. Les deux packs réunissent
206 PNG : 194 atlas, 7 272 cellules d’animation et 12 scènes de décor.
Les 118 images du premier pack conservent leurs octets et leurs SHA-256.

## Couverture exacte

| Groupe DLC | Fichiers | Grille | Cellules | Utilisation dans cette version |
|---|---:|---|---:|---|
| Héroïnes | 12 | 8 × 8 | 768 | Galerie du domaine |
| Boss des six domaines | 12 | 8 × 6 | 576 | Galerie du domaine |
| Architecte Zéro | 1 | 8 × 8 | 64 | Galerie du Pacte, quatre phases représentées |
| Tourelles | 12 | 8 × 8 | 768 | Galerie du domaine |
| Unités aériennes | 10 | 8 × 4 | 320 | Galerie Horizons Aériens |
| Projectiles | 6 | 4 × 2 | 48 | Galerie du domaine |
| Évolutions | 6 | 4 × 2 | 48 | Galerie du domaine |
| Effets des quatre duos et brouillard | 5 | 4 × 2 | 40 | Combat, météo et galerie |
| Monuments de biome | 6 | 2 × 2 | 24 | Décoration du champ de bataille |
| Cartes illustrées | 12 | scène entière | 12 | Deux décors sélectionnables par domaine |
| **Total DLC** | **82** | | **2 668** | **2 656 cellules animées + 12 scènes** |

Les noms, IDs, palettes et rôles proviennent de `dlc-packs.v1.js`. Le détail des
entrées et des références est conservé dans [l’inventaire initial](ASSET_GAPS_20261124.md)
et dans `scripts/dlc-art-spec.cjs`. Le manifeste généré contient les dimensions,
grilles, états, usages, tailles et empreintes exactes.

## Où apparaissent les nouvelles images

Depuis le QG, ouvrir **Extensions & Théâtres DLC**. Chaque domaine propose ses
deux cartes illustrées ; choisir une carte active le domaine et sauvegarde ce
choix. Le bouton de retour au théâtre Haven rétablit le décor standard et
sauvegarde aussi cette décision. Les scènes sont cadrées en conservant leur
rapport d’aspect ; les monuments animés accompagnent le décor hors de l’arène.
Ces images habillent le terrain existant, sans créer de nouvelles collisions,
routes, missions ou règles de déplacement.

La rubrique **Voir les personnages et l’arsenal** ouvre une galerie de sprites
animés. Les atlas ne sont demandés qu’à son ouverture, après l’entrée dans le jeu.
L’animation d’interface continue lorsque le QG met la partie en pause, et cesse
quand la galerie ou la fenêtre est masquée. Le réglage de mouvement réduit garde
une image fixe. Les deux extensions gratuites concernées présentent également
les unités aériennes, les effets de duo et l’Architecte Zéro.

Les quatre particules de duo déjà émises par le moteur portent désormais leur
ID propre ; le rendu leur associe leur atlas. Les anneaux ordinaires conservent
leur comportement. Le brouillard utilise son atlas dans le cycle météo existant,
aux côtés de la pluie acide et de l’orage ionique du pack principal.

Les personnages, tours et armes DLC sont **des ressources de catalogue prêtes à
être utilisées par une future intégration de gameplay**. Le pack ne leur attribue
pas artificiellement de dégâts, coûts, talents, vagues ou conditions de déblocage.
Les noms annoncés sans conception individuelle complète restent explicitement
répertoriés dans l’inventaire : comptes d’ennemis premium, généraux, mini-boss,
variantes et certains ensembles de tenues/scènes. Ils ne sont pas présentés comme
des sprites terminés.

## Fidélité et format natif

Pour les six unités historiques ajoutées, la référence d’identité est leur ligne
dans les atlas d’ennemis existants. Les versions boss de Vespera et Carmilla
restent distinctes des héroïnes homonymes. Les dix portraits déjà générés sont
intégrés sans modification de leurs images.

Les personnages DLC nommés n’avaient pas de dessin individuel antérieur. Leurs
images constituent leur première interprétation illustrée des descriptions,
palettes et thèmes du catalogue. Les références jointes guident la peinture,
la caméra et les matériaux ; elles ne sont pas des identités à recopier. Une
reproduction pixel pour pixel d’un original inexistant n’est donc pas revendiquée.
Les corrections préservent l’identité choisie dans la première génération et
traitent les défauts concrets de fond, de cadrage ou d’effets.

Tous les PNG ont été générés avec l’outil d’images intégré et copiés sans
redimensionnement, découpage, détourage par code, interpolation ni recompression.
Le moteur lit directement les cellules natives, même lorsque leurs coordonnées
sont fractionnaires. Les cellules d’un état sont des poses dessinées, sans
duplication logicielle destinée à gonfler le nombre d’images.

Les héroïnes ont huit états : arrivée, respiration, attaque, compétence, ultime,
victoire, défaite et sortie. Les boss de domaine ont six états : arrivée, phases
2 et 3, télégraphe, défaite et repos. L’Architecte ajoute sa phase 4 et une attaque.
Les tours suivent les états du catalogue : niveaux 1–3, charge, Overdrive,
déploiement, recyclage et repos. Ces états ne sont pas confondus avec les
spécialisations A/B des tours du jeu principal.

## Validation et traçabilité

Les rapports se trouvent dans `docs/art-generation/illustrated-v1/` :

- `root-results/` et `root-independent-review.json` : cartes, monuments,
  projectiles, évolutions, effets et leur revue indépendante ;
- `units-towers.json` : les dix aériens et les douze tours ;
- `characters.json` : six unités historiques et une partie des personnages DLC ;
- `characters-root-results/`, `characters-root.json` et
  `characters-root-independent-review.json` : les autres personnages DLC,
  avec revue indépendante ;
- `qa-review.json` : liste finale des 82 approbations liées à leur SHA-256 exact.

Les prompts, références, dimensions natives, empreintes et motifs des corrections
sont conservés. Les anciennes tentatives rejetées sont décrites dans les rapports
et répertoires `*-attempts`, mais leurs PNG ne sont pas ajoutés au pack actif.
La présence d’un fichier n’accorde jamais à elle seule une approbation.

Les contrôles combinent inspection visuelle et lecture des pixels : identité,
états et nombre de cellules, silhouettes contenues, transparence effective,
distinction des poses, dimensions et conservation des octets du natif. Un halo
ou un membre qui dépasse déclenche une correction par génération d’image ; les
résidus d’alpha extrêmement faible sont documentés sans nettoyage logiciel.

Pour reconstruire le registre après une revue explicite :

```sh
npm run sprites:dlc -- --qa docs/art-generation/illustrated-v1/qa-review.json --require-complete
npm run sprites:manifest -- --qa docs/art-generation/completion-v1/qa-review.json --scales docs/art-generation/completion-v1/draw-scales.json
npm run check
```

Le premier script refuse les IDs inconnus, doublons, approbations sans SHA,
fichiers modifiés, images absentes et grilles incompatibles. `--require-complete`
exige les 82 entrées validées. Le runtime n’utilise que les chemins approuvés.

Les tests couvrent le chargement après entrée, l’absence de requête pour une
ressource non approuvée, les images lentes ou indisponibles, l’appartenance des
cartes à leur domaine, la sauvegarde de leur choix, le cadrage proportionnel et
la lecture des effets de duo. Le parcours Playwright exerce la sélection d’une
carte, l’ouverture et l’animation réelle d’une galerie pendant la pause, puis la
persistance après rechargement, sur trois tailles d’écran. GitHub Actions garde
le rapport et les captures de ce parcours pour la revue de la PR.

Les nouvelles images sont demandées à l’usage. Le service worker change sa
révision de cache pour servir les nouveaux scripts, sans téléchargement initial
de la totalité des atlas.
