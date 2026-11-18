# Infernal City: Valkyrie Sweeper — Bible Officielle du Jeu

> **Version du contrat logiciel :** `3.1.0` · **Langue principale :** Français · **Sources vérifiées :** extraction directe depuis le dépôt (`game.v9.js`, `characters.v1.js`, `expansion.v1.js`, `enemy-legions*.v1.js`, `gameplay-professional.v1.js`, `vn-*.v1.js`, `adult-scenes.v1.js`, `audio.v8.js`, `index.html`, `gameplay-pro.v1.css`).

---

## 1. Vision, Piliers & Contrat de Contenu (18+)

### 1.1 Identité du projet
- **Genre :** Hybride **Tower Defense tactique** + **Action / Survivant de Citadelle** + **Visual Novel adulte consensuel**.
- **Ton :** Cyber-gothique militaire, dramatique sur le front, intimiste et consensuel au Quartier Général.
- **Boucle centrale :** Défendre la **Citadelle Haven** au centre de l’arène face aux vagues convergentes des légions infernales, construire et spécialiser des tourelles, activer les compétences des Valkyries et les armes orbitales, puis débloquer chapitres narratifs, tenues et archives entre les assauts.

### 1.2 Contrat de contenu adulte (gelé & vérifié par tests)
Toutes les scènes narratives et archives adultes respectent un contrat strict, vérifié automatiquement par `tests/*.test.js` :
- **Âge minimum :** tous les personnages jouables et PNJ majeurs sont des **adultes (27 ans et plus)**.
- **Consentement & révocabilité :** `consentement refus et révocation` immédiats à tout moment, sans pénalité ni perte de progression.
- **Non explicite / hors champ :** `loreChoicesAreNarrativeOnly: true`, aucune récompense militaire ou gameplay liée aux scènes intimes (`boudoir`, `parenthese privee`, `Eros Time`, `romances F/F`).
- **Archives adultes (`adult-scenes.v1.js`) :** `60` routes corporelles individuelles, `224` scènes bonus, `10` cinématiques d’introduction/défaite des Trônes.

---

## 2. Univers, Lore & Chronologie de Campagne

### 2.1 Lieux & factions majeures
- **Infernal City :** mégapole côtière assiégée, fracturée entre les chaussées d’approche et le périmètre fortifié central.
- **Citadelle Haven :** bastion octogonal blindé protégé par un dôme bouclier Aegis géodésique et un cœur réacteur central. La Valkyrie commandante se tient sur la flèche de commandement.
- **Les Quatre Portes (Acte I — Vagues 1 à 15) :** quatre quadrants d’invasion (Nord, Est, Sud, Ouest) convergents vers Haven, culminant avec l’assaut du Léviathan.
- **Les Dix Trônes (Acte II — Vagues 16 à 20 & Chasses) :** dix seigneurs de guerre souverains commandant dix légions spécialisées (50 types d’ennemis).

### 2.2 Dépêches narratives de campagne (`CAMPAIGN_STORY_DISPATCHES`)
| Vague | Dépêche tactique |
|---:|---|
| **1** | Quatre Portes · Secteur 01 : les avant-gardes infernales sondent le périmètre d’Haven. Verrouillez les approches. |
| **3** | Relais de la Muraille : les meutes rapides contournent nos premiers bastions. Croisez les tirs de couverture. |
| **5** | Première brèche contenue : nos batteries tiennent, mais l’ennemi déploie déjà ses unités blindées sur les axes. |
| **8** | Alerte tactique Quatre Portes : signatures d’artillerie lourde repérées. Surveillez les tirs de siège longue portée. |
| **10** | Cœur du siège d’Haven : les lignes extérieures ploient sous la pression. Maintenez le réseau énergétique intact. |
| **12** | Assaut coordonné sur les quatre quadrants : aucune porte ne doit céder avant la relève de la garde. |
| **15** | Climax des Quatre Portes : l’état-major infernal engage sa réserve souveraine. Toute la puissance d’Haven sur la brèche ! |
| **16** | Ouverture des Dix Trônes : au-delà des portes brisées, les seigneurs de guerre prennent personnellement le commandement. |
| **18** | Protocole Dix Trônes : les régiments d’élite convergent vers la Citadelle. Optimisez chaque tourelle et chaque relais. |
| **20** | Assaut final des Dix Trônes : le dernier sceau vacille. Tenez Haven jusqu’à l’aube, Commandant. |

---

## 3. Personnages Jouables — Les 16 Valkyries Adultes

### 3.1 Garde d’origine (6 héroïnes historiques)
| ID | Nom | Âge | Rôle / Sous-titre | Compétence active (`[Q]`) | Arme / Passif |
|---|---|---:|---|---|---|
| `aria` | **Commandante Aria** | 34 | Valkyrie Aegis | Leurre Bouclier Aegis (12s) | Arme départ: `vulcan` — Déploie un leurre renforcé. |
| `kira` | **Kira l’Ombre** | 29 | Infiltratrice Fantôme | Hologramme d’Ombre (10s) | Arme départ: `railgun` — Déploie une illusion qui explose en plasma. |
| `rin` | **Rin** | 28 | Haute Prêtresse de Flamme | Vortex Enflammé (14s) | Arme départ: `flamethrower` — Déploie un leurre qui embrase les monstres. |
| `selene` | **Sélène** | 31 | Oracle Cyber-Lunaire | Faisceau Lunaire (11s) | Arme départ: `plasma` — Déploie un leurre lunaire à impulsions de zone. |
| `vespera` | **Impératrice Vespera** | 146 | Souveraine Abyssale | Orbes Abyssales (10s) | Arme départ: `plasma` — Déploie un orbe-leurre à puissantes impulsions abyssales. |
| `carmilla` | **Reine Carmilla** | 312 | Impératrice de Sang | Vortex de Sang (9s) | Arme départ: `railgun` — Déploie un leurre vampire absorbant la vie. |

### 3.2 Extension Dix Trônes (10 héroïnes supplémentaires)
| ID | Nom | Âge | Titre / Archétype | Compétence | Ultime | Atlas Sprite |
|---|---|---:|---|---|---|---|
| `nyx` | **Nyx Circuit** | 30 | Ronin des Néons | Faille Chromatique | Blackout de la Cité | `assets/characters/heroines/nyx-circuit-atlas-v1.png` |
| `aurelia` | **Aurelia Brassheart** | 36 | Maréchale des Engrenages | Chrono-Soupape | La Minute Dorée | `assets/characters/heroines/aurelia-brassheart-atlas-v1.png` |
| `maris` | **Capitaine Maris Blacktide** | 33 | Corsaire de la Marée Noire | Bordée Blacktide | Armada Spectrale | `assets/characters/heroines/maris-blacktide-atlas-v1.png` |
| `zahra` | **Zahra des Mille-Ciels** | 28 | Princesse des Dunes Stellaires | Mirage des Mille-Ciels | Palais de l’Aube | `assets/characters/heroines/zahra-mille-ciels-atlas-v1.png` |
| `mircalla` | **Mircalla Dollheart** | 29 | Duchesse de Porcelaine Noire | Cour de Porcelaine | Maison de Poupée Noire | `assets/characters/heroines/mircalla-dollheart-atlas-v1.png` |
| `isolde` | **Isolde Mourne** | 35 | Cantatrice du Dernier Deuil | Requiem Mourne | Chœur des Dernières | `assets/characters/heroines/isolde-mourne-atlas-v1.png` |
| `hana` | **Hana Kurogane** | 32 | Shogun du Chrome Pourpre | Lune Kurogane | Un Souffle, Sept Coupes | `assets/characters/heroines/hana-kurogane-atlas-v1.png` |
| `freyja` | **Freyja Rimeborne** | 38 | Jarl des Tempêtes Cryoniques | Serment du Blizzard | Contre-Charge Fimbul | `assets/characters/heroines/freyja-rimeborne-atlas-v1.png` |
| `vega` | **Vega Solari** | 31 | Paladine de l’Héliosphère | Lance Héliosphérique | Couronne Solari | `assets/characters/heroines/vega-solari-atlas-v1.png` |
| `amara` | **Amara Verdigris** | 34 | Alchimiste des Jardins Toxiques | Floraison Verdigris | Le Jardin après la Ruine | `assets/characters/heroines/amara-verdigris-atlas-v1.png` |

