# Audit complet — Infernal City 2.11.0

Date : 1er août 2026

## Verdict

Infernal City possède désormais le parcours, les règles de progression et la
robustesse attendus d’un jeu statique complet : deux campagnes finissables,
des modes secondaires qui ne corrompent pas la partie principale, une reprise
sûre, un contrat quotidien déterministe, un endgame, un visual novel adulte
consensuel et une livraison web installable.

La version 2.11 corrige les défauts bloquants et majeurs prouvés pendant
l’audit. Les éléments encore listés en fin de document relèvent d’une phase de
production commerciale, de contenu additionnel ou de tests utilisateurs ; ils
ne rendent pas la boucle actuelle incomplète.

## Périmètre contrôlé

- Parcours critique : portail 18+, briefing, campagne, victoire, défaite,
  checkpoint, reprise et nouvelle partie.
- Gameplay : vingt défenses, spécialisations, héroïnes, quatre terrains,
  caméra, hordes, boss, économie, difficulté et récompenses.
- Modes : Quatre Portes, Dix Trônes, chasses du Codex, défi quotidien, Tour
  Infinitum 100 étages et mode infini.
- Narration : seize héroïnes adultes, routes VN, consentement, révocation,
  archives CG et séparation stricte entre romance et avantage militaire.
- Données : migrations, import/export, sauvegardes de version future,
  corruption, reset, bornes et contenu injecté.
- Qualité web : clavier, tactile, manette, mobile, paysage, mouvement réduit,
  audio, chargement, cache PWA, sécurité HTTP, SEO et CI.

## Corrections bloquantes et majeures

### État de partie et modes

- Les chasses et la Tour utilisent un snapshot isolé de la campagne. Vague,
  Citadelle, économie, défenses, compagnons et checkpoint sont restaurés après
  victoire, défaite ou palier.
- Les gains permanents légitimes restent acquis sans laisser fuir les compteurs
  temporaires. La récompense unique de l’étage 100 ne peut pas être dupliquée.
- Une chasse ne déclenche plus une victoire de campagne, ne supprime plus son
  checkpoint et ne distribue plus une récompense de campagne parasite.
- Le contrat quotidien fixe date, graine, héroïne, terrain, mutateurs,
  difficulté et trois défenses initiales. Un retry reconstruit exactement le
  même run et la prime permanente n’est accordée qu’une fois. Ses vagues ne
  modifient ni crédits permanents, ni cumul économique, ni records de campagne.
- Les vagues 16 à 20 des Dix Trônes sont maintenant composées manuellement,
  progressives et cohérentes avec l’arrivée des trois dernières souveraines.
  Récompenses, escorts, traits et intermissions du registre sont appliqués.

### Combat et lisibilité tactique

- La construction respecte le vrai rectangle jouable et non le corridor
  d’approche. Les variantes asymétriques conservent leurs directions de horde.
- Les barrières Aegis n’effacent plus instantanément une cible et les tours
  récupèrent un cooldown valide après un cas limite.
- Boss et unités lourdes résistent au contrôle de foule ; acide et dangers au
  sol sont plafonnés afin d’éviter les verrouillages permanents. Tesla,
  gravité, impulsion, EMP et Sonic passent par les mêmes helpers de résistance
  et d’immunité temporaire.
- Checkpoints et rotations replacent les défenses dans une position valide :
  bornes de construction, dégagement de la Citadelle, routes de horde et
  espacement entre tours sont contrôlés par un validateur central.
- Le monde d’approche reste cinq fois plus profond que le terrain central. La
  caméra couvre toute la largeur, se déplace, cadre et zoome sans déplacer les
  entités logiques.
- En paysage compact, les bandes HUD sont réduites et les contrôles secondaires
  masqués : la zone tactique n’est plus écrasée par le HUD desktop.

### Sauvegarde et sécurité des données

- Les checkpoints importés sont canonisés et bornés : tours, armes, monnaies,
  compteurs, mercenaires et drones ne peuvent pas injecter de statistiques ou
  de HTML arbitraires.
- Mercenaires et drones sont reconstruits avec leurs statistiques canoniques,
  leurs niveaux autorisés et une limite de trois par famille.
- L’import campagne + VN est transactionnel. Toute version incompatible ou
  donnée invalide annule l’ensemble et restaure les deux sauvegardes originales.
- Une sauvegarde campagne ou narrative provenant d’une version future est
  conservée brute, bloque les écritures et peut être exportée sans être
  silencieusement remplacée par un état vierge.
- Un refus d’écriture narratif conserve la mutation pour la session, affiche
  explicitement « non persistée », laisse la révocation possible et inclut cet
  état mémoire dans l’export portable.
- Le reset confirmé efface ensemble campagne et progression narrative.
- Les mémoires, callbacks, tableaux et chaînes du VN sont limités pour éviter
  croissance infinie et données hostiles.

