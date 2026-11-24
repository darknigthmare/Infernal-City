# Sprites complémentaires — completion-v1

Ce pack produit les ressources artistiques décrites dans la section 15.1 du
[cahier des charges](GAME_BIBLE.md#151-animations-de-sprites--suivi-de-production).
Il contient **124 atlas PNG natifs, soit 4 616 cellules d’animation** :
111 atlas de combat et 13 ressources de présentation intégrées au Studio,
aux expressions VN neutres, à la météo et au recyclage.

Les fichiers sont conservés exactement tels qu’ils ont été livrés par le générateur
d’images. Aucune pose n’est obtenue par duplication, interpolation ou déformation
d’une image existante. Les dimensions natives peuvent varier ; le lecteur et le
moteur divisent l’image selon sa grille, y compris lorsque les limites des cellules
ont des coordonnées fractionnaires.

## Couverture

| Groupe | Atlas | Grille par atlas | Cellules | États ou séquence |
|---|---:|---|---:|---|
| Valkyries historiques | 6 | 8 × 8 | 384 | intro, respiration, attaque, compétence, ultime, victoire, défaite, sortie |
| Valkyries Dix Trônes | 10 | 8 × 4 | 320 | intro, victoire, défaite, sortie ; leurs animations de combat existantes restent utilisées |
| Boss | 14 | 8 × 6 | 672 | intro, phases 2 et 3, télégraphe, défaite, repos |
| Ennemis des légions | 50 | 8 × 4 | 1 600 | déplacement, attaque, dissolution, rupture de bouclier |
| Spécialistes | 4 | 8 × 4 | 128 | mêmes quatre états |
| Ennemis historiques | 3 | 8 × 4 | 96 | Swarmer, Runner et Brute ; mêmes quatre états |
| Tourelles | 20 | 8 × 8 | 1 280 | niveaux 1–3, spécialités A/B, déploiement, recyclage, repos |
| Évolutions d’armes | 4 | 4 × 2 | 32 | huit images successives par effet |
| Portraits Dix Trônes | 10 | 4 × 2 | 80 | respiration, clignement, sourire discret, retour au repos |
| Environnement | 3 | 4 × 2 | 24 | pluie acide, arcs ioniques, retombée de débris |
| **Total** | **124** | | **4 616** | |

Les six Valkyries historiques réellement présentes dans le registre du jeu sont
Aria, Kira, Rin, Selene, Vespera et Carmilla. Nova appartient à la galerie ; elle
n’est pas ajoutée artificiellement au roster jouable.

Les trois boss ajoutés le 24 novembre sont Hellwarden, Vespera et Carmilla.
Les deux derniers utilisent leurs silhouettes de boss dans `enemy-atlas-02.png`,
distinctes des héroïnes homonymes. Les trois ennemis historiques suivent leurs
lignes respectives de `enemy-atlas-01.png`.

Le format livré comporte huit poses dessinées par état. Le format de seize images
proposé pour les héroïnes historiques dans le cahier des charges reste un objectif
de fluidité supplémentaire ; le pack ne présente pas des images interpolées comme
de nouvelles poses dessinées.

## Utilisation en combat

`sprite-completion.v1.js` décrit les grilles et les états attendus.
`sprite-completion-approved.v1.js` contient seulement les fichiers présents et
validés, avec leur empreinte SHA-256. `sprite-completion-runtime.v1.js` sélectionne
les états à partir des événements déjà produits par le moteur.

- Les nouveaux PNG sont chargés à la demande, après l’entrée dans le jeu. Leur
  présence dans le registre n’entraîne pas un téléchargement de tout le pack.
- Le sprite précédent reste affiché pendant le chargement ou après un échec réseau.
- Une échelle fixe par atlas conserve la taille apparente du sprite précédent.
  Elle est calculée sur la silhouette opaque d’une pose de référence et liée à
  l’empreinte du fichier ; les PNG eux-mêmes ne sont pas redimensionnés.
- Les dégâts, hitboxes, récompenses, prix, cadences et règles de campagne ne sont
  pas modifiés par les nouvelles images.
- Une mort confirmée ou un recyclage réussi crée seulement une animation visuelle
  temporaire. Le nombre de ces animations est borné ; une résurrection ne crée pas
  une seconde récompense ni une fausse animation de mort.
- Ce pack fournit un effet propre aux quatre évolutions. L’épaisseur du rayon
  reste indépendante de sa portée. La [continuation](SPRITE_CONTINUATION_20261124.md)
  ajoute les effets tactiques des projectiles ordinaires, dont la flamme.
- Le réglage de mouvement réduit fige les poses et évite les boucles supplémentaires.
- La mort conserve l’orientation et le décalage de rotation du corps vivant.
  Le repos de niveau 1 et l’aperçu de construction utilisent le même atlas de
  tourelle que la défense placée ; les niveaux supérieurs conservent leur silhouette.

Les animations de boss suivent les signaux disponibles. L’intro et le changement
de phase ont priorité sur un télégraphe simultané. Le jeu ne possède pas de signal
distinct pour une « attaque lourde » de chaque boss : le pack fournit ce dessin,
mais n’invente pas un avertissement sur chaque tir normal.

## Portraits et environnement

Les **10 portraits et 3 effets d’environnement sont intégrés** par
`sprite-presentation.v1.js` ; aucune entrée ne reste `preparedOnly`.
Le Studio propose « Portrait animé » aux dix héroïnes concernées. Dans les scènes
VN, les poses neutres ou calmes peuvent respirer ; les autres émotions conservent
leurs expressions 3 × 3. L’horloge d’interface continue pendant une pause de jeu,
s’arrête lorsque la fenêtre est masquée ou la scène fermée, et respecte le
mouvement réduit. Le portrait statique reste disponible jusqu’au décodage du PNG.

La pluie acide et l’orage ionique suivent le cycle météo déjà présent dans le
moteur. La retombée de débris accompagne uniquement un recyclage de défense
réussi ; elle ne se déclenche pas sur les morts organiques. Ces effets temporaires
sont bornés et ne changent pas les récompenses ni l’économie.

Les ressources des entrées DLC nommées sont décrites séparément dans
[DLC_ILLUSTRATED_ASSETS.md](DLC_ILLUSTRATED_ASSETS.md). Les annonces de contenu
sans identité individuelle définie restent répertoriées dans
[l’audit des besoins](ASSET_GAPS_20261124.md).

## Examiner les planches

Depuis la racine du dépôt :

```sh
python -m http.server 4187
```

Ouvrir ensuite `http://localhost:4187/docs/sprite-completion-review.html`.
Le lecteur permet de choisir un atlas, une ligne d’état et une image précise,
de modifier la cadence, de mettre en pause et d’ouvrir le PNG complet. Le fond
quadrillé aide à examiner la transparence. Les séquences 4 × 2 sont lues dans
l’ordre des lignes, du coin supérieur gauche au coin inférieur droit.

Le [manifeste](../assets/animations/completion-v1/manifest.json) donne les chemins,
dimensions, grilles, tailles et empreintes de chaque fichier. Il distingue les
ressources validées et celles en revue, avec l’usage prévu de chaque entrée.

## Provenance et contrôle

Les références, prompts et corrections sont consignés dans
[`art-generation/completion-v1/`](art-generation/completion-v1/).
Les six ajouts historiques sont documentés dans
[`art-generation/illustrated-v1/characters.json`](art-generation/illustrated-v1/characters.json).
Les rapports par lot conservent les empreintes des PNG finaux. Les tentatives
écartées sont documentées ; elles ne sont pas utilisées comme sprites actifs.

Les planches ont été examinées pour l’identité des personnages, le nombre de
cellules, les poses, l’anatomie, le cadrage et les effets qui débordent. Plusieurs
générations ont été corrigées pour retirer un fond parasite ou réduire une arme,
un halo ou un socle traversant les limites de cellules. Les faibles valeurs d’alpha
résiduelles invisibles ne sont pas supprimées par une transformation du fichier.

Pour refaire les mesures techniques, sans modifier les images :

```sh
python scripts/audit_sprite_completion.py --output docs/art-generation/completion-v1/technical-review.json
npm run sprites:manifest -- --qa docs/art-generation/completion-v1/qa-review.json --scales docs/art-generation/completion-v1/draw-scales.json
npm run check
```

L’analyse Python nécessite Pillow et lit uniquement les pixels. Elle mesure les
dimensions, l’alpha, les limites de cellules et les empreintes ; **elle n’accorde
jamais une validation visuelle**. La liste `qa-review.json` contient des approbations
explicites liées au SHA-256 exact. Changer une image impose de la revoir avant de
reconstruire son entrée active.

Les tests du moteur couvrent notamment le choix des lignes, le chargement différé,
les échecs d’image, les états répétés, la rupture effective d’un bouclier, les morts,
les résurrections, les améliorations et le recyclage. Les horloges des leurres,
la priorité des compétences pendant le tir automatique, le redémarrage des
télégraphes, les rotations à la mort et les portraits pendant la pause font
également l’objet de tests de régression.

Le [résumé de l’audit technique](art-generation/completion-v1/technical-review-summary.md)
documente les 118 sorties du premier pack. Le rapport technique JSON courant
couvre les 124 atlas et 4 616 cellules.
Il conserve une réserve sur le bruit alpha très faible du fond d’Astarra ;
l’identité et la grille ont été validées visuellement.

Chromium local est bloqué par les restrictions de sockets de l’environnement.
Les parcours navigateur sont donc exécutés dans GitHub Actions sur ordinateur,
mobile portrait et mobile paysage. Le rapport Playwright conserve également
des captures de la nouvelle galerie DLC. Le résultat de cette exécution figure
dans les vérifications de la PR.
