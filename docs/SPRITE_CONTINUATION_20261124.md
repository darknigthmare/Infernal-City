# Suite des sprites manquants — 24 novembre 2026

Cette livraison poursuit la PR nº 6 depuis `dd39ce554ed64cc25439d68cc95e22885c2726e3`.
Elle ajoute **25 PNG natifs** et raccorde au combat les dix unités aériennes
déjà illustrées. Aucun des 206 PNG des deux packs précédents n’est remplacé.

## Couverture et usages

| Ajout | Fichiers nouveaux | Grille | Usage réel |
|---|---:|---|---|
| Ennemis Astral, Abyssal et Botanique nommés | 12 | 8 × 4 | Galerie animée du domaine |
| Projectiles tactiques | 6 | 8 × 3 | Vol, impact réel et variante Overdrive |
| Réactions élémentaires | 3 | 8 × 4 | Combat existant et galerie de la Première Brèche |
| Théâtres d’Haven | 4 | Scène 1536 × 1024 | Sélection tactique, routes, construction et rotation |
| Unités aériennes déjà illustrées | 0 | 8 × 4 existante | Vagues génériques et fallback Infinitum |
| **Nouvelles images** | **25** | | **624 cellules animées et quatre scènes** |

Le pack `illustrated-v1` passe à **107 ressources** : 91 atlas, 16 scènes et
**3 280 cellules animées**. Avec les 124 atlas de `completion-v1`, les deux packs
totalisent **231 PNG**, **215 atlas**, **7 896 cellules animées** et **16 scènes**,
soit **7 912 cellules**, scènes comprises.

## Douze ennemis retrouvés dans la Bible

Les sections 17.1 à 17.3 nomment quatre ennemis par domaine. Ces identités
étaient absentes du registre structuré ; elles figurent désormais dans
`dlc-packs.v1.js` et le générateur de manifeste.

| ID | Nom |
|---|---|
| `astral_cherub_automaton` | Chérubin Automaton |
| `astral_censer_bearer` | Porte-Encensoir |
| `astral_alabaster_golem` | Golem d’Albâtre |
| `astral_siege_pendulum` | Pendulier de Siège |
| `abyss_armored_nautilus` | Nautile Blindé |
| `abyss_emp_jellyfish` | Méduse EMP |
| `abyss_stealth_ray` | Raie Furtive |
| `abyss_drill_crab` | Crabe Foreur |
| `flora_crystal_wasp` | Guêpe Cristalline |
| `flora_steel_treant` | Tréant d’Acier |
| `flora_mortar_flower` | Fleur Mortier |
| `flora_ivy_crawler` | Rampeur de Lierre |

Chaque atlas contient `move`, `attack`, `death_dissolve` et `shield_break`.
Les images sont accessibles dans **Extensions & Théâtres DLC → Voir les
personnages et l’arsenal** du domaine correspondant. Aucune statistique ou vague
premium n’est inventée à partir d’un nom seul. Les 36 ennemis premium encore
sans nom individuel restent signalés dans l’inventaire.

## Les dix aériens entrent dans le combat

`aerial-legions.v1.js` reprend les noms, factions, PV et vitesses de
`free_aerial_horizon.aerialLegionUnits`. Les autres statistiques et traits
proviennent du spécialiste volant existant. À partir de la vague 4, le runtime
remplace uniquement les emplacements génériques `flying`, en utilisant la
faction de la vague ou une sélection déterministe respectant la progression des
légions. Il ne consomme pas de tirage aléatoire supplémentaire et conserve les
effectifs, routes, cadences et boss.

La composition actuelle des Dix Trônes ne contient pas ces emplacements : ses
50 unités de légion ne changent pas. Les aériens interviennent dans les vagues
génériques concernées et le fallback Infinitum. Les PV de 100 à 140 et vitesses
de 118 à 148 déjà écrits dans le catalogue les rendent moins résistants et plus
rapides que le spécialiste de référence. Les multiplicateurs aériens et de
spécialiste sont appliqués une seule fois.

Le rendu réutilise `sprite-completion-runtime.v1.js`, avec déplacement, attaque,
bris de bouclier, mort après retrait réel, orientation et barres de vie. Une
échelle d’affichage fixe, mesurée sur les silhouettes et liée au SHA du PNG,
compense les marges natives sans modifier les images. La harpie historique reste
le rendu de secours en cas d’atlas indisponible.

