(function installDlcArt(root) {
  'use strict';

  if (typeof GameEngine !== 'function') return;
  const proto = GameEngine.prototype;
  const states = new WeakMap();
  const prefix = 'assets/dlc/illustrated-v1/';
  const duoIds = new Set((root.INFERNAL_CITY_DLCS?.freeExpansions || [])
    .flatMap(pack => (pack.duoCombos || []).map(duo => duo.id)));

  function stateFor(engine) {
    if (!states.has(engine)) states.set(engine, { images: new Map(), thumbnails: [] });
    return states.get(engine);
  }

  function specFor(key) {
    const spec = root.INFERNAL_CITY_DLC_ART?.assets?.[key];
    if (!spec || spec.approved !== true || spec.src !== `${prefix}${key}.png`
      || !/^[a-f0-9]{64}$/u.test(spec.sha256 || '')
      || !Number.isInteger(spec.columns) || spec.columns < 1 || spec.columns > 16
      || !Number.isInteger(spec.rows) || spec.rows < 1 || spec.rows > 16) return null;
    return spec;
  }

  function ready(engine, spec) {
    if (!spec || engine.hasEnteredAdultExperience !== true) return null;
    const images = stateFor(engine).images;
    if (!images.has(spec.src)) images.set(spec.src, engine.preloadSpriteAsset(spec.src, spec.name));
    const image = images.get(spec.src);
    return engine.isSpriteReady(image) ? { image, spec } : null;
  }

  function frameFor(spec, seconds, reduced = false) {
    if (reduced || !spec.fps) return 0;
    const count = spec.sequenceFrames || spec.columns;
    return Math.floor(Math.max(0, seconds) * spec.fps) % count;
  }

  function drawSprite(ctx, loaded, frame, row, x, y, width, height = width, alpha = 1) {
    if (!ctx || !loaded || !(width > 0 && height > 0)) return false;
    const { image, spec } = loaded;
    const cellW = (image.naturalWidth || image.width) / spec.columns;
    const cellH = (image.naturalHeight || image.height) / spec.rows;
    if (!(cellW > 0 && cellH > 0)) return false;
    const sequence = Boolean(spec.sequenceFrames);
    const col = sequence ? frame % spec.columns : Math.max(0, Math.min(spec.columns - 1, frame));
    const safeRow = sequence ? Math.floor(frame / spec.columns) : Math.max(0, Math.min(spec.rows - 1, row));
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(image, col * cellW, safeRow * cellH, cellW, cellH,
      x - width / 2, y - height / 2, width, height);
    ctx.restore();
    return true;
  }

  function packMaps(packId) {
    return Object.values(root.INFERNAL_CITY_DLC_ART?.assets || {})
      .filter(spec => spec.group === 'maps' && spec.packId === packId && specFor(spec.key));
  }

  proto.getDlcIllustratedMap = function getDlcIllustratedMap(packId = this.activeDlcBiomeId) {
    const maps = packMaps(packId);
    return maps.find(spec => spec.id === this.dlcMapSelections?.[packId]) || maps[0] || null;
  };

  proto.selectDlcIllustratedMap = function selectDlcIllustratedMap(packId, mapId) {
    const map = packMaps(packId).find(spec => spec.id === mapId);
    if (!map) return false;
    const result = this.activateDlcBiome?.(packId);
    if (result === false) return false;
    if (!this.dlcMapSelections || typeof this.dlcMapSelections !== 'object') this.dlcMapSelections = {};
    this.dlcMapSelections[packId] = map.id;
    ready(this, map);
    this.saveProgress?.();
    this.openDlcHubModal?.();
    return true;
  };

  const baseBiome = proto.renderDlcBiomeOverlay;
  proto.renderDlcBiomeOverlay = function renderIllustratedBiome(w, h, view) {
    const map = this.getDlcIllustratedMap();
    const loaded = ready(this, map);
    if (!loaded || !view || !(w > 0 && h > 0) || !this.ctx) {
      return baseBiome?.call(this, w, h, view);
    }
    const image = loaded.image;
    const iw = image.naturalWidth || image.width, ih = image.naturalHeight || image.height;
    // Cover without stretching the authored scene. Source PNG bytes stay native.
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale, sh = h / scale;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, w, h);
    ctx.restore();
    const prop = ready(this, specFor(`props/${map.biomeKey}_monument`));
    if (prop) {
      const frame = frameFor(prop.spec, this.animationClock || 0, this.prefersReducedMotion);
      const size = this.getReadableWorldSize?.(220, 100) || 220;
      for (const [x, y] of [[-100, -100], [w + 100, -100], [-100, h + 100], [w + 100, h + 100]]) {
        drawSprite(ctx, prop, frame, 0, x, y, size, size, 0.92);
      }
    }
    return true;
  };

  const baseEvolution = proto.drawCompletedEvolution;
  proto.drawCompletedEvolution = function drawDlcDuoEffect(particle) {
    if (!this.prefersReducedMotion && particle?.type === 'gravity_ring' && duoIds.has(particle.dlcDuoId)) {
      const loaded = ready(this, specFor(`fx/${particle.dlcDuoId}`));
      if (loaded) {
        const duration = Math.max(0.01, Number(particle.maxLife) || 0.68);
        const progress = Math.max(0, Math.min(0.999, 1 - (Number(particle.life) || 0) / duration));
        const frame = Math.min(7, Math.floor(progress * loaded.spec.sequenceFrames));
        const radius = Math.max(1, Number(particle.radius) || 48);
        // Ring artwork occupies about the central half of its transparent cell.
        return drawSprite(this.ctx, loaded, frame, 0, particle.x, particle.y,
          radius * 4, radius * 4, Math.min(0.85, (1 - progress) * 1.5));
      }
    }
    return baseEvolution?.call(this, particle) || false;
  };

  function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function addGallery(engine, card, specs, title) {
    if (!card || !specs.length) return;
    const details = el('details', 'dlc-art-gallery');
    const summary = el('summary', '', title);
    summary.tabIndex = 0;
    details.appendChild(summary);
    const grid = el('div', 'dlc-art-gallery-grid');
    details.appendChild(grid);
    let populated = false;
    details.addEventListener('toggle', () => {
      if (!details.open || populated) return;
      populated = true;
      for (const spec of specs) {
        const figure = el('figure', 'dlc-art-figure');
        const canvas = el('canvas', 'dlc-art-sprite');
        canvas.width = 180; canvas.height = 180;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', spec.name);
        figure.appendChild(canvas);
        figure.appendChild(el('figcaption', '', spec.name));
        grid.appendChild(figure);
        const idle = spec.states.indexOf('idle');
        const breathing = spec.states.indexOf('idle_respiration');
        stateFor(engine).thumbnails.push({ canvas, details, spec,
          row: idle >= 0 ? idle : breathing >= 0 ? breathing : 0, lastFrame: -1 });
      }
      engine.updateDlcArtCatalogue();
    });
    card.appendChild(details);
  }

  function enhanceHub(engine) {
    if (typeof document === 'undefined' || engine.hasEnteredAdultExperience !== true) return;
    const paid = document.getElementById('dlc-paid-grid');
    const free = document.getElementById('dlc-free-grid');
    if (!paid || !free) return;
    stateFor(engine).thumbnails = [];
    const all = Object.values(root.INFERNAL_CITY_DLC_ART?.assets || {}).filter(spec => specFor(spec.key));
    (root.INFERNAL_CITY_DLCS?.paidDlcs || []).forEach((pack, index) => {
      const card = paid.children[index];
      if (!card) return;
      const maps = packMaps(pack.id);
      if (maps.length) {
        const mapGrid = el('div', 'dlc-art-map-grid');
        const active = engine.getDlcIllustratedMap(pack.id);
        for (const map of maps) {
          const figure = el('figure', 'dlc-art-map');
          const image = el('img');
          image.loading = 'lazy'; image.decoding = 'async';
          image.alt = map.name; image.src = map.src;
          image.addEventListener('error', () => { image.hidden = true; });
          figure.appendChild(image);
          const button = el('button', engine.activeDlcBiomeId === pack.id && active?.id === map.id ? 'btn-primary' : 'btn-secondary', map.name);
          button.type = 'button';
          button.setAttribute('aria-pressed', String(engine.activeDlcBiomeId === pack.id && active?.id === map.id));
          button.addEventListener('click', () => engine.selectDlcIllustratedMap(pack.id, map.id));
          figure.appendChild(button);
          mapGrid.appendChild(figure);
        }
        card.appendChild(mapGrid);
      }
      addGallery(engine, card, all.filter(spec => spec.packId === pack.id && !['maps', 'props'].includes(spec.group)),
        'Voir les personnages et l’arsenal');
    });
    (root.INFERNAL_CITY_DLCS?.freeExpansions || []).forEach((pack, index) => {
      addGallery(engine, free.children[index], all.filter(spec => spec.packId === pack.id),
        pack.id === 'free_aerial_horizon' ? 'Voir les unités aériennes et la météo' : 'Voir les visuels du Pacte');
    });
    const reset = document.getElementById('btn-dlc-reset-biome');
    if (reset && typeof reset.onclick === 'function') {
      const original = reset.onclick;
      reset.onclick = function resetIllustratedBiome(...args) {
        const result = original.apply(this, args);
        engine.saveProgress?.();
        return result;
      };
    }
  }

  proto.updateDlcArtCatalogue = function updateDlcArtCatalogue() {
    if (typeof document === 'undefined' || document.hidden) return;
    const modal = document.getElementById('dlc-hub-modal');
    if (!modal?.classList.contains('active')) return;
    const time = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
    for (const item of stateFor(this).thumbnails) {
      if (!item.details.open || item.canvas.isConnected === false) continue;
      const loaded = ready(this, item.spec);
      if (!loaded) continue;
      const frame = frameFor(item.spec, time, this.prefersReducedMotion);
      if (frame === item.lastFrame) continue;
      const ctx = item.canvas.getContext('2d');
      if (!ctx) continue;
      ctx.clearRect(0, 0, 180, 180);
      drawSprite(ctx, loaded, frame, item.row, 90, 90, 180);
      item.lastFrame = frame;
    }
  };

  const baseHub = proto.openDlcHubModal;
  proto.openDlcHubModal = function openIllustratedDlcHub(...args) {
    const result = baseHub?.apply(this, args);
    enhanceHub(this);
    return result;
  };
  const baseActivate = proto.activateDlcBiome;
  proto.activateDlcBiome = function activateIllustratedDlcBiome(...args) {
    const result = baseActivate?.apply(this, args);
    if (result === true) this.saveProgress?.();
    return result;
  };
  const baseRender = proto.render;
  proto.render = function renderWithDlcArt(...args) {
    const result = baseRender?.apply(this, args);
    this.updateDlcArtCatalogue();
    return result;
  };
})(typeof window !== 'undefined' ? window : globalThis);