---

## 4. Antagonistes — Les Dix Trônes & Le Léviathan

- **Léviathan :** boss climax de la campagne *Quatre Portes* (vague 15).
- **Les Dix Trônes :** chacun possède **3 phases distinctes** (seuils `66%` et `33%` PV) et une cinématique d’introduction et de défaite dédiée.

| ID | Nom | Titre / Faction | Phases & Signatures | Atlas |
|---|---|---|---|---|
| `xyra` | **Xyra Bioforge** | Démone Biomécanique | Ph.1: Éveil de la Forge · Ph.2: Mue d’Acier · Ph.3: Apothéose Biomécanique | `assets/characters/villains/xyra-bioforge-atlas-v1.png` |
| `ossuary` | **Lady Ossuary** | Maîtresse Squelette | Ph.1: Valse des Os · Ph.2: Cathédrale Blanche · Ph.3: Trône Ossuaire | `assets/characters/villains/lady-ossuary-atlas-v1.png` |
| `nhalzara` | **Nhal’Zara** | Impératrice du Vide | Ph.1: Couronne du Néant · Ph.2: Horizon Brisé · Ph.3: Zéro Absolu | `assets/characters/villains/nhal-zara-atlas-v1.png` |
| `astarra` | **Astarra Infernale** | Reine des Enfers | Ph.1: Tribut de Braise · Ph.2: Portes de Gehenne · Ph.3: Règne Incandescent | `assets/characters/villains/astarra-infernal-atlas-v1.png` |
| `umbrael` | **Umbrael Shadow** | Maîtresse des Ombres | Ph.1: Voile Vivant · Ph.2: Nuit Sans Bord · Ph.3: Éclipse Dévorante | `assets/characters/villains/umbrael-shadow-atlas-v1.png` |
| `pestifera` | **Pestifera** | Duchesse des Pestes | Ph.1: Premier Miasme · Ph.2: Floraison Septique · Ph.3: Jardin de la Fin | `assets/characters/villains/pestifera-atlas-v1.png` |
| `vexara` | **Vexara Dreadtide** | Amirale de l’Abîme | Ph.1: Bordée Maudite · Ph.2: Marée des Noyées · Ph.3: Dernier Pavillon | `assets/characters/villains/vexara-dreadtide-atlas-v1.png` |
| `kalix` | **Kali-X** | Dominatrice Quantique | Ph.1: Calcul de Chasse · Ph.2: Temps Fractionné · Ph.3: Singularité Kali | `assets/characters/villains/kali-x-atlas-v1.png` |
| `malika` | **Malika Ash-Djinn** | Sultane des Cendres | Ph.1: Mirage de Cendre · Ph.2: Palais Incendié · Ph.3: Souhait de Ruine | `assets/characters/villains/malika-ash-djinn-atlas-v1.png` |
| `noctis` | **Madame Noctis** | Tisseuse de Cauchemars | Ph.1: Premier Songe · Ph.2: Sommeil de Haven · Ph.3: Nuit Éternelle | `assets/characters/villains/madame-noctis-atlas-v1.png` |

---

## 5. Bestiaire — Les 10 Légions (50 Ennemis)

### 5.1 Types spécialistes historiques (`game.v9.js`)
- `flying` (aérien rapide), `bulwark` (bouclier frontal), `artillery` (siège longue portée), `splitter` (division à la mort).

### 5.2 Légions professionnelles (`enemy-legions.v1.js` — 10 factions × 5 rangs)
| Faction | Rang | ID | Nom | PV | Vitesse | Armure | Mécaniques |
|---|---:|---|---|---:|---:|---:|---|
| bioforge | - | `bioforge_scarab` | **Scarabée de la Bioforge** | - | - | 0 | scarab_corrosion |
| bioforge | - | `bioforge_hound` | **Molosse Synaptique** | - | - | 0 | hound_pounce |
| bioforge | - | `bioforge_stitcher` | **Sutureur Hémal** | - | - | 0 | stitcher_triage |
| bioforge | - | `bioforge_carapace` | **Carapace Cathédrale** | - | - | 0 | carapace_guard |
| bioforge | - | `bioforge_broodmother` | **Matriarche Incubatrice** | - | - | 0 | broodmother_lay_eggs |
| ossuary | - | `ossuary_bone_thrall` | **Serf d’Os** | - | - | 0 | thrall_reassembly |
| ossuary | - | `ossuary_spine_archer` | **Archer Vertébral** | - | - | 0 | spine_pierce |
| ossuary | - | `ossuary_funeral_chantress` | **Chantresse Funéraire** | - | - | 0 | chantress_grave_rune |
| ossuary | - | `ossuary_sarcophagus_knight` | **Chevalier-Sarcophage** | - | - | 0 | sarcophagus_interment |
| ossuary | - | `ossuary_grave_architect` | **Architecte des Tombes** | - | - | 0 | architect_tomb_wall |
| void | - | `void_mote` | **Poussière du Vide** | - | - | 0 | mote_flicker |
| void | - | `void_phasewalker` | **Marche-Faille** | - | - | 0 | phasewalker_skip |
| void | - | `void_nullifier` | **Nullificateur** | - | - | 0 | nullifier_silence |
| void | - | `void_gravity_maw` | **Gueule Gravitationnelle** | - | - | 0 | gravity_maw_field |
| void | - | `void_horizon_oracle` | **Oracle de l’Horizon** | - | - | 0 | oracle_event_horizon |
| infernal | - | `infernal_ember_imp` | **Diablotin de Braise** | - | - | 0 | imp_kindling |
| infernal | - | `infernal_cinder_hound` | **Molosse de Scorie** | - | - | 0 | hound_cinder_trail |
| infernal | - | `infernal_brazier_flagellant` | **Flagellant du Brasier** | - | - | 0 | flagellant_raise_brazier |
| infernal | - | `infernal_gehenna_guard` | **Garde de Géhenne** | - | - | 0 | gehenna_retaliation |
| infernal | - | `infernal_brimstone_magus` | **Mage du Soufre** | - | - | 0 | magus_meteor_ritual |
| shadow | - | `shadow_shardling` | **Éclatin d’Ombre** | - | - | 0 | shardling_blind |
| shadow | - | `shadow_blinkblade` | **Blinkblade** | - | - | 0 | blinkblade_ambush |
| shadow | - | `shadow_veil_specter` | **Spectre du Voile** | - | - | 0 | specter_veil |
| shadow | - | `shadow_black_lamplighter` | **Allumeur de Lampes Noires** | - | - | 0 | lamplighter_black_lantern |
| shadow | - | `shadow_eclipse_sniper` | **Tireuse de l’Éclipse** | - | - | 0 | sniper_eclipse_shot |
| plague | - | `plague_miasma_rat` | **Rat de Miasmes** | - | - | 0 | rat_miasma_death |
| plague | - | `plague_pustule_bearer` | **Porte-Pustule** | - | - | 0 | pustule_burst |
| plague | - | `plague_septic_surgeon` | **Chirurgien Septique** | - | - | 0 | surgeon_septic_bomb |
| plague | - | `plague_fungal_colossus` | **Colosse Fongique** | - | - | 0 | colossus_spore_regen |
| plague | - | `plague_canker_sower` | **Semeuse de Chancres** | - | - | 0 | sower_canker_pod |
| dreadtide | - | `dreadtide_drowned_deckhand` | **Matelot Noyé** | - | - | 0 | deckhand_boarding |
| dreadtide | - | `dreadtide_reef_cutlass` | **Cutlass des Récifs** | - | - | 0 | cutlass_combo |
| dreadtide | - | `dreadtide_abyss_harpooner` | **Harponneur Abyssal** | - | - | 0 | harpooner_tether |
| dreadtide | - | `dreadtide_coral_bulwark` | **Rempart Corallien** | - | - | 0 | bulwark_coral_barricade |
| dreadtide | - | `dreadtide_ghost_cannoneer` | **Canonnier Fantôme** | - | - | 0 | cannoneer_broadside |
| quantum | - | `quantum_qubit_drone` | **Drone Qubit** | - | - | 0 | qubit_chain |
| quantum | - | `quantum_lag_runner` | **Coureuse de Latence** | - | - | 0 | lag_echo |
| quantum | - | `quantum_chronal_jammer` | **Brouilleur Chronal** | - | - | 0 | jammer_anchor |
| quantum | - | `quantum_entangled_sentinel` | **Sentinelle Intriquée** | - | - | 0 | sentinel_entanglement |
| quantum | - | `quantum_paradox_markswoman` | **Tireuse Paradoxe** | - | - | 0 | marksman_rewind |
| ash | - | `ash_ember_wisp` | **Feu-Follet de Cendre** | - | - | 0 | wisp_ash_screen |
| ash | - | `ash_cinder_dervish` | **Derviche de Cendre** | - | - | 0 | dervish_whirl |
| ash | - | `ash_mirage_weaver` | **Tisseuse de Mirages** | - | - | 0 | weaver_decoys |
| ash | - | `ash_censer_ifrit` | **Ifrit au Censoir** | - | - | 0 | ifrit_incense |
| ash | - | `ash_wish_artillerist` | **Artilleuse des Souhaits** | - | - | 0 | artillerist_three_wishes |
| nightmare | - | `nightmare_dream_claw` | **Griffe de Songe** | - | - | 0 | claw_fear |
| nightmare | - | `nightmare_screaming_sleepwalker` | **Somnambule Hurlant** | - | - | 0 | sleepwalker_scream |
| nightmare | - | `nightmare_hypnosis_weaver` | **Tisseuse d’Hypnose** | - | - | 0 | weaver_hypnosis |
| nightmare | - | `nightmare_dream_eater` | **Mange-Rêve** | - | - | 0 | eater_consume_fear |
| nightmare | - | `nightmare_bell_toll` | **Glas du Cauchemar** | - | - | 0 | bell_third_toll |

