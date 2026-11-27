'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'sprite-presentation.v1.js'), 'utf8');

class Element {
  constructor(id = '') {
    this.id = id; this.style = {}; this.dataset = {}; this.attributes = {};
    this.children = []; this.hidden = false; this.value = ''; this.alt = '';
    const classes = new Set();
    this.classList = {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      contains(name) { return classes.has(name); }
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  appendChild(child) { this.children.push(child); child.parent = this; }
  closest(selector) { return selector === '.studio-preview-frame' ? this.parent : null; }
  querySelector(selector) {
    return this.children.find(child => selector.startsWith('.')
      ? child.className === selector.slice(1) : child.id === selector.slice(1)) || null;
  }
}

function load({ ready = true, entered = true } = {}) {
  const nodes = Object.fromEntries([
    'photo-studio-modal', 'studio-preview-img', 'studio-pose-select', 'visual-novel-modal',
    'vn-expression-portrait', 'vn-scene-img'
  ].map(id => [id, new Element(id)]));
  const frame = new Element('studio-frame');
  frame.appendChild(nodes['studio-preview-img']);
  nodes['photo-studio-modal'].dataset.heroId = 'nyx';
  nodes['studio-pose-select'].value = 'classic';
  nodes['vn-expression-portrait'].hidden = true;
  const events = new Map();
  const document = {
    hidden: false, getElementById(id) { return nodes[id] || null; },
    createElement() { return new Element(); },
    addEventListener(type, callback) { events.set(type, callback); }
  };
  const images = new Map(), requests = [], drawings = [];
  const assets = Object.fromEntries([
    'portraits/nyx', 'portraits/aurelia', 'environment/acid-rain',
    'environment/ion-storm', 'environment/debris-settle'
  ].map(key => [key, {
    key, src: `assets/animations/completion-v1/${key}.png`, columns: 4, rows: 2,
    sequenceFrames: 8, fps: key.startsWith('portraits/') ? 4 : 10
  }]));
  const heroes = { nyx: { avatar: 'nyx-original.webp' }, aurelia: { avatar: 'aurelia-original.webp' } };
  const window = { INFERNAL_CITY_SPRITE_COMPLETION: { approved(key) { return assets[key] || null; } } };
  let time = 0;
  class GameEngine {}
  Object.assign(GameEngine.prototype, {
    getStudioPoseOptions() { return [{ id: 'classic', label: 'Pose narrative' }]; },
    getStudioPreviewSource(heroId, poseId) { return `${heroId}-${poseId}-cg.webp`; },
    updatePhotoStudioPreview() {
      const heroId = nodes['photo-studio-modal'].dataset.heroId;
      nodes['studio-preview-img'].src = this.getStudioPreviewSource(heroId, nodes['studio-pose-select'].value);
      nodes['studio-preview-img'].alt = `Portrait de ${heroId}`;
    },
    setVnExpressionMood(heroId, mood) {
      const portrait = nodes['vn-expression-portrait'];
      portrait.style.backgroundImage = `url("expressions-${heroId}-${mood}.webp")`;
      portrait.style.backgroundPosition = '50% 50%';
      portrait.hidden = false;
    },
    setVnSceneImage(heroId) {
      nodes['vn-scene-img'].src = `${heroId}-narrative-cg.webp`;
      nodes['vn-expression-portrait'].hidden = true;
    },
    openModal(id) { (typeof id === 'string' ? nodes[id] : id).classList.add('active'); this.isPaused = true; },
    closeModal(id) { (typeof id === 'string' ? nodes[id] : id).classList.remove('active'); },
    closeAllGameplayModals() { Object.values(nodes).forEach(element => element.classList.remove('active')); },
    preloadSpriteAsset(src) {
      requests.push(src);
      const image = { src, complete: ready, naturalWidth: ready ? 1774 : 0, naturalHeight: ready ? 887 : 0 };
      images.set(src, image); return image;
    },
    isSpriteReady(image) { return Boolean(image?.complete && image.naturalWidth); },
    sellDefense(defense) {
      if (!this.placedTowers.includes(defense)) return { ok: false };
      this.placedTowers = this.placedTowers.filter(item => item !== defense);
      this.coins += 60; return { ok: true, refund: 60 };
    },
    killEnemy(enemy) { enemy.dead = true; this.kills++; },
    update(dt) { this.gameplaySeconds += dt; }, render() {},
    getBattlefieldView() { return { left: 20, top: 40, right: 1220, bottom: 840 }; },
    applyBattlefieldView() {}, getReadableWorldSize(size) { return size; },
    startNewGame() { this.placedTowers = []; }, restoreGameplayState() { this.placedTowers = []; }
  });
  const context = vm.createContext({
    window, document, GameEngine, HERO_CLASSES: heroes, console,
    performance: { now() { return time; } }
  });
  vm.runInContext(source, context);
  const engine = new GameEngine();
  Object.assign(engine, {
    hasEnteredAdultExperience: entered, selectedHero: { id: 'nyx' },
    animationClock: 0, waveActive: true, gameplaySeconds: 0, coins: 0, kills: 0,
    placedTowers: [], canvas: { width: 1200, height: 800 },
    ctx: { save() {}, restore() {}, drawImage(...args) { drawings.push({ args, alpha: this.globalAlpha }); } }
  });
  function selectPortrait(heroId = 'nyx') {
    nodes['photo-studio-modal'].dataset.heroId = heroId;
    nodes['studio-pose-select'].value = 'animated-portrait';
    engine.updatePhotoStudioPreview();
  }
  function tick(milliseconds = 250) { time += milliseconds; engine.render(); }
  function setReady(key) {
    const image = images.get(assets[key]?.src || key);
    assert.ok(image, `No requested image for ${key}`);
    Object.assign(image, { complete: true, naturalWidth: 1774, naturalHeight: 887 });
  }
  function visibility(hidden) { document.hidden = hidden; events.get('visibilitychange')?.(); }
  return { engine, window, nodes, frame, document, assets, images, requests, drawings,
    selectPortrait, tick, setReady, visibility };
}

test('portrait choices preserve narrative poses and load only an open approved portrait after entry', () => {
  const h = load({ entered: false });
  assert.deepEqual(Array.from(h.engine.getStudioPoseOptions('nyx'), item => item.id), ['classic', 'animated-portrait']);
  assert.deepEqual(Array.from(h.engine.getStudioPoseOptions('aria'), item => item.id), ['classic']);
  h.selectPortrait(); h.tick();
  assert.equal(h.requests.length, 0);
  h.engine.openModal('photo-studio-modal'); h.tick();
  assert.equal(h.requests.length, 0);
  h.engine.hasEnteredAdultExperience = true; h.tick();
  assert.equal(h.requests.length, 1);
  assert.match(h.requests[0], /portraits\/nyx\.png$/u);
  assert.equal(h.nodes['studio-preview-img'].src, 'nyx-original.webp');
  const overlay = h.frame.querySelector('.sprite-studio-portrait');
  assert.equal(overlay.getAttribute('role'), 'img');
  assert.equal(overlay.getAttribute('aria-label'), 'Portrait de nyx');
  assert.equal(overlay.hidden, false);
});

test('Studio keeps the static fallback on decoding failure and never requests it once per frame', () => {
  const h = load({ ready: false });
  h.selectPortrait(); h.engine.openModal('photo-studio-modal');
  for (let i = 0; i < 20; i++) h.tick();
  const overlay = h.frame.querySelector('.sprite-studio-portrait');
  assert.equal(overlay.hidden, true);
  assert.equal(h.nodes['studio-preview-img'].classList.contains('sprite-portrait-fallback-hidden'), false);
  assert.equal(h.requests.length, 1);
  h.engine.closeModal('photo-studio-modal'); h.selectPortrait(); h.engine.openModal('photo-studio-modal');
  h.tick();
  assert.equal(h.requests.length, 1);
  h.setReady('portraits/nyx'); h.tick();
  assert.equal(overlay.hidden, false);
  assert.equal(h.nodes['studio-preview-img'].classList.contains('sprite-portrait-fallback-hidden'), true);
});

test('portrait clock advances while gameplay is paused and freezes across hidden tabs and reduced motion', () => {
  const h = load();
  h.selectPortrait(); h.engine.openModal('photo-studio-modal');
  const overlay = h.frame.querySelector('.sprite-studio-portrait');
  assert.equal(overlay.dataset.spriteFrame, '0');
  h.tick(250);
  assert.equal(overlay.dataset.spriteFrame, '1');
  assert.equal(h.engine.gameplaySeconds, 0);
  assert.equal(h.engine.animationClock, 0);
  h.visibility(true);
  // No game render occurs while the tab is hidden.
  h.visibility(false); h.tick(5000);
  assert.equal(overlay.dataset.spriteFrame, '1');
  h.tick(250); assert.equal(overlay.dataset.spriteFrame, '2');
  h.engine.prefersReducedMotion = true; h.tick(250);
  assert.equal(overlay.dataset.spriteFrame, '0');
  h.tick(1000); assert.equal(overlay.dataset.spriteFrame, '0');
});

test('changing pose or closing the Studio restores the original image and stops frame updates', () => {
  const h = load();
  h.selectPortrait(); h.engine.openModal('photo-studio-modal'); h.tick();
  const overlay = h.frame.querySelector('.sprite-studio-portrait');
  const frame = overlay.dataset.spriteFrame;
  h.engine.closeModal('photo-studio-modal'); h.tick(3000);
  assert.equal(overlay.hidden, true);
  assert.equal(overlay.dataset.spriteFrame, frame);
  assert.equal(h.nodes['studio-preview-img'].classList.contains('sprite-portrait-fallback-hidden'), false);
  h.nodes['studio-pose-select'].value = 'classic'; h.engine.updatePhotoStudioPreview();
  h.engine.openModal('photo-studio-modal'); h.tick();
  assert.equal(h.nodes['studio-preview-img'].src, 'nyx-classic-cg.webp');
  assert.equal(overlay.hidden, true);
});

test('late image availability cannot restore the previous heroine after a selection change', () => {
  const h = load({ ready: false });
  h.selectPortrait('nyx'); h.engine.openModal('photo-studio-modal');
  h.selectPortrait('aurelia');
  h.setReady('portraits/nyx'); h.tick();
  const overlay = h.frame.querySelector('.sprite-studio-portrait');
  assert.equal(overlay.hidden, true);
  assert.equal(h.nodes['studio-preview-img'].src, 'aurelia-original.webp');
  h.setReady('portraits/aurelia'); h.tick();
  assert.match(overlay.style.backgroundImage, /portraits\/aurelia\.png/u);
});

test('VN animates compatible moods only and keeps every other expression and narrative CG intact', () => {
  const h = load();
  h.engine.openModal('visual-novel-modal');
  h.engine.setVnExpressionMood('nyx', 'neutral', 'chapter1'); h.tick();
  const portrait = h.nodes['vn-expression-portrait'];
  assert.match(portrait.style.backgroundImage, /portraits\/nyx\.png/u);
  assert.equal(portrait.style.backgroundSize, '400% 200%');
  assert.equal(portrait.dataset.spriteFrame, '1');
  for (const mood of ['sad', 'command', 'fear', 'romantic', 'playful']) {
    h.engine.setVnExpressionMood('nyx', mood, 'chapter1'); h.tick();
    assert.equal(portrait.style.backgroundImage, `url("expressions-nyx-${mood}.webp")`);
    assert.equal(portrait.style.backgroundSize, '');
    assert.equal(portrait.dataset.animatedPortrait, undefined);
  }
  h.engine.setVnExpressionMood('nyx', 'calm', 'chapter1'); h.tick();
  h.engine.setVnSceneImage('nyx'); h.tick();
  assert.equal(h.nodes['vn-scene-img'].src, 'nyx-narrative-cg.webp');
  assert.equal(portrait.hidden, true);
  assert.equal(portrait.dataset.animatedPortrait, undefined);
});

test('closing all modals clears both portrait overlays and a pending VN load stays cancelled', () => {
  const h = load({ ready: false });
  h.engine.openModal('visual-novel-modal');
  h.engine.setVnExpressionMood('nyx', 'neutral');
  h.engine.closeAllGameplayModals();
  h.setReady('portraits/nyx'); h.tick();
  assert.equal(h.nodes['vn-expression-portrait'].style.backgroundImage, 'url("expressions-nyx-neutral.webp")');
  assert.equal(h.nodes['vn-expression-portrait'].dataset.animatedPortrait, undefined);
});

test('weather uses native fractional source cells, bounded opacity and the actual viewport', () => {
  const h = load();
  h.engine.animationClock = 0.5;
  const view = { left: 200, top: 400, right: 1400, bottom: 1200 };
  assert.equal(h.engine.drawCompletedTacticalWeather('acid_rain', view), true);
  assert.ok(h.drawings.length > 0 && h.drawings.length <= 20);
  const first = h.drawings[0];
  assert.equal(first.args[1], 443.5);
  assert.equal(first.args[2], 443.5);
  assert.equal(first.args[3], 443.5);
  assert.equal(first.args[4], 443.5);
  assert.equal(first.alpha, 0.3);
  const centerX = first.args[5] + first.args[7] / 2;
  const centerY = first.args[6] + first.args[8] / 2;
  assert.ok(centerX >= view.left && centerX <= view.right);
  assert.ok(centerY >= view.top && centerY <= view.bottom);
  const count = h.drawings.length;
  h.engine.drawCompletedTacticalWeather('ion_storm', view);
  assert.ok(h.drawings.slice(count).every(call => call.alpha <= 0.18));
  assert.equal(h.engine.getActiveTacticalWeather, undefined, 'Presentation does not replace weather rules');
});

test('weather retains procedural fallback until decoded and does not load for clear/reduced-motion/inactive waves', () => {
  const h = load({ ready: false }); const view = h.engine.getBattlefieldView();
  assert.equal(h.engine.drawCompletedTacticalWeather('clear', view), false);
  h.engine.prefersReducedMotion = true;
  assert.equal(h.engine.drawCompletedTacticalWeather('acid_rain', view), false);
  h.engine.prefersReducedMotion = false; h.engine.waveActive = false;
  assert.equal(h.engine.drawCompletedTacticalWeather('acid_rain', view), false);
  assert.equal(h.requests.length, 0);
  h.engine.waveActive = true;
  for (let i = 0; i < 10; i++) assert.equal(h.engine.drawCompletedTacticalWeather('acid_rain', view), false);
  assert.equal(h.requests.length, 1);
  h.setReady('environment/acid-rain');
  assert.equal(h.engine.drawCompletedTacticalWeather('acid_rain', view), true);
});

test('infernal fog is requested only from the exact approved DLC register entry', () => {
  const h = load(); const view = h.engine.getBattlefieldView();
  assert.equal(h.engine.drawCompletedTacticalWeather('infernal_fog', view), false);
  const fog = { src: 'assets/dlc/illustrated-v1/fx/infernal_fog.png', columns: 4, rows: 2,
    sequenceFrames: 8, fps: 8, approved: true, sha256: 'bad' };
  h.window.INFERNAL_CITY_DLC_ART = { assets: { 'fx/infernal_fog': fog } };
  assert.equal(h.engine.drawCompletedTacticalWeather('infernal_fog', view), false);
  assert.equal(h.requests.length, 0);
  fog.sha256 = 'b'.repeat(64);
  assert.equal(h.engine.drawCompletedTacticalWeather('infernal_fog', view), true);
  assert.equal(h.requests[0], fog.src);
  assert.ok(h.drawings.every(call => call.alpha === 0.16));
});

test('settling debris is bounded, follows successful mechanical recycling only, and never changes rewards', () => {
  const h = load();
  h.engine.killEnemy({ type: 'infernal_ember_imp' });
  h.engine.sellDefense({ x: 1, y: 2 });
  assert.equal(h.requests.length, 0);
  for (let i = 0; i < 30; i++) {
    const tower = { id: 'vulcan_turret', x: i * 10, y: 20 };
    h.engine.placedTowers.push(tower);
    assert.equal(h.engine.sellDefense(tower).refund, 60);
  }
  assert.equal(h.engine.coins, 1800);
  assert.equal(h.engine.kills, 1);
  assert.equal(h.requests.length, 1);
  h.engine.render(); assert.equal(h.drawings.length, 0, 'Debris waits for the recycling pose');
  h.engine.update(0.4); h.engine.render();
  assert.equal(h.drawings.length, 24);
  h.drawings.length = 0; h.engine.update(0.8); h.engine.render();
  assert.equal(h.drawings.length, 0);
});

test('reduced motion and gameplay restoration discard temporary recycling effects', () => {
  const h = load();
  h.engine.prefersReducedMotion = true;
  const tower = { x: 10, y: 10 }; h.engine.placedTowers.push(tower); h.engine.sellDefense(tower);
  assert.equal(h.requests.length, 0);
  h.engine.prefersReducedMotion = false;
  for (const reset of ['startNewGame', 'restoreGameplayState']) {
    const other = { x: 20, y: 20 }; h.engine.placedTowers.push(other); h.engine.sellDefense(other);
    h.engine[reset](); h.engine.update(0.5); h.engine.render();
    assert.equal(h.drawings.length, 0);
  }
});
