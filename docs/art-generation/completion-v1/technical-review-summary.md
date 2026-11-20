# Revue technique finale des sprites

118 PNG RGBA, 4 376 frames : 16 héros, 11 boss, 54 ennemis, 20 tours, 4 évolutions, 10 portraits et 3 effets environnement. Comptes et grilles conformes.

Les 118 empreintes SHA256 concordent avec la provenance ; les 118 fichiers sont identiques aux originaux natifs imagegen. Aucun doublon de fichier ; chaque frame possède des octets RGBA distincts dans son atlas. Toutes les 4 376 cellules contiennent des pixels alpha ≥ 96. Aucune cellule ne dépasse 5 % de contact de bord à ce seuil.

Les versions corrigées de `towers/napalm_mine` et `towers/blood_shrine` sont incluses : chacune 64 cellules distinctes, ratio carré, transparence réelle et aucune alerte technique.

Une réserve documentée : `bosses/astarra` possède 2,430 % de pixels alpha nul, mais 67,8565 % à alpha ≤ 16. Sur les frontières internes, alpha médian = 1, P95 = 2, P99 = 3, maximum = 7 ; aucun pixel alpha > 32. L’alerte de transparence stricte reste dans le rapport. L’identité et la grille 8×6 ont été inspectées ; l’approbation visuelle existante est conservée. Les images n’ont subi aucune modification.

Détails : `technical-review.json`, y compris contrôles de provenance et percentiles alpha. Cette revue technique ne remplace pas les validations visuelles des auteurs.
