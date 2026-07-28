# Infernal City: Valkyrie Sweeper

Roguelite de défense cyber-gothique en HTML, CSS et JavaScript natifs.

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
- Sol cyber-infernal, vingt défenses, sept ennemis et six héros de combat
  animés à partir d’assets OpenAI.
- Quartier Général : commandantes, escadrille de familiers améliorable,
  mercenaires en patrouille, boutique, archives, Salon Nocturne et mini-jeu.

## Contenu adulte

Le jeu est réservé aux personnes majeures. Tous les personnages relationnels ont
au moins 27 ans. Les romances sont facultatives, séparées des alliances
militaires et reposent sur un consentement libre et révocable. Les scènes
intimes restent suggestives et se terminent par un fondu au noir.

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
Après une première visite en ligne, les fichiers essentiels, le sol et les neuf
planches d’animation de combat sont précachés. Les portraits de galerie
rejoignent ensuite le cache à la demande. Le manifeste et les icônes PNG 192/512
permettent de proposer l’installation en application autonome.

Les actifs cœur portent un nom de version et le code utilise le réseau en
priorité lorsqu’il est disponible, puis le cache hors ligne en secours. Le
cache actif reste versionné dans `sw.js`.

## Direction visuelle OpenAI

La texture raccordable de l’arène et les neuf planches 4×4 ont été générées
avec l’outil ImageGen intégré d’OpenAI. Elles couvrent les vingt défenses, les
sept archétypes ennemis et les six héros jouables. Le canvas choisit les frames
selon les états réels : charge/tir/recul, locomotion/attaque/impact et
attaque/compétence héroïque. Le héros choisi est rendu physiquement sur la
Citadelle et ses leurres utilisent aussi sa planche.

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