---

## 6. Arsenal, Tourelles, Armes & Compagnons

### 6.1 Tourelles constructibles (`TOWER_TYPES`)
| ID | Nom | Coût | Dégâts | Portée | Cadence (ms) | Rôle / Description |
|---|---|---:|---:|---:|---:|---|
| `vulcan_turret` | **Tourelle Minigun** | 30 🪙 | 15 | 240 | 300 | Tirs cinétiques rapides. |
| `plasma_mortar` | **Mortier Plasma** | 60 🪙 | 40 | 320 | 900 | Tirs d'artillerie plasma à dégâts de zone. |
| `railgun_pylon` | **Pylône Railgun** | 90 🪙 | 110 | 420 | 1600 | Faisceaux laser transperçants à longue portée. |
| `flame_trap` | **Piège Inferno** | 45 🪙 | 6 | 180 | 100 | Cône continu de flammes incandescantes. |
| `tesla_spire` | **Spire Tesla** | 75 🪙 | 35 | 260 | 700 | Éclairs électriques se propageant entre démons. |
| `cryo_cannon` | **Canon Cryo** | 50 🪙 | 12 | 250 | 500 | Ralentit et gèle les hordes démoniaques. |
| `acid_trap` | **Flaque d'Acide** | 35 🪙 | 10 | 150 | 200 | Flaque corrosive rongeant l'armure. |
| `laser_drone` | **Drone Laser** | 80 🪙 | 25 | 300 | 400 | Drone volant d'attaque rapide. |
| `landmine` | **Mine Explosive** | 25 🪙 | 150 | 40 | 0 | Détonne au contact du premier démon. |
| `aegis_barrier` | **Barrière Aegis** | 40 🪙 | 0 | 60 | 0 | Mur de force bloquant les vagues. |
| `gravity_well` | **Puits de Gravité** | 100 🪙 | 20 | 280 | 800 | Attire et compresse les monstres. |
| `missile_pod` | **Pod de Missiles** | 110 🪙 | 85 | 380 | 1200 | Roquettes explosives à dégâts de zone. |
| `bio_siphon` | **Pique Siphon** | 65 🪙 | 18 | 200 | 400 | Vole la vie des monstres pour soigner la Citadelle. |
| `magnet_drone` | **Drone Aimant** | 50 🪙 | 0 | 400 | 0 | Attire automatiquement tous les Bio-Coins. |
| `sawblade_turret` | **Lance-Lames** | 70 🪙 | 45 | 260 | 600 | Projette des scies perforant deux cibles. |
| `emp_tower` | **Tour EMP** | 85 🪙 | 15 | 300 | 1400 | Onde de choc étourdissant les démons 2s. |
| `orbital_beam` | **Canon Orbital** | 150 🪙 | 250 | 500 | 2500 | Rayon laser dévastateur descendu des cieux. |
| `napalm_mine` | **Mine Napalm** | 45 🪙 | 100 | 70 | 0 | Laisse une zone de feu persistant. |
| `blood_shrine` | **Autel de Sang** | 95 🪙 | 30 | 250 | 500 | Augmente les dégâts de la Valkyrie active. |
| `sonic_cannon` | **Canon Sonique** | 75 🪙 | 22 | 220 | 750 | Onde sonique repoussant les monstres. |

### 6.2 Spécialisations de défenses (Niveau 2+)
Nombre de défenses dotées de 2 branches de spécialisation : **20**.

