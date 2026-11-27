(function installSpritePresentation(root) {
  'use strict';

  const registry = root.INFERNAL_CITY_SPRITE_COMPLETION;
  if (!registry || typeof GameEngine !== 'function') return;
  const proto = GameEngine.prototype;
  const states = new WeakMap();
  const portraitStates = new Set();
  const PORTRAIT_POSE = 'animated-portrait';
  const MAX_DEBRIS = 24;
  const NEUTRAL_MOODS = /^(neutral|calm|relaxed|relax|peace|peaceful|safe|rest|resting|idle)$/u;

  function stateFor(engine) {
    if (!states.has(engine)) states.set(engine, {
      images: new Map(), studio: null, vn: null, debris: [], combatTime: 0
    });
    return states.get(engine);
  }

  function node(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function clock() {
    return typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
  }

  function modalVisible(id) {
    const modal = node(id);
    return Boolean(modal?.classList.contains('active') && modal.inert !== true
      && modal.getAttribute?.('aria-hidden') !== 'true');
  }

  function portraitSpec(heroId) {
    return registry.approved(`portraits/${heroId}`);
  }

  function weatherSpec(weather) {
    if (weather === 'acid_rain') return registry.approved('environment/acid-rain');
    if (weather === 'ion_storm') return registry.approved('environment/ion-storm');
    if (weather !== 'infernal_fog') return null;
    const spec = root.INFERNAL_CITY_DLC_ART?.assets?.['fx/infernal_fog'];
    // A future filename alone cannot enable a request. The art register is
    // published only after the exact native file receives visual approval.
    return spec?.approved === true && /^[a-f0-9]{64}$/u.test(spec.sha256 || '')
      && spec.src === 'assets/dlc/illustrated-v1/fx/infernal_fog.png'
      && spec.columns === 4 && spec.rows === 2 && spec.sequenceFrames === 8
      ? spec : null;
  }

  function loadedImage(engine, spec) {
    if (!spec || engine.hasEnteredAdultExperience !== true) return null;
    const images = stateFor(engine).images;
    if (!images.has(spec.src)) {
      images.set(spec.src, engine.preloadSpriteAsset(spec.src, 'Portrait ou effet animé'));
    }
    const image = images.get(spec.src);
    // Keep failed loads in this cache: the static/procedural fallback remains
    // usable and reopening a panel never retries the same failure every frame.
    return engine.isSpriteReady(image) ? { image, spec } : null;
  }

  function sequenceFrame(spec, seconds, reducedMotion = false) {
    if (reducedMotion) return 0;
    const count = Math.min(spec.columns * spec.rows, spec.sequenceFrames || 8);
    return Math.floor(Math.max(0, seconds) * (spec.fps || 4)) % count;
  }

  function paintBackground(element, spec, frame) {
    const column = frame % spec.columns;
    const row = Math.floor(frame / spec.columns);
    element.style.backgroundImage = `url("${spec.src}")`;
    element.style.backgroundSize = `${spec.columns * 100}% ${spec.rows * 100}%`;
    element.style.backgroundPosition = `${spec.columns > 1 ? column * 100 / (spec.columns - 1) : 0}% ${spec.rows > 1 ? row * 100 / (spec.rows - 1) : 0}%`;
    element.dataset.spriteFrame = String(frame);
  }

  function clearStudio(engine) {
    const target = stateFor(engine).studio;
    if (target) {
      target.overlay.hidden = true;
      target.preview.classList.remove('sprite-portrait-fallback-hidden');
    }
    stateFor(engine).studio = null;
    if (!stateFor(engine).vn) portraitStates.delete(stateFor(engine));
  }

  function clearVn(engine) {
    const target = stateFor(engine).vn;
    if (target) {
      Object.assign(target.element.style, target.fallback);
      delete target.element.dataset.spriteFrame;
      delete target.element.dataset.animatedPortrait;
    }
    stateFor(engine).vn = null;
    if (!stateFor(engine).studio) portraitStates.delete(stateFor(engine));
  }

  function updateTarget(engine, target, visible, time) {
    if (!target) return;
    if (!visible || (typeof document !== 'undefined' && document.hidden)) {
      target.lastAt = null;
      return;
    }
    const loaded = loadedImage(engine, target.spec);
    if (!loaded) {
      target.lastAt = null;
      return;
    }
    if (!engine.prefersReducedMotion && target.lastAt !== null) {
      // UI keeps breathing while gameplay is paused, without accumulating
      // background-tab time or altering any combat/simulation clock.
      target.elapsed += Math.max(0, Math.min(0.3, time - target.lastAt));
    }
    target.lastAt = time;
    const frame = sequenceFrame(target.spec, target.elapsed, engine.prefersReducedMotion);
    if (target.overlay) {
      paintBackground(target.overlay, target.spec, frame);
      target.overlay.style.filter = target.preview.style.filter || '';
      target.overlay.setAttribute('role', 'img');
      target.overlay.setAttribute('aria-label', target.preview.alt || 'Portrait animé');
      target.overlay.removeAttribute('aria-hidden');
      target.overlay.hidden = false;
      target.preview.classList.add('sprite-portrait-fallback-hidden');
    } else {
      paintBackground(target.element, target.spec, frame);
      target.element.dataset.animatedPortrait = target.heroId;
    }
  }

  function updatePortraits(engine) {
    const state = stateFor(engine);
    const time = clock();
    updateTarget(engine, state.studio, modalVisible('photo-studio-modal'), time);
    updateTarget(engine, state.vn,
      modalVisible('visual-novel-modal') && state.vn?.element.hidden !== true, time);
  }

  if (typeof document !== 'undefined') document.addEventListener?.('visibilitychange', () => {
    // The game intentionally stops rendering hidden tabs. Reset at the actual
    // visibility event so returning to a tab cannot advance a dormant portrait.
    portraitStates.forEach(state => {
      if (state.studio) state.studio.lastAt = null;
      if (state.vn) state.vn.lastAt = null;
    });
  });

  const basePoses = proto.getStudioPoseOptions;
  if (typeof basePoses === 'function') proto.getStudioPoseOptions = function getAnimatedStudioPoses(heroId) {
    const poses = basePoses.call(this, heroId);
    if (!portraitSpec(heroId) || poses.some(pose => pose.id === PORTRAIT_POSE)) return poses;
    return [...poses, { id: PORTRAIT_POSE, label: 'Portrait animé', animatedPortrait: true }];
  };

  const baseStudioSource = proto.getStudioPreviewSource;
  if (typeof baseStudioSource === 'function') proto.getStudioPreviewSource = function getAnimatedStudioFallback(heroId, poseId) {
    if (poseId === PORTRAIT_POSE && portraitSpec(heroId)) {
      const hero = typeof HERO_CLASSES !== 'undefined' ? HERO_CLASSES[heroId] : null;
      if (hero?.avatar) return hero.avatar;
    }
    return baseStudioSource.call(this, heroId, poseId);
  };

  const baseStudio = proto.updatePhotoStudioPreview;
  if (typeof baseStudio === 'function') proto.updatePhotoStudioPreview = function updateAnimatedStudioPreview(...args) {
    clearStudio(this);
    const result = baseStudio.apply(this, args);
    const modal = node('photo-studio-modal');
    const heroId = modal?.dataset.heroId || this.selectedHero?.id;
    const spec = portraitSpec(heroId);
    const preview = node('studio-preview-img');
    const frame = preview?.closest?.('.studio-preview-frame');
    if (!spec || !frame || node('studio-pose-select')?.value !== PORTRAIT_POSE) return result;
    let overlay = frame.querySelector('.sprite-studio-portrait');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sprite-studio-portrait';
      overlay.hidden = true;
      frame.appendChild(overlay);
    }
    stateFor(this).studio = { heroId, spec, overlay, preview, elapsed: 0, lastAt: null };
    portraitStates.add(stateFor(this));
    updatePortraits(this);
    return result;
  };

  const baseExpression = proto.setVnExpressionMood;
  if (typeof baseExpression === 'function') proto.setVnExpressionMood = function setAnimatedVnMood(heroId, mood = 'neutral', ...args) {
    clearVn(this);
    const result = baseExpression.call(this, heroId, mood, ...args);
    const element = node('vn-expression-portrait');
    const spec = portraitSpec(heroId);
    if (!spec || !element || element.hidden || !NEUTRAL_MOODS.test(String(mood).toLowerCase())) return result;
    stateFor(this).vn = { heroId, spec, element, elapsed: 0, lastAt: null,
      fallback: {
        backgroundImage: element.style.backgroundImage,
        backgroundPosition: element.style.backgroundPosition,
        backgroundSize: element.style.backgroundSize || ''
      }
    };
    portraitStates.add(stateFor(this));
    updatePortraits(this);
    return result;
  };

  const baseVnScene = proto.setVnSceneImage;
  if (typeof baseVnScene === 'function') proto.setVnSceneImage = function setSceneWithoutStalePortrait(...args) {
    clearVn(this);
    return baseVnScene.apply(this, args);
  };

  const baseOpen = proto.openModal;
  if (typeof baseOpen === 'function') proto.openModal = function openAnimatedPortraitModal(...args) {
    const result = baseOpen.apply(this, args);
    updatePortraits(this);
    return result;
  };
  ['closeModal', 'closeAllGameplayModals'].forEach(method => {
    const original = proto[method];
    if (typeof original !== 'function') return;
    proto[method] = function closeAnimatedPortraitModal(...args) {
      const result = original.apply(this, args);
      if (!modalVisible('photo-studio-modal')) clearStudio(this);
      if (!modalVisible('visual-novel-modal')) clearVn(this);
      return result;
    };
  });

  function drawCell(engine, loaded, frame, x, y, size, alpha = 1) {
    const { image, spec } = loaded;
    const sw = (image.naturalWidth || image.width) / spec.columns;
    const sh = (image.naturalHeight || image.height) / spec.rows;
    if (!(sw > 0 && sh > 0)) return false;
    const width = size * sw / Math.max(sw, sh);
    const height = size * sh / Math.max(sw, sh);
    const ctx = engine.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, (frame % spec.columns) * sw, Math.floor(frame / spec.columns) * sh, sw, sh,
      x - width / 2, y - height / 2, width, height);
    ctx.restore();
    return true;
  }

  proto.drawCompletedTacticalWeather = function drawCompletedTacticalWeather(weather, view) {
    if (!this.ctx || !this.waveActive || this.prefersReducedMotion) return false;
    const width = view?.right - view?.left;
    const height = view?.bottom - view?.top;
    if (!(width > 0 && height > 0)) return false;
    const spec = weatherSpec(weather);
    const loaded = loadedImage(this, spec);
    if (!loaded) return false;
    const cols = Math.max(1, Math.min(5, Math.ceil(width / 420)));
    const rows = Math.max(1, Math.min(4, Math.ceil(height / 340)));
    const size = Math.max(160, Math.min(weather === 'infernal_fog' ? 640 : 400,
      Math.min(width / cols, height / rows) * 1.3));
    const alpha = weather === 'acid_rain' ? 0.3 : (weather === 'ion_storm' ? 0.18 : 0.16);
    const seconds = Number(this.animationClock) || 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Stable world positions and authored frames avoid a flashing full-screen
        // overlay. Weather stays below towers, targets, telegraphs and the HUD.
        const phase = (row * cols + col) / (spec.fps || 10);
        drawCell(this, loaded, sequenceFrame(spec, seconds + phase),
          view.left + width * (col + 0.5) / cols,
          view.top + height * (row + 0.5) / rows, size, alpha);
      }
    }
    return true;
  };

  const baseSell = proto.sellDefense;
  if (typeof baseSell === 'function') proto.sellDefense = function sellDefenseWithSettlingDebris(defense, ...args) {
    const position = defense ? { x: defense.x, y: defense.y } : null;
    const result = baseSell.call(this, defense, ...args);
    if (result?.ok && position && Number.isFinite(position.x) && Number.isFinite(position.y)
      && !this.prefersReducedMotion && registry.approved('environment/debris-settle')) {
      const state = stateFor(this);
      loadedImage(this, registry.approved('environment/debris-settle'));
      state.debris.push({ ...position, born: state.combatTime + 0.35, duration: 0.8 });
      if (state.debris.length > MAX_DEBRIS) state.debris.splice(0, state.debris.length - MAX_DEBRIS);
    }
    return result;
  };

  const baseUpdate = proto.update;
  if (typeof baseUpdate === 'function') proto.update = function updatePresentationEffects(dt) {
    const state = stateFor(this);
    state.combatTime += Math.max(0, Number(dt) || 0);
    state.debris = state.debris.filter(effect => state.combatTime - effect.born < effect.duration);
    return baseUpdate.call(this, dt);
  };

  const baseRender = proto.render;
  if (typeof baseRender === 'function') proto.render = function renderSpritePresentation(...args) {
    const result = baseRender.apply(this, args);
    updatePortraits(this);
    const state = stateFor(this);
    if (!this.ctx || !this.canvas || this.prefersReducedMotion || !state.debris.length) return result;
    const loaded = loadedImage(this, registry.approved('environment/debris-settle'));
    if (!loaded) return result;
    this.ctx.save();
    this.applyBattlefieldView(this.getBattlefieldView(this.canvas.width, this.canvas.height));
    state.debris.forEach(effect => {
      const elapsed = state.combatTime - effect.born;
      if (elapsed < 0 || elapsed >= effect.duration) return;
      const frame = Math.min(7, Math.floor(elapsed / effect.duration * 8));
      drawCell(this, loaded, frame, effect.x, effect.y,
        this.getReadableWorldSize(92, 44), Math.min(1, (effect.duration - elapsed) / 0.2));
    });
    this.ctx.restore();
    return result;
  };

  ['startNewGame', 'restoreGameplayState'].forEach(method => {
    const original = proto[method];
    if (typeof original !== 'function') return;
    proto[method] = function resetPresentationEffects(...args) {
      clearStudio(this);
      clearVn(this);
      const state = stateFor(this);
      state.debris = [];
      state.combatTime = 0;
      return original.apply(this, args);
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
