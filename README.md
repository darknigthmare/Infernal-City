# Infernal City: Valkyrie Sweeper

Roguelite de défense cyber-gothique en HTML, CSS et JavaScript natifs.

## Mise à jour 2.3 — La Guerre des Quatre Portes

- Quatre théâtres tactiques sur un monde fixe de 1 200 × 800 : Convergence,
  Muraille occidentale, Veille du Sud et Double Faille. La rotation de campagne
  alterne ces configurations sans déplacer artificiellement les unités.
- Les terrains asymétriques changent réellement les lignes d’arrivée :
  Citadelle à gauche avec hordes venant de droite, défense nord contre assaut
  du sud, ou double voie parallèle.
- Quinze vagues déterministes annoncent leur prochaine composition. Les unités
  volantes, protectrices, diviseuses et d’artillerie demandent chacune une
  réponse différente.
- Chaque défense possède deux spécialisations définitives, et les six héroïnes
  ont désormais un pouvoir ciblable propre.
- Défi quotidien déterministe, historique local des runs et Tour Infinitum
  poursuivie par segments de dix étages à mutateurs cumulés.
- Studio 2.0 : pose, ambiance, intensité artistique suggestive ou intimiste et
  galerie des conclusions. Tous les modèles sont adultes et chaque séance
  reste facultative, consentie et révocable.
- Paramètres centralisés pour volumes, contraste, taille du texte, détection de
  manette et sauvegarde portable JSON.

## Boucles de jeu

- Campagne complète de 15 vagues avec boss aux vagues 5, 10 et 15, écran de
  victoire, épilogue et mode infini optionnel.
- Trois difficultés qui modifient réellement la Citadelle, les ennemis et les
  récompenses.
- Tour Infinitum de 100 étages avec mutateur verrouillé par étage et conclusion
  dédiée.
- Checkpoint automatique au début de la vague suivante, records locaux et
  métaprogression.
- Vingt défenses améliorables jusqu’au niveau 3 et revendables à 60 % de la
  valeur investie.
- Monde logique fixe 1200 × 800, indépendant de l’écran, entouré de quatre
  couloirs d’arrivée de 320 unités — exactement cinq fois l’ancienne profondeur.
  La caméra tactique les cadre entre les HUD sur bureau et mobile, sans
  téléporter les hordes lors d’une rotation.
- Sol, terrain d’approche et quatre portails cyber-infernaux, vingt défenses,
  sept ennemis et six héros de combat animés à partir d’assets OpenAI.
- Quartier Général : commandantes, escadrille de familiers améliorable,
  mercenaires en patrouille, boutique, archives, Salon Nocturne et mini-jeu.
- Visual novel relationnel : 18 chapitres, plus de 10 000 mots, historique,
  reprise sauvegardée et 126 choix pour six héroïnes adultes.

## Contenu adulte

Le jeu est réservé aux personnes majeures. Tous les personnages relationnels ont
au moins 27 ans. Les romances sont facultatives, séparées des alliances
militaires et reposent sur un consentement libre et révocable. Les scènes
intimes restent suggestives et se terminent par un fondu au noir.
Les choix VN ne sont ni chronométrés ni présélectionnés. Pause, limite et
révocation préservent toujours la confiance et l’efficacité militaire.

## Lancer le jeu

```powershell
py -m http.server 4173 --bind 127.0.0.1
```

Ouvrir ensuite `http://127.0.0.1:4173/`.

## Vérifier

```powershell
npm.cmd run check
```

Le projet ne requiert aucune dépendance ni étape de compilation.

## Installation et mode hors ligne

Le jeu enregistre un service worker sur `localhost` ou depuis une origine HTTPS.
Après une première visite en ligne, les scripts essentiels, le terrain
Convergence, les dix planches historiques et l’atlas des ennemis spécialisés
sont précachés. Les grands terrains asymétriques, les CG narratives, les
portraits de galerie et les compositions du Studio 2.0 rejoignent un cache
média séparé à leur première consultation. Cela conserve une installation
initiale sous le budget de 20 Mio sans sacrifier leur disponibilité hors ligne
après découverte. Le manifeste 2.3 et les icônes PNG 192/512 permettent de
proposer l’installation en application autonome.

Les actifs cœur portent un nom de version et le code utilise le réseau en
priorité lorsqu’il est disponible, puis le cache hors ligne en secours. Le
cache actif reste versionné dans `sw.js`.

## Direction visuelle OpenAI

La texture raccordable de l’arène, le terrain orthographique d’approche et les
dix planches 4×4 ont été générés avec l’outil ImageGen intégré d’OpenAI. Les
neuf planches de combat couvrent les vingt défenses, les sept archétypes ennemis
et les six héros jouables. Le canvas choisit les frames
selon les états réels : charge/tir/recul, locomotion/attaque/impact et
attaque/compétence héroïque. Le héros choisi est rendu physiquement sur la
Citadelle et ses leurres utilisent aussi sa planche.

La dixième planche anime les quatre portes lointaines (veille, avertissement,
ouverture, fermeture). Les vagues tournent entre nord, est, sud et ouest ; le
HUD affiche le secteur et l’ETA de la menace la plus proche.

La côte panoramique et six CG de conversations ont également été générées avec
ImageGen à partir des portraits établis. Leurs ancres d’identité, compositions
et prompts finaux sont documentés dans `assets/CG_PROMPTS.md`.

Les chemins, lignes, colonnes et résumés des prompts sont documentés dans
`assets/animations/atlas-manifest.json`.

## Contrôles

- Souris ou tactile : sélectionner puis placer une défense ; toucher une
  défense existante pour l’améliorer ou la vendre.
- Clavier sur le champ de bataille : flèches pour déplacer le curseur,
  `Entrée` ou `Espace` pour construire ou gérer la défense visée.
- `B` : focaliser la barre de défenses ; flèches gauche/droite pour choisir,
  `Échap` pour revenir au champ de bataille.
- `F` : activer Overdrive lorsqu’il est chargé.
- Quartier Général : mettre le combat en pause et gérer l’équipe.
- Salon Nocturne : ouvrir « Histoire VN », lire ligne par ligne, consulter
  l’historique ou reprendre plus tard exactement au même beat.