| Défense | Branche A | Branche B |
|---|---|---|
| `vulcan_turret` | **Cerbère Rotatif** — Trois canons chauffent progressivement et percent une cible supplémentaire à plein régime. | **Doctrine Suppressive** — Des rafales larges marquent et ralentissent les unités légères au prix de dégâts directs. |
| `plasma_mortar` | **Nova Cataclysmique** — Chaque obus crée deux détonations concentriques avec une zone brûlante résiduelle. | **Batterie à Sous-Munitions** — L’obus se divise pour saturer plusieurs routes proches. |
| `railgun_pylon` | **Lance d’Odin** — Un rayon extrême traverse toute la colonne et brise les boucliers frontaux. | **Pylône Chasseur** — Verrouille les unités aériennes ou d’artillerie et accélère après chaque élimination. |
| `flame_trap` | **Souffle de Niflhel** — Un plasma froid brûle et ralentit simultanément les cibles. | **Fournaise Vorace** — Une flamme étroite gagne en puissance tant qu’elle reste sur le même ennemi. |
| `tesla_spire` | **Tempête Synaptique** — Les arcs se multiplient dans les hordes denses et étourdissent la dernière cible. | **Paratonnerre d’Exil** — Des impulsions rares frappent prioritairement les volants et les artilleurs. |
| `cryo_cannon` | **Zéro Absolu** — Accumule du gel jusqu’à immobiliser puis fracturer les unités lourdes. | **Brouillard Blanc** — Diffuse un brouillard permanent qui ralentit une vaste section de route. |
| `acid_trap` | **Solvant Royal** — Dissout rapidement armures et boucliers dans une flaque plus concentrée. | **Marée Corrosive** — La flaque s’étend lorsqu’un ennemi y meurt et couvre progressivement le couloir. |
| `laser_drone` | **Intercepteur Séraphin** — Patrouille entre deux points et abat les unités aériennes en priorité. | **Désignateur Fantôme** — Sacrifie sa cadence pour marquer les cibles et amplifier les tirs alliés. |
| `landmine` | **Charge Creuse** — Une explosion directionnelle transperce les remparts et les brutes. | **Nid de Vipères** — Déploie quatre petites mines qui se réarment lentement entre les vagues. |
| `aegis_barrier` | **Bastion Inébranlable** — Un mur compact doté d’une immense réserve de points de vie et d’une réparation autonome. | **Miroir Aegis** — Une barrière plus fragile renvoie les projectiles de siège vers leur source. |
| `gravity_well` | **Singularité Affamée** — Compacte brutalement les unités légères et leur inflige des dégâts croissants. | **Anneau Orbital** — Un champ large dévie les volants et allonge toutes les routes affectées. |
| `missile_pod` | **Hydre de Saturation** — Lance une salve de micro-missiles répartie entre toutes les cibles visibles. | **Brise-Forteresse** — Un missile guidé lent détruit les boucliers et frappe l’artillerie à très longue portée. |
| `bio_siphon` | **Veine de la Citadelle** — Transfère l’essentiel du drain directement vers le noyau de la Citadelle. | **Sang Partagé** — Distribue les soins aux défenses proches et accélère leur cadence. |
| `magnet_drone` | **Récupérateur Haven** — Collecte à grande distance et augmente légèrement la valeur des Bio-Coins. | **Polariseur de Guerre** — Renonce au bonus économique pour repousser les unités métalliques et les projectiles. |
| `sawblade_turret` | **Danse des Lames** — Les scies ricochent entre les ennemis et regagnent des dégâts à chaque rebond. | **Scie de l’Exécuteur** — Une lourde lame revient vers la tourelle et exécute les unités très affaiblies. |
| `emp_tower` | **Black-out Total** — Une impulsion immense désactive durablement boucliers, auras et artilleries. | **Impulsion Cascade** — Des décharges rapides bondissent entre quelques cibles et interrompent leurs attaques. |
| `orbital_beam` | **Jugement Zénithal** — Un rayon prolongé suit l’ennemi le plus dangereux et augmente continuellement ses dégâts. | **Grille Solaire** — Divise le rayon en trois frappes moins puissantes réparties sur les routes. |
| `napalm_mine` | **Champ de Fournaise** — La détonation laisse un brasier très large qui se propage aux unités embrasées. | **Charge Thermobarique** — Une explosion unique concentre ses dégâts sur les unités lourdes et projette les survivants. |
| `blood_shrine` | **Chœur de Guerre** — Amplifie les dégâts et la cadence des défenses dans son cercle rituel. | **Autel de la Valkyrie** — Concentre le rituel sur l’héroïne et accélère fortement la charge de son ultime. |
| `sonic_cannon` | **Onde Répulsive** — Une détonation large repousse fortement les unités légères et interrompt les lourdes. | **Résonance Fractale** — Chaque impact pose une résonance ; la troisième fait exploser l’armure de la cible. |

### 6.3 Armes orbitales / de l’Héroïne & Évolutions (`WEAPONS_DATA`)
| ID | Arme | Dégâts | Cadence (ms) | Portée | Type | Évolution |
|---|---|---:|---:|---:|---|---|
| `vulcan` | **Vulcan Minigun** | 18 | 200 | 280 | ballistic | **Vulcan Cerberus** — Munitions surchargées capables de traverser trois cibles. |
| `plasma` | **Mortier Plasma** | 45 | 800 | 350 | plasma | **Nova Cataclysmique** — Chaque impact déclenche une onde plasma de très grande portée. |
| `railgun` | **Railgun à Particules** | 120 | 1500 | 450 | rail | **Lance d’Odin** — Un rayon amplifié traverse tout le champ de bataille. |
| `flamethrower` | **Lance-Flammes Inferno** | 8 | 80 | 200 | fire | **Souffle de Niflhel** — Des flammes cryo-plasma couvrent un cône beaucoup plus large. |

### 6.4 Power-ups & Compagnons
| ID | Nom | Effet |
|---|---|---|
| `nuke` | **BOMBE NUCLÉAIRE** | nuke |
| `freeze` | **GEL CHRONO** | freeze |
| `quad` | **DÉGÂTS QUADRUPLES** | quad |
| `magnet` | **AIMANT TOTAL** | magnet |
| `invincible` | **BOUCLIER TOTAL** | invincible |
| `frenzy` | **OVERDRIVE RECHARGE** | frenzy |
- **Compagnons :** Mercenaires intercepteurs (`merc_hunter`, jusqu’à 3, `120 🪙` de base) & Drones Bio-Lab (`pet_drone`, jusqu’à 3, niveaux 1 à 3).

---

## 7. Modes de Jeu, Difficultés & Progression

### 7.1 Modes disponibles
- **Campagne Quatre Portes :** 15 vagues classiques + climax Léviathan.
- **Campagne Dix Trônes :** 20 vagues déterministes avec un boss Trône tous les 2 niveaux.
- **Défi Quotidien (`Daily`) :** deck déterministe journalier garantissant rôles direct, anti-aérien et utilitaire.
- **Infinitum :** mode sans fin avec **10 mutateurs** structurels.

### 7.2 Difficultés (`DIFFICULTY_DATA`)
| ID | Nom | Multiplicateur PV Citadelle | Description |
|---|---|---:|---|
| `story` | **Histoire sensuelle** | ×1.2 | Pour découvrir Haven, ses alliances adultes et son histoire avec une pression modérée. |
| `standard` | **Siège standard** | ×1 | L’expérience équilibrée prévue pour une première campagne complète. |
| `nightmare` | **Cauchemar néon** | ×0.9 | Des hordes plus résistantes et rapides, avec davantage de Crédits Haven. |

### 7.3 Économie & Progression
- **Bio-Coins (`🪙`) :** monnaie de run (construction, amélioration, vente, Bio-Lab, Mercenaires, Machine à sous `25 🪙`).
- **Crédits Haven (`◆`) :** méta-monnaie persistante (boutique permanente, déblocages).
- **Affinité Valkyrie :** rangs 1 à 5 gagnés en combat ; débloque chapitres VN et archives sans impact militaire.

---

## 8. Cartes, Dimensions & Hors-Arène

- **Dimensions logiques de la zone constructible :** `1200 × 800` px.
- **Ceinture d’approche (`BATTLEFIELD_APPROACH_MARGIN`) :** `320` unités (`64 × 5`) de chaque côté (`approachBounds` `-320..1520` × `-320..1120`).
- **Citadelle centrale :** bastion octogonal visuel ~`230` px de diamètre, bouclier géodésique ~`264` px, héroïne à échelle cohérente (`62` px) sur la flèche centrale.
- **Hors-arène & Props :** horizon côtier continu (`coastlineImage`), structures architecturales `outer-city-structures-atlas.png`, 14 props animés `props-animated-atlas.png`, rempart blindé segmenté.