## Effets tactiques

| Atlas | Événement existant |
|---|---|
| `flame_stream` | Projectiles `flame` ordinaires |
| `siege_missile` | Projectile de la défense `missile` |
| `cryo_shard` | Projectile de la défense `cryo` |
| `acid_glob` | Projectile de la défense `acid` |
| `drone_laser` | Projectile de la défense `drone` |
| `siphon_seed` | Projectile de la défense `siphon` |
| `choc_thermique` | Thermique + refroidissement |
| `tempete_magnetique` | Tesla + attraction gravitationnelle |
| `embrasement_toxique` | Thermique + corrosion biologique |

Les projectiles utilisent `flight`, `impact` et `overload`. L’impact se déclenche
à une collision réelle ; son émission est bornée pour les tirs perçants et les
flammes. Dégâts, ralentissements, soins, explosions, pénétrations et suppressions
restent gérés par le moteur existant. Les synergies conservent leurs
multiplicateurs et temps de recharge ; leur ID visuel accompagne la particule.

Les effets évolués déjà livrés et les quatre duos gardent la priorité. Les images
se chargent à l’usage après l’entrée. Un chargement lent ou refusé conserve le
rendu antérieur. Le mouvement réduit fixe les projectiles sur une image et
supprime les nouvelles animations d’impact ; la pause fige l’horloge de combat.

## Quatre terrains Haven sélectionnables

Les quatre noms de la section 15.4 de la Bible rejoignent le sélecteur
**Configuration tactique** : Port Extérieur d’Haven, Cathédrale Engloutie,
Réacteur Abyssal et Citadelle Intérieure (Dernier Carré).

Les images natives 1536 × 1024 couvrent uniformément une zone d’approche
1800 × 1200 autour du monde 1200 × 800. Les quatre accès cardinaux rejoignent
la citadelle centrale. Les zones de construction restent dégagées, les
architectures décoratives étant en bordure. Les cartes participent à la rotation
manuelle ; le défi quotidien conserve ses quatre terrains historiques et ses
résultats déterministes.

Un choix manuel Haven ou une rotation vers Haven efface un ancien habillage DLC.
Un choix explicite de décor DLC effectué ensuite reste possible et persistant.
Le retour d’un mode secondaire recharge la bonne image de terrain sans déplacer
la caméra ni reconstruire les routes sauvegardées.

Ces terrains apportent des décors et des configurations jouables. Les ponts
destructibles, collisions de piliers, anneaux tournants, zones de chaleur et
étages envisagés dans la Bible restent des mécaniques futures.

## Fidélité, provenance et validation

Les noms et domaines visuels proviennent des sources du projet. Les nouveaux
ennemis, effets et terrains constituent leurs premières illustrations ; aucun
dessin individuel antérieur ne permet de revendiquer une reproduction pixel
pour pixel. Les références locales guident les matériaux, la palette et la
caméra. Les 206 images déjà livrées conservent leurs octets.

Les 25 nouvelles images sont produites par l’outil d’images intégré et copiées
exactement depuis leur fichier natif. Aucun redimensionnement, détourage par
code, découpage, interpolation ou nettoyage logiciel n’est appliqué. Les
corrections de fonds ou de cadrage sont des générations d’image supplémentaires.

Les journaux de `docs/art-generation/continuation-v1/` conservent les prompts,
rôles des références, natifs, empreintes, mesures et motifs de rejet. La présence
d’un fichier ne suffit pas à l’approuver. Les faibles résidus d’alpha sont
mesurés, sans modifier les PNG. `aerial-draw-scales.json` documente séparément
les dix échelles d’affichage.

Le manifeste cumulatif est reconstruit avec :

```sh
npm run sprites:dlc -- --qa docs/art-generation/illustrated-v1/qa-review.json --require-complete
npm run check
```

Les tests ciblent les événements réels : apparition d’aériens, multiplicateurs,
files de vagues, mort et bouclier, collisions de projectiles, synergies, repli
en cas d’image indisponible, pause, restauration et rotation de carte. Le parcours
Playwright supplémentaire vérifie le dessin effectif des PNG d’un terrain,
d’un aérien, de projectiles et d’une réaction sur ordinateur et mobiles. Les
résultats de la CI et ses captures sont liés dans la PR.