### UX, accessibilité et entrées

- Le portail adulte n’est pas contournable par une modalité d’entrée. Clavier
  et manette suivent le même bloqueur central que souris et tactile.
- Le jeu accepte portrait et paysage ; une faible hauteur ne met plus la
  simulation en pause. Les actions principales du portail et du briefing restent
  visibles sur les petits écrans.
- Le canvas possède un accès direct, un statut ARIA de menace peu bavard et des
  annonces seulement lors de changements significatifs.
- La préférence système de mouvement réduit fige les animations décoratives,
  cache les explosions purement visuelles et désactive le CRT sans modifier les
  dégâts ni la préférence enregistrée.
- L’audio crée son contexte avant de déclarer la radio active et suspend/reprend
  exactement la piste lors d’un changement de visibilité.
- Les paramètres expliquent maintenant version, données locales, absence de
  télémétrie, requête de polices et provenance des visuels.

### Performance, PWA et livraison

- Avant consentement, aucun terrain, atlas de combat ou CG n’est téléchargé.
  Le runtime jouable n’est initialisé qu’après franchissement du portail.
- Après consentement, seuls terrain, Citadelle, héroïne, défense initiale et
  première horde sont préchauffés ; les autres médias sont chargés à la demande.
- Les sept décors OpenAI utilisent des dérivés WebP d’environ 2,7 Mio au total
  au lieu d’environ 18,5 Mio de PNG. Les PNG restent les masters du projet et
  sont exclus du paquet Vercel.
- Le service worker 2.11 ne précache que le shell indispensable, tolère les
  actifs optionnels indisponibles et limite son cache média LRU à 320 entrées.
- Les médias non fingerprintés sont revalidés au lieu d’être déclarés
  immuables pendant un an, évitant les graphismes périmés après déploiement.
- La livraison ajoute CSP, protections de frame/MIME/référent, politique de
  permissions, métadonnées sociales, canonical, sitemap, robots et manifeste
  PWA stable.
- GitHub Actions exécute l’audit complet sous Node 22 avec permissions minimales.

## Contrat adulte

- Tous les personnages relationnels ont au moins 27 ans.
- Les relations sont facultatives, consenties, révocables et sans pénalité.
- Cadeaux, romance, alliance militaire et récompenses économiques restent
  indépendants.
- Les scènes intimes restent suggestives, non graphiques et hors champ.
- Les variantes dites « jeunes années » sont des flashbacks adultes non
  sexualisés ; aucune adolescente ni ambiguïté d’âge n’est admise.
- Une relecture narrative ne peut ni redonner une récompense ni modifier le
  gameplay.

## Validation de sortie

- `npm.cmd run check` : 175 tests réussis, 0 échec.
- Syntaxe contrôlée sur tous les scripts runtime et le service worker.
- Audit statique : 293 IDs uniques, 223 références DOM valides, aucun asset
  local référencé manquant.
- Tests de régression dédiés aux états chasse/Tour/quotidien, sauvegardes
  futures, import transactionnel, PWA, audio, caméra et paysage compact.
- Inspection des décors WebP face à leurs PNG : composition, transparence et
  direction artistique conservées.
- QA navigateur fraîche en 1440×1000, 390×844 et 844×390 : portail sans
  auto-scroll, CTA sans scroll, aucun overflow ni erreur console, simulation
  active et caméra réellement déplaçable/zoomable.
- En paysage 844×390, la zone tactique libre passe de 52 à 154 px. Les médias
  post-consentement passent d’environ 12,8 à 5,0 Mo et aucun PNG de décor n’est
  demandé par le runtime.

## Risques résiduels et suite de production

### P2 — recommandé avant une commercialisation payante

- Organiser une bêta multi-appareils avec données d’équilibrage réelles, puis
  ajuster courbes de dégâts, économie et difficulté sur des taux de victoire.
- Ajouter une suite E2E automatisée sur navigateurs réels et des sessions de
  lecteur d’écran avec personnes utilisatrices.
- Faire relire mentions légales, classification d’âge, droits de marque et
  politique de confidentialité selon les pays de distribution visés.
- Ajouter crash reporting et télémétrie uniquement avec opt-in explicite si le
  projet a besoin de données de production.

### P3 — enrichissement, non dette bloquante

- Ajouter localisation, voix, sous-titres avancés et mixage audio final.
- Produire davantage de biomes, variations visuelles des tours niveau 2–3,
  ennemis à distance et événements de campagne.
- Remplacer les pictogrammes texte historiques du QG par une famille d’icônes
  illustrées cohérente et livrée comme vrais assets.
- Ajouter sauvegarde cloud, succès plateforme et classement quotidien seulement
  si une infrastructure et des comptes deviennent des objectifs du produit.