| ID Carte | Nom | Citadelle `(x, y)` | Provenance des vagues | Asset Terrain |
|---|---|---|---|---|
| `convergence` | **La Convergence** | (600, 400) | north, east, south, west (4 routes) | `assets/environment/infernal-city-approach-terrain.webp` |
| `western_wall` | **Le Mur Occidental** | (140, 400) | east (3 routes) | `assets/environment/map-western-wall.webp` |
| `southern_watch` | **La Veille du Sud** | (600, 125) | south (3 routes) | `assets/environment/map-southern-watch.webp` |
| `twin_rift` | **Les Failles Jumelles** | (165, 400) | east (2 routes) | `assets/environment/map-twin-rift.webp` |

---

## 9. Interface Diégétique, Modales & Contrôles

### 9.1 Raccourcis clavier & accessibilité
- `Q` : Compétence active de la Valkyrie.
- `F` : Déclencher l’Overdrive / Surcharge Aegis.
- `U` / `X` : Améliorer / Vendre rapidement la tourelle sous le curseur.
- **Cibles tactiles :** `44 × 44` px minimum · support complet `@media (prefers-reduced-motion: reduce)` · manette prise en charge.

### 9.2 Modales & Consoles du Bastion (`index.html`)
| ID HTML | Titre diégétique |
|---|---|
| `#adult-gate-modal` | adult-gate-modal |
| `#mission-briefing-modal` | BRIEFING DE CAMPAGNE |
| `#hq-menu-modal` | QUARTIER GÉNÉRAL DE LA CITADELLE |
| `#antagonist-codex-modal` | CODEX DES DIX TRÔNES |
| `#biolab-modal` | BIO-LABORATOIRE & DRONES COMPAGNONS |
| `#tower-infinitum-modal` | TOUR INFINITUM |
| `#mercenary-guild-modal` | GUILDE DES MERCENAIRES CYBERPUNK |
| `#photo-studio-modal` | STUDIO BOUDOIR NÉON |
| `#harem-lounge-modal` | SALON NOCTURNE — RELATIONS ADULTES |
| `#slot-machine-modal` | MACHINE À SOUS CYBERPUNK |
| `#achievements-modal` | HAUTS FAITS & SUCCÈS |
| `#wardrobe-modal` | GARDE-ROBE & PORTRAITS ALTERNATIFS (+18) |
| `#boss-recruit-modal` | TRÊVE APRÈS LE DUEL |
| `#visual-novel-modal` | Conversations de Haven |
| `#tower-complete-modal` | LES CENT ÉTAGES SONT SÉCURISÉS |
| `#roster-modal` | SALLE DE COMMANDEMENT |
| `#level-up-modal` | NIVEAU SUPÉRIEUR / ARSENAL |
| `#shop-modal` | ARMURERIE & MÉTA-BOUTIQUE |
| `#gallery-modal` | ARCHIVES NOCTURNES (CODEX ADULTE) |
| `#cg-viewer-modal` | cg-viewer-modal |
| `#adult-scenes-modal` | ARCHIVES SENSUELLES |
| `#body-route-vn-modal` | Route VN |
| `#cinematic-modal` | Antagoniste |
| `#defense-management-modal` | Défense |
| `#settings-modal` | PARAMÈTRES & SAUVEGARDE |
| `#run-history-modal` | HISTORIQUE DES RUNS |
| `#victory-modal` | LE LÉVIATHAN EST NEUTRALISÉ |
| `#game-over-modal` | LA CITADELLE EST TOMBÉE ! |
| `#runtime-error-modal` | LE SYSTÈME DE COMBAT A RENCONTRÉ UNE ERREUR |

---

## 10. Direction Artistique, Palette & Atlas

### 10.1 Variables CSS & Palette (`gameplay-pro.v1.css`)
| Variable | Valeur |
|---|---|

### 10.2 Atlas & VFX (`COMPANION_FX_SPRITE_DATA`)
Total de fichiers d’assets recensés dans `assets/` : **592**.

| Clé | Grille | Taille (px) | FPS | Chemin |
|---|---|---:|---:|---|
| `merc_hunter` | 8×2 | 46 | 12 | `assets/animations/companions/merc-hunter-atlas.png` |
| `pet_drone` | 8×2 | 38 | 14 | `assets/animations/companions/pet-drone-atlas.png` |
| `loot_crate` | 8×2 | 36 | 10 | `assets/animations/fx/loot-crates-atlas.png` |
| `combat_fx` | 8×4 | 64 | 16 | `assets/animations/fx/combat-fx-atlas.png` |
| `citadel_core` | 8×2 | 104 | 10 | `assets/animations/citadel/citadel-core-atlas.png` |
| `citadel_bastion` | 8×2 | 230 | 8 | `assets/animations/citadel/citadel-bastion-atlas.png` |
| `citadel_shield` | 8×2 | 264 | 10 | `assets/animations/citadel/citadel-shield-atlas.png` |
| `powerups` | 8×6 | 38 | 12 | `assets/animations/fx/powerups-atlas.png` |
| `projectiles` | 8×4 | 22 | 16 | `assets/animations/fx/projectiles-atlas.png` |
| `env_props` | 4×1 | 54 | 1 | `assets/animations/environment/props-atlas.png` |
| `env_props_anim` | 8×4 | 68 | 10 | `assets/animations/environment/props-animated-atlas.png` |
| `outer_structures` | 4×2 | 175 | 1 | `assets/animations/environment/outer-city-structures-atlas.png` |
| `state_poses` | 8×6 | 120 | 12 | `assets/animations/smooth/character-states-fx-atlas.png` |
- **Types de particules VFX gérés :** `sprite_fx`, `gravity_ring` (ondes expansives et implosions), `rail_beam`, `lightning_arc`.

---

## 11. Audio Synthétique & Radio Haven (`audio.v8.js`)

- **Stations radio (5) :** `synthwave` (CH-01 · Synthwave), `gothic` (CH-02 · Gothic Metal), `industrial` (CH-03 · Cyber Industrial), `chillwave` (CH-04 · Chillwave), `heavy` (CH-05 · Heavy Electro).
- **Effets sonores (29 méthodes) :** `playShoot()`, `playPlasma()`, `playRailgun()`, `playFlame()`, `playExplosion()`, `playPickup()`, `playAbility()`, `playOverdrive()`, `playNuke()`, `playFreeze()`, `playSlotSpin()`, `playDragonRoar()`, `playHurtVoice()`, `playRelationshipCue()`, `playUiClick()`, `playModalOpen()`, `playModalClose()`, `playTowerPlace()`, `playWaveStart()`, `playWaveClear()`, `playBossAlert()`, `playCommsBeep()`, `playTowerUpgrade()`, `playLevelUp()`, `playVictoryFanfare()`, `playDefeatStinger()`, `playShieldImpact()`, `playCitadelHeal()`, `playBossAttack()`.

---

## 12. Visual Novel & Romances

- **Corpus de base + Extension 16 héroïnes :** 30 longs chapitres de registre personnages avec expressions (`assets/vn/expressions/*.webp`), CG dédiées et callbacks persistants sans impact combat.
- **Révocation & pause :** disponibles à tout moment sur chaque graphe narratif.

---

## 13. Glossaire & Règles de Cohérence

- **Haven :** nom de la Citadelle et de l’organisation humaine.
- **Bio-Coins (`🪙`) :** monnaie tactique de partie uniquement.
- **Crédits Haven (`◆`) :** méta-monnaie persistante.
- **Règle d’échelle visuelle :** Citadelle (~230 px) > Portes de spawn (132 px) > Boss (72–88 px) > Héroïne sur piédestal (62 px) > Tourelles (42–52 px) > Ennemis standards (26–36 px).
- **Règle 18+ :** toute nouvelle héroïne ou scène doit afficher explicitement un âge adulte (`27+`) et rester strictement optionnelle, consensuelle et sans effet gameplay.

