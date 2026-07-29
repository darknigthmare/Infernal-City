'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'vn-scenes.v1.js'), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(source, context, { filename: 'vn-scenes.v1.js' });
const data = context.window.INFERNAL_VN_SCENES;

const narrativeCgs = {
  aria: 'assets/cg_aria_nightwatch.png',
  kira: 'assets/cg_kira_rooftop.png',
  rin: 'assets/cg_rin_embers.png',
  selene: 'assets/cg_selene_observatory.png',
  vespera: 'assets/cg_vespera_truce.png',
  carmilla: 'assets/cg_carmilla_library.png'
};

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

test('le corpus VN couvre six heroines adultes avec un vrai volume narratif', () => {
  assert.equal(data.schema, 'infernal-city.vn-scenes/1');
  assert.equal(data.content.allCharactersAdults, true);
  assert.equal(data.content.consentRequired, true);
  assert.equal(data.content.consentRevocable, true);

  const heroines = Object.values(data.heroines);
  const chapters = heroines.flatMap(heroine => heroine.chapters);
  const beats = chapters.flatMap(chapter => chapter.beats);
  const lines = beats.flatMap(beat => beat.lines || []);
  const options = beats.flatMap(beat => beat.options || []);
  const wordCount = lines.reduce((total, line) => total + line.text.trim().split(/\s+/u).length, 0);

  assert.equal(heroines.length, 6);
  assert.ok(heroines.every(heroine => heroine.isAdult && heroine.age >= 18));
  assert.equal(chapters.length, 18);
  assert.equal(beats.length, 144);
  assert.equal(lines.length, 801);
  assert.equal(options.length, 126);
  assert.ok(wordCount >= 10000, `Corpus trop court : ${wordCount} mots`);
});

test('chaque branche VN est atteignable et pointe vers un beat valide', () => {
  Object.values(data.heroines).forEach(heroine => {
    heroine.chapters.forEach(chapter => {
      const beatsById = new Map(chapter.beats.map(beat => [beat.id, beat]));
      assert.ok(beatsById.has(chapter.entryBeat), `${heroine.id}/${chapter.id}: entryBeat absent`);
      const visited = new Set();
      const queue = [chapter.entryBeat];
      while (queue.length) {
        const id = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        const beat = beatsById.get(id);
        assert.ok(beat, `${heroine.id}/${chapter.id}: beat ${id} absent`);
        const destinations = beat.kind === 'choice'
          ? beat.options.map(option => option.nextBeat)
          : beat.nextBeat
            ? [beat.nextBeat]
            : [];
        destinations.forEach(destination => {
          assert.ok(beatsById.has(destination), `${heroine.id}/${chapter.id}: destination ${destination} absente`);
          queue.push(destination);
        });
      }
      assert.equal(visited.size, chapter.beats.length, `${heroine.id}/${chapter.id}: branche morte`);
    });
  });
});

test('les six nouvelles CG OpenAI et la cote sont des PNG haute definition reels', () => {
  Object.entries(narrativeCgs).forEach(([heroId, relativePath]) => {
    const absolutePath = path.join(ROOT, relativePath);
    assert.ok(fs.existsSync(absolutePath), `${heroId}: CG absente`);
    const { width, height } = pngDimensions(absolutePath);
    assert.ok(width >= 1000 && height >= 900, `${heroId}: resolution insuffisante ${width}x${height}`);
  });
  const coastPath = path.join(ROOT, 'assets/environment/infernal-city-coastline.png');
  const coast = pngDimensions(coastPath);
  assert.deepEqual(coast, { width: 1536, height: 1024 });
});
