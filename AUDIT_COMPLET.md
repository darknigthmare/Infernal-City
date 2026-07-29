# Audit complet — Infernal City

Date : 29 juillet 2026

## Verdict

Le dépôt est passé d’un prototype avancé à une version complète jouable :
une campagne possède désormais un objectif, une fin victorieuse et une défaite,
les systèmes de progression sont compréhensibles et persistants, les défenses
peuvent être gérées, et les modes de longévité ont une conclusion ou une boucle
claire.

## Parcours critique

1. Portail 18+ : sain, responsive et impossible à fermer accidentellement.
2. Briefing : objectif, commandes, monnaies et difficulté expliqués.
3. Nouvelle campagne : trois difficultés réellement appliquées.
4. Combat : construction souris, tactile et clavier.
5. Gestion tactique : amélioration niveau 1–3 et revente des défenses.
6. Progression de run : XP visible, arsenal, Frénésie et Overdrive.
7. Boss : Vespera, Carmilla puis Léviathan, avec trêve libre pour les boss
   relationnels.
8. Reprise : checkpoint sûr au début de la vague suivante.
9. Défaite : résumé, records, nouveau run ou retour au briefing.
10. Victoire : conclusion vague 15, épilogue, nouvelle campagne ou mode infini.
11. Tour Infinitum : 100 étages, mutateur verrouillé et conclusion dédiée.
12. Salon Nocturne : 18 chapitres VN, historique, reprise et choix de
    consentement sans pénalité.

## P0 résolus

- Crash de première frame dû aux méthodes de particules manquantes.
- Ancien script servi par le cache PWA après une mise à jour : actifs cœur
  fingerprintés et stratégie réseau prioritaire pour le code.
- Absence de victoire et lancement automatique d’une vague 16.
- Récompenses/boss susceptibles d’être rejoués ou dupliqués.
- Tours dont les comportements annoncés n’étaient pas tous actifs.

## P1 résolus

- Tutoriel et objectif final absents.
- Partie active non reprenable.
- Niveaux de tours factices, sans amélioration ni vente.
- Loot permanent et non borné.
- Familiers/mercenaires achetables sans limite et superposés.
- Familier annoncé comme améliorable et mercenaire annoncé comme patrouilleur
  sans mécanique correspondante.
- Tour lancée derrière le QG encore en pause et mutateur reroulable gratuitement.
- Niveau/XP et résultats de run incomplets.
- Boutique HP sans plafond runtime.
- Focus perdu après plusieurs décisions obligatoires.
- Modales de niveau/alliance pouvant rester empilées sous un Game Over.
- Prime unique de la Tour 100 présentée à tort lors d’un replay.
- État du bouton musique désynchronisé après le portail 18+.
- État de mission recouvrant le HUD sur petits écrans.
- Promesses du Studio et de la machine à sous supérieures à leurs fonctions.
- Barre de vingt défenses laborieuse au clavier.
- SFX procéduraux recréés dans les chemins chauds.
- Absence d’installation et de cache hors ligne.
- Terrain trop proche : caméra tactique reculée, zone utile dégagée entre les
  HUD et quatre couloirs d’approche désormais visibles ; les paysages trop bas
  sont mis en pause avec une demande de passage en portrait.
- Côte absente et CG narratives trop rares : panorama et six scènes cohérentes
  générés avec OpenAI puis intégrés au combat et au visual novel.
- Conversations relationnelles réduites à une phrase : corpus porté à 801
  répliques et 126 choix sur 18 chapitres.

## Cohérence adulte

- Tous les personnages relationnels sont explicitement adultes, âgés de 27 ans
  ou plus.
- Alliance militaire, relation romantique et récompense économique sont
  séparées.
- L’accord relationnel est facultatif, explicite et révocable sans pénalité.
- Un cadeau ne modifie plus la confiance.
- Les moments privés restent suggestifs et utilisent un fondu au noir.
- Chaque chapitre VN possède deux checkpoints explicites ; aucun choix n’est
  chronométré ou présélectionné.
- Une relecture ne peut pas redonner d’XP relationnelle.

## Longévité

- Campagne finie : 15 vagues et trois combats de boss.
- Rejouabilité : trois difficultés, choix de commandante et arsenal roguelite.
- Endgame : Tour Infinitum de 100 étages.
- Après la victoire : mode infini sans plafond de vague.
- Métaprogression : boutique, relations, archives, skins, succès et records.

## P2 non bloquants

- Ajouter d’autres arènes/biomes, événements et archétypes ennemis à distance.
- Remplacer les représentations canvas simples des familiers et mercenaires par
  des assets OpenAI au niveau du sol, des tours, des ennemis et des héros animés.
- Ajouter RNG seedé, historique détaillé des runs et simulations d’équilibrage.
- Ajouter une vraie suite E2E navigateur/CI et des tests de lecteur d’écran.
- Ajouter des voix, expressions faciales et décors alternatifs aux 18 chapitres
  sans rendre les scènes graphiques.

## Vérifications

- `npm.cmd run check`
- 43 tests automatisés réussis
- `node --check` sur les cinq scripts runtime et PWA
- unicité des IDs HTML
- références JS/HTML et assets locaux
- routes HTTP locales
- inspection visuelle bureau, 390 × 844 et 320 × 568

## Limite de l’audit visuel

Le portail 18+ n’a pas été franchi automatiquement. Le canvas a été extrait
directement pour inspecter le terrain bureau/mobile, et la modale VN a été
rendue dans une session QA éphémère sans valider le portail ni activer un choix.
Chargement, requêtes, console, reprise, historique et absence de débordement ont
été contrôlés sans erreur.