---

## 14. Annexe — Points de vigilance & Détails techniques

- Deux boutons statiques HTML (`#btn-defense-specialization-a` / `#btn-defense-specialization-b`) restent présents dans le DOM d’`index.html` mais sont remplacés dynamiquement à l’ouverture de `#defense-management-modal` par `renderDefenseManagementModal()`.
- Les tests E2E Playwright (`npm run test:e2e`) nécessitent l’installation locale de `playwright` pour être exécutés en navigateur réel ; la suite `npm run check` couvre `17` vérifications syntaxiques, l’audit statique complet et `213` tests unitaires.

---

## 15. Cahier des Charges des Manques & Feuille de Route Complète (Tous Domaines)

> Cette section recense de manière structurée tout ce qui reste à produire ou étendre pour passer du socle actuel (`v3.1.0`) à la version finale complète, y compris les spécifications destinées à d’autres IA spécialisées (animation, contenu adulte, bestiaire, level design).

### 15.1 Animations de sprites manquantes (À produire)
| Catégorie | État actuel | Animations manquantes à produire | Format cible recommandé |
|---|---|---|---|
| **6 Valkyries historiques** (`aria`, `kira`, `rin`, `nova`, `selene`, `vespera`, `carmilla`) | Planches `hero-atlas-01/02` + lissage 16 frames + `character-states-fx-atlas.png` (auras de pose) | Planches dédiées par état : `intro` (atterrissage/salut), `idle_respiration`, `attack` (tir/frappe arme), `ability` (`[Q]`), `ultimate` (Overdrive), `victory`, `defeat` (genou à terre/armure fissurée), `outro` | PNG RGBA `16×8` (`2048×1024`, 128×128/cellule) avec ligne par état |
| **10 Valkyries Dix Trônes** | Déjà structurées en `state_rows` (`idle`, `move`, `attack`, `ultimate`) | Lignes dédiées `intro`, `victory`, `defeat`, `outro` et poses portrait animées pour le Studio & VN | Extension des atlas `*-atlas-v1.png` à 8 lignes |
| **10 Antagonistes (Dix Trônes) + Léviathan** | `state_rows` (idle/walk/attack/ultimate) + anneaux de phase (`bossPhase` 1–3) | Animations distinctes de **changement de phase** (`phase_shift_2`, `phase_shift_3`), **intro théâtrale**, **télégraphe d’attaque lourde** et **animation de défaite / reddition** | PNG RGBA `8×6` par boss, 256×256/cellule pour lisibilité AAA |
| **50 Ennemis des Légions + 4 Spécialistes** | 4 frames WebP (marche/idle) + rotation/bobbing procédural | Animations dédiées `attack`, `death_dissolve` (désintégration spécifique par faction : cendre, os, néant, acide), `shield_break` | 4 états × 8 frames par unité |
| **20 Tourelles & Spécialisations** | 16 frames lissées + recul procédural | Visuels distincts de **Niv 1 / Niv 2 / Niv 3** et **variante visuelle pour chaque spécialisation A/B** + animation de déploiement/construction et de recyclage | 2 variantes de skin par tourelle + VFX de construction |
| **VFX & Environnement** | `combat-fx-atlas`, `projectiles-atlas`, `citadel-bastion/shield`, `props-animated` | Projectiles animés spécifiques aux 4 évolutions d’armes (`Vulcan Cerberus`, `Nova Cataclysmique`, `Lance d’Odin`, `Souffle de Niflhel`), pluie/orage dynamique sur carte, débris persistants temporaires | PNG/WebP RGBA 8–16 frames |

### 15.2 Spécification Handoff — Partie Adulte Explicite (Pour IA / Studio spécialisé)
> **Avertissement contractuel :** Le dépôt actuel (`v3.1.0`) gèle un contrat **non explicite / hors champ** vérifié par `tests/*.test.js`. Toute implémentation explicite ultérieure devra vivre dans un module/pack séparé ou mettre à jour explicitement ce contrat, **tout en conservant impérativement les garde-fous suivants** :
- **Garde-fous absolus :**
  1. **Âge strictement adulte (27+)** vérifié sur 100 % des personnages (`age >= 27`, `isAdult: true`).
  2. **Consentement explicite, préalable et révocable à tout instant** (`romanceOptIn`, bouton de pause/retrait sans pénalité).
  3. **Zéro impact gameplay / militaire** (`loreChoicesAreNarrativeOnly: true`) : aucune statistique de combat ne dépend des scènes privées.
- **Architecture de contenu à produire par l’IA spécialisée (par héroïne & par antagoniste recrutée — 16 + 10 personnages) :**
  - **3 paliers d’intimité progressifs :**
    1. *Palier I — Rapprochement (Rang 2) :* dialogue long en Salon Nocturne + CG/animation boucle douce (habillée / détente).
    2. *Palier II — Parenthèse Privée / Boudoir (Rang 3–4) :* choix d’ambiance (`néon`, `chandelle`, `observatoire`), tenue (`garde-robe`), 3 scènes séquentielles (*avant / pendant / afterglow*) avec variantes F/F.
    3. *Palier III — Scène Intime Explicite Complète (Rang 5, opt-in confirmé) :* script narratif multi-embranchements (rythme, posture, dialogue réactif), **boucles d’animation sprite/Live2D-like 60fps** (3 vitesses : *lent / soutenu / climax* + *afterglow*), couche d’expressions faciales synchronisées (6 expressions : *désir, douceur, surprise, extase, souffle, repos*), et design sonore ASMR/voix optionnel.
- **Spécification technique d’intégration :**
  - Format visuel : planches PNG/WebP RGBA multi-calques (`base_corps`, `tenue_amovible`, `tête_expressions`, `fx_lumière`) à `1024×1024` ou `1536×1024` par frame pour supporter le mode Studio Boudoir et le lecteur CG plein écran.
  - Schéma JSON cible : `{ id, characterId, ageVerified: true, consentRequired: true, intensityTier, poses: [...], loops: { slow, medium, climax, afterglow }, branches: [...], audioCues: [...] }`.

### 15.3 Unités ennemies manquantes & Extensions du Bestiaire
| Manque identifié | Rôle tactique proposé | Faction / Contexte |
|---|---|---|
| **Unités aériennes dédiées par légion (10 unités)** | Ennemis volants ignorant les barrières au sol, forçant l’usage des tourelles anti-air / Tesla / Railgun | 1 volant par faction (ex. *Harpyie de Cendre*, *Drone Bioforge*, *Spectre du Vide*) |
| **Sapeurs / Saboteurs EMP (5 unités)** | Désactivent temporairement une tourelle pendant 3 s s’ils atteignent le périmètre | Légions *Quantum*, *Shadow*, *Bioforge* |
| **Mini-Boss intermédiaires (Vagues 4, 8, 12, 14)** | Lieutenants blindés avec 1 mécanique de garde ou d’aura avant l’arrivée du boss majeur | Campagnes *Quatre Portes* et *Dix Trônes* |
| **Porteurs de Brèche / Invocateurs de Portails** | Ouvrent un mini-portail temporaire à mi-chemin si non éliminés en < 8 s | *Vagues 16–20* & *Infinitum* |
| **Variantes Apex / Mutées Infinitum** | Modificateurs visuels et de stats (bouclier régénératif, division explosive, camouflage) | Mode *Infinitum* au-delà de la vague 20 |

