'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'adult-scenes.v1.js'), 'utf8');

function loadContract() {
  const window = {};
  const context = vm.createContext({ window });
  vm.runInContext(SOURCE, context, { filename: 'adult-scenes.v1.js' });
  return window.INFERNAL_CITY_ADULT_SCENES;
}

function assertRealWebp(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(filePath), `${relativePath}: fichier absent`);
  const data = fs.readFileSync(filePath);
  assert.ok(data.length > 15_000, `${relativePath}: fichier anormalement petit`);
  assert.equal(data.toString('ascii', 0, 4), 'RIFF', `${relativePath}: conteneur RIFF absent`);
  assert.equal(data.toString('ascii', 8, 12), 'WEBP', `${relativePath}: signature WebP absente`);
  const chunk = data.toString('ascii', 12, 16);
  let width = 0;
  let height = 0;
  if (chunk === 'VP8X') {
    width = 1 + data.readUIntLE(24, 3);
    height = 1 + data.readUIntLE(27, 3);
  } else if (chunk === 'VP8 ') {
    width = data.readUInt16LE(26) & 0x3fff;
    height = data.readUInt16LE(28) & 0x3fff;
  } else if (chunk === 'VP8L') {
    width = 1 + data[21] + ((data[22] & 0x3f) << 8);
    height = 1 + ((data[22] >> 6) | (data[23] << 2) | ((data[24] & 0x0f) << 10));
  }
  assert.deepEqual({ width, height }, { width: 960, height: 540 }, `${relativePath}: dimensions`);
}

function inspectReachableRouteGraph(route) {
  const nodesById = new Map(route.nodes.map(node => [node.id, node]));
  assert.equal(nodesById.size, route.nodes.length, `${route.id}: identifiants de noeuds uniques`);
  assert.ok(nodesById.has(route.initialNode), `${route.id}: noeud initial absent`);

  const reachableIds = new Set();
  const pendingIds = [route.initialNode];
  while (pendingIds.length > 0) {
    const nodeId = pendingIds.pop();
    if (reachableIds.has(nodeId)) continue;
    const node = nodesById.get(nodeId);
    assert.ok(node, `${route.id}: cible ${nodeId} absente`);
    reachableIds.add(nodeId);
    if (node.nextNode) pendingIds.push(node.nextNode);
    if (node.kind === 'choice') {
      assert.ok(node.options.length >= 2, `${route.id}/${node.id}: moins de deux branches`);
      node.options.forEach(option => pendingIds.push(option.nextNode));
    }
  }

  function branchReachesEnding(nodeId, visitedIds = new Set()) {
    if (visitedIds.has(nodeId)) return false;
    const node = nodesById.get(nodeId);
    if (!node) return false;
    if (node.end === true) return true;
    const nextVisitedIds = new Set(visitedIds).add(nodeId);
    if (node.nextNode && branchReachesEnding(node.nextNode, nextVisitedIds)) return true;
    return node.kind === 'choice'
      && node.options.some(option => branchReachesEnding(option.nextNode, nextVisitedIds));
  }

  return { nodesById, reachableIds, branchReachesEnding };
}

test('le contrat 2.9 est gele et limite toutes les scenes aux adultes non explicites', () => {
  const contract = loadContract();
  assert.equal(contract.contentVersion, '2.9.0');
  assert.equal(contract.bodyRouteDataVersion, '1.0.0');
  assert.equal(contract.maturity.adultsOnly, true);
  assert.equal(contract.maturity.minimumAge >= 27, true);
  assert.equal(contract.maturity.explicitSexualActs, false);
  assert.equal(contract.maturity.nudity, false);
  assert.equal(contract.maturity.consentRequired, true);
  assert.equal(contract.maturity.intimacyPresentation, 'before_after_fade_to_black');
  assert.equal(contract.maturity.gameplayConsequencesForRefusal, false);
  assert.equal(contract.maturity.sexualDevices, false);
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.bonusScenes), true);
});

test('les dix Trones ont une vraie introduction et une vraie defaite cinematographiques', () => {
  const contract = loadContract();
  const cinematics = Object.values(contract.villainCinematics);
  assert.equal(cinematics.length, 10);
  const paths = [];
  cinematics.forEach(cinematic => {
    assert.equal(cinematic.isAdult, true);
    assert.equal(cinematic.age >= 27, true);
    assert.match(cinematic.introSrc, new RegExp(`${cinematic.id}-intro-v1\\.webp$`));
    assert.match(cinematic.defeatSrc, new RegExp(`${cinematic.id}-defeat-v1\\.webp$`));
    paths.push(cinematic.introSrc, cinematic.defeatSrc);
  });
  assert.equal(new Set(paths).size, 20);
  paths.forEach(assertRealWebp);
});

