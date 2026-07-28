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
Après une première visite en ligne, les fichiers essentiels sont précachés.
Les portraits et sprites consultés rejoignent ensuite le cache à la demande
pour permettre les visites suivantes hors connexion sans téléchargement initial
inutile. Le manifeste et les icônes PNG 192/512 permettent de proposer
l’installation en application autonome.

Les actifs cœur portent un nom de version et le code utilise le réseau en
priorité lorsqu’il est disponible, puis le cache hors ligne en secours. Le
cache actif reste versionné dans `sw.js`.

## Bestiaire visuel

Les sept archétypes d’ennemis utilisent des sprites PNG générés avec l’outil
ImageGen intégré d’OpenAI, stockés dans `assets/enemies/`. Les collisions,
auras, états et barres de vie restent pilotés par le canvas. Le prompt set
reproductible est documenté dans `assets/enemies/PROMPTS.md`.

## Contrôles

- Souris ou tactile : sélectionner puis placer une défense ; toucher une
  défense existante pour l’améliorer ou la vendre.
- Clavier sur le champ de bataille : flèches pour déplacer le curseur,
  `Entrée` ou `Espace` pour construire ou gérer la défense visée.
- `B` : focaliser la barre de défenses ; flèches gauche/droite pour choisir,
  `Échap` pour revenir au champ de bataille.
- `F` : activer Overdrive lorsqu’il est chargé.
- Quartier Général : mettre le combat en pause et gérer l’équipe.
