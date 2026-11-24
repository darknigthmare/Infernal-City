# Inventaire des visuels — 24 novembre 2026

## Point de départ vérifié

Audit de `main` au commit `85bfec3adb18eacc810f8dcd28da2681c1f3f1cd`, après
fusion du premier pack de sprites. Les 118 PNG de `completion-v1` sont présents
et leurs 118 SHA-256 concordent avec le manifeste, pour 4 376 cellules. Une
recherche de références littérales d’images dans les fichiers JS, HTML et CSS
racine recense 229 chemins, sans fichier absent parmi ces chemins. Ce contrôle
ne prétend pas couvrir les chemins construits dynamiquement.

Les besoins ci-dessous décrivent **l’état avant le pack `illustrated-v1`**.
Les manifestes et rapports de ce nouveau pack font foi pour sa livraison.

## Animations absentes pour des unités déjà utilisées

Les types suivants sont encore invoqués par `chooseFallbackEnemyType()` et
`spawnMutant()`, mais ne possèdent pas d’entrée dans le premier pack complémentaire.

| Type | Référence d’identité | Ligne, index zéro |
|---|---|---:|
| `swarmer` | `assets/animations/enemies/enemy-atlas-01.png` | 0 |
| `runner` | même atlas | 1 |
| `brute` | même atlas | 2 |
| `hellwarden` | même atlas | 3 |
| boss `vespera` | `assets/animations/enemies/enemy-atlas-02.png` | 0 |
| boss `carmilla` | même atlas | 1 |

Les versions boss de Vespera et Carmilla ont leurs propres silhouettes. Les
sprites des héroïnes homonymes ne sont pas des références interchangeables.

## Images présentes qui attendaient leur intégration

- Les dix portraits animés Dix Trônes : `completion-v1/portraits/`.
- Les trois effets `acid-rain`, `ion-storm`, `debris-settle` :
  `completion-v1/environment/`.

Ces treize entrées portent initialement `preparedOnly`. Le moteur possède déjà
des expressions VN 3 × 3 : les boucles de portrait 4 × 2 doivent coexister avec
les expressions contextuelles, sans les remplacer indistinctement.

## Effets de systèmes réellement présents

Le brouillard `infernal_fog` existe dans le cycle météo, mais son rendu initial
est une simple teinte. Les quatre duos utilisent initialement un même anneau
magenta ; ils disposent de noms et de partenaires précis :

| ID | Partenaires | Nom |
|---|---|---|
| `duo_aria_astarra` | Aria × Astarra | Rempart de Braise |
| `duo_nyx_kalix` | Nyx × Kali-X | Faille Temporelle |
| `duo_carmilla_ossuary` | Carmilla × Lady Ossuary | Cour Écarlate |
| `duo_freyja_vexara` | Freyja × Vexara | Maelström Polaire |

## Catalogue des six domaines DLC

Les premiers `biome-*-atlas.png` sont des motifs géométriques issus de
`scripts/generate_dlc_art_pack.cjs`, affichés comme quatre éléments hors arène.
Ils ne représentent pas les douze théâtres d’opération illustrés.

| Domaine | Héroïnes | Boss | Tourelles | Arme |
|---|---|---|---|---|
| Astral | `seraphine`, `beatrice` | `archon_aurelien`, `celestia_bell` | `solar_organ`, `stasis_pendulum` | `seraphic_ray` |
| Abyssal | `nerea`, `thalassa` | `charybde`, `sirena_nautilus` | `sonar_tower`, `pressure_harpoon` | `cavitation_torpedo` |
| Botanique | `sylva`, `ophelia` | `noctiflora`, `belladonna_glass` | `spore_hive`, `botanic_prism` | `plasma_vine` |
| Désert | `sheherazade`, `daria` | `ignis_rah`, `miraj_obsidian` | `helios_mirror`, `silica_mortar` | `solar_saber` |
| Arctique | `astrid`, `katya` | `cryo_valkyr`, `skadi_prism` | `icebreaker_cannon`, `boreal_beacon` | `cryo_laser` |
| Cuivre | `vivienne`, `clarisse` | `brass_queen`, `duchess_valva` | `steam_gatling`, `copper_tesla` | `voltaic_musket` |

Cartes nommées : Parvis Solaire, Nef d’Horlogerie, Fosse de Corail, Dôme Bathyal,
Grande Serre, Racines du Cœur, Oasis Vitrifiée, Canyon des Miroirs, Banquise
Fracturée, Centrale Polaire, Fonderie Impériale et Pont des Dirigeables.

Ces 12 héroïnes, 12 boss, 12 tours, 6 armes et leurs évolutions possèdent des
briefs dans `dlc-packs.v1.js`, mais aucun dessin individuel antérieur. Leurs
premières images sont donc des **designs originaux tirés du catalogue**, fidèles
aux noms, rôles, palettes et thèmes ; elles ne sont pas présentées comme des
copies 1:1 d’une référence d’identité inexistante. La fidélité 1:1 concerne les
identités déjà illustrées et conservées comme références explicites.

## Unités aériennes déclarées

Les dix IDs de `free_aerial_horizon.aerialLegionUnits` sont :

`air_bioforge_wasp`, `air_ossuary_crow`, `air_void_manta`,
`air_infernal_harpy`, `air_shadow_owl`, `air_plague_locust`,
`air_dreadtide_albatross`, `air_quantum_glider`, `air_ash_ifrit`,
`air_nightmare_moth`.

Avant ce pack, ils avaient un nom, une faction, des PV et une vitesse, mais ni
sprite propre ni branchement aux vagues. Les membres existants de leurs légions
servent de références de matériaux et de palette, pas de silhouette à copier.

## Conceptions encore incomplètes dans le catalogue

- Les 48 ennemis premium sont annoncés par six comptes de huit unités, sans
  liste complète d’IDs, de silhouettes ou de comportements individuels.
- Les quatre mini-boss possèdent des vagues `[4, 8, 12, 14]`, mais aucun nom
  individuel ni design canonique.
- Le Zénith annonce 12 unités et trois généraux par comptes. Seul
  `architect_zero` est nommé avec quatre phases.
- Les saboteurs EMP, porteurs de brèche et variantes Apex sont des propositions
  de la Bible sans roster complet.
- Les tenues historiques, chapitres préquelle/Aftermath et packs VN premium
  restent partiellement décrits par nombres ; ils ne constituent pas une liste
  complète d’images individuelles à produire.
- Les quatre autres théâtres de la Bible — Port Extérieur, Cathédrale Engloutie,
  Réacteur Abyssal et Citadelle Intérieure — ne sont pas des cartes jouables
  enregistrées dans cette version de départ.

L’existence d’une illustration ne signifie pas à elle seule qu’un nouveau
personnage, une carte ou une mécanique est jouable. Les registres et les tests
d’intégration doivent préciser cette distinction.