test('les bonus couvrent les archives sensuelles, corporelles, boudoir et parenthese privee', () => {
  const contract = loadContract();
  const counts = contract.bonusScenes.reduce((result, scene) => {
    result[scene.kind] = (result[scene.kind] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(
    { ...counts },
    {
      bikini: 10,
      romance_ff: 5,
      afterglow: 5,
      game_over: 4,
      body_variants: 60,
      boudoir: 20,
      private_ritual: 60
    }
  );
  assert.equal(contract.bonusScenes.length, 164);
  assert.equal(new Set(contract.bonusScenes.map(scene => scene.src)).size, 164);
  contract.bonusScenes.forEach(scene => {
    assert.ok(scene.ageLabel);
    assert.ok(scene.alt.length > 30);
    assert.ok(scene.story.length > 40);
    assertRealWebp(scene.src);
  });
});

test('les vingt parentheses privees separent strictement trois CG independantes', () => {
  const contract = loadContract();
  const scenes = contract.bonusScenes.filter(scene => scene.kind === 'private_ritual');
  const heroineScenes = scenes.filter(scene => scene.unlockRule.type === 'heroes_unlocked');
  const villainScenes = scenes.filter(scene => scene.unlockRule.type === 'boss_defeated');
  const sequences = scenes.reduce((result, scene) => {
    result[scene.sequenceId] = result[scene.sequenceId] || [];
    result[scene.sequenceId].push(scene);
    return result;
  }, {});
  const stageCounts = scenes.reduce((result, scene) => {
    result[scene.sequenceStage] = (result[scene.sequenceStage] || 0) + 1;
    return result;
  }, {});

  assert.equal(scenes.length, 60);
  assert.equal(heroineScenes.length, 30);
  assert.equal(villainScenes.length, 30);
  assert.equal(Object.keys(sequences).length, 20);
  assert.deepEqual({ ...stageCounts }, { before: 20, ellipsis: 20, after: 20 });
  Object.values(sequences).forEach(sequence => {
    assert.equal(sequence.length, 3);
    assert.deepEqual(
      sequence.sort((left, right) => left.sequenceIndex - right.sequenceIndex)
        .map(scene => scene.sequenceStage),
      ['before', 'ellipsis', 'after']
    );
    assert.deepEqual(
      sequence.map(scene => scene.sequenceIndex).sort(),
      [0, 1, 2]
    );
  });
  scenes.forEach(scene => {
    assert.equal(scene.sequenceLength, 3);
    assert.equal(scene.participants.length, 1);
    assert.match(scene.src, /assets\/vn\/cg\/private-ritual\/(?:heroines|villains)\/.+-ritual-(?:before|ellipsis|after)-v1\.webp$/u);
    assert.equal(Object.hasOwn(scene, 'reward'), false);
    assert.equal(Object.hasOwn(scene, 'gameplayEffect'), false);
    if (scene.sequenceStage === 'ellipsis') assert.match(scene.alt, /vide/u);
  });
});

test('les vingt boudoirs montrent chaque femme adulte seule et sans effet gameplay', () => {
  const contract = loadContract();
  const boudoirs = contract.bonusScenes.filter(scene => scene.kind === 'boudoir');
  const heroineBoudoirs = boudoirs.filter(scene => scene.unlockRule.type === 'heroes_unlocked');
  const villainBoudoirs = boudoirs.filter(scene => scene.unlockRule.type === 'boss_defeated');
  const heroineIds = ['amara', 'aurelia', 'freyja', 'hana', 'isolde', 'maris', 'mircalla', 'nyx', 'vega', 'zahra'];
  const villainIds = ['astarra', 'kalix', 'malika', 'nhalzara', 'noctis', 'ossuary', 'pestifera', 'umbrael', 'vexara', 'xyra'];

  assert.equal(boudoirs.length, 20);
  assert.equal(heroineBoudoirs.length, 10);
  assert.equal(villainBoudoirs.length, 10);
  assert.equal(new Set(boudoirs.flatMap(scene => scene.participants)).size, 20);
  assert.deepEqual(Array.from(heroineBoudoirs.flatMap(scene => scene.participants)).sort(), heroineIds);
  assert.deepEqual(Array.from(villainBoudoirs.flatMap(scene => scene.participants)).sort(), villainIds);
  boudoirs.forEach(scene => {
    assert.equal(scene.participants.length, 1);
    assert.match(scene.ageLabel, /ans/u);
    assert.match(scene.alt, /adulte/u);
    assert.match(scene.alt, /sans nudité/u);
    assert.match(scene.src, /assets\/vn\/cg\/boudoir\/(?:heroines|villains)\/.+-boudoir-v1\.webp$/u);
    assert.equal(Object.hasOwn(scene, 'reward'), false);
    assert.equal(Object.hasOwn(scene, 'gameplayEffect'), false);
  });
});

test('les variantes corporelles separent trois CG par femme sans sexualiser la jeunesse', () => {
  const contract = loadContract();
  const variants = contract.bonusScenes.filter(scene => scene.kind === 'body_variants');
  const heroineVariants = variants.filter(scene => scene.routeUnlockRule.type === 'heroes_unlocked');
  const villainVariants = variants.filter(scene => scene.routeUnlockRule.type === 'boss_defeated');
  const stageCounts = variants.reduce((counts, scene) => {
    counts[scene.bodyVariantStage] = (counts[scene.bodyVariantStage] || 0) + 1;
    return counts;
  }, {});
  const participantCounts = variants.reduce((counts, scene) => {
    const [participantId] = scene.participants;
    counts[participantId] = (counts[participantId] || 0) + 1;
    return counts;
  }, {});

  assert.equal(heroineVariants.length, 30);
  assert.equal(villainVariants.length, 30);
  assert.deepEqual(
    { ...stageCounts },
    { chubby: 20, maternity: 20, 'early-career': 10, 'first-reign': 10 }
  );
  assert.equal(Object.keys(participantCounts).length, 20);
  Object.values(participantCounts).forEach(count => assert.equal(count, 3));
  variants.forEach(scene => {
    assert.equal(scene.participants.length, 1);
    assert.ok(scene.bodyRouteId);
    assert.equal(scene.unlockRule.type, 'body_route_completed');
    assert.equal(scene.unlockRule.routeId, scene.bodyRouteId);
    assert.match(scene.subtitle, /27/u);
    assert.match(scene.ageLabel, /27 ans et plus/u);
    assert.match(scene.alt, /adulte/u);
    assert.match(scene.src, new RegExp(`-${scene.bodyVariantStage}-v1\\.webp$`, 'u'));
    assert.doesNotMatch(scene.src, /body-variants-v1/u);
    assert.equal(Object.hasOwn(scene, 'reward'), false);
    assert.equal(Object.hasOwn(scene, 'gameplayEffect'), false);
  });
});

test('les soixante routes corporelles 2.9 restent individuelles, adultes et entierement atteignables', () => {
  const contract = loadContract();
  const routes = contract.bodyRoutes;
  const variants = contract.bonusScenes.filter(scene => scene.kind === 'body_variants');
  const scenesById = new Map(variants.map(scene => [scene.id, scene]));
  const participantCounts = routes.reduce((counts, route) => {
    counts[route.participantId] = (counts[route.participantId] || 0) + 1;
    return counts;
  }, {});
  const targetCgPaths = [];
  const portraitPaths = [];
  const participantVoices = new Map();

  assert.equal(routes.length, 60);
  assert.equal(new Set(routes.map(route => route.id)).size, 60);
  assert.equal(new Set(routes.map(route => route.sceneId)).size, 60);
  assert.equal(Object.keys(participantCounts).length, 20);
  Object.values(participantCounts).forEach(count => assert.equal(count, 3));

  routes.forEach(route => {
    const scene = scenesById.get(route.sceneId);
    assert.ok(scene, `${route.id}: CG cible absente du contrat`);
    assert.equal(scene.bodyRouteId, route.id);
    assert.deepEqual(Array.from(scene.participants), [route.participantId]);
    targetCgPaths.push(scene.src);

    assert.equal(route.minimumSceneAge >= 27, true);
    assert.equal(route.participantAge >= 27, true);
    assert.equal(route.isAdultAtScene, true);
    assert.equal(route.romanceRequired, false);
    assert.equal(route.sexualContent, false);
    assert.equal(Object.hasOwn(route, 'reward'), false);
    assert.equal(Object.hasOwn(route, 'gameplayEffect'), false);
    assert.ok(fs.existsSync(path.join(ROOT, route.portraitSrc)), `${route.id}: portrait absent`);
    portraitPaths.push(route.portraitSrc);

    assert.equal(route.unlockRule, scene.routeUnlockRule);
    assert.notEqual(scene.unlockRule, scene.routeUnlockRule);
    assert.equal(scene.unlockRule.type, 'body_route_completed');
    assert.equal(scene.unlockRule.routeId, route.id);
    assert.ok(['heroes_unlocked', 'boss_defeated'].includes(route.unlockRule.type));
    if (route.unlockRule.type === 'heroes_unlocked') {
      assert.deepEqual(Array.from(route.unlockRule.heroIds), [route.participantId]);
    } else {
      assert.equal(route.unlockRule.bossId, route.participantId);
    }

    const graph = inspectReachableRouteGraph(route);
    assert.equal(graph.reachableIds.size, route.nodes.length, `${route.id}: noeuds inatteignables`);
    const choiceNodes = route.nodes.filter(node => (
      graph.reachableIds.has(node.id) && node.kind === 'choice'
    ));
    assert.equal(route.choicesRequired, 2);
    assert.equal(choiceNodes.length, 2, `${route.id}: deux choix atteignables requis`);
    choiceNodes.forEach(node => {
      assert.equal(node.options.length, 3, `${route.id}/${node.id}: trois perspectives requises`);
      node.options.forEach(option => {
        assert.ok(graph.nodesById.has(option.nextNode), `${route.id}/${node.id}: branche absente`);
        assert.equal(
          graph.branchReachesEnding(option.nextNode),
          true,
          `${route.id}/${node.id}/${option.id}: branche sans conclusion`
        );
      });
    });

    const playthroughs = [];
    function enumeratePlaythroughs(nodeId, lineCount = 0, choiceCount = 0) {
      const node = graph.nodesById.get(nodeId);
      assert.ok(node, `${route.id}/${nodeId}: noeud de parcours absent`);
      if (node.kind === 'dialogue') {
        const nextLineCount = lineCount + node.lines.length;
        if (node.end === true) {
          playthroughs.push({ lineCount: nextLineCount, choiceCount });
        } else {
          enumeratePlaythroughs(node.nextNode, nextLineCount, choiceCount);
        }
        return;
      }
      node.options.forEach(option => {
        enumeratePlaythroughs(option.nextNode, lineCount, choiceCount + 1);
      });
    }
    enumeratePlaythroughs(route.initialNode);
    assert.equal(playthroughs.length, 9, `${route.id}: neuf parcours complets attendus`);
    playthroughs.forEach(playthrough => {
      assert.deepEqual(playthrough, { lineCount: 29, choiceCount: 2 });
    });

    const voicedLine = route.nodes
      .flatMap(node => node.lines || [])
      .find(line => line.speaker === 'hero' && /mégacorps|horloges|cap libre|palais|création|deuil|discipline|couronne|lumière|transformation|châssis|repos|Vide|Enfers|ombre|soin|équipage|équation|pacte|cauchemar/u.test(line.text));
    assert.ok(voicedLine, `${route.id}: voix individuelle absente`);
    participantVoices.set(route.participantId, voicedLine.text);
  });

  assert.equal(new Set(targetCgPaths).size, 60);
  assert.equal(new Set(portraitPaths).size, 20);
  assert.equal(participantVoices.size, 20);
  assert.equal(new Set(participantVoices.values()).size, 20);
});

test('les romances et afterglows sont F/F, atteignables et sans recompense gameplay', () => {
  const contract = loadContract();
  contract.bonusScenes
    .filter(scene => ['romance_ff', 'afterglow'].includes(scene.kind))
    .forEach(scene => {
      assert.equal(scene.participants.length, 2);
      assert.equal(scene.unlockRule.type, 'heroes_unlocked');
      assert.deepEqual(
        [...scene.unlockRule.heroIds].sort(),
        [...scene.participants].sort()
      );
      assert.equal(Object.hasOwn(scene, 'reward'), false);
      assert.equal(Object.hasOwn(scene, 'gameplayEffect'), false);
    });
});
