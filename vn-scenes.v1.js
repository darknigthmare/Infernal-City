/**
 * Infernal City — scènes longues de Visual Novel, version 1.
 *
 * Contrat d’intégration :
 * - Charger ce fichier avant le moteur qui consomme les scènes.
 * - Lire `window.INFERNAL_VN_SCENES.heroines[heroId].chapters`.
 * - Commencer un chapitre à `entryBeat`, puis suivre `nextBeat`.
 * - Une réplique utilise `speaker` : `narrator`, `hero` ou `player`.
 * - Un beat `choice` expose des options avec `consentAction`, `nextBeat`
 *   et des effets déclaratifs. Le moteur reste responsable de la sauvegarde.
 * - `pause` ne révoque pas la relation. `revoke` place explicitement
 *   `romanceOptIn` à false sans toucher à l’affinité ni au gameplay.
 *
 * Toutes les protagonistes sont explicitement adultes. Les scènes reposent
 * sur un consentement enthousiaste, renouvelable et révocable. L’intimité
 * reste sensuelle et se termine par un fondu au noir.
 */
(function exposeInfernalVisualNovelScenes() {
  'use strict';

  const N = (text, mood = 'atmosphere') => ({ speaker: 'narrator', text, mood });
  const H = (text, mood = 'neutral') => ({ speaker: 'hero', text, mood });
  const P = (text, mood = 'neutral') => ({ speaker: 'player', text, mood });

  const safeEffects = Object.freeze({
    relationshipXp: 0,
    preserveAffinity: true,
    preserveCombat: true
  });

  /**
   * Tous les chapitres partagent la même grammaire de consentement afin que
   * l’interface puisse afficher des contrôles prévisibles et accessibles.
   */
  function makeChapter(config) {
    const completionFlag = `vn.${config.heroId}.${config.id}.complete`;
    return {
      id: config.id,
      heroId: config.heroId,
      title: config.title,
      subtitle: config.subtitle,
      summary: config.summary,
      estimatedMinutes: config.estimatedMinutes || 8,
      unlock: config.unlock,
      presentation: {
        portrait: config.portrait,
        alternatePortrait: config.alternatePortrait || config.portrait,
        backdrop: config.backdrop,
        musicMood: config.musicMood,
        fadeToBlack: true
      },
      entryBeat: 'opening',
      onceEffects: true,
      beats: [
        {
          id: 'opening',
          kind: 'dialogue',
          lines: config.opening,
          nextBeat: 'consent-check'
        },
        {
          id: 'consent-check',
          kind: 'choice',
          consentCheckpoint: true,
          prompt: config.firstPrompt,
          options: [
            {
              id: 'accept',
              label: config.acceptLabel,
              consentAction: 'affirm',
              nextBeat: 'middle',
              effects: { relationshipXp: 2, preserveAffinity: true, preserveCombat: true }
            },
            {
              id: 'pause',
              label: 'Pas maintenant — rester proches sans poursuivre',
              consentAction: 'pause',
              nextBeat: 'pause',
              effects: safeEffects
            },
            {
              id: 'revoke',
              label: 'Révoquer l’accord romantique et rester alliés',
              consentAction: 'revoke',
              nextBeat: 'revoke',
              effects: {
                romanceOptIn: false,
                relationshipXp: 0,
                preserveAffinity: true,
                preserveCombat: true
              }
            }
          ]
        },
        {
          id: 'middle',
          kind: 'dialogue',
          lines: config.middle,
          nextBeat: 'renew-consent'
        },
        {
          id: 'renew-consent',
          kind: 'choice',
          consentCheckpoint: true,
          prompt: config.secondPrompt,
          options: [
            {
              id: 'continue',
              label: config.continueLabel,
              consentAction: 'affirm',
              nextBeat: 'close',
              effects: { relationshipXp: 2, preserveAffinity: true, preserveCombat: true }
            },
            {
              id: 'slow',
              label: 'Ralentir et prolonger seulement la conversation',
              consentAction: 'limit',
              nextBeat: 'slow-close',
              effects: { relationshipXp: 1, preserveAffinity: true, preserveCombat: true }
            },
            {
              id: 'stop',
              label: 'Arrêter ici, sans modifier notre accord',
              consentAction: 'pause',
              nextBeat: 'pause',
              effects: safeEffects
            },
            {
              id: 'revoke',
              label: 'Retirer mon accord romantique maintenant',
              consentAction: 'revoke',
              nextBeat: 'revoke',
              effects: {
                romanceOptIn: false,
                relationshipXp: 0,
                preserveAffinity: true,
                preserveCombat: true
              }
            }
          ]
        },
        {
          id: 'close',
          kind: 'dialogue',
          lines: config.close,
          end: true,
          endState: 'completed',
          onEnterEffects: {
            setFlags: [completionFlag],
            relationshipXp: 3,
            preserveAffinity: true,
            preserveCombat: true
          }
        },
        {
          id: 'slow-close',
          kind: 'dialogue',
          lines: config.slowClose,
          end: true,
          endState: 'completed-with-limit',
          onEnterEffects: {
            setFlags: [completionFlag],
            relationshipXp: 1,
            preserveAffinity: true,
            preserveCombat: true
          }
        },
        {
          id: 'pause',
          kind: 'dialogue',
          lines: [
            N('Le rythme retombe aussitôt. La porte reste ouverte, la distance choisie est respectée.'),
            H(config.pauseLine, 'supportive'),
            N('La scène s’achève sans perte de confiance, de progression ou d’efficacité militaire.')
          ],
          end: true,
          endState: 'paused',
          onEnterEffects: safeEffects
        },
        {
          id: 'revoke',
          kind: 'dialogue',
          lines: [
            N('Votre retrait est entendu immédiatement, sans discussion ni tentative de vous faire changer d’avis.'),
            H(config.revokeLine, 'respectful'),
            N('Votre alliance et toute la confiance déjà acquise demeurent intactes.')
          ],
          end: true,
          endState: 'revoked',
          onEnterEffects: {
            romanceOptIn: false,
            relationshipXp: 0,
            preserveAffinity: true,
            preserveCombat: true
          }
        }
      ]
    };
  }

  const heroines = {
    aria: {
      id: 'aria',
      displayName: 'Commandante Aria',
      age: 34,
      isAdult: true,
      title: 'Valkyrie Aegis',
      portrait: 'assets/cg_aria.jpg',
      alternatePortrait: 'assets/cg_aria_swimsuit.jpg',
      voice: 'directe, protectrice et vulnérable seulement lorsqu’elle le choisit',
      boundary: 'Hors service, vous êtes d’égal à égal. Un refus ne change jamais son efficacité au combat.',
      chapters: [
        makeChapter({
          id: 'midnight-relief',
          heroId: 'aria',
          title: 'La relève de minuit',
          subtitle: 'Deux commandants, aucune chaîne de commandement',
          summary: 'Après une défense éprouvante, Aria vous invite à parler hors service et pose les bases d’une relation entre égaux.',
          unlock: { affinityMin: 1, romanceOptIn: false, alliedRequired: false },
          portrait: 'assets/cg_aria.jpg',
          alternatePortrait: 'assets/cg_aria_swimsuit.jpg',
          backdrop: 'haven-command-deck-night',
          musicMood: 'quiet-industrial',
          firstPrompt: 'Aria retire ses insignes et demande si vous souhaitez rester avec elle hors service.',
          acceptLabel: 'Rester et lui parler d’égal à égal',
          secondPrompt: 'Elle vous propose de partager un verre dans l’alcôve privée du pont, sans autre attente.',
          continueLabel: 'Accepter le verre et cette proximité choisie',
          pauseLine: '« Très bien. Tu n’as rien à justifier. Je serai sur le pont quand tu auras envie de parler. »',
          revokeLine: '« Reçu. Nous restons partenaires de combat, et je ne laisserai personne traiter ton choix comme une faiblesse. »',
          opening: [
            N('Les portes blindées du centre de commandement se ferment sur la relève. Au-dehors, les batteries Aegis continuent de balayer les ruines de Haven.'),
            N('Aria reste devant la carte tactique jusqu’à ce que le dernier officier quitte la salle. Puis elle coupe le canal militaire de son brassard.'),
            H('« Fin de service. À partir de maintenant, je ne te donne plus d’ordres. »', 'reserved'),
            P('« Tu voulais me voir sans état-major ? »'),
            H('« Je voulais vérifier comment tu tiens. Pas la Citadelle, pas les chiffres. Toi. »', 'concerned'),
            N('Elle dépose ses gants sur la console. Le geste paraît plus intime que n’importe quelle parade cérémonielle.'),
            H('« On nous regarde toujours comme si nous étions faits d’acier. Je refuse de te demander cette comédie ici. »'),
            P('« Et toi, qui vérifie comment tu tiens ? »'),
            N('Son regard quitte enfin la carte. La fatigue y apparaît, nette, mais nullement honteuse.'),
            H('« Personne, d’habitude. C’est précisément pour cela que je t’ai invité. »', 'vulnerable'),
            H('« Si tu restes, c’est une conversation privée entre deux adultes. Tu peux repartir, maintenant ou plus tard, sans que cela change notre travail. »')
          ],
          middle: [
            N('Aria désactive les écrans tactiques. La lumière rouge des alertes cède la place au bleu calme du cycle nocturne.'),
            H('« J’ai perdu une escouade dans le secteur nord, il y a trois ans. Depuis, chaque silence radio me ramène là-bas. »', 'vulnerable'),
            P('« Tu n’as pas à porter ça seule pour prouver que tu peux commander. »'),
            H('« Je sais le dire aux autres. L’appliquer à moi-même est une autre bataille. »'),
            N('Elle s’assoit sur le bord de la table plutôt que dans le fauteuil du commandement et vous désigne la place voisine.'),
            H('« Près de moi, si cette distance te convient. Sinon, la chaise d’en face. Les deux réponses me vont. »'),
            P('« Ici me convient. Et si cela change, je te le dirai. »'),
            H('« Voilà le genre de rapport clair que j’aime recevoir. »', 'warm'),
            N('Un rire bref adoucit son visage. Ses épaules cessent enfin de tenir toute la voûte de la Citadelle.'),
            H('« Je ne te promets pas d’être facile à connaître. Je peux te promettre de ne jamais utiliser mon grade pour obtenir ta présence. »'),
            P('« Alors je peux te promettre une présence qui sera toujours choisie. »'),
            N('Elle laisse le silence accueillir cette phrase au lieu de la remplir trop vite.')
          ],
          close: [
            N('Dans l’alcôve, Aria ouvre une bouteille réservée aux fins de siège. Elle vous tend d’abord le verre intact pour que vous décidiez vous-même.'),
            H('« À Haven, encore debout. Et aux personnes qui n’ont pas besoin de l’être tout le temps. »', 'soft'),
            P('« À nous, hors service. »'),
            N('Les verres se touchent. Son genou effleure le vôtre, puis elle s’arrête assez longtemps pour vous laisser confirmer la proximité.'),
            H('« Toujours bien ? »'),
            P('« Oui. Si ce n’est plus le cas, je te le dirai. »'),
            H('« Parfait. Je ferai de même. »', 'warm'),
            N('Vous parlez jusqu’à ce que les premiers néons de l’aube remplacent les alarmes. Aria ne vous retient pas ; elle vous raccompagne à la porte avec un sourire désormais sans armure.')
          ],
          slowClose: [
            N('Vous choisissez la chaise d’en face et Aria l’accepte avec le même naturel que si vous aviez choisi sa proximité.'),
            H('« Restons sur les mots. J’en ai trop gardé derrière les dents. »', 'relieved'),
            N('La nuit se poursuit en récits de batailles, de mauvais café et de lendemains possibles.'),
            H('« Merci d’être resté exactement de la manière qui te convenait. »')
          ]
        }),
        makeChapter({
          id: 'shield-dance',
          heroId: 'aria',
          title: 'La danse des boucliers',
          subtitle: 'Une soirée que personne ne commande',
          summary: 'Aria transforme un exercice Aegis en rendez-vous et vous laisse définir ensemble la nature de votre rapprochement.',
          unlock: { affinityMin: 2, romanceOptIn: true, alliedRequired: false, flags: ['vn.aria.midnight-relief.complete'] },
          portrait: 'assets/cg_aria.jpg',
          alternatePortrait: 'assets/cg_aria_swimsuit.jpg',
          backdrop: 'aegis-training-dome',
          musicMood: 'slow-synth',
          firstPrompt: 'Aria tend sa main au centre du dôme d’entraînement vidé pour la nuit.',
          acceptLabel: 'Prendre sa main et essayer cette danse improvisée',
          secondPrompt: 'Lorsque la musique ralentit, elle demande si elle peut se rapprocher davantage.',
          continueLabel: 'Dire oui et préciser la proximité souhaitée',
          pauseLine: '« On garde la musique, chacun de son côté. Ce n’est pas un échec, c’est notre rythme ce soir. »',
          revokeLine: '« Merci de me l’avoir dit clairement. Je range cette invitation, pas notre confiance. »',
          opening: [
            N('Le dôme Aegis est vide, débarrassé des drones cibles et des instructeurs. Des hexagones de lumière dérivent encore sur les parois.'),
            H('« J’ai réservé le terrain sous le prétexte d’un étalonnage. C’était plus simple que d’écrire “rendez-vous” sur le registre. »', 'amused'),
            P('« La commandante contourne donc ses propres procédures ? »'),
            H('« La commandante n’est pas ici. Aria, en revanche, assume toute la responsabilité. »'),
            N('Elle lance une ancienne chanson de Haven, lente, presque engloutie sous les basses du système de défense.'),
            H('« Avant la guerre, je dansais. Mal, si l’on en croit ma sœur. Avec enthousiasme, si l’on m’écoute. »'),
            P('« Et tu veux recommencer avec moi ? »'),
            H('« Je veux te le proposer. La nuance compte. »', 'direct'),
            N('Elle tend une main ouverte, sans avancer d’un pas.'),
            H('« Tu peux la prendre, proposer autre chose ou me laisser danser seule. Aucun rapport ne sera rédigé. »'),
            P('« Tu avais vraiment préparé cette phrase. »'),
            H('« Trois versions. Celle-ci était la moins militaire. »', 'playful')
          ],
          middle: [
            N('Sa paume est chaude et ferme. Elle attend que vous choisissiez la distance avant de commencer à compter les pas.'),
            H('« Un, deux… non, oublie les chiffres. Ils me donnent envie de former une escouade. »'),
            P('« Suis plutôt la musique. Je te préviendrai si je change de rythme. »'),
            H('« Marché conclu. »', 'warm'),
            N('Les champs d’entraînement répondent à vos mouvements par des halos dorés. Chaque tour dessine un bouclier fugitif sous vos pieds.'),
            H('« Au combat, je prévois quatre issues à chaque seconde. Ici, je n’en veux qu’une : celle que nous choisissons ensemble. »'),
            P('« Tu peux ne rien prévoir pendant une chanson. Je suis là. »'),
            N('Aria inspire profondément. Sa main quitte votre épaule, puis revient seulement après votre signe.'),
            H('« Je voulais faire cela depuis la relève de minuit. Je ne voulais pas supposer que l’envie était partagée. »', 'tender'),
            P('« Elle l’est. Et j’apprécie que tu aies demandé. »'),
            H('« Alors je demande encore : est-ce que cette distance te convient ? »'),
            N('Le dôme devient silencieux entre deux morceaux, offrant un véritable espace à votre réponse.')
          ],
          close: [
            P('« Oui. Plus près, mais lentement. »'),
            N('Aria réduit l’espace d’un seul pas. Son front vient toucher le vôtre avant que ses lèvres ne cherchent les vôtres.'),
            H('« Ici ? »', 'soft'),
            P('« Ici. »'),
            N('Le baiser reste calme, attentif, interrompu une première fois pour un sourire et une seconde pour vérifier vos regards.'),
            H('« Je comprends enfin pourquoi les manuels Aegis n’expliquent pas ça. »', 'playful'),
            P('« Trop de variables ? »'),
            H('« Une seule qui compte : que nous en ayons envie tous les deux. »'),
            N('La chanson s’achève, mais vous continuez à tourner sous les boucliers de lumière jusqu’à ce que la nuit vous rende doucement au reste de Haven.')
          ],
          slowClose: [
            P('« Gardons un peu de distance et apprends-moi seulement les pas. »'),
            H('« Avec plaisir. Et tu constateras que ma sœur avait raison. »', 'amused'),
            N('Vous dansez côte à côte, parfois maladroits, souvent rieurs.'),
            H('« Ce rendez-vous me plaît ainsi. Il n’a rien à prouver. »')
          ]
        }),
        makeChapter({
          id: 'under-aegis',
          heroId: 'aria',
          title: 'Sous le dôme Aegis',
          subtitle: 'Le droit de déposer les armes',
          summary: 'Dans ses quartiers, Aria révèle ce qu’elle désire hors du rôle de protectrice et renouvelle votre accord avant tout geste intime.',
          unlock: { affinityMin: 4, romanceOptIn: true, privateMomentRequired: false, flags: ['vn.aria.shield-dance.complete'] },
          portrait: 'assets/cg_aria_swimsuit.jpg',
          alternatePortrait: 'assets/cg_aria.jpg',
          backdrop: 'aria-private-quarters',
          musicMood: 'intimate-aegis',
          estimatedMinutes: 10,
          firstPrompt: 'Aria demande si vous voulez entrer dans ses quartiers privés maintenant que la bataille est terminée.',
          acceptLabel: 'Entrer après avoir confirmé vos limites mutuelles',
          secondPrompt: 'Elle vous demande si vous souhaitez poursuivre au-delà des mots et des baisers.',
          continueLabel: 'Confirmer une intimité partagée, avec signal d’arrêt',
          pauseLine: '« Nous pouvons rester devant la baie, ou nous retrouver une autre nuit. Ton choix me protège autant qu’il te protège. »',
          revokeLine: '« Notre lien n’a jamais été un ordre de mission. Il est terminé parce que tu le décides, et je respecte cela entièrement. »',
          opening: [
            N('Le couloir des officiers est silencieux. Aria attend devant sa porte sans présenter sa paume au lecteur biométrique.'),
            H('« Avant d’ouvrir : cette invitation est personnelle. Tu ne me dois aucune réponse à cause de ce que nous avons vécu ou défendu ensemble. »', 'serious'),
            P('« Et si j’entre, je peux encore changer d’avis. »'),
            H('« À chaque seconde. Moi aussi. Notre signal d’arrêt sera “veille”. Un seul mot, et tout s’arrête. »'),
            N('Elle vous demande vos limites, les répète avec ses propres mots et corrige une nuance jusqu’à ce que vous vous sentiez compris.'),
            H('« Je veux que tu saches exactement ce que j’espère, pas que tu le devines. De la proximité. Des baisers. Peut-être davantage si nous le voulons encore tous les deux. »', 'open'),
            P('« C’est aussi ce que j’espère. Lentement, et sans devoir aller jusqu’à une destination précise. »'),
            H('« Voilà une mission dont j’aime les paramètres. »', 'warm'),
            N('La serrure reste éteinte. Aria vous regarde une dernière fois, laissant l’ultime décision précéder l’ouverture.'),
            H('« Est-ce que tu veux entrer ? »')
          ],
          middle: [
            N('Ses quartiers ne ressemblent pas au bureau austère du commandement. Des photos, une vieille veste de pilote et une plante obstinée y survivent aux sièges.'),
            H('« Bienvenue dans la seule pièce où je ne sais pas toujours quoi faire. »', 'vulnerable'),
            P('« Tu pourrais commencer par ne rien faire. »'),
            N('Aria pose son brassard et son holster dans un coffre. Lorsqu’elle revient, son allure n’a plus rien d’une parade.'),
            H('« Au combat, tout le monde attend que je sois le bouclier. Avec toi, j’aimerais parfois être celle qu’on laisse respirer. »'),
            P('« Tu peux. Tu n’as pas besoin de gagner ton repos. »'),
            N('Elle s’approche, s’arrête à portée de votre main et attend. Vous effleurez ses doigts ; sa réponse est un soupir retenu depuis trop longtemps.'),
            H('« Oui pour ta main. Oui pour que tu te rapproches. Demande-moi pour le reste. »', 'tender'),
            P('« Puis-je t’embrasser ? »'),
            H('« Oui. »'),
            N('Le premier baiser est lent. Aria garde une main ouverte contre votre épaule, jamais une prise, et recule assez pour vous retrouver du regard.'),
            H('« Toujours oui ? »'),
            P('« Toujours oui. Et toi ? »'),
            H('« Oui. Avec une envie qui ne doit rien à mon uniforme. »', 'desiring')
          ],
          close: [
            N('Vous répétez le signal d’arrêt une dernière fois. Aria sourit à la précision du rituel, non pour s’en moquer mais parce qu’elle s’y sent libre.'),
            H('« Alors nous n’avons rien à conquérir. Seulement quelque chose à partager. »', 'soft'),
            N('Les panneaux Aegis se teintent d’un bleu profond. Vos baisers gagnent en chaleur, entrecoupés de questions brèves et de réponses claires.'),
            P('« Veux-tu que je reste cette nuit ? »'),
            H('« Oui. Et si l’un de nous change d’avis, l’autre offrira du thé, une couverture ou de l’espace. »'),
            N('La porte intérieure se ferme sur votre nouvel accord. La scène se fond au noir avant ce qui n’appartient qu’à vous.'),
            N('Plus tard, deux tasses fumantes reposent près de la baie. Aria appuie sa tête contre votre épaule, détendue.'),
            H('« Rapport final : aucune forteresse prise. Confiance intacte. Nuit excellente. »', 'content')
          ],
          slowClose: [
            P('« Restons aux baisers et à la conversation. »'),
            H('« Oui. C’est exactement ce que nous ferons. »', 'supportive'),
            N('Vous vous installez devant la baie, proches mais sans précipitation, et regardez les patrouilles dessiner l’aube.'),
            H('« Je n’ai jamais eu besoin que cette nuit aille plus loin pour qu’elle compte. »')
          ]
        })
      ]
    },

    kira: {
      id: 'kira',
      displayName: 'Kira l’Ombre',
      age: 29,
      isAdult: true,
      title: 'Infiltratrice Fantôme',
      portrait: 'assets/cg_kira.jpg',
      alternatePortrait: 'assets/cg_kira_lingerie.jpg',
      voice: 'ironique, observatrice et très précise sur le rythme',
      boundary: 'Kira contrôle son propre rythme et préfère les invitations directes, sans insistance.',
      chapters: [
        makeChapter({
          id: 'dead-channel',
          heroId: 'kira',
          title: 'Le canal mort',
          subtitle: 'Une conversation sans surveillance',
          summary: 'Kira vous révèle un refuge invisible aux systèmes de Haven et teste non votre loyauté, mais votre capacité à entendre un non.',
          unlock: { affinityMin: 1, romanceOptIn: false, alliedRequired: false },
          portrait: 'assets/cg_kira.jpg',
          alternatePortrait: 'assets/cg_kira_lingerie.jpg',
          backdrop: 'shadow-lounge',
          musicMood: 'noir-electronic',
          firstPrompt: 'Kira vous offre la chaise face à elle et demande si vous acceptez une conversation sans masque.',
          acceptLabel: 'S’asseoir et promettre de ne rien exiger',
          secondPrompt: 'Elle propose d’éteindre aussi vos terminaux pour préserver ce moment.',
          continueLabel: 'Couper le dernier canal et rester avec elle',
          pauseLine: '« Sage décision. Les bons secrets savent attendre sans se vexer. »',
          revokeLine: '« Message reçu et clé effacée. Je couvrirai toujours tes angles morts sur le terrain. »',
          opening: [
            N('Le message de Kira ne contient qu’une suite de coordonnées et la phrase : “Viens si tu le choisis. Seul.”'),
            N('Les coordonnées mènent à un ancien relais radio sous le Salon Nocturne, officiellement condamné depuis vingt ans.'),
            H('« Tu as trouvé. Je devrai rendre mes énigmes plus difficiles. »', 'playful'),
            P('« Ou admettre que tu voulais être trouvée. »'),
            N('Kira apparaît lorsque les ombres cessent de la dissimuler. Elle n’est pas armée, détail qu’elle vous laisse délibérément remarquer.'),
            H('« Ici, aucune caméra, aucun rapport, aucun faux reflet. C’est plus rare que la sécurité absolue. »'),
            P('« Pourquoi me montrer cet endroit ? »'),
            H('« Parce que tu as accepté trois de mes refus sans négocier. La plupart des gens pensent qu’un non ouvre une discussion. Toi, tu l’as traité comme une réponse. »', 'measured'),
            N('Elle désigne deux chaises séparées par une petite table.'),
            H('« Ne confonds pas ma gratitude avec une dette. Je veux parler. Je ne promets rien après. »'),
            P('« Alors parlons. Rien ne sera présumé. »'),
            H('« Bonne réponse. Mais je préfère encore qu’elle soit vraie. »', 'curious')
          ],
          middle: [
            N('Kira active un brouilleur analogique. Son bourdonnement couvre les basses du Salon et crée autour de vous une poche de silence.'),
            H('« L’Ombre est un rôle pratique. Elle n’a peur de rien, n’attend personne et ne dort jamais. »'),
            P('« Et Kira ? »'),
            H('« Kira déteste les chambres sans fenêtres et collectionne les chansons trop sentimentales. Cette information peut détruire ma réputation. »', 'dry'),
            P('« Elle est en sécurité avec moi. »'),
            H('« Tu vois ? Voilà le piège. J’ai envie de te croire. »', 'vulnerable'),
            N('Elle avance une main sur la table mais s’arrête avant de franchir la ligne médiane.'),
            H('« Si tu veux la prendre, demande. Si tu ne le veux pas, ne joue pas un rôle pour me rassurer. »'),
            P('« Puis-je prendre ta main ? »'),
            H('« Oui. Doucement. »'),
            N('Ses doigts se referment sur les vôtres à leur propre rythme. Son pouce trace une fois votre phalange, puis attend votre réaction.'),
            H('« Mon signal de pause sera deux pressions. Pas de question avant que j’aie repris de l’espace. »'),
            P('« Compris. Le mien sera le mot “clair”. »'),
            H('« Deux codes simples. Plus honnêtes que bien des serments. »', 'warm')
          ],
          close: [
            N('Vous éteignez vos terminaux. Dans le noir presque complet, Kira rallume une petite lampe couleur ambre.'),
            H('« Je ne veux pas disparaître ce soir. Seulement choisir qui peut me voir. »', 'soft'),
            P('« Je te vois. Et je n’emporterai rien que tu ne m’aies donné. »'),
            N('Elle contourne la table et s’assied sur l’accoudoir de votre fauteuil, proche sans vous enfermer.'),
            H('« Toujours confortable ? »'),
            P('« Oui. »'),
            H('« Moi aussi. C’est assez pour cette nuit. »', 'content'),
            N('La conversation dure longtemps : missions absurdes, identités abandonnées, plats préférés. Quand Kira vous raccompagne, elle glisse une nouvelle clé cryptée dans votre paume.'),
            H('« Celle-ci ouvre seulement quand nous sommes deux à l’activer. Une précaution que je trouve soudain séduisante. »', 'playful')
          ],
          slowClose: [
            N('Vous gardez vos terminaux allumés et les chaises à leur place. Kira incline la tête, satisfaite de la réponse exacte.'),
            H('« Bien. Nous pouvons être sincères sans fabriquer de l’intimité à toute vitesse. »'),
            N('Elle partage une chanson sentimentale et menace de nier son existence au lever du jour.'),
            P('« Ton secret est sauf. Et notre rythme aussi. »')
          ]
        }),
        makeChapter({
          id: 'shadow-game',
          heroId: 'kira',
          title: 'Le jeu des ombres',
          subtitle: 'Faire confiance sans perdre le contrôle',
          summary: 'Un exercice d’infiltration devient un jeu sensuel dont Kira énonce elle-même les règles et les sorties.',
          unlock: { affinityMin: 2, romanceOptIn: true, flags: ['vn.kira.dead-channel.complete'] },
          portrait: 'assets/cg_kira.jpg',
          alternatePortrait: 'assets/cg_kira_lingerie.jpg',
          backdrop: 'holographic-maze',
          musicMood: 'playful-stealth',
          firstPrompt: 'Kira propose un jeu : la suivre dans le labyrinthe holographique, avec le droit de quitter la partie à chaque balise.',
          acceptLabel: 'Accepter le jeu et convenir des signaux de pause',
          secondPrompt: 'À la dernière balise, elle demande si elle peut retirer votre visière et vous embrasser.',
          continueLabel: 'L’autoriser et confirmer que le baiser est souhaité',
          pauseLine: '« Partie suspendue. Je préfère un arrêt net à un oui approximatif. »',
          revokeLine: '« Le jeu s’arrête ici. Je ne conserverai aucune donnée intime, et notre équipe reste solide. »',
          opening: [
            N('Le labyrinthe holographique occupe un hangar entier. Ses murs changent au rythme des pas, créant des ruelles de néons et des portes impossibles.'),
            H('« Aucun score. Aucun classement. Seulement six balises et le plaisir de me chercher. »', 'playful'),
            P('« Tu seras invisible ? »'),
            H('« Presque. Je te laisserai toujours assez d’indices pour choisir de continuer. »'),
            N('Kira fixe une visière translucide devant vous sans la fermer.'),
            H('« Tu l’attaches toi-même. Tu peux la relever à chaque balise. Visière levée, la partie s’arrête immédiatement. »', 'precise'),
            P('« Et tes deux pressions ? »'),
            H('« Toujours valables. Ton mot “clair” aussi. Un nouveau jeu n’efface pas nos anciens codes. »'),
            N('Elle recule dans une porte de lumière. Sa silhouette se fragmente en dizaines de reflets.'),
            H('« Je veux que tu me suives. Je ne veux pas que tu te sentes obligé de me rattraper. Différence fondamentale. »'),
            P('« Je te suivrai tant que nous aurons tous les deux envie de jouer. »'),
            H('« Alors trouve-moi. »', 'teasing')
          ],
          middle: [
            N('À la première balise, une projection de Kira vous demande si vous voulez poursuivre. À la deuxième, sa vraie voix murmure derrière votre épaule.'),
            H('« Encore oui ? »'),
            P('« Encore oui. »'),
            N('Elle disparaît avant que vous vous retourniez. Chaque étape vous offre une sortie clairement éclairée, jamais un cul-de-sac.'),
            N('À la quatrième balise, vous trouvez son masque posé sur un socle.'),
            H('« Je porte ce visage pour traverser les défenses. Ce soir, je choisis de te montrer celui qui reste. »', 'open'),
            P('« Je peux attendre que tu viennes à moi. »'),
            H('« C’est exactement ce que je voulais entendre. »'),
            N('Kira sort d’une ombre à quelques pas, visage découvert, sourire moins assuré que d’habitude.'),
            H('« Ne me promets pas que tu ne me blesseras jamais. Promets-moi d’écouter quand je dirai que quelque chose me blesse. »'),
            P('« Je te le promets. Et je te dirai la même chose. »'),
            H('« Voilà une confiance utilisable. Pas parfaite. Vivante. »', 'tender'),
            N('Elle vous guide vers la dernière balise, cette fois sans disparaître.')
          ],
          close: [
            P('« Tu peux retirer la visière. Et oui, j’ai envie que tu m’embrasses. »'),
            N('Kira déverrouille la visière et la pose à portée de votre main. Ses yeux recherchent les vôtres avant qu’elle avance.'),
            H('« Si tu changes d’avis, tu n’as qu’un mot à dire. »', 'soft'),
            N('Son baiser est d’abord une question, léger et bref. Votre réponse l’invite à revenir avec une chaleur plus franche.'),
            H('« Toujours clair ? »'),
            P('« Très clair. Et toi ? »'),
            H('« Je choisis de rester visible encore un peu. »', 'desiring'),
            N('Les murs du labyrinthe s’effacent, laissant un hangar vide autour de vous. Kira ne se cache pas lorsque vos mains se retrouvent.'),
            N('La partie se termine sans vainqueur, ce qu’elle déclare être sa meilleure réussite tactique.')
          ],
          slowClose: [
            P('« Retire la visière, mais gardons le baiser pour une autre fois. »'),
            H('« Accord précis. J’aime ça. »', 'supportive'),
            N('Elle retire l’équipement et reste à vos côtés tandis que le labyrinthe s’éteint.'),
            H('« Être vue sans devoir aller plus loin est déjà une victoire. »')
          ]
        }),
        makeChapter({
          id: 'two-key-safehouse',
          heroId: 'kira',
          title: 'La clé à deux voix',
          subtitle: 'Dans le refuge où l’Ombre se repose',
          summary: 'Kira ouvre son véritable refuge et négocie avec vous une nuit intime dont chaque règle peut être modifiée.',
          unlock: { affinityMin: 4, romanceOptIn: true, flags: ['vn.kira.shadow-game.complete'] },
          portrait: 'assets/cg_kira_lingerie.jpg',
          alternatePortrait: 'assets/cg_kira.jpg',
          backdrop: 'kira-safehouse',
          musicMood: 'intimate-noir',
          estimatedMinutes: 10,
          firstPrompt: 'La serrure attend vos deux voix. Kira demande si vous voulez ouvrir le refuge avec elle.',
          acceptLabel: 'Prononcer la clé et entrer selon vos règles communes',
          secondPrompt: 'Après un long baiser, Kira demande si vous souhaitez rester pour une intimité plus profonde.',
          continueLabel: 'Rester et renouveler clairement votre accord',
          pauseLine: '« Nous n’ouvrons rien de plus ce soir. Je peux rester contre toi, ou te laisser tout l’espace nécessaire. »',
          revokeLine: '« J’efface ta signature de la serrure maintenant. Ce refuge reste un souvenir sûr, jamais une dette. »',
          opening: [
            N('Le refuge de Kira se cache derrière une façade sans porte. Deux capteurs vocaux attendent dans une étroite bande de lumière.'),
            H('« Une serrure à deux voix. Même moi, je ne peux pas l’ouvrir seule lorsque ce protocole est actif. »', 'proud'),
            P('« Tu as conçu une porte qui exige notre accord simultané. »'),
            H('« J’aime quand l’architecture comprend le consentement mieux que certains officiers. »', 'dry'),
            N('Elle vous donne la phrase-clé, puis ajoute un second mot.'),
            H('« “Cendre” suspend tout. “Aube” ferme la scène et désactive ta clé. Ni l’un ni l’autre n’a besoin d’explication. »'),
            P('« Cendre pour respirer. Aube pour terminer. »'),
            H('« Exact. Et avant d’entrer, parlons de ce que nous désirons vraiment. »'),
            N('Vous énoncez vos envies et vos limites. Kira ne transforme aucune hésitation en permission ; elle reformule jusqu’à entendre une réponse nette.'),
            H('« J’ai envie de tes mains, de tes baisers et de ne pas devoir surveiller la sortie pendant quelques heures. Pas d’improvisation au-delà de ce que nous venons de nommer. »', 'open'),
            P('« J’en ai envie aussi. Et je resterai attentif à tes mots comme à ton silence. »'),
            H('« Alors, si tu le veux encore, dis la clé avec moi. »')
          ],
          middle: [
            N('La porte s’ouvre sur une pièce chaude, garnie de coussins, de plantes et de cartes postales rapportées sous de fausses identités.'),
            H('« Voici tout ce que l’Ombre ne montre pas. Kira aime les couleurs, apparemment. »', 'self-conscious'),
            P('« Kira a très bon goût. »'),
            H('« Flatterie détectée. Pas nécessaire, mais acceptée. »', 'playful'),
            N('Elle retire lentement ses accessoires d’infiltration et les range hors de portée, signal clair que la nuit n’est pas une mission.'),
            H('« Approche. Seulement jusqu’à ce que je vienne finir la distance. »'),
            N('Vous obéissez à la limite. Kira observe votre immobilité, puis glisse elle-même ses bras autour de vous.'),
            H('« Oui à ça. »', 'tender'),
            P('« Puis-je t’embrasser ? »'),
            H('« Oui. Et je veux pouvoir te le demander à mon tour ensuite. »'),
            N('Le baiser commence lentement. Elle s’écarte, demande, puis revient avec une assurance qui n’a rien à voir avec son personnage public.'),
            H('« Est-ce que je peux te toucher ainsi ? »'),
            P('« Oui. Et dis-moi si tu veux que ma main reste ou s’éloigne. »'),
            H('« Elle peut rester. Pour l’instant, exactement là. »', 'desiring')
          ],
          close: [
            N('Vous répétez “Cendre” et “Aube”, puis confirmez chacun votre oui. Le refuge baisse ses lumières sans verrouiller aucune issue.'),
            H('« Je n’ai pas envie de disparaître. Pas avec toi, pas cette nuit. »', 'soft'),
            P('« Alors reste visible. Je resterai présent. »'),
            N('Vos gestes deviennent plus intimes, toujours ponctués de questions simples. La scène se fond au noir sur un accord renouvelé.'),
            N('Plus tard, Kira revient avec de l’eau, une couverture et le choix explicite entre parler, dormir proches ou reprendre de l’espace.'),
            H('« Je vote pour proches, si ton vote est le même. »'),
            P('« Il l’est. »'),
            N('Elle désactive le brouilleur afin qu’une musique douce remplisse la pièce. Pour une fois, aucune ombre n’est nécessaire.'),
            H('« Garde le secret sur mes chansons. Pour le reste… je crois que j’aimerais construire d’autres nuits comme celle-ci. »', 'content')
          ],
          slowClose: [
            P('« Restons aux baisers et gardons le reste pour plus tard. »'),
            H('« Oui. Aucun objectif caché, aucune étape obligatoire. »', 'supportive'),
            N('Kira choisit une chanson et vient se blottir près de vous après avoir demandé la permission.'),
            H('« Deux adultes dans une pièce sûre. C’est déjà beaucoup plus rare qu’un miracle. »')
          ]
        })
      ]
    },

    rin: {
      id: 'rin',
      displayName: 'Rin',
      age: 28,
      isAdult: true,
      title: 'Haute Prêtresse de Flamme',
      portrait: 'assets/cg_rin.jpg',
      alternatePortrait: 'assets/cg_rin_silk.jpg',
      voice: 'franche, chaleureuse et attentive aux mots prononcés',
      boundary: 'Rin demande toujours une réponse claire avant de rapprocher les flammes.',
      chapters: [
        makeChapter({
          id: 'two-ember-cups',
          heroId: 'rin',
          title: 'Deux coupes de braise',
          subtitle: 'La chaleur offerte, jamais imposée',
          summary: 'Rin partage un thé rituel et explique pourquoi chaque invitation du sanctuaire commence par une possibilité de partir.',
          unlock: { affinityMin: 1, romanceOptIn: false, alliedRequired: false },
          portrait: 'assets/cg_rin.jpg',
          alternatePortrait: 'assets/cg_rin_silk.jpg',
          backdrop: 'ember-sanctuary',
          musicMood: 'ritual-warmth',
          firstPrompt: 'Rin vous offre une coupe et vous demande si vous souhaitez rester jusqu’à l’extinction de la première braise.',
          acceptLabel: 'Accepter la coupe et rester librement',
          secondPrompt: 'Elle propose de partager un souvenir personnel plutôt qu’un autre rituel.',
          continueLabel: 'L’écouter et partager aussi un souvenir',
          pauseLine: '« Une flamme entretenue de force n’éclaire personne. Reviens seulement si le désir t’y conduit. »',
          revokeLine: '« Ton non est complet. Le sanctuaire et mon amitié te resteront ouverts, sans attente dissimulée. »',
          opening: [
            N('Le sanctuaire de Rin se dresse entre deux générateurs de la Citadelle, oasis de pierre chaude au cœur du métal.'),
            N('Des dizaines de flammes flottent au-dessus du sol sans combustible. Rin en recueille deux dans ses paumes.'),
            H('« Celle-ci pour toi, si tu la veux. Celle-ci pour moi. Aucune ne brûle sans être invitée. »', 'ceremonial'),
            P('« Même le feu doit demander la permission ? »'),
            H('« Surtout le feu. Il peut réchauffer, révéler, détruire. La différence tient souvent à la manière dont on l’accueille. »'),
            N('Elle transforme les flammes en deux coupes fumantes et pose la vôtre à mi-distance.'),
            H('« Le rite est simple. Tu peux boire, laisser refroidir ou repartir. Je ne chercherai aucun présage dans ton choix. »', 'direct'),
            P('« Tu désamorces souvent tes propres cérémonies ? »'),
            H('« Quand une tradition fait croire que refuser portera malheur, ce n’est plus une tradition. C’est une menace bien habillée. »'),
            N('La soie rouge de sa tenue capte les lueurs du sanctuaire lorsqu’elle s’assoit en face de vous.'),
            H('« Je t’ai invité parce que ta présence me plaît. Pas parce que les flammes l’exigent. »', 'warm'),
            P('« Alors je peux rester parce que ta présence me plaît aussi. »')
          ],
          middle: [
            N('Le thé goûte la cannelle, les agrumes et quelque chose de presque électrique. Rin rit en voyant votre surprise.'),
            H('« Recette de ma grand-mère. Elle prétendait qu’un bon thé devait réveiller les morts sans les vexer. »', 'playful'),
            P('« Elle aurait été utile pendant le siège. »'),
            H('« Elle aurait surtout disputé nos démons jusqu’à leur reddition. »'),
            N('Le rire s’apaise. Rin regarde la flamme dans sa coupe.'),
            H('« J’ai été choisie prêtresse très jeune. Adulte, j’ai dû apprendre la différence entre être désirée pour mon rôle et être aimée pour moi. »', 'vulnerable'),
            P('« Qu’est-ce qui te fait sentir la différence ? »'),
            H('« Les questions. Le temps. La liberté de décevoir sans être punie. »'),
            N('Elle pose sa paume près de la vôtre, laissant entre elles un espace lumineux.'),
            H('« Je veux connaître ce que tu désires, mais aussi ce que tu ne veux pas me donner. Les deux me parlent de toi. »'),
            P('« Je peux être honnête, même lorsque la réponse est “pas encore”. »'),
            H('« Alors tu es déjà plus proche que ceux qui promettent toujours oui. »', 'tender')
          ],
          close: [
            H('« Mon souvenir : la première fois que j’ai éteint le feu sacré pour regarder les étoiles. J’ai cru trahir tout le temple. »'),
            P('« Et qu’as-tu découvert dans le noir ? »'),
            H('« Que ma foi survivait très bien sans spectacle. Et que j’aimais le silence. »', 'soft'),
            N('Vous partagez à votre tour un souvenir imparfait. Rin l’écoute sans le purifier, l’expliquer ou le comparer au sien.'),
            H('« Merci. Je le garderai comme on garde une braise : sans souffler dessus jusqu’à l’étouffer. »'),
            N('Vos mains se rejoignent au-dessus de la dernière flamme, après une question et un oui.'),
            P('« La braise s’éteint. Dois-je partir ? »'),
            H('« Le rite est terminé. Maintenant, tu peux rester simplement parce que nous en avons envie. »', 'warm'),
            N('Vous restez jusqu’à ce que le métal froid de Haven prenne lui-même une couleur d’aurore.')
          ],
          slowClose: [
            N('Vous laissez la coupe refroidir et Rin ne cherche pas à ranimer la braise.'),
            H('« Parlons seulement de choses légères. Les vérités profondes n’aiment pas les horaires. »'),
            N('Elle raconte trois catastrophes culinaires du temple et vous apprend un juron cérémoniel.'),
            H('« Voilà une soirée sacrée qui me convient parfaitement. »', 'amused')
          ]
        }),
        makeChapter({
          id: 'spoken-limits',
          heroId: 'rin',
          title: 'Le rituel des limites',
          subtitle: 'Nommer le désir pour le rendre sûr',
          summary: 'Avant une danse du feu, Rin fait de vos limites partagées le centre du rituel plutôt qu’un obstacle à la passion.',
          unlock: { affinityMin: 2, romanceOptIn: true, flags: ['vn.rin.two-ember-cups.complete'] },
          portrait: 'assets/cg_rin.jpg',
          alternatePortrait: 'assets/cg_rin_silk.jpg',
          backdrop: 'flame-ritual-circle',
          musicMood: 'sensual-ritual',
          firstPrompt: 'Rin vous invite dans le cercle et demande quelles distances et quels gestes vous conviennent.',
          acceptLabel: 'Entrer après avoir nommé clairement vos limites',
          secondPrompt: 'À la fin de la danse, elle demande si elle peut poser ses lèvres sur les vôtres.',
          continueLabel: 'Répondre oui et l’inviter à vous embrasser',
          pauseLine: '« Nous laissons la flamme descendre. Elle ne perd rien à attendre un autre oui. »',
          revokeLine: '« Le cercle est ouvert et notre accord romantique s’achève. Ma chaleur ne deviendra jamais une pression. »',
          opening: [
            N('Rin a tracé un cercle assez vaste pour que deux personnes puissent s’y déplacer sans jamais se toucher.'),
            H('« Certains récits prétendent que ce rite lie deux âmes. C’est une mauvaise traduction. Il ne lie rien. Il révèle ce qui est offert. »', 'ceremonial'),
            P('« Et si nous offrons seulement une danse ? »'),
            H('« Alors nous aurons une danse. Complète, digne et suffisante. »'),
            N('Elle vous montre trois gestes : paume ouverte pour continuer, poing fermé pour ralentir, main sur le cœur pour arrêter.'),
            H('« Les mots restent prioritaires. Les signes servent seulement quand la musique les couvre. »'),
            P('« Paume, poing, cœur. »'),
            H('« Et aucune surprise. Je toucherai tes mains et tes épaules si tu l’acceptes. Rien d’autre sans une nouvelle question. »', 'direct'),
            P('« J’accepte ces gestes. Tu peux également guider mes mains vers ta taille, mais pas plus bas. »'),
            H('« Compris : je guide, et cette limite reste en place jusqu’à ce que tu la modifies explicitement. »'),
            N('Rin attend encore, le cercle ouvert derrière elle.'),
            H('« Veux-tu entrer ? »', 'inviting')
          ],
          middle: [
            N('La musique commence par un battement sourd. Les flammes imitent vos respirations plutôt que vos pas.'),
            H('« Ne me suis pas. Réponds-moi. »', 'playful'),
            N('Rin avance ; vous tournez. Elle présente sa paume ; vous la rejoignez. Chaque contact reste dans le vocabulaire convenu.'),
            P('« Tu savais que le cercle ferait ça ? »'),
            H('« Qu’il dessinerait nos mouvements, oui. Qu’il te donnerait cette lumière, non. »', 'admiring'),
            N('Elle guide vos mains jusqu’à sa taille, attend votre paume ouverte, puis réduit lentement la distance.'),
            H('« Toujours confortable ? »'),
            P('« Oui. Ta main sur mon épaule peut rester. »'),
            H('« La tienne aussi. »'),
            N('Les flammes se font plus hautes, mais leur chaleur ne dépasse jamais celle d’une peau au soleil.'),
            H('« Le désir n’est pas moins puissant quand il connaît ses frontières. Regarde comme il danse mieux. »', 'tender'),
            P('« Et si une frontière bouge ? »'),
            H('« On arrête. On demande. On ne devine jamais dans son propre intérêt. »'),
            N('La dernière note vous laisse proches, les mains exactement là où vous aviez convenu.')
          ],
          close: [
            P('« Oui, tu peux m’embrasser. »'),
            H('« Et toi, veux-tu poser ta main contre ma joue ? »'),
            P('« Oui. »'),
            N('Rin incline le visage dans votre paume avant de vous embrasser. La chaleur du cercle se concentre en une douce lumière autour de vous.'),
            H('« Toujours oui ? »', 'soft'),
            P('« Oui. Et toi ? »'),
            H('« Oui, sans la moindre prophétie pour décider à ma place. »', 'joyful'),
            N('Le deuxième baiser dure davantage, puis Rin recule la première et sourit de voir votre attention rester calme.'),
            H('« Le rite ne nous lie pas. Je reviendrai parce que je le choisirai. J’espère que toi aussi. »'),
            N('Les flammes s’éteignent une à une, laissant votre liberté intacte et votre proximité plus lumineuse.')
          ],
          slowClose: [
            P('« Pas de baiser ce soir. Mais je veux rester dans le cercle avec toi. »'),
            H('« Oui. Terminons la danse ainsi. »', 'supportive'),
            N('Vos mains restent jointes jusqu’à la dernière note, sans que Rin tente d’ajouter un sens à votre limite.'),
            H('« Cette réponse était claire. Elle rend le moment plus beau, pas moins. »')
          ]
        }),
        makeChapter({
          id: 'closed-sanctuary',
          heroId: 'rin',
          title: 'Le sanctuaire fermé',
          subtitle: 'Une nuit sans oracle',
          summary: 'Rin ferme le sanctuaire aux prophéties et vous invite à construire une intimité guidée uniquement par vos choix présents.',
          unlock: { affinityMin: 4, romanceOptIn: true, flags: ['vn.rin.spoken-limits.complete'] },
          portrait: 'assets/cg_rin_silk.jpg',
          alternatePortrait: 'assets/cg_rin.jpg',
          backdrop: 'rin-private-sanctuary',
          musicMood: 'intimate-flame',
          estimatedMinutes: 10,
          firstPrompt: 'Rin éteint le brasier divin et vous demande si vous souhaitez rester dans le sanctuaire devenu simplement sien.',
          acceptLabel: 'Rester et confirmer ensemble envies et signaux',
          secondPrompt: 'Près du bassin chaud, elle demande si vous souhaitez prolonger cette intimité au-delà des baisers.',
          continueLabel: 'Dire oui avec les limites déjà formulées',
          pauseLine: '« Nous nous arrêterons ici et je garderai près de toi la chaleur que tu souhaites, rien de plus. »',
          revokeLine: '« Aucun dieu, aucun rite et aucun souvenir ne s’opposera à ton choix. Nous restons libres et alliés. »',
          opening: [
            N('Pour la première fois, le grand brasier du sanctuaire est éteint. Seules des lampes basses éclairent les étoffes et le bassin de pierre.'),
            H('« Ce soir, je ne suis l’oracle de personne. Je ne demanderai aucun signe aux flammes. »', 'open'),
            P('« Pourquoi les avoir éteintes ? »'),
            H('« Parce que je veux que nos choix soient les seules voix dans cette pièce. »'),
            N('Rin déroule un coussin près de l’entrée, assez loin du bassin pour que la conversation ne contienne aucune promesse cachée.'),
            H('« Mon envie : t’embrasser, sentir tes mains dans mon dos, puis décider ensemble si nous souhaitons davantage. Ma limite : aucun geste que nous n’avons pas nommé. »', 'direct'),
            P('« Mon envie est proche de la tienne. Mon signal d’arrêt sera “braise”. »'),
            H('« Le mien sera “nuit”. Les deux signifient arrêt immédiat, puis nous demanderons seulement ce qui aide : eau, couverture, parole ou espace. »'),
            N('Vous échangez d’autres limites sans gêne. Rin accueille chaque précision comme une confiance, jamais comme une déception.'),
            H('« Tu peux encore choisir la porte. Elle restera déverrouillée toute la nuit. »'),
            P('« Je veux rester. »'),
            H('« Alors reste avec Rin, pas avec son titre. »', 'tender')
          ],
          middle: [
            N('Rin défait les ornements cérémoniels de ses cheveux et les pose un à un. Le silence se charge d’une proximité calme.'),
            H('« Est-ce que je peux m’asseoir contre toi ? »'),
            P('« Oui. »'),
            N('Elle vient se placer près de vous, son épaule sous votre bras, puis attend avant de guider votre main jusqu’au milieu de son dos.'),
            H('« Ici me convient. »', 'soft'),
            P('« Puis-je t’embrasser ? »'),
            H('« Oui. Lentement d’abord. »'),
            N('Ses lèvres sont chaudes sans magie. Le baiser se construit par retours successifs, chacun précédé d’un regard ou d’un mot.'),
            H('« Plus près ? »'),
            P('« Oui, à ce rythme. »'),
            N('Rin sourit contre votre joue. Sa main se pose sur votre poitrine, légère et facile à écarter.'),
            H('« Je sens ton cœur. Pas besoin d’oracle pour comprendre cette réponse, mais je te la demande quand même. »'),
            P('« Je désire continuer. Et toi ? »'),
            H('« Oui. Avec toi, maintenant, sans promesse obligatoire pour demain. »', 'desiring')
          ],
          close: [
            N('Vous reformulez une dernière fois vos limites. Rin confirme chacune d’elles, puis vous demande votre oui présent.'),
            P('« Oui. »'),
            H('« Oui pour moi aussi. “Braise” et “nuit” restent avec nous. »', 'soft'),
            N('Les lampes descendent jusqu’à une lueur ambrée. Vos gestes gagnent en intimité, sans quitter le langage convenu.'),
            N('La scène se fond au noir avant la suite que vous choisissez de partager.'),
            N('Plus tard, Rin rallume une seule flamme pour chauffer de l’eau et vous laisse choisir entre proximité et espace.'),
            H('« Je voudrais rester près de toi. Est-ce également ton envie ? »'),
            P('« Oui. »'),
            H('« Alors aucune prophétie. Seulement ce oui, et un autre demain si nous le voulons encore. »', 'content')
          ],
          slowClose: [
            P('« Je veux rester aux baisers et m’arrêter là. »'),
            H('« Oui. Ta limite est la forme entière de notre nuit. »', 'supportive'),
            N('Rin se blottit près de vous seulement après votre accord et rallume une flamme paisible.'),
            H('« Nous avons toute la chaleur nécessaire. »')
          ]
        })
      ]
    },

    selene: {
      id: 'selene',
      displayName: 'Sélène',
      age: 31,
      isAdult: true,
      title: 'Oracle Cyber-Lunaire',
      portrait: 'assets/cg_selene.jpg',
      alternatePortrait: 'assets/cg_selene_translucent.jpg',
      voice: 'douce, analytique et rassurante par sa précision',
      boundary: 'Sélène privilégie les mots précis et renouvelle le consentement à chaque étape.',
      chapters: [
        makeChapter({
          id: 'artificial-moon',
          heroId: 'selene',
          title: 'La lune artificielle',
          subtitle: 'Observer sans interpréter',
          summary: 'Sous le ciel simulé de Haven, Sélène vous demande de l’aider à distinguer une émotion réelle d’une prédiction.',
          unlock: { affinityMin: 1, romanceOptIn: false, alliedRequired: false },
          portrait: 'assets/cg_selene.jpg',
          alternatePortrait: 'assets/cg_selene_translucent.jpg',
          backdrop: 'lunar-observatory',
          musicMood: 'ambient-lunar',
          firstPrompt: 'Sélène vous invite à vous asseoir sous la lune artificielle, à la distance que vous choisirez.',
          acceptLabel: 'Rester et choisir une proximité confortable',
          secondPrompt: 'Elle demande si elle peut laisser sa main rejoindre la vôtre sur la rambarde.',
          continueLabel: 'L’inviter à prendre votre main',
          pauseLine: '« Nous préserverons le silence et la distance. Ils ne signifient rien d’autre que ce que tu viens de choisir. »',
          revokeLine: '« Je supprime cette hypothèse romantique. Notre confiance réelle vaut davantage qu’une prédiction désirée. »',
          opening: [
            N('L’observatoire projette un ciel que la pollution de Haven a effacé depuis des générations. Au centre brille une lune immense et parfaitement artificielle.'),
            H('« Je connais chaque défaut de cette simulation. Pourtant, elle continue de m’émouvoir. Cela me rassure. »', 'reflective'),
            P('« Pourquoi cela te rassure-t-il ? »'),
            H('« Une émotion prévisible reste parfois une émotion sincère. J’ai longtemps cru que mes modèles rendaient tout ce que je ressentais suspect. »'),
            N('Sélène règle deux sièges indépendants et vous laisse déplacer le vôtre.'),
            H('« Choisis ta distance. Je ne l’interpréterai ni comme une promesse ni comme un rejet. »', 'precise'),
            P('« Tu pourrais pourtant calculer ce que je vais faire. »'),
            H('« Je pourrais estimer. Je préfère demander. Une personne n’est pas une probabilité que l’on manipule jusqu’au résultat désiré. »'),
            N('Son reflet flotte dans la baie, mêlé aux cratères de lumière.'),
            H('« Ma question est simple : veux-tu rester avec moi jusqu’au prochain cycle lunaire ? »'),
            P('« Oui. Et je te dirai si mon envie change. »'),
            H('« Cette variable claire me plaît beaucoup. »', 'warm')
          ],
          middle: [
            N('Le dôme ralentit sa course. Sélène vous montre une étoile encodée à partir du dernier signal reçu de sa colonie natale.'),
            H('« Elle n’existe peut-être plus. La lumière ment avec plusieurs siècles de retard. »', 'sad'),
            P('« Ce qu’elle représentait pour toi existe encore. »'),
            H('« Tu réponds comme un poète, ce qui rend mes contre-arguments difficiles. »', 'amused'),
            N('Elle replie ses jambes sous elle et se tourne davantage vers vous.'),
            H('« Je peux prévoir le prochain assaut avec une marge de trois minutes. Je ne peux pas prévoir si tu auras envie de me revoir après cette conversation. »'),
            P('« Tu peux me le demander demain. »'),
            H('« Oui. Et accepter que la réponse ne soit pas garantie par celle d’aujourd’hui. »'),
            N('Ses doigts approchent de la rambarde entre vous, puis restent immobiles à quelques centimètres des vôtres.'),
            H('« Je souhaite prendre ta main. Je ne veux pas utiliser le silence pour présumer ton accord. »', 'tender'),
            P('« Merci de me laisser répondre. »'),
            H('« Le temps de la réponse fait partie de la question. »'),
            N('La lune simulée descend lentement vers l’horizon, sans imposer aucun compte à rebours.')
          ],
          close: [
            P('« Oui, prends ma main. »'),
            N('Sélène glisse ses doigts entre les vôtres avec une lenteur qui permettrait de s’arrêter à chaque instant.'),
            H('« Cette donnée-ci n’ira dans aucune archive. »', 'soft'),
            P('« Tu peux pourtant la garder comme souvenir. »'),
            H('« Un souvenir choisi, oui. Pas une preuve à produire contre une future réponse différente. »'),
            N('Elle appuie doucement son épaule contre la vôtre après un nouveau regard interrogateur.'),
            H('« Toujours confortable ? »'),
            P('« Oui. »'),
            H('« Pour moi aussi. »', 'content'),
            N('La lune s’éteint. Vous restez main dans la main sous un ciel redevenu noir, et ce qui aurait pu sembler vide devient un espace partagé.')
          ],
          slowClose: [
            P('« Gardons nos mains séparées, mais je veux continuer à regarder le ciel avec toi. »'),
            H('« Merci pour la précision. Elle m’évite d’inventer une histoire à ta place. »', 'supportive'),
            N('Vos reflets demeurent proches dans la baie sans que Sélène réduise la distance réelle.'),
            H('« Cette nuit est belle dans cette configuration exacte. »')
          ]
        }),
        makeChapter({
          id: 'memory-garden',
          heroId: 'selene',
          title: 'Le jardin des souvenirs',
          subtitle: 'Ce que les machines ne doivent pas décider',
          summary: 'Sélène vous ouvre une simulation faite de souvenirs privés et vous confie le contrôle de leur intensité.',
          unlock: { affinityMin: 2, romanceOptIn: true, flags: ['vn.selene.artificial-moon.complete'] },
          portrait: 'assets/cg_selene.jpg',
          alternatePortrait: 'assets/cg_selene_translucent.jpg',
          backdrop: 'lunar-memory-garden',
          musicMood: 'dreamlike-lunar',
          firstPrompt: 'Sélène vous tend le contrôle principal de la simulation et demande si vous souhaitez entrer dans son souvenir.',
          acceptLabel: 'Prendre le contrôle et entrer avec elle',
          secondPrompt: 'Sous l’arbre lunaire, elle demande si elle peut se rapprocher et vous embrasser.',
          continueLabel: 'L’accueillir près de vous et dire oui au baiser',
          pauseLine: '« Je suspends la simulation ici. Le souvenir ne sera pas endommagé et nous non plus. »',
          revokeLine: '« J’efface immédiatement tes accès privés. Notre alliance reste réelle, même si cette voie romantique s’arrête. »',
          opening: [
            N('Le jardin n’existe que lorsque Sélène ferme les portes du laboratoire. Des arbres argentés émergent alors du sol de données.'),
            H('« C’est la cour de mon enfance, reconstruite avec des fragments incomplets. Il pleuvait toujours dans mon souvenir. Le programme insiste sur un ciel clair. »', 'wistful'),
            P('« Tu veux que je voie cela ? »'),
            H('« Je veux te le proposer. Je crains de transformer involontairement une vulnérabilité en obligation de proximité. »'),
            N('Elle détache le contrôle principal de son poignet et vous le tend.'),
            H('« Avec ceci, tu peux réduire l’intensité, quitter la scène ou couper ma projection. Je ne peux pas annuler ton choix depuis l’intérieur. »', 'precise'),
            P('« Tu me donnes le pouvoir de fermer ton propre souvenir. »'),
            H('« Le pouvoir de te protéger de ce que je t’offre. La confiance n’exige pas que tu renonces à tes sorties. »'),
            N('Une pluie de pixels traverse les arbres puis disparaît.'),
            H('« Si tu entres, je te demanderai régulièrement ce qui te convient. Mais tu n’as pas besoin d’attendre mes questions. »'),
            P('« Je le comprends. »'),
            H('« Alors choisis seulement si tu en as envie. »', 'inviting')
          ],
          middle: [
            N('Dans la simulation, le laboratoire s’efface. Une brise transporte l’odeur improbable d’une mer disparue.'),
            H('« Cet arbre était réel. Je m’y cachais pour lire les cartes orbitales interdites. »', 'fond'),
            P('« L’oracle était déjà rebelle. »'),
            H('« Avec une efficacité statistiquement décevante. Ma mère me trouvait toujours. »', 'amused'),
            N('Sélène vous montre un banc. Vous pouvez en modifier la distance d’un geste ; elle attend que vous le placiez.'),
            H('« Ici ? »'),
            P('« Ici me convient. »'),
            N('Elle s’assoit. Le programme tente de rapprocher automatiquement vos avatars ; Sélène le bloque aussitôt.'),
            H('« Algorithme romantique simpliste. Il confond préférence historique et consentement actuel. »', 'annoyed'),
            P('« Même tes programmes ont encore des choses à apprendre. »'),
            H('« Ils apprennent de données. Nous pouvons faire mieux : nous parler. »'),
            N('Elle se tourne vers vous sous les feuilles lunaires.'),
            H('« J’ai envie de me rapprocher et de t’embrasser. Est-ce une envie partagée, limitée ou non désirée ? »', 'tender')
          ],
          close: [
            P('« Partagée. Viens près de moi. »'),
            N('Sélène réduit la distance sans laisser la simulation le faire pour elle. Sa main demande la vôtre avant que son visage s’approche.'),
            H('« Oui pour ta main ? »'),
            P('« Oui. Et oui pour le baiser. »'),
            N('Ses lèvres rencontrent les vôtres sous une pluie enfin conforme à son souvenir. Elle rit doucement lorsque des gouttes numériques traversent vos épaules.'),
            H('« L’imperfection améliore curieusement la scène. »', 'joyful'),
            P('« Peut-être parce qu’elle devient la nôtre. »'),
            H('« La nôtre aujourd’hui. Nous redemanderons demain. »'),
            N('Elle vous embrasse encore après votre réponse, puis vous laisse décider du moment où le jardin se referme.'),
            H('« Merci de n’avoir pas traité mon passé comme une monnaie d’échange. »', 'soft')
          ],
          slowClose: [
            P('« Je veux rester près de toi, mais sans baiser. »'),
            H('« Proximité acceptée, baiser exclu. »', 'supportive'),
            N('Sélène s’assoit à la distance choisie et fait apparaître une pluie légère sur le jardin.'),
            H('« Tu peux fermer la scène quand tu le souhaites. D’ici là, regardons-la tomber. »')
          ]
        }),
        makeChapter({
          id: 'tide-chamber',
          heroId: 'selene',
          title: 'La chambre de marée',
          subtitle: 'Un avenir qui ne se calcule pas',
          summary: 'Dans un refuge baigné de lumière lunaire, Sélène abandonne ses prédictions et négocie une nuit intime au présent.',
          unlock: { affinityMin: 4, romanceOptIn: true, flags: ['vn.selene.memory-garden.complete'] },
          portrait: 'assets/cg_selene_translucent.jpg',
          alternatePortrait: 'assets/cg_selene.jpg',
          backdrop: 'selene-tide-chamber',
          musicMood: 'intimate-lunar',
          estimatedMinutes: 10,
          firstPrompt: 'Sélène désactive ses modèles prédictifs et demande si vous souhaitez rester dans la chambre de marée.',
          acceptLabel: 'Rester dans un présent sans prédiction',
          secondPrompt: 'Après avoir renouvelé vos limites, elle demande si vous souhaitez partager une intimité plus profonde.',
          continueLabel: 'Confirmer le désir partagé et le signal d’arrêt',
          pauseLine: '« Je n’extrapolerai rien de cet arrêt. Je reste disponible pour la proximité exacte que tu choisis. »',
          revokeLine: '« Je ferme cette possibilité sans chercher un scénario où tu répondrais autrement. Ton choix présent est complet. »',
          opening: [
            N('La chambre de marée domine les bassins de refroidissement de Haven. Leur mouvement reflète sur les murs une lumière semblable à l’océan.'),
            H('« J’ai désactivé mes modèles personnels pour douze heures. Je ne sais pas ce que tu vas répondre, et j’accepte ce vertige. »', 'open'),
            P('« Tu n’as vraiment lancé aucune simulation de cette soirée ? »'),
            H('« J’en ai lancé quatre cent douze, puis je les ai toutes supprimées. Elles commençaient à ressembler à une manière sophistiquée de ne pas t’écouter. »'),
            N('Elle vous montre un panneau comportant quatre commandes : lumière, porte, assistance et fin de scène. Toutes répondent à vos deux voix.'),
            H('« Mon signal de pause sera “orbite”. Le tien peut être différent. La commande de fin n’a besoin que d’une voix. »', 'precise'),
            P('« Le mien sera “rivage”. »'),
            H('« Orbite et rivage. Nous arrêterons immédiatement, puis nous demanderons ce qui apporte du confort. »'),
            N('Vous nommez ce que vous souhaitez partager et ce qui reste hors limites. Sélène répète vos mots sans les rendre plus vagues.'),
            H('« Mon envie est de t’embrasser et de laisser nos gestes devenir plus intimes si nous le confirmons encore. Mon attente n’est pas une obligation. »'),
            P('« Mon envie est partagée. Je veux avancer lentement. »'),
            H('« Lentement est une direction complète. »', 'tender')
          ],
          middle: [
            N('Sélène s’assoit près du bassin intérieur et tend la main sans toucher la vôtre.'),
            H('« Puis-je ? »'),
            P('« Oui. »'),
            N('Ses doigts rejoignent les vôtres. Elle les porte contre sa joue, puis vous regarde avant chaque nouveau mouvement.'),
            H('« Est-ce que ta main peut rester ici ? »'),
            P('« Oui. Puis-je venir plus près ? »'),
            H('« Oui, jusqu’à ce que nos épaules se touchent. »'),
            N('La lumière oscille sur sa peau et sa tenue translucide sans rien transformer en spectacle. Sélène choisit elle-même de réduire encore la distance.'),
            H('« Je veux t’embrasser. »', 'desiring'),
            P('« Je le veux aussi. »'),
            N('Le baiser est doux, puis plus assuré lorsqu’elle reçoit une nouvelle confirmation. Elle s’interrompt d’elle-même pour reprendre votre regard.'),
            H('« Mes modèles auraient prédit ce moment avec une précision médiocre. La réalité est beaucoup plus attentive. »', 'warm'),
            P('« Toujours envie de continuer ? »'),
            H('« Oui. Et je veux entendre ton oui sans laisser mon enthousiasme parler à ta place. »')
          ],
          close: [
            P('« Oui. Rivage reste notre arrêt. »'),
            H('« Oui pour moi aussi. Orbite reste le mien. »', 'soft'),
            N('Vous activez ensemble le mode privé. Les reflets de la marée deviennent une lueur basse tandis que vos gestes suivent les limites dites à voix haute.'),
            N('La scène se fond au noir sur deux accords présents, sans prétendre écrire ceux de demain.'),
            N('Plus tard, Sélène vous propose de l’eau, une couverture et trois possibilités : parler, dormir proches ou reprendre chacun son espace.'),
            P('« J’aimerais rester près de toi et parler. »'),
            H('« C’est aussi mon choix. »'),
            N('Vous racontez des futurs impossibles jusqu’à ce que le vrai matin apparaisse sur les bassins.'),
            H('« Je ne sais pas ce que nous deviendrons. Pour la première fois, cette inconnue me semble être un cadeau. »', 'content')
          ],
          slowClose: [
            P('« Restons à cette proximité et aux baisers. »'),
            H('« Oui. Je verrouille cette limite pour la soirée, modifiable seulement si tu la renommes clairement. »', 'supportive'),
            N('Vous regardez les reflets de marée en échangeant quelques baisers lents.'),
            H('« Le présent n’a besoin d’aucune autre preuve. »')
          ]
        })
      ]
    },

    vespera: {
      id: 'vespera',
      displayName: 'Impératrice Vespera',
      age: 146,
      isAdult: true,
      title: 'Souveraine Abyssale',
      portrait: 'assets/cg_vespera.jpg',
      alternatePortrait: 'assets/cg_vespera.jpg',
      voice: 'souveraine, incisive et attachée à la réciprocité des pactes',
      boundary: 'L’alliance militaire ne vaut jamais accord romantique. Vespera choisit séparément chaque rapprochement.',
      chapters: [
        makeChapter({
          id: 'table-without-throne',
          heroId: 'vespera',
          title: 'La table sans trône',
          subtitle: 'L’alliance ne donne aucun droit',
          summary: 'Vespera accepte une rencontre privée à condition que le cadre militaire reste hors de la pièce.',
          unlock: { affinityMin: 1, romanceOptIn: false, alliedRequired: true },
          portrait: 'assets/cg_vespera.jpg',
          backdrop: 'neutral-embassy-chamber',
          musicMood: 'abyssal-diplomacy',
          firstPrompt: 'Vespera retire sa couronne de guerre et demande si vous souhaitez parler sans titres ni dette d’alliance.',
          acceptLabel: 'Accepter cette rencontre séparée du traité',
          secondPrompt: 'Elle propose de prolonger la conversation autour d’un repas préparé par les deux cours.',
          continueLabel: 'Partager le repas sans présumer d’un lien romantique',
          pauseLine: '« Alors l’audience s’arrête. Un souverain digne respecte la frontière avant même d’en demander la raison. »',
          revokeLine: '« Le traité militaire demeure, la proposition romantique disparaît. Je ne confonds jamais un pacte avec une possession. »',
          opening: [
            N('La salle neutre ne porte ni bannière de Haven ni sceau abyssal. Une table ronde y remplace les trônes demandés par les deux protocoles.'),
            N('Vespera entre seule, couronne de guerre à la main, et la pose loin du siège qu’elle choisit.'),
            H('« Mes conseillers pensent que cette rencontre me rend vulnérable. Les tiens pensent probablement qu’elle constitue déjà une victoire. Ils se trompent tous. »', 'imperious'),
            P('« L’alliance n’obligeait pas cette rencontre. »'),
            H('« Bien. Répétons-le jusqu’à ce que les murs eux-mêmes cessent de l’oublier. Je défends Haven parce que cela sert mon peuple et parce que je l’ai décidé. »'),
            P('« Et tu es ici pour une raison différente. »'),
            H('« Je suis ici parce que ta volonté soutient la mienne sans chercher à la courber. Cela m’intrigue. Peut-être davantage. »', 'curious'),
            N('Elle fait glisser vers vous un document ne portant aucune signature.'),
            H('« Ce n’est pas un contrat. C’est une liste de limites : les miennes, celles que je souhaite connaître des tiennes, et une clause d’annulation immédiate. »'),
            P('« Une rencontre romantique négociée comme un traité ? »'),
            H('« Les bons traités rendent la liberté plus claire. Les mauvais la maquillent en obligation. »'),
            N('Vespera se penche légèrement, puis attend sans masquer l’intensité de son regard.'),
            H('« Veux-tu rester à cette table sans trône ? »', 'direct')
          ],
          middle: [
            N('Vous échangez vos limites. Vespera discute les formulations, jamais votre droit de les poser.'),
            H('« “Peut-être” n’est pas une permission différée. Ce sera non jusqu’à ce qu’une nouvelle réponse existe. »', 'precise'),
            P('« Nous sommes d’accord. Et ton alliance avec Haven ne pèsera dans aucune réponse. »'),
            H('« Alors tu comprends pourquoi j’ai accepté de venir. »'),
            N('Elle évoque son empire : les cités suspendues dans l’abîme, les révoltes qu’elle a menées avant de porter la couronne, les noms qu’elle refuse d’effacer.'),
            H('« On m’appelle souveraine comme si je n’avais jamais été prisonnière. Voilà pourquoi je ne tolère aucune chaîne, même tressée de désir. »', 'vulnerable'),
            P('« Je ne te demanderai pas de déposer ta souveraineté pour être proche. »'),
            H('« Non. Tu me demanderas si je souhaite partager cette proximité. Et j’aurai le même devoir envers toi. »'),
            N('Pour la première fois, son sourire n’est ni une menace ni un geste diplomatique.'),
            H('« Tu n’es pas mon sujet. Ne deviens pas non plus mon adorateur. Je préférerais un égal assez courageux pour me contredire. »', 'warm'),
            P('« Je peux certainement te contredire. »'),
            H('« Voilà une promesse crédible. »', 'amused')
          ],
          close: [
            N('Le repas mêle épices de Haven et fruits luminescents de l’abîme. Vespera goûte chaque plat avant de commenter sa diplomatie culinaire.'),
            H('« Celui-ci est une déclaration de guerre. Celui-là mérite une frontière ouverte. »', 'playful'),
            P('« Et cette soirée ? »'),
            H('« Une négociation que je choisis de poursuivre. Pas une annexion. »'),
            N('Elle lève sa coupe, puis attend que vous leviez la vôtre.'),
            H('« À deux volontés qui peuvent se rejoindre sans se posséder. »', 'soft'),
            P('« Et se séparer sans se punir. »'),
            H('« Clause essentielle. »'),
            N('Lorsque le repas s’achève, Vespera remet sa couronne mais ne rétablit pas la distance de la souveraine.'),
            H('« Je demanderai une seconde rencontre. Tu resteras libre de me faire attendre. »', 'intrigued')
          ],
          slowClose: [
            N('Vous maintenez la rencontre à une conversation formelle. Vespera ne tente pas de transformer votre prudence en défi.'),
            H('« Une frontière claire mérite plus de respect qu’un territoire offert par peur. »'),
            N('Elle partage tout de même un récit de sa jeunesse rebelle avant de remettre sa couronne.'),
            H('« La prochaine proposition, si elle existe, sera aussi libre que celle-ci. »')
          ]
        }),
        makeChapter({
          id: 'abyssal-ball',
          heroId: 'vespera',
          title: 'Le bal de l’abîme',
          subtitle: 'Danser sans plier le genou',
          summary: 'À l’ambassade abyssale, Vespera vous invite à une danse réservée aux partenaires capables de rester debout face à elle.',
          unlock: { affinityMin: 2, romanceOptIn: true, alliedRequired: true, flags: ['vn.vespera.table-without-throne.complete'] },
          portrait: 'assets/cg_vespera.jpg',
          backdrop: 'abyssal-embassy-ballroom',
          musicMood: 'regal-sensual',
          firstPrompt: 'Vespera vous tend une main gantée et précise que vous pouvez refuser devant toute sa cour.',
          acceptLabel: 'Prendre sa main sans incliner la tête',
          secondPrompt: 'Sur le balcon, elle demande si elle peut retirer son gant et toucher votre visage.',
          continueLabel: 'L’autoriser et lui demander la même permission',
          pauseLine: '« Nous resterons côte à côte, pas plus près. La cour apprendra que ma volonté sait entendre la tienne. »',
          revokeLine: '« Que tous en soient témoins : ton retrait est légitime, et aucun pacte ne te rend redevable de moi. »',
          opening: [
            N('L’ambassade abyssale a transformé une ancienne gare de Haven en salle de bal. Des orbes violets flottent entre les arches métalliques.'),
            N('À l’arrivée de Vespera, sa cour s’incline. Elle traverse la salle jusqu’à vous et attend que vous restiez debout.'),
            H('« Bien. Si tu avais plié le genou, j’aurais choisi quelqu’un d’autre pour cette danse. »', 'pleased'),
            P('« Ta cour nous regarde. »'),
            H('« Qu’elle regarde. Elle doit apprendre qu’une invitation impériale demeure une invitation. »'),
            N('Vespera tend sa main, paume ouverte.'),
            H('« Tu peux refuser ici, devant tous. Je ferai taire la première langue qui prendra ton choix pour une offense. »', 'protective'),
            P('« Tu veux vraiment danser, ou démontrer une réforme politique ? »'),
            H('« Les deux désirs peuvent coexister. Mais seul le premier te concerne. »', 'amused'),
            N('La musique abyssale commence, lente et profonde comme une marée souterraine.'),
            H('« Si tu acceptes, nous convenons d’abord des contacts. Main, taille, épaule. Aucun autre geste sans question. »'),
            P('« Ces contacts me conviennent. Les mêmes limites s’appliquent à moi. »'),
            H('« Alors choisis. »', 'inviting')
          ],
          middle: [
            N('Vespera vous entraîne dans une danse aux pas amples. Elle guide sans tirer, laissant à votre main toute la liberté de quitter la sienne.'),
            H('« Mon premier maître de danse attachait les poignets des élèves pour corriger leur posture. Je l’ai exilé. »', 'cool'),
            P('« Pour ses méthodes pédagogiques ? »'),
            H('« Pour avoir appelé contrainte ce qui n’était que paresse. On peut enseigner sans posséder le corps de l’autre. »'),
            N('Elle vous invite d’un geste à la faire tourner. La cour murmure lorsque l’impératrice accepte de suivre votre mouvement.'),
            H('« Ils imaginent que céder un pas signifie céder le pouvoir. »'),
            P('« Et toi ? »'),
            H('« Je sais que choisir de suivre est encore une expression de ma volonté. »', 'warm'),
            N('La danse s’achève sur le balcon, loin des regards. Vespera maintient exactement la distance convenue.'),
            H('« Ton assurance m’attire. Ton attention davantage. »', 'desiring'),
            P('« Tu pourrais simplement me dire que la danse t’a plu. »'),
            H('« Elle m’a plu. Toi aussi. Voilà une franchise qui ferait trembler mon conseil. »', 'playful'),
            N('Elle lève sa main gantée vers votre joue, puis s’arrête.')
          ],
          close: [
            P('« Oui, tu peux me toucher. Puis-je retirer ton autre gant ? »'),
            H('« Oui. Lentement. »'),
            N('Ses doigts nus suivent votre joue avec une délicatesse inattendue. Vous retirez l’autre gant sans quitter son regard.'),
            H('« Toujours confortable ? »'),
            P('« Oui. Et toi ? »'),
            H('« Oui. Je souhaite maintenant t’embrasser, mais je ne l’ajouterai pas à ta première permission. »', 'direct'),
            P('« Tu peux m’embrasser. »'),
            N('Vespera ferme la distance et pose sur vos lèvres un baiser aussi assuré que mesuré. Elle recule avant que la cour puisse vous surprendre.'),
            H('« Ce secret ne sera pas une honte. Seulement quelque chose que nous décidons nous-mêmes de partager. »', 'soft'),
            N('Vous retournez au bal côte à côte, sans courbette, sans chaîne et sans nier le sourire de l’impératrice.')
          ],
          slowClose: [
            P('« Gardons nos gants et restons seulement sur le balcon. »'),
            H('« Accepté. La nuit est vaste, nous ne lui devons aucune progression. »', 'supportive'),
            N('Vespera vous montre les constellations de son empire depuis la rambarde.'),
            H('« Rester près de moi par choix suffit à distinguer ce moment de toutes mes audiences. »')
          ]
        }),
        makeChapter({
          id: 'amendable-pact',
          heroId: 'vespera',
          title: 'Le pacte amendable',
          subtitle: 'Deux volontés sous un même sceau',
          summary: 'Vespera vous accueille dans sa chambre diplomatique pour écrire un pacte intime que chacun peut modifier ou détruire.',
          unlock: { affinityMin: 4, romanceOptIn: true, alliedRequired: true, flags: ['vn.vespera.abyssal-ball.complete'] },
          portrait: 'assets/cg_vespera.jpg',
          backdrop: 'vespera-private-embassy',
          musicMood: 'intimate-abyssal',
          estimatedMinutes: 11,
          firstPrompt: 'Le sceau abyssal attend deux signatures lumineuses. Vespera demande si vous souhaitez formuler ce pacte avec elle.',
          acceptLabel: 'Signer seulement après lecture commune des limites',
          secondPrompt: 'Vespera demande si vous souhaitez que le pacte accompagne une nuit plus intime.',
          continueLabel: 'Confirmer la nuit et le droit d’amender chaque limite',
          pauseLine: '« Le sceau restera incomplet. Je veux un accord entier ou aucun, jamais une signature arrachée au doute. »',
          revokeLine: '« Regarde : je détruis ma copie avec la tienne. Rien de toi ne demeure lié à ma couronne. »',
          opening: [
            N('La chambre diplomatique de Vespera est protégée par un sceau qui ne reconnaît ni rang ni autorité, seulement deux présences volontaires.'),
            H('« Ce pacte n’a aucune force dans mon empire ou à Haven. Il existe pour que nous n’utilisions jamais l’intensité comme excuse à l’imprécision. »', 'serious'),
            P('« Nous pouvons aussi ne pas le signer. »'),
            H('« Exact. Un parchemin parfait ne remplace pas un oui présent. Et un oui présent n’abolit pas le prochain non. »'),
            N('Elle lit à voix haute ses limites, ses désirs, son signal “trêve” et ses besoins après toute intimité.'),
            H('« J’ai envie de tes baisers, de tes mains et d’une nuit où je n’aurai à régner sur personne. Je veux pouvoir reprendre ma distance sans te consoler de ma limite. »', 'open'),
            P('« Je peux accueillir ta distance sans en faire une blessure. Mon signal sera “surface”. »'),
            H('« Trêve et surface. Arrêt immédiat, puis eau, parole ou espace selon la demande de celui qui l’a prononcé. »'),
            N('Vous ajoutez vos propres limites. Vespera ne signe qu’après vous avoir entendu les relire vous-même.'),
            H('« Le sceau peut être amendé à chaque instant. Une phrase dite à voix haute prévaut sur l’encre. »'),
            P('« Et si l’un de nous détruit sa copie ? »'),
            H('« Les deux disparaissent. Aucun empire ne conservera une trace d’un consentement révoqué. »', 'firm')
          ],
          middle: [
            N('Les deux signatures illuminent le sceau. Vespera retire sa couronne et la place dans un coffre avant de revenir vers vous.'),
            H('« Ici, je ne suis pas moins souveraine. Je choisis seulement de ne pas exercer cette souveraineté sur toi. »', 'soft'),
            P('« Et je ne suis pas ton sujet. »'),
            H('« Non. Tu es l’adulte que je désire près de moi. Si ce désir est partagé. »'),
            P('« Il l’est. Puis-je t’embrasser ? »'),
            H('« Oui. »'),
            N('Son baiser est lent malgré la force habituelle de sa présence. Elle attend votre invitation avant de laisser ses mains parcourir les zones nommées.'),
            H('« Est-ce que ceci te convient encore ? »', 'desiring'),
            P('« Oui. Ma limite reste celle que nous avons écrite. »'),
            H('« Je la vois. Je la respecte. »'),
            N('Vespera vous guide vers les coussins près de la baie, jamais vers une porte verrouillée.'),
            H('« Je veux poursuivre. Je ne veux pas que mon désir devienne la réponse à ta place. »'),
            P('« Demande-moi. »'),
            H('« Veux-tu partager cette nuit avec moi, dans les limites que nous pouvons encore changer ? »', 'tender')
          ],
          close: [
            P('« Oui. Surface reste mon arrêt. »'),
            H('« Oui. Trêve reste le mien. »'),
            N('Le sceau projette vos limites sur le mur avant de s’effacer de la vue, accessible d’une seule parole.'),
            N('Vos baisers deviennent plus chauds ; chaque nouveau geste reçoit sa propre place dans votre langage. La scène se fond au noir.'),
            N('Plus tard, Vespera demande explicitement si vous souhaitez sa proximité, une conversation ou de l’espace.'),
            P('« Ta proximité. Sans couronne. »'),
            H('« Volontiers. Mais sache que je reste impératrice même avec les cheveux défaits. »', 'playful'),
            N('Elle vient reposer contre vous après votre rire et votre nouveau oui.'),
            H('« Ce pacte n’a rien soumis. C’est pour cela qu’il a plus de valeur que toutes les capitulations de mon règne. »', 'content')
          ],
          slowClose: [
            P('« Je signe pour les baisers et la proximité, pas pour davantage ce soir. »'),
            H('« Amendement accepté avant même l’encre. »', 'supportive'),
            N('Vespera inscrit elle-même la limite et vous remet le contrôle du sceau.'),
            H('« Tu n’as réduit ni la nuit ni mon désir. Tu leur as donné une forme sûre. »')
          ]
        })
      ]
    },

    carmilla: {
      id: 'carmilla',
      displayName: 'Reine Carmilla',
      age: 312,
      isAdult: true,
      title: 'Impératrice de Sang',
      portrait: 'assets/cg_carmilla.jpg',
      alternatePortrait: 'assets/cg_carmilla.jpg',
      voice: 'gothique, spirituelle et intraitable sur les accords explicites',
      boundary: 'Carmilla considère toute hésitation comme une pause immédiate.',
      chapters: [
        makeChapter({
          id: 'sealed-cup',
          heroId: 'carmilla',
          title: 'La coupe scellée',
          subtitle: 'Un pacte ne se boit pas par politesse',
          summary: 'Dans sa bibliothèque, Carmilla offre une coupe dont le sceau garantit que seul votre choix peut l’ouvrir.',
          unlock: { affinityMin: 1, romanceOptIn: false, alliedRequired: true },
          portrait: 'assets/cg_carmilla.jpg',
          backdrop: 'carmilla-gothic-library',
          musicMood: 'gothic-chamber',
          firstPrompt: 'Carmilla place la coupe scellée entre vous et demande si vous souhaitez prolonger l’audience.',
          acceptLabel: 'Rester, sans obligation d’ouvrir la coupe',
          secondPrompt: 'Elle propose de briser ensemble le sceau et de partager la boisson.',
          continueLabel: 'Ouvrir la coupe après avoir confirmé votre choix',
          pauseLine: '« La coupe restera fermée. Rien de précieux ne se gâte parce qu’un adulte prend le temps de décider. »',
          revokeLine: '« L’accord romantique est dissous. Je garderai le traité et brûlerai toute attente qui prétendrait lui survivre. »',
          opening: [
            N('La bibliothèque de Carmilla occupe une aile sombre de l’ambassade. Les ouvrages s’élèvent jusqu’aux voûtes, reliés de cuir synthétique et de fils d’argent.'),
            H('« Rassure-toi : aucun de ces livres n’est couvert de peau humaine. Cette rumeur est d’un goût terriblement provincial. »', 'dry'),
            P('« Et la coupe rouge sur la table ? »'),
            H('« Jus de grenade, épices, une goutte de mon alchimie. Pas de sang. Je préfère que les décisions complexes restent parfaitement sobres. »'),
            N('Un sceau de cire noire ferme la coupe. Il porte deux empreintes vides.'),
            H('« Elle ne s’ouvrira qu’avec nos deux marques. Tu peux rester sans boire, partir sans rester, ou poser toutes les questions que ma réputation t’inspire. »', 'precise'),
            P('« Tu sembles t’attendre à de la peur. »'),
            H('« Trois siècles apprennent à reconnaître quand le désir se mélange à la crainte. Je refuse de prendre l’un pour l’autre. »'),
            N('Carmilla s’assoit de l’autre côté de la table, suffisamment loin pour que la porte demeure dans votre champ de vision.'),
            H('« Mon alliance avec Haven ne t’a donné aucun droit sur moi. Elle ne m’en donne aucun sur toi. Cette audience est une proposition distincte. »'),
            P('« Pourquoi la faire ? »'),
            H('« Parce que tu m’as regardée comme une personne capable de choisir après m’avoir combattue comme une adversaire capable de tuer. Les deux vérités m’intéressent. »', 'intrigued')
          ],
          middle: [
            N('Carmilla ouvre un ancien registre contenant les pactes qu’elle a annulés au cours de son règne. Les pages brûlées y sont plus nombreuses que les pages signées.'),
            H('« Un accord qui ne prévoit pas sa fin n’est qu’une cage en attente. »', 'serious'),
            P('« Tu as vraiment conservé la trace de chaque révocation ? »'),
            H('« La trace que le pacte a cessé, jamais les raisons privées. Même la mémoire doit connaître ses limites. »'),
            N('Elle referme le registre et croise les mains.'),
            H('« Je souhaite apprendre à te connaître hors de la guerre. Je ne promets ni éternité ni exclusivité. Je promets une parole nette. »'),
            P('« Je préfère une parole nette à une promesse éternelle. »'),
            H('« Voilà qui te rend déjà plus sage que la moitié de mes poètes. »', 'amused'),
            N('Son regard descend vers la coupe, puis revient à vous sans impatience.'),
            H('« Si nous l’ouvrons, cela signifiera seulement que nous partageons une boisson ce soir. Aucun symbole ne décidera de la suite à notre place. »'),
            P('« Et si je change d’avis après avoir posé ma marque ? »'),
            H('« Tu retires ta main. Je détruis le sceau. Ta décision la plus récente règne. »', 'firm')
          ],
          close: [
            N('Vous posez vos marques sur la cire. Le sceau s’ouvre sans bruit et Carmilla vous laisse verser vous-même votre part.'),
            H('« À la décision la plus récente. »', 'soft'),
            P('« Et à celles que nous pourrons prendre demain. »'),
            N('La boisson est douce, épicée, sans aucune magie cachée. Carmilla semble amusée par votre soulagement.'),
            H('« Je pourrais te dire que j’avais prédit ta méfiance. La vérité est que je la respecte. »'),
            P('« Ta réputation travaille contre toi. »'),
            H('« Ma réputation est une armure. Je peux difficilement reprocher aux autres de la voir. »', 'reflective'),
            N('Elle vous raconte alors l’origine moins glorieuse de trois légendes terrifiantes, dont l’une implique un chat, un rideau et un ambassadeur superstitieux.'),
            H('« Tu es autorisé à rire. Pas à répéter l’histoire du chat. »', 'playful'),
            N('Lorsque vous partez, la coupe est vide et aucune dette n’a pris sa place.')
          ],
          slowClose: [
            N('Vous restez sans ouvrir la coupe. Carmilla la range dans une armoire et revient avec deux tasses de thé ordinaire.'),
            H('« Une boisson sans symbole. Excellent amendement. »', 'supportive'),
            N('Vous comparez les pires mensonges écrits à votre sujet dans les chroniques ennemies.'),
            H('« Cette soirée me plaît. Elle n’aurait gagné aucune valeur à forcer le sceau. »')
          ]
        }),
        makeChapter({
          id: 'velvet-ball',
          heroId: 'carmilla',
          title: 'Le bal de velours',
          subtitle: 'Un masque que l’on retire soi-même',
          summary: 'Carmilla vous invite à un bal privé où chacun peut quitter la danse en posant simplement son masque.',
          unlock: { affinityMin: 2, romanceOptIn: true, alliedRequired: true, flags: ['vn.carmilla.sealed-cup.complete'] },
          portrait: 'assets/cg_carmilla.jpg',
          backdrop: 'crimson-masked-ball',
          musicMood: 'gothic-waltz',
          firstPrompt: 'Carmilla vous présente un masque dont le retrait interrompt immédiatement la danse.',
          acceptLabel: 'Mettre le masque et accepter les règles annoncées',
          secondPrompt: 'Dans le jardin de nuit, elle demande si elle peut retirer son masque puis vous embrasser.',
          continueLabel: 'Dire oui et retirer aussi votre masque',
          pauseLine: '« Pose le masque. La musique continuera sans exiger que nous la suivions. »',
          revokeLine: '« Le bal et notre accord s’achèvent. Ma cour apprendra qu’un retrait digne reçoit une révérence, jamais une représaille. »',
          opening: [
            N('La salle de bal est drapée de velours sombre. Seul un quatuor d’automates y joue pour quelques invités adultes triés par Carmilla elle-même.'),
            H('« Une tradition de ma cour : lorsqu’un danseur pose son masque, son partenaire s’arrête et s’incline. Aucune question avant la fin du morceau. »', 'ceremonial'),
            P('« Et si quelqu’un enfreint la tradition ? »'),
            H('« Il ne sera plus invité. S’il insiste, il découvrira pourquoi l’on m’appelle Impératrice de Sang. »', 'cold'),
            N('Elle vous tend un masque dont les attaches restent entre vos mains.'),
            H('« Tu le mets toi-même. Tu peux aussi le garder à la main et parler avec moi sans danser. »'),
            P('« Quels contacts la danse implique-t-elle ? »'),
            H('« Une main dans la mienne, une à ma taille si nous l’acceptons mutuellement. Je poserai la mienne sur ton épaule. Rien d’autre sans nouvelle demande. »', 'precise'),
            P('« Ces contacts me conviennent. »'),
            H('« Ils me conviennent également. Le retrait du masque et le mot “Aube” signifient arrêt. »'),
            N('Carmilla attache son propre masque, puis garde ses deux mains visibles.'),
            H('« Souhaites-tu danser avec moi ? »', 'inviting')
          ],
          middle: [
            N('La valse commence. Carmilla attend votre pas avant de fermer la position, créant un espace de mouvement plutôt qu’une étreinte imposée.'),
            H('« Tu danses comme quelqu’un qui surveille les issues. »', 'observant'),
            P('« Vieille habitude. »'),
            H('« Ne la perds pas pour me flatter. Une personne prudente m’intéresse davantage qu’une proie docile. »'),
            N('Elle vous guide entre les couples, chaque virage annoncé par une pression légère que vous pourriez refuser.'),
            H('« Puis-je réduire la distance ? »'),
            P('« Oui, d’un pas. »'),
            H('« Un pas, pas davantage. »'),
            N('Elle respecte exactement la mesure. Son parfum évoque la rose sombre et le bois brûlé.'),
            H('« Ton rythme s’accélère. Est-ce du plaisir, de l’inquiétude ou les deux ? »', 'gentle'),
            P('« Du plaisir. Je te dirai si l’inquiétude prend sa place. »'),
            H('« Réponse satisfaisante. Mais elle n’autorise aucun autre geste. »'),
            N('Le morceau s’achève. Carmilla vous conduit vers le jardin, puis relâche votre main avant de franchir la porte.'),
            H('« Ici, loin de la cour, j’ai une nouvelle question. »', 'tender')
          ],
          close: [
            P('« Oui, retire ton masque. Je retire le mien. Et oui, tu peux m’embrasser. »'),
            N('Carmilla défait elle-même son masque. Elle attend que le vôtre soit posé avant d’approcher.'),
            H('« Toujours oui ? »', 'soft'),
            P('« Toujours oui. Et toi ? »'),
            H('« Oui. »'),
            N('Son baiser est étonnamment doux, sans mise en scène vampirique. Elle s’arrête avant que ses dents puissent devenir une ambiguïté.'),
            H('« Je ne mêlerai jamais le sang à un baiser sans une conversation distincte et un accord spécifique. Ce soir, je ne le propose pas. »', 'firm'),
            P('« Merci de le préciser. »'),
            H('« Les suppositions nourrissent les légendes. Les mots nourrissent la confiance. »'),
            N('Vous échangez un second baiser après une nouvelle question, puis retournez au bal sans masque, au vu d’une cour qui apprend à s’incliner devant vos choix.')
          ],
          slowClose: [
            P('« Retirons les masques, mais pas de baiser ce soir. »'),
            H('« Oui. Visages découverts, distance maintenue. »', 'supportive'),
            N('Carmilla s’assoit avec vous dans le jardin et critique avec passion les choix musicaux de son propre quatuor.'),
            H('« Ta présence ne devient pas moindre parce qu’elle respecte une limite. »')
          ]
        }),
        makeChapter({
          id: 'when-dawn-rings',
          heroId: 'carmilla',
          title: 'Quand sonne l’Aube',
          subtitle: 'Une nuit qui connaît son terme',
          summary: 'Carmilla ouvre ses appartements privés après avoir défini avec vous un signal d’arrêt, les limites liées à sa nature vampirique et le soin mutuel.',
          unlock: { affinityMin: 4, romanceOptIn: true, alliedRequired: true, flags: ['vn.carmilla.velvet-ball.complete'] },
          portrait: 'assets/cg_carmilla.jpg',
          backdrop: 'carmilla-private-chamber',
          musicMood: 'intimate-gothic',
          estimatedMinutes: 11,
          firstPrompt: 'Devant ses appartements, Carmilla vous demande si vous souhaitez franchir la porte après avoir formulé chaque limite.',
          acceptLabel: 'Entrer avec le mot “Aube” comme arrêt absolu',
          secondPrompt: 'Après plusieurs baisers, elle demande si vous voulez prolonger la nuit dans les limites convenues.',
          continueLabel: 'Confirmer l’intimité et renouveler votre accord',
          pauseLine: '« Alors l’Aube sonne maintenant. Nous choisissons eau, conversation ou espace, sans transformer cet arrêt en tragédie. »',
          revokeLine: '« Notre pacte romantique est terminé et toutes ses copies brûlent. Mon alliance, mon respect et ta sécurité demeurent. »',
          opening: [
            N('Les appartements de Carmilla sont éclairés par des bougies électriques dont les flammes ne consomment rien. La porte reste ouverte derrière elle.'),
            H('« Avant d’entrer, parlons de la morsure que ma réputation place déjà dans ton imagination. »', 'direct'),
            P('« Je préfère en parler plutôt que faire semblant de ne pas y penser. »'),
            H('« Bien. Elle ne fait pas partie de mon invitation. Aucun contact de mes dents avec ta peau. Si un jour nous voulions en discuter, ce serait sobrement, séparément et jamais au milieu d’un autre geste. »', 'firm'),
            P('« Compris. Ma limite est la même ce soir. »'),
            H('« Quant à mon envie : tes mains dans mon dos, des baisers et une intimité plus profonde si nous la confirmons encore. Mon signal est “Aube”. »'),
            P('« Le mien sera également “Aube”. Une seule voix suffit. »'),
            H('« Parfait. Lorsque l’Aube sonne, tout s’arrête. Ensuite : eau, couverture, parole ou solitude selon le besoin exprimé. »'),
            N('Vous nommez vos autres limites. Carmilla accueille chaque précision avec une attention presque solennelle.'),
            H('« Je n’ai aucune envie de séduire ton hésitation. Si la réponse n’est pas entière, nous resterons dans la bibliothèque. »', 'soft'),
            P('« Ma réponse est entière maintenant. Je veux entrer. »'),
            H('« Alors entre comme mon partenaire, jamais comme mon dû. »', 'tender')
          ],
          middle: [
            N('La porte reste déverrouillée. Carmilla retire sa couronne et ses bijoux elle-même, puis demande avant de vous laisser l’aider avec le dernier fermoir.'),
            H('« Oui pour tes mains sur mes épaules et mon dos. Demande avant toute nouvelle zone. »', 'precise'),
            P('« Puis-je t’embrasser ? »'),
            H('« Oui. »'),
            N('Le baiser se prolonge, chaud et attentif. Carmilla garde ses dents éloignées de votre peau avec une maîtrise qui transforme la limite en sécurité visible.'),
            H('« Toujours confortable ? »'),
            P('« Oui. Puis-je me rapprocher ? »'),
            H('« Oui, lentement. »'),
            N('Elle guide une de vos mains jusqu’à l’endroit convenu au milieu de son dos et s’arrête avant tout autre geste.'),
            H('« Là. Cela me plaît. »', 'desiring'),
            P('« À moi aussi. Veux-tu continuer ? »'),
            H('« Oui. Je veux toutefois entendre encore ton choix, maintenant que le désir est plus intense. »'),
            N('Elle recule assez pour que votre réponse ne soit pas murmurée sous un baiser.'),
            H('« Veux-tu partager le reste de cette nuit avec moi selon toutes les limites dites ? »', 'open')
          ],
          close: [
            P('« Oui. Aube reste notre arrêt absolu. »'),
            H('« Oui pour moi aussi. »', 'soft'),
            N('Carmilla ferme les rideaux, jamais la serrure. Vos gestes gagnent en intimité sans franchir les frontières formulées.'),
            N('La scène se fond au noir tandis qu’un dernier échange confirme vos deux accords.'),
            N('Plus tard, Carmilla prononce doucement votre nom avant de demander si vous souhaitez sa proximité ou davantage d’espace.'),
            P('« Ta proximité, et de l’eau. »'),
            H('« Excellente combinaison. »', 'warm'),
            N('Elle revient avec deux verres, une couverture et aucun commentaire destiné à transformer votre vulnérabilité en dette.'),
            H('« Les immortels aiment prétendre qu’une belle nuit devrait durer toujours. Je préfère qu’elle connaisse son terme, afin que la prochaine puisse être choisie à nouveau. »', 'content'),
            N('Lorsque la vraie aube éclaire les rideaux, vous êtes libres de partir et libres de souhaiter revenir.')
          ],
          slowClose: [
            P('« Je veux rester aux baisers et aux gestes déjà nommés. »'),
            H('« Oui. La limite est fixée pour cette nuit. »', 'supportive'),
            N('Carmilla remet la musique du bal et vous accueille contre elle seulement après votre accord.'),
            H('« Nous n’avons rien à prouver aux légendes qui attendent derrière cette porte. »')
          ]
        })
      ]
    }
  };

  const data = {
    schema: 'infernal-city.vn-scenes/1',
    version: '1.0.0',
    locale: 'fr-FR',
    title: 'Salon Nocturne — Chroniques de Haven',
    content: {
      minimumAge: 18,
      allCharactersAdults: true,
      consentRequired: true,
      consentRevocable: true,
      intimacyLevel: 'sensual',
      explicitSexualDetail: false,
      endingStyle: 'fade-to-black'
    },
    consentContract: {
      romanceFlag: 'romanceOptIn',
      militaryAllianceIsNotRomanticConsent: true,
      pausePreservesRomanceOptIn: true,
      revokeSetsRomanceOptInFalse: true,
      refusalPenalty: 'none',
      preserveAffinityOnPauseOrRevoke: true,
      preserveCombatOnPauseOrRevoke: true,
      supportedActions: ['affirm', 'limit', 'pause', 'revoke']
    },
    integration: {
      heroineCollection: 'heroines',
      chapterCollection: 'chapters',
      chapterStartField: 'entryBeat',
      beatKinds: ['dialogue', 'choice'],
      lineSpeakers: ['narrator', 'hero', 'player'],
      effectFields: [
        'relationshipXp',
        'romanceOptIn',
        'setFlags',
        'preserveAffinity',
        'preserveCombat'
      ],
      saveKeySuggestion: 'vnSceneProgress'
    },
    heroines
  };

  if (typeof window !== 'undefined') {
    window.INFERNAL_VN_SCENES = data;
  }
}());