### 15.4 Niveaux, Cartes & Progression manquants
- **Acte III — Campagne « Chute de l’Abîme » (Vagues 21 à 30) :** assaut coordonné multi-Trônes avec double boss en vague 25 et vague 30.
- **4 Nouveaux Théâtres d’Opération (Cartes 5 à 8) :**
  1. *Port Extérieur d’Haven* : jetées maritimes étroites, ponts destructibles/réparables, attaques navales & aériennes.
  2. *Cathédrale Engloutie* : labyrinthe gothique à piliers bloquant la ligne de vue (avantage mortier/Tesla/flammes).
  3. *Réacteur Abyssal* : arène circulaire à anneaux rotatifs et zones de surchauffe (+25 % dégâts, -15 % portée).
  4. *Citadelle Intérieure (Dernier Carré)* : combat rapproché sur 3 niveaux de remparts autour du cœur central.
- **Niveaux de maîtrise des tourelles (Niv 4 & Niv 5 Prestige) :** déblocables via Crédits Haven, avec aura visuelle dorée/chromatique.
- **Arbre de Recherche du Bastion (QG) :** améliorations tactiques persistantes (armure du rempart, capacité du bouclier Aegis, drones de réparation).

### 15.5 Gameplay, Audio, UI/Diégétique & Technique manquants
- **Synergies élémentaires inter-tourelles :** *Cryo + Plasma* (Choc thermique +35 % dégâts), *Tesla + Gravité* (Tempête magnétique de zone), *Lance-flammes + Pique Siphon* (Embrasement toxique).
- **Météo dynamique tactique :** *Pluie acide* (affaiblit armure ennemie), *Tempête ionique* (recharge compétences `[Q]` +20 %, perturbe visée longue portée), *Brouillard infernal*.
- **Audio & Doublage (VO) :** répliques vocales courtes françaises lors de l’activation `[Q]`, Overdrive `[F]`, alerte boss et Salon Nocturne pour les 16 Valkyries et 10 Trônes ; thèmes musicaux adaptatifs par phase de boss.
- **Tests & Outillage :** installation et exécution complète de la suite E2E Playwright (`npm run test:e2e`) en intégration continue sur navigateur réel (Chrome/WebKit) pour valider visuellement chaque carte, modale et shader/canvas.

---

## 16. Extensions Gratuites de Contenu (Lore, Histoire & Rejouabilité)

> Deux extensions gratuites conçues pour densifier l’univers d’Haven, combler les manques narratifs/bestiaire et enrichir la boucle tactique sans mur payant.

### 16.1 Extension Gratuite I — « Archives de la Première Brèche » (Lore, Origines & Synergies)
- **Pitch & Thème :** Préquelle narrative explorant la chute du District Extérieur, la fondation de la Citadelle Haven et le passé des 6 Valkyries d’origine (`Aria`, `Kira`, `Rin`, `Nova`, `Sélène`, `Vespera`, `Carmilla`).
- **Contenu Campagne & Missions :**
  - **5 Opérations Mémoires (10 vagues scénarisées)** jouables depuis les *Archives du Bastion*, avec modificateurs historiques (arsenal restreint d’époque, défense de convois civils avant l’érection du dôme Aegis).
  - **Journal de Guerre & Codex d’Origine :** 24 entrées audio/texte débloquées par objectifs tactiques (ex. défendre un relais intact pendant 5 vagues).
- **Nouvelles Mécaniques de Gameplay :**
  - **Matrice de Synergies Élémentaires inter-tourelles :**
    - *Choc Thermique* (`Cryo` + `Mortier Plasma` / `Lance-Flammes`) : +35 % dégâts sur cibles gelées ou brûlées.
    - *Tempête Magnétique* (`Tesla` + `Puits Gravité`) : arcs électriques rebondissant sur toutes les cibles ralenties dans le champ.
    - *Embrasement Toxique* (`Pique Siphon` + `Lance-Flammes`) : nuage corrosif infligeant des dégâts sur la durée proportionnels aux PV max.
  - **Niveaux 4 & 5 Prestige des Tourelles :** aura dorée/chromatique et second module passif déblocable via Crédits Haven.
- **Narratif, VN & Récompenses gratuites :**
  - **18 nouveaux chapitres VN « Mémoires d’Avant-Siège »** (dialogues F/F et commandement, 100 % adultes 27+, consentement révocable, sans bonus militaire).
  - **6 tenues « Tenue de Service Historique »** déblocables gratuitement en jeu dans la Garde-Robe.
- **Audio, VFX & UI Diégétique :**
  - Couche de transmission radio archivée (filtre bande-passante historique), VFX de liaison énergétique entre tourelles synergiques sur le canvas, onglet *Mémoires* dans le QG.

### 16.2 Extension Gratuite II — « Protocole Éclipse » (Endgame, Bestiaire Aérien & Météo)
- **Pitch & Thème :** Escalade de la guerre de siège au-delà des vagues 1–20 : l’ennemi contourne les remparts par les airs et les tempêtes magnétiques frappent Haven.
- **Nouvelles Unités Ennemies (14 ajouts) :**
  - **10 Unités Aériennes de Légion** (1 par faction, ex. *Harpyie de Cendre*, *Drone Bioforge*, *Spectre du Vide*) ignorant les barrières au sol et ciblant la spire centrale.
  - **4 Mini-Boss Lieutenants** apparaissant aux vagues **4, 8, 12 et 14** (avec aura de commandement et mécanique de garde unique).
- **Nouveaux Niveaux & Modes :**
  - **Acte III — « Chute de l’Abîme » (Vagues 21 à 30) :** vagues haute intensité culminant par un double assaut de Trônes en vagues 25 et 30.
  - **Mode Endless Boss Rush :** enchaînement pur des 10 Trônes + Léviathan avec chrono et classement local.
- **Mécaniques Tactiques & Progression :**
  - **Météo Tactique Dynamique :** *Pluie Acide* (-15 % armure ennemie), *Tempête Ionique* (+20 % recharge `[Q]`, portée longue -10 %), *Brouillard Infernal* (portée radar réduite, bonus dégâts courte portée).
  - **Arbre de Recherche du Bastion (QG) :** 12 nœuds persistants achetables en Crédits Haven (blindage du rempart, capacité d’absorption du bouclier Aegis, drones de réparation automatisés).
  - **12 nouveaux Mutateurs Infinitum** liés à la météo et aux vagues aériennes.
- **VFX, Sprites & Audio :**
  - Planches RGBA 8 frames pour les 10 unités aériennes, particules météo canvas (pluie oblique, éclairs ambiants, brume basse), alerte sonore dédiée « Intrusion Aérienne » (`playAirRaidAlert()`).

---

## 17. Extensions Payantes de Contenu (3 Domaines Visuels Inédits)

> Trois extensions premium conçues chacune autour d’une **direction artistique totalement inédite** (en rupture visuelle avec la cité côtière cyber-gothique sombre du jeu de base), avec cartes, héroïnes adultes (27+), antagonistes, bestiaire, arsenal, radio et contenu narratif complet.

### 17.1 Extension Payante I — « Cathédrale Astrale & Nécropole Solaire »
- **Domaine Visuel Inédit :** **Gothique Sacré Doré, Marbre Blanc & Horlogerie Céleste** (au-dessus de la couche nuageuse, baignée de lumière astrale chaude — rupture totale avec l’asphalte nocturne néon).
  - **Palette :** Marbre `#f8fafc`, Or astral `#f59e0b` / `#fef3c7`, Indigo céleste `#312e81`, Cyan stellaire `#38bdf8`.
  - **Props & Hors-Arène :** vitraux géants flottants, rouages d’astrolabe en rotation lente, arches de marbre suspendues, nuages dorés en parallaxe.
- **Cartes (2 nouveaux théâtres d’opération) :**
  1. *Parvis Solaire* : esplanade symétrique à miroirs concentrateurs augmentant la portée des tourelles alignées.
  2. *Nef d’Horlogerie* : couloirs rythmés par des engrenages rotatifs modifiant périodiquement les lignes de tir.
- **Personnages (2 Valkyries adultes 27+ & 1 Archonte Boss) :**
  - **Séraphine Vesper-Sol (29 ans)** — *Garde du Méridien* : `[Q]` *Prisme Orbital* (rayon solaire balayant une allée), Ultime *Zénith d’Or* (invulnérabilité brève + pluie de lances lumineuses).
  - **Béatrice Horologia (33 ans)** — *Maîtresse des Rouages* : `[Q]` *Ralentissement Astral* (zone temporelle -55 % vitesse ennemie), Ultime *Minuit Solaire* (réinitialise les temps de recharge des tourelles proches).
  - **Antagoniste — Archonte Aurélien-X (Boss 3 phases)** : *Ph.1 Jugement de Verre*, *Ph.2 Éclipse Dorée*, *Ph.3 Effondrement d’Astrolabe*.
- **Bestiaire & Arsenal :**
  - **8 Ennemis Célestes/Horlogerie** (*Chérubin Automaton*, *Porte-Encensoir*, *Golem d’Albâtre*, *Pendulier de Siège*, etc.).
  - **2 Tourelles :** *Orgue Solaire* (rayon continu focalisé) & *Pendule Stase* (impulsion chrono-ralentissante).
  - **1 Arme Héroïne :** *Rayon Séraphique* (évolution : *Chœur de Supernova*).
- **Audio, HUD & Contenu 18+ :**
  - **Station Radio `CH-06 · Celestial Organ` :** orgue synthétique baroque + chœurs éthérés.
  - **Skin HUD Doré Diégétique :** bordures filigranées or & marbre dans les modales.
  - **Pack VN & Studio Boudoir « Sanctuaire Solaire » :** 6 chapitres longs, 2 décors de boudoir dorés, 4 tenues soie/or (strictement adultes 27+, consensuel).

### 17.2 Extension Payante II — « Abysses Bioluminescents »
- **Domaine Visuel Inédit :** **Sous-Marin Abyssal, Récifs Coralliens Mécaniques & Bioluminescence Organique** (station bathyscaphe sous la côte d’Haven, ambiance aquatique profonde et caustiques lumineuses).
  - **Palette :** Bleu abyssal `#042f2e` / `#091526`, Turquoise bioluminescent `#2dd4bf`, Violet médusaire `#a855f7`, Corail néon `#fb7185`.
  - **Props & Hors-Arène :** fosses océaniques sombres, bancs de méduses lumineuses dérivantes, épaves de sous-marins, caustiques d’eau animées en superposition.
- **Cartes (2 nouveaux théâtres d’opération) :**
  1. *Fosse de Corail* : récifs organiques créant des goulots sinueux + geysers thermaux repoussant les ennemis.
  2. *Dôme Bathyal* : station pressurisée circulaire à sas étanches activables tactiquement.
- **Personnages (2 Valkyries adultes 27+ & 1 Impératrice Abyssale Boss) :**
  - **Néréa Kestrel (28 ans)** — *Plongeuse Pression* : `[Q]` *Onde Sonar* (révèle les unités furtives et étourdit 1,8 s), Ultime *Maelström Bathyal*.
  - **Thalassa Vance (35 ans)** — *Commandante du Bathyscaphe* : `[Q]` *Harpon Cryo-Pression*, Ultime *Décompression Souveraine*.
  - **Antagoniste — Léviathane Abyssale Charybde (Boss 3 phases)** : *Ph.1 Courant Noir*, *Ph.2 Essaim Médusaire*, *Ph.3 Pression Critique*.
- **Bestiaire & Arsenal :**
  - **8 Ennemis Abyssaux** (*Nautile Blindé*, *Méduse EMP*, *Raie Furtive*, *Crabe Foreur*, etc.).
  - **2 Tourelles :** *Tour Sonar* (détection furtive + onde de choc) & *Harpon Pression* (perforation lourde anti-armure).
  - **1 Arme Héroïne :** *Torpille à Cavitation* (évolution : *Vortex Abyssal*).
- **Audio, VFX & Contenu 18+ :**
  - **Station Radio `CH-07 · Abyssal Pulse` :** deep-ambient, basses sous-marines filtrées et impulsions sonar.
  - **VFX dédiés :** bulles de cavitation, ondes sonar concentriques, traînées bioluminescentes.
  - **Pack VN & Studio Boudoir « Observatoire Sous-Marin » :** 6 chapitres longs, 2 ambiances aquatiques nocturnes, 4 tenues néoprène tactique / soie nacrée (27+, consensuel).

### 17.3 Extension Payante III — « Jardin de Cendre & Verrière Art Nouveau »
- **Domaine Visuel Inédit :** **Botanique Mutante, Fer Forgé Art Nouveau & Serres de Cristal Émeraude/Pourpre** (mégastructure végétale ayant repris ses droits sur d’anciens quartiers industriels, lumière filtrée à travers des verrières brisées).
  - **Palette :** Émeraude profond `#064e3b`, Vert sève lumineux `#34d399`, Rose ronce `#e11d48`, Ambre pollen `#fbbf24`.
  - **Props & Hors-Arène :** arches de fer forgé Art Nouveau couvertes de lianes luminescentes, bassins de sève, pétales géants et spores flottantes en continu.
- **Cartes (2 nouveaux théâtres d’opération) :**
  1. *Grande Serre* : allées vitrées traversées par des ronces rétractables ralentissant naturellement l’ennemi.
  2. *Racines du Cœur* : arène organique où des bourgeons d’énergie soignent légèrement les tourelles adjacentes.
- **Personnages (2 Valkyries adultes 27+ & 1 Souveraine Florale Boss) :**
  - **Sylva Rosier (31 ans)** — *Architecte Botanique* : `[Q]` *Mur de Ronces Cristallines*, Ultime *Éclosion Écarlate* (poison + soin léger de la Citadelle).
  - **Ophélia Lierre (37 ans)** — *Maîtresse des Serres* : `[Q]` *Nuage de Spores Dorées* (confusion/ralentissement), Ultime *Canopée d’Émeraude*.
  - **Antagoniste — Reine Noctiflora (Boss 3 phases)** : *Ph.1 Pollen Hallucinogène*, *Ph.2 Lianes Étrangleuses*, *Ph.3 Floraison Finale*.
- **Bestiaire & Arsenal :**
  - **8 Ennemis Bio-Botaniques** (*Guêpe Cristalline*, *Tréant d’Acier*, *Fleur Mortier*, *Rampeur de Lierre*, etc.).
  - **2 Tourelles :** *Ruche de Spores* (essaims autonomes) & *Prisme Botanique* (laser réfracté multi-cibles).
  - **1 Arme Héroïne :** *Liane Plasma* (évolution : *Couronne d’Épines*).
- **Audio, VFX & Contenu 18+ :**
  - **Station Radio `CH-08 · Velvet Flora` :** trip-hop organique, nappes analogiques chaudes et percussions boisées.
  - **VFX dédiés :** pluie de pétales cristallins, pollen lumineux, éclats de verre Art Nouveau.
  - **Pack VN & Studio Boudoir « Serre Privée au Clair de Lune » :** 6 chapitres longs, 2 ambiances verrière nocturne/pluie sur vitre, 4 tenues dentelle botanique / soie émeraude (27+, consensuel).
