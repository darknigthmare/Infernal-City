(function installInfernalCityProfessionalGameplay(global) {
  'use strict';

  if (typeof GameEngine === 'undefined' || GameEngine.prototype.__professionalGameplayInstalled) return;

  const proto = GameEngine.prototype;
  proto.__professionalGameplayInstalled = true;

  const BASE = {
    init: proto.init,
    loadProgress: proto.loadProgress,
    createCampaignSaveData: proto.createCampaignSaveData,
    captureGameplayState: proto.captureGameplayState,
    restoreGameplayState: proto.restoreGameplayState,
    saveProgress: proto.saveProgress,
    resizeCanvas: proto.resizeCanvas,
    syncSettingsControls: proto.syncSettingsControls,
    initializeSettingsControls: proto.initializeSettingsControls,
    openMissionBriefing: proto.openMissionBriefing,
    startDailyChallenge: proto.startDailyChallenge,
    beginNewCampaign: proto.beginNewCampaign,
    continueSavedCampaign: proto.continueSavedCampaign,
    returnToMissionBriefing: proto.returnToMissionBriefing,
    startNewGame: proto.startNewGame,
    configureWave: proto.configureWave,
    completeWave: proto.completeWave,
    openSlotMachineModal: proto.openSlotMachineModal,
    openTowerInfinitumModal: proto.openTowerInfinitumModal,
    spawnMutant: proto.spawnMutant,
    advanceWave: proto.advanceWave,
    continueEndlessMode: proto.continueEndlessMode,
    rotateWorldLayoutBetweenWaves: proto.rotateWorldLayoutBetweenWaves,
    updateSpawns: proto.updateSpawns,
    update: proto.update,
    render: proto.render,
    renderBuildBar: proto.renderBuildBar,
    renderDefenseManagementModal: proto.renderDefenseManagementModal,
    sanitizeRunCheckpoint: proto.sanitizeRunCheckpoint,
    restoreRunCheckpoint: proto.restoreRunCheckpoint,
    chooseDefenseSpecialization: proto.chooseDefenseSpecialization,
    upgradeDefense: proto.upgradeDefense,
    sellDefense: proto.sellDefense,
    triggerHeroAbility: proto.triggerHeroAbility,
    triggerOverdrive: proto.triggerOverdrive,
    triggerLevelUpModal: proto.triggerLevelUpModal,
    triggerEvolutionModal: proto.triggerEvolutionModal,
    openShopModal: proto.openShopModal,
    openRosterModal: proto.openRosterModal,
    triggerCampaignVictory: proto.triggerCampaignVictory,
    triggerDailyVictory: proto.triggerDailyVictory,
    triggerGameOver: proto.triggerGameOver,
    recordRunHistory: proto.recordRunHistory,
    renderRunHistory: proto.renderRunHistory,
    killEnemy: proto.killEnemy,
    getCoinValueMultiplier: proto.getCoinValueMultiplier,
    getEffectiveShopUpgrade: proto.getEffectiveShopUpgrade,
    getActiveGamepad: proto.getActiveGamepad,
    updateGamepadControls: proto.updateGamepadControls
  };

  const FIXED_STEP_SECONDS = 1 / 60;
  const MAX_SIMULATION_STEPS = 18;
  const PROJECTILE_CAP = 1400;
  const PARTICLE_CAP = 900;
  const STARTING_COINS = Object.freeze({ story: 280, standard: 220, nightmare: 240 });
  const META_HP_BONUS_PER_RANK = 10;
  const META_HP_MAX_RANK = 10;
  const META_FIRE_RATE_PER_RANK = 0.02;
  const META_FIRE_RATE_MAX_RANK = 10;
  const META_MAGNET_MAX_RANK = 10;
  const TARGET_POLICIES = new Set(['first', 'last', 'strong', 'weak', 'flying', 'elite']);

  const STARTER_TOWER_IDS = Object.freeze([
    'vulcan_turret',
    'plasma_mortar',
    'flame_trap',
    'cryo_cannon',
    'laser_drone',
    'aegis_barrier'
  ]);

  const TOWER_UNLOCK_PLAN = Object.freeze([
    { wave: 2, ids: ['tesla_spire', 'acid_trap'] },
    { wave: 3, ids: ['landmine', 'sonic_cannon'] },
    { wave: 4, ids: ['railgun_pylon', 'magnet_drone'] },
    { wave: 5, ids: ['gravity_well', 'missile_pod'] },
    { wave: 7, ids: ['bio_siphon', 'sawblade_turret'] },
    { wave: 9, ids: ['emp_tower', 'napalm_mine'] },
    { wave: 11, ids: ['blood_shrine', 'orbital_beam'] }
  ]);

  const TUTORIAL_STEPS = Object.freeze([
    { event: 'select', title: 'Choisir une défense', copy: 'Sélectionnez une carte de défense. Commencez par une arme simple dont le coût laisse une réserve.' },
    { event: 'build', title: 'Lire le terrain', copy: 'Placez la défense : vert signifie valide, rouge signale une route, la Citadelle ou une collision.' },
    { event: 'launch', title: 'Engager la vague', copy: 'Lisez la composition annoncée, puis lancez la vague. Un lancement anticipé pendant une intermission rapporte un bonus.' },
    { event: 'upgrade', title: 'Améliorer une position', copy: 'Sélectionnez une défense déployée et améliorez-la au niveau 2.' },
    { event: 'specialize', title: 'Définir un rôle', copy: 'Choisissez une spécialisation définitive et une priorité de ciblage adaptée.' },
    { event: 'hero', title: 'Commander la Valkyrie', copy: 'Déclenchez la capacité héroïque, puis choisissez sa cible sur le terrain si nécessaire.' },
    { event: 'overdrive', title: 'Exploiter la Frénésie', copy: 'Quand la jauge est prête, activez l’Overdrive avec F ou son bouton.' },
    { event: 'wave_complete', title: 'Sécuriser un secteur', copy: 'Terminez une vague. Construction, vente et préparation restent disponibles avant le prochain assaut.' }
  ]);

  const SECONDARY_OBJECTIVES = Object.freeze({
    convergence: {
      label: 'Neutraliser des menaces sur au moins deux voies',
      evaluate(engine) {
        return engine.waveRouteKills instanceof Set && engine.waveRouteKills.size >= Math.min(2, Math.max(1, engine.spawnRoutes.length));
      }
    },
    western_wall: {
      label: 'Citadelle intacte pendant la vague',
      evaluate(engine) {
        return engine.citadel.hp >= engine.waveStartCitadelHp - 0.001;
      }
    },
    southern_watch: {
      label: 'Déployer une défense anti-aérienne',
      evaluate(engine) {
        return engine.placedTowers.some(tower => ['drone', 'rail', 'tesla'].includes(tower.type));
      }
    },
    twin_rift: {
      label: 'Tenir les deux fronts avec huit constructions maximum',
      evaluate(engine) {
        return engine.waveRouteKills instanceof Set
          && engine.waveRouteKills.size >= 2
          && engine.placedTowers.filter(tower => !tower.isStarter).length <= 8;
      }
    }
  });

  function ensureProfessionalState(engine) {
    if (engine.__professionalStateReady) return;
    engine.__professionalStateReady = true;
    engine.gameplayPhase = 'briefing';
    engine.gameSpeed = 1;
    engine.simulationAccumulator = 0;
    engine.professionalRunStarted = false;
    engine.professionalRunHeroId = null;
    engine.professionalLayoutPreparedForWave = null;
    engine.keyboardPreset = 'zqsd';
    engine.pauseOnBlur = true;
    engine.gamepadDeadzone = 0.18;
    engine.gamepadSensitivity = 1;
    engine.tutorialCompleted = false;
    engine.tutorialActive = false;
    engine.tutorialIndex = 0;
    engine.unlockedTowerIds = new Set(STARTER_TOWER_IDS);
    engine.completedCampaignIds = new Set();
    engine.campaignCompletionsByDifficulty = {};
    engine.records = {};
    engine.dailyRecords = {};
    engine.dailyStreak = 0;
    engine.claimedInfinitumMilestones = new Set();
    engine.waveRouteKills = new Set();
    engine.waveStartCitadelHp = Number(engine.citadel?.hp) || 500;
    engine.secondaryObjectiveResult = null;
    engine.enemySpatialIndex = new Map();
    engine.enemySpatialCellSize = 180;
    engine.professionalSessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    engine.professionalSaveRevision = 0;
    engine.professionalTabConflict = false;
    engine.campaignSeed = 0;
    engine.campaignRng = null;
    engine.campaignRngCalls = 0;
    engine.professionalRetryCheckpointAvailable = false;
    engine.pendingTowerMutatorCandidates = [];
    engine.pendingTowerMutatorCandidatesFloor = null;
  }

  function readProfessionalSave(engine) {
    ensureProfessionalState(engine);
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CAMPAIGN_STORAGE_KEY) : null;
      if (!raw) return;
      const data = JSON.parse(raw);
      const progression = data.professionalProgression || {};
      const isLegacyVeteran = !data.professionalProgression
        && Math.max(0, Number(data.campaignCompletions) || 0) > 0;
      if (isLegacyVeteran) Object.keys(TOWER_TYPES).forEach(id => engine.unlockedTowerIds.add(id));
      if (isLegacyVeteran) engine.completedCampaignIds.add('four_gates');
      if (Array.isArray(progression.unlockedTowerIds)) {
        engine.unlockedTowerIds = new Set(
          progression.unlockedTowerIds.filter(id => Object.hasOwn(TOWER_TYPES, id))
        );
        STARTER_TOWER_IDS.forEach(id => engine.unlockedTowerIds.add(id));
      }
      if (Array.isArray(progression.completedCampaignIds)) {
        engine.completedCampaignIds = new Set(
          progression.completedCampaignIds.filter(id => ['four_gates', 'ten_thrones'].includes(id))
        );
      }
      if (progression.campaignCompletionsByDifficulty && typeof progression.campaignCompletionsByDifficulty === 'object') {
        engine.campaignCompletionsByDifficulty = { ...progression.campaignCompletionsByDifficulty };
      }
      engine.tutorialCompleted = progression.tutorialCompleted === true;
      engine.tutorialIndex = Math.max(
        0,
        Math.min(TUTORIAL_STEPS.length - 1, Math.floor(Number(progression.tutorialIndex) || 0))
      );
      engine.keyboardPreset = ['zqsd', 'wasd', 'arrows'].includes(progression.keyboardPreset)
        ? progression.keyboardPreset
        : 'zqsd';
      engine.pauseOnBlur = progression.pauseOnBlur !== false;
      engine.gamepadDeadzone = Math.max(0.05, Math.min(0.45, Number(progression.gamepadDeadzone) || 0.18));
      engine.gamepadSensitivity = Math.max(0.5, Math.min(1.8, Number(progression.gamepadSensitivity) || 1));
      engine.records = progression.records && typeof progression.records === 'object'
        ? { ...progression.records }
        : {};
      engine.dailyRecords = progression.dailyRecords && typeof progression.dailyRecords === 'object'
        ? { ...progression.dailyRecords }
        : {};
      engine.dailyStreak = Math.max(0, Math.floor(Number(progression.dailyStreak) || 0));
      engine.claimedInfinitumMilestones = new Set(
        Array.isArray(progression.claimedInfinitumMilestones)
          ? progression.claimedInfinitumMilestones.map(Number).filter(floor => floor >= 10 && floor <= 100 && floor % 10 === 0)
          : []
      );
      if (Array.isArray(data.towerMutatorIds)) {
        const allMutators = global.INFERNAL_CITY_CAMPAIGN_CONTENT?.infinitumMutators
          || EXPANSION?.infinitumMutators
          || [];
        engine.towerMutators = data.towerMutatorIds
          .map(id => allMutators.find(mutator => mutator.id === id))
          .filter(Boolean);
      }
      engine.professionalSaveRevision = Math.max(0, Math.floor(Number(progression.saveRevision) || 0));
      engine.campaignSeed = Math.max(0, Math.floor(Number(progression.campaignSeed) || 0)) >>> 0;
      engine.campaignRngCalls = Math.max(0, Math.min(1000000, Math.floor(Number(progression.campaignRngCalls) || 0)));
      engine.shopUpgrades.hpBonus = Math.min(META_HP_MAX_RANK, Math.max(0, Number(engine.shopUpgrades.hpBonus) || 0));
      engine.shopUpgrades.fireRateBonus = Math.min(META_FIRE_RATE_MAX_RANK, Math.max(0, Number(engine.shopUpgrades.fireRateBonus) || 0));
      engine.shopUpgrades.magnetRange = Math.min(META_MAGNET_MAX_RANK, Math.max(0, Number(engine.shopUpgrades.magnetRange) || 0));
    } catch (error) {
      console.warn('Progression professionnelle illisible :', error);
    }
  }

  proto.loadProgress = function loadProgressProfessional() {
    const result = BASE.loadProgress.call(this);
    readProfessionalSave(this);
    return result;
  };

  proto.createCampaignSaveData = function createCampaignSaveDataProfessional() {
    ensureProfessionalState(this);
    const data = BASE.createCampaignSaveData.call(this);
    this.professionalSaveRevision += 1;
    data.professionalProgression = {
      dataVersion: '3.0.0',
      unlockedTowerIds: [...this.unlockedTowerIds],
      completedCampaignIds: [...this.completedCampaignIds],
      campaignCompletionsByDifficulty: { ...this.campaignCompletionsByDifficulty },
      tutorialCompleted: this.tutorialCompleted,
      tutorialIndex: this.tutorialIndex,
      keyboardPreset: this.keyboardPreset,
      pauseOnBlur: this.pauseOnBlur,
      gamepadDeadzone: this.gamepadDeadzone,
      gamepadSensitivity: this.gamepadSensitivity,
      records: this.records,
      dailyRecords: this.dailyRecords,
      dailyStreak: this.dailyStreak,
      claimedInfinitumMilestones: [...this.claimedInfinitumMilestones],
      saveRevision: this.professionalSaveRevision,
      sessionId: this.professionalSessionId,
      campaignSeed: this.campaignSeed,
      campaignRngCalls: this.campaignRngCalls
    };
    return data;
  };

  proto.syncProfessionalSaveBanner = function syncProfessionalSaveBanner(message = '') {
    const banner = document.getElementById('save-failure-banner');
    const copy = document.getElementById('save-failure-banner-message');
    const failed = this.storageWriteBlocked || Boolean(this.saveLoadError);
    if (banner) banner.hidden = !failed;
    if (copy && message) copy.textContent = message;
  };

  proto.saveProgress = function saveProgressProfessional() {
    const ok = BASE.saveProgress.call(this);
    if (!ok) {
      this.syncProfessionalSaveBanner(
        'Le stockage local refuse la sauvegarde. Exportez immédiatement votre progression avant de fermer cette page.'
      );
    } else {
      this.syncProfessionalSaveBanner();
      this.professionalChannel?.postMessage?.({
        type: 'save-revision',
        sessionId: this.professionalSessionId,
        revision: this.professionalSaveRevision
      });
    }
    return ok;
  };

  proto.captureGameplayState = function captureGameplayStateProfessional() {
    ensureProfessionalState(this);
    return {
      ...BASE.captureGameplayState.call(this),
      professionalRunStarted: this.professionalRunStarted,
      professionalRunHeroId: this.professionalRunHeroId,
      gameplayPhase: this.gameplayPhase,
      campaignSeed: this.campaignSeed,
      campaignRngCalls: this.campaignRngCalls,
      tutorialActive: this.tutorialActive,
      tutorialIndex: this.tutorialIndex,
      gameSpeed: this.gameSpeed,
      waveRouteKills: new Set(this.waveRouteKills || []),
      waveStartCitadelHp: this.waveStartCitadelHp,
      secondaryObjectiveResult: this.secondaryObjectiveResult
    };
  };

  proto.restoreProfessionalCampaignRng = function restoreProfessionalCampaignRng(seed, calls = 0) {
    this.campaignSeed = Math.max(1, Math.floor(Number(seed) || 1)) >>> 0;
    const targetCalls = Math.max(0, Math.min(1000000, Math.floor(Number(calls) || 0)));
    this.campaignRng = this.createFallbackSeededRng(this.campaignSeed);
    for (let index = 0; index < targetCalls; index++) this.campaignRng();
    this.campaignRngCalls = targetCalls;
  };

  proto.restoreGameplayState = function restoreGameplayStateProfessional(state) {
    const restored = BASE.restoreGameplayState.call(this, state);
    if (!restored) return false;
    ensureProfessionalState(this);
    this.restoreProfessionalCampaignRng(
      state?.campaignSeed || this.campaignSeed,
      state?.campaignRngCalls
    );
    this.professionalRunStarted = state?.professionalRunStarted === true;
    this.professionalRunHeroId = this.professionalRunStarted
      ? (state?.professionalRunHeroId || this.selectedHero?.id || null)
      : null;
    this.gameplayPhase = ['briefing', 'preparation', 'intermission', 'combat'].includes(state?.gameplayPhase)
      ? state.gameplayPhase
      : (this.professionalRunStarted ? (this.waveActive ? 'combat' : 'preparation') : 'briefing');
    this.tutorialActive = state?.tutorialActive === true && !this.tutorialCompleted;
    this.tutorialIndex = Math.max(0, Math.min(
      TUTORIAL_STEPS.length - 1,
      Math.floor(Number(state?.tutorialIndex) || this.tutorialIndex || 0)
    ));
    this.gameSpeed = [1, 2, 3].includes(Number(state?.gameSpeed)) ? Number(state.gameSpeed) : 1;
    this.waveRouteKills = new Set(state?.waveRouteKills || []);
    this.waveStartCitadelHp = Number.isFinite(Number(state?.waveStartCitadelHp))
      ? Number(state.waveStartCitadelHp)
      : this.citadel.hp;
    this.secondaryObjectiveResult = state?.secondaryObjectiveResult ?? null;
    this.syncTacticalControls();
    this.syncTutorialCoach();
    return true;
  };

  proto.createBriefingHeroField = function createBriefingHeroField() {
    if (document.getElementById('briefing-hero-select')) return;
    const campaignSelect = document.getElementById('campaign-select');
    const campaignField = campaignSelect?.closest?.('.difficulty-field');
    if (!campaignField || typeof document.createElement !== 'function') return;
    const label = document.createElement('label');
    label.className = 'difficulty-field';
    label.setAttribute('for', 'briefing-hero-select');
    const title = document.createElement('span');
    title.textContent = 'Commandante';
    const select = document.createElement('select');
    select.id = 'briefing-hero-select';
    select.setAttribute('aria-describedby', 'briefing-hero-description');
    const description = document.createElement('small');
    description.id = 'briefing-hero-description';
    description.textContent = 'La commandante choisie est verrouillée dès le départ de la sortie.';
    label.append(title, select, description);
    campaignField.insertAdjacentElement?.('afterend', label);
    select.addEventListener('change', () => {
      const hero = HERO_CLASSES[select.value];
      if (!hero || hero.unlocked === false) return;
      this.selectedHero = hero;
      this.updateHeroPresentation();
      this.saveProgress();
    });
  };

  proto.syncProgressionBriefing = function syncProgressionBriefing() {
    ensureProfessionalState(this);
    const difficulty = document.getElementById('difficulty-select');
    const nightmare = difficulty?.querySelector?.('option[value="nightmare"]');
    const nightmareUnlocked = Boolean(
      this.campaignCompletionsByDifficulty.standard
      || this.campaignCompletionsByDifficulty.nightmare
      || this.campaignCompletions > 0
    );
    if (nightmare) nightmare.disabled = !nightmareUnlocked;
    if (difficulty?.value === 'nightmare' && !nightmareUnlocked) difficulty.value = 'standard';

    const campaign = document.getElementById('campaign-select');
    const tenThrones = campaign?.querySelector?.('option[value="ten_thrones"]');
    const tenThronesUnlocked = this.completedCampaignIds.has('four_gates')
      || this.campaignCompletions > 0;
    if (tenThrones) tenThrones.disabled = !tenThronesUnlocked;
    if (campaign?.value === 'ten_thrones' && !tenThronesUnlocked) campaign.value = 'four_gates';

    const heroSelect = document.getElementById('briefing-hero-select');
    if (heroSelect) {
      heroSelect.replaceChildren();
      Object.values(HERO_CLASSES)
        .filter(hero => hero.unlocked !== false)
        .forEach(hero => {
          const option = document.createElement('option');
          option.value = hero.id;
          option.textContent = hero.name + ' · ' + hero.title;
          option.selected = hero.id === this.selectedHero.id;
          heroSelect.appendChild(option);
        });
    }

    const tutorialToggle = document.getElementById('guided-tutorial-toggle');
    if (tutorialToggle) tutorialToggle.checked = !this.tutorialCompleted;
    const summary = document.getElementById('progression-lock-summary');
    if (summary) {
      summary.textContent = [
        this.unlockedTowerIds.size + '/20 défenses disponibles',
        nightmareUnlocked ? 'Cauchemar débloqué' : 'Cauchemar après une victoire Standard',
        tenThronesUnlocked ? 'Dix Trônes débloqués' : 'Dix Trônes après les Quatre Portes'
      ].join(' · ');
    }
  };

  proto.bindProfessionalControls = function bindProfessionalControls() {
    if (this.__professionalControlsBound) return;
    this.__professionalControlsBound = true;
    const releaseSession = () => {
      this.professionalChannel?.postMessage?.({
        type: 'run-released',
        sessionId: this.professionalSessionId
      });
    };
    window.addEventListener('pagehide', releaseSession);
    window.addEventListener('beforeunload', releaseSession);


    document.getElementById('btn-launch-wave')?.addEventListener('click', () => this.launchPreparedWave());
    document.getElementById('btn-game-speed')?.addEventListener('click', () => this.cycleGameSpeed());
    document.getElementById('btn-combat-pause')?.addEventListener('click', () => this.toggleProfessionalPause());
    document.getElementById('btn-skip-tutorial')?.addEventListener('click', () => this.finishTutorial(true));
    document.getElementById('btn-emergency-export')?.addEventListener('click', () => this.exportPortableSave());
    document.getElementById('btn-restart')?.addEventListener('click', event => {
      if (!this.professionalRetryCheckpointAvailable || !this.savedRunCheckpoint) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const checkpoint = this.savedRunCheckpoint;
      this.professionalRetryCheckpointAvailable = false;
      this.closeAllGameplayModals();
      if (this.restoreRunCheckpoint(checkpoint)) {
        this.showFeedback('Dernier secteur restauré · reprenez votre préparation.', '#10b981');
        this.announce('Point de contrôle restauré au début du secteur.');
      } else {
        this.startNewGame({ difficulty: this.difficulty });
      }
      this.focusBattlefield();
    }, true);

    document.addEventListener('click', event => {
      if (event.target?.closest?.('.build-tower-card')) this.progressTutorial('select');
    });

    document.getElementById('defense-targeting-policy')?.addEventListener('change', event => {
      if (!this.selectedPlacedDefense || !TARGET_POLICIES.has(event.target.value)) return;
      this.selectedPlacedDefense.targetPolicy = event.target.value;
      this.showFeedback('Ciblage · ' + event.target.selectedOptions?.[0]?.textContent, '#a78bfa');
      this.announce('Priorité de ciblage mise à jour.');
      this.saveProgress();
    });

    window.addEventListener('keydown', event => {
      if (event.key.toLowerCase() === 'p' && !this.getTopOpenModal()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.toggleProfessionalPause();
        return;
      }
      if (this.getTopOpenModal() || document.activeElement !== this.canvas) return;
      const key = event.key.toLowerCase();
      const maps = {
        zqsd: { q: [70, 0], d: [-70, 0], z: [0, 70], s: [0, -70] },
        wasd: { a: [70, 0], d: [-70, 0], w: [0, 70], s: [0, -70] },
        arrows: {}
      };
      const movement = maps[this.keyboardPreset]?.[key];
      if (!movement) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const multiplier = event.shiftKey ? 2 : 1;
      this.panBattlefieldCameraBy(movement[0] * multiplier, movement[1] * multiplier);
    }, true);

    window.addEventListener('storage', event => {
      if (event.key !== CAMPAIGN_STORAGE_KEY || !event.newValue || !this.professionalRunStarted) return;
      try {
        const incoming = JSON.parse(event.newValue)?.professionalProgression;
        if (!incoming || incoming.sessionId === this.professionalSessionId) return;
        if (Number(incoming.saveRevision) <= this.professionalSaveRevision) return;
        this.professionalTabConflict = true;
        this.isPaused = true;
        this.showFeedback('Une autre fenêtre a modifié cette sauvegarde. Partie mise en pause.', '#ef4444');
        this.announce('Conflit de sauvegarde multi-fenêtre. Fermez l’autre partie avant de continuer.');
        this.syncTacticalControls();
      } catch (_) {}
    });
  };

  proto.setupProfessionalSessionGuard = function setupProfessionalSessionGuard() {
    if (this.professionalChannel || typeof BroadcastChannel !== 'function') return;
    this.professionalChannel = new BroadcastChannel('infernal-city-gameplay-v3');
    this.professionalChannel.addEventListener('message', event => {
      const message = event.data;
      if (!message || message.sessionId === this.professionalSessionId) return;
      if (message.type === 'run-started' && this.professionalRunStarted) {
        this.professionalTabConflict = true;
        this.isPaused = true;
        this.showFeedback('Une autre fenêtre joue cette sauvegarde. Session locale verrouillée.', '#ef4444');
        this.syncTacticalControls();
      }
      if (message.type === 'run-released' && this.professionalTabConflict) {
        this.professionalTabConflict = false;
        this.isPaused = true;
        this.showFeedback('L’autre session est fermée. Vous pouvez reprendre cette partie.', '#10b981');
        this.announce('Verrou multi-fenêtre levé. Utilisez Reprendre pour continuer.');
        this.syncTacticalControls();
      }
    });
  };

  proto.init = function initProfessional() {
    ensureProfessionalState(this);
    this.createBriefingHeroField();
    if (!this.__professionalVisibilityGuardBound) {
      this.__professionalVisibilityGuardBound = true;
      document.addEventListener('visibilitychange', event => {
        if (this.pauseOnBlur) return;
        event.stopImmediatePropagation();
        if (document.hidden) {
          this.saveProgress();
          audio.suspendForVisibility?.();
        } else {
          audio.resumeFromVisibility?.();
          this.lastTime = performance.now?.() || 0;
          this.simulationAccumulator = 0;
        }
      }, true);
    }
    const result = BASE.init.call(this);
    this.bindProfessionalControls();
    this.setupProfessionalSessionGuard();
    this.syncProgressionBriefing();
    this.syncTacticalControls();
    this.syncTutorialCoach();
    this.syncProfessionalSaveBanner();
    return result;
  };

  proto.openMissionBriefing = function openMissionBriefingProfessional() {
    ensureProfessionalState(this);
    this.professionalRunStarted = false;
    this.gameplayPhase = 'briefing';
    const result = BASE.openMissionBriefing.call(this);
    const createChallenge = global.INFERNAL_CITY_CAMPAIGN_CONTENT?.createDailyChallenge
      || EXPANSION?.utils?.createDailyChallenge;
    if (typeof createChallenge === 'function') {
      const preview = createChallenge(new Date());
      const dateText = document.getElementById('daily-challenge-date');
      const layoutText = document.getElementById('daily-challenge-layout');
      const mutatorText = document.getElementById('daily-challenge-mutators');
      if (dateText) dateText.textContent = preview.date;
      if (layoutText) layoutText.textContent = this.getWorldLayout(preview.layoutId).name || preview.layoutId;
      if (mutatorText) {
        const mutators = global.INFERNAL_CITY_CAMPAIGN_CONTENT?.infinitumMutators
          || EXPANSION?.infinitumMutators
          || [];
        mutatorText.textContent = (preview.mutatorIds || [])
          .map(id => mutators.find(mutator => mutator.id === id)?.name || id)
          .join(' · ') || 'Aucun mutateur';
      }
    }
    this.createBriefingHeroField();
    this.syncProgressionBriefing();
    this.syncTacticalControls();
    return result;
  };

  proto.beginNewCampaign = function beginNewCampaignProfessional() {
    ensureProfessionalState(this);
    const heroId = document.getElementById('briefing-hero-select')?.value;
    if (heroId && HERO_CLASSES[heroId] && HERO_CLASSES[heroId].unlocked !== false) {
      this.selectedHero = HERO_CLASSES[heroId];
    }
    const difficulty = document.getElementById('difficulty-select');
    if (
      difficulty?.value === 'nightmare'
      && !this.campaignCompletionsByDifficulty.standard
      && this.campaignCompletions <= 0
    ) {
      difficulty.value = 'standard';
      this.showFeedback('Cauchemar se débloque après une victoire Standard.', '#f59e0b');
    }
    const campaign = document.getElementById('campaign-select');
    if (campaign?.value === 'ten_thrones' && !this.completedCampaignIds.has('four_gates') && this.campaignCompletions <= 0) {
      campaign.value = 'four_gates';
      this.showFeedback('Les Dix Trônes se débloquent après les Quatre Portes.', '#f59e0b');
    }
    return BASE.beginNewCampaign.call(this);
  };

  proto.returnToMissionBriefing = function returnToMissionBriefingProfessional() {
    this.professionalRunStarted = false;
    this.professionalRunHeroId = null;
    this.gameplayPhase = 'briefing';
    return BASE.returnToMissionBriefing.call(this);
  };

  proto.getProfessionalWaveDefinition = function getProfessionalWaveDefinition(waveNumber) {
    const scriptId = this.dailyChallenge?.waveScriptId
      || (this.activeCampaignId === 'ten_thrones' ? 'ten_thrones_20' : 'siege_15');
    return EXPANSION?.waveScripts?.[scriptId]?.waves?.find(wave => Number(wave.number) === Number(waveNumber)) || null;
  };

  proto.describeProfessionalWave = function describeProfessionalWave(waveNumber) {
    const definition = this.activeCampaignId === 'ten_thrones'
      ? global.INFERNAL_CITY_CAMPAIGN_CONTENT?.tenThronesWaves?.find(wave => wave.number === Number(waveNumber))
      : this.getProfessionalWaveDefinition(waveNumber);
    if (!definition) return 'Vague ' + waveNumber + ' · composition adaptative';
    const hidden = this.getActiveRunMutators().some(mutator => mutator.modifiers?.hiddenWavePreview === true);
    if (hidden) return 'Vague ' + waveNumber + ' · reconnaissance brouillée';
    const groups = (definition.groups || []).map(group => {
      const count = this.getAdjustedWaveGroupCount(group);
      const name = EXPANSION.enemyDefinitions?.[group.type]?.name || group.type;
      return count + ' ' + name;
    });
    return 'Vague ' + waveNumber + ' · ' + definition.name + ' · ' + groups.join(' · ');
  };

  proto.startDailyChallenge = function startDailyChallengeProfessional(value = new Date(), playerSalt = '') {
    const suspendedCampaignState = this.campaignStateBeforeDaily || this.captureGameplayState();
    const createChallenge = global.INFERNAL_CITY_CAMPAIGN_CONTENT?.createDailyChallenge
      || EXPANSION?.utils?.createDailyChallenge;
    const challenge = createChallenge(value, playerSalt);
    this.dailyChallenge = challenge;
    this.lastDailyChallenge = challenge;
    this.dailyRetryAvailable = false;
    const createRng = EXPANSION?.utils?.createSeededRng;
    this.dailyRng = typeof createRng === 'function'
      ? createRng(challenge.seed)
      : this.createFallbackSeededRng(challenge.seed);
    this.selectedLayoutId = EXPANSION?.worldLayouts?.[challenge.layoutId]
      ? challenge.layoutId
      : 'convergence';
    this.setMapRotation([]);
    const dailyHero = HERO_CLASSES[challenge.heroId];
    if (dailyHero) this.selectedHero = dailyHero;
    const professionalMutators = global.INFERNAL_CITY_CAMPAIGN_CONTENT?.infinitumMutators
      || EXPANSION.infinitumMutators
      || [];
    this.activeRunMutators = (challenge.mutatorIds || [])
      .map(id => professionalMutators.find(mutator => mutator.id === id))
      .filter(Boolean);
    this.startNewGame({
      layoutId: this.selectedLayoutId,
      campaignId: 'four_gates',
      difficulty: 'standard',
      dailyChallenge: challenge,
      preserveCheckpoint: true
    });
    this.campaignStateBeforeDaily = suspendedCampaignState;
    this.coins = Math.max(0, Number(challenge.rules?.startingCoins) || 0);
    const firstDailyDefenseId = this.getDailyDefenseDeckIds(challenge)[0];
    if (firstDailyDefenseId) this.selectedTowerToBuild = TOWER_TYPES[firstDailyDefenseId];
    this.renderBuildBar();
    this.updateHUD();
    return challenge;
  };

  proto.prepareOpeningWave = function prepareOpeningWave() {
    this.enemies.length = 0;
    this.enemyBullets.length = 0;
    this.projectiles.length = 0;
    this.configureWave(1);
    this.waveActive = false;
    this.waveIntermissionTimer = 0;
    this.gameplayPhase = 'preparation';
    this.waveStartCitadelHp = this.citadel.hp;
    this.waveRouteKills = new Set();
    this.secondaryObjectiveResult = null;
    this.updateProfessionalWavePreview(1, true);
    this.syncTacticalControls();
  };

  proto.startNewGame = function startNewGameProfessional(options = {}) {
    ensureProfessionalState(this);
    const guidedTutorialRequested = document.getElementById('guided-tutorial-toggle')?.checked === true;
    const result = BASE.startNewGame.call(this, options);
    if (!options.preserveCheckpoint || !this.campaignSeed) {
      this.campaignSeed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    }
    this.campaignRng = this.createFallbackSeededRng(this.campaignSeed);
    this.campaignRngCalls = 0;
    this.professionalRunStarted = true;
    this.professionalRunHeroId = this.selectedHero.id;
    this.professionalTabConflict = false;
    this.professionalRetryCheckpointAvailable = false;
    this.gameSpeed = 1;
    this.simulationAccumulator = 0;
    this.coins = STARTING_COINS[this.difficulty] || STARTING_COINS.standard;

    if (!this.dailyChallenge && !this.isTowerMode) {
      this.placedTowers = [];
    }

    this.prepareOpeningWave();
    this.tutorialActive = guidedTutorialRequested
      && !this.dailyChallenge;
    if (this.tutorialActive) {
      this.tutorialCompleted = false;
      this.tutorialIndex = 0;
    }
    this.renderBuildBar();
    this.updateHUD();
    this.syncTutorialCoach();
    this.professionalChannel?.postMessage?.({
      type: 'run-started',
      sessionId: this.professionalSessionId
    });
    this.saveProgress();
    return result;
  };

  proto.continueSavedCampaign = function continueSavedCampaignProfessional() {
    const result = BASE.continueSavedCampaign.call(this);
    if (this.savedRunCheckpoint && !this.isGameOver) {
      this.professionalRunStarted = true;
      this.professionalRunHeroId = this.selectedHero.id;
      this.gameplayPhase = 'preparation';
      this.waveActive = false;
      this.waveIntermissionTimer = 0;
      this.updateProfessionalWavePreview(this.wave, true);
      this.syncTacticalControls();
    }
    return result;
  };

  proto.configureWave = function configureWaveProfessional(number, options = {}) {
    const contentWave = this.activeCampaignId === 'ten_thrones'
      && !options.towerMode
      && !this.dailyChallenge
      && !this.endlessMode
      ? global.INFERNAL_CITY_CAMPAIGN_CONTENT?.tenThronesWaves?.find(wave => wave.number === Number(number))
      : null;
    if (contentWave?.layoutPolicy && EXPANSION?.worldLayouts?.[contentWave.layoutPolicy]) {
      this.applyWorldLayout(contentWave.layoutPolicy, {
        rotation: true,
        force: true,
        repositionUnits: true
      });
    }
    const result = BASE.configureWave.call(this, number, options);
    if (contentWave) {
      this.activeWaveDefinition = contentWave;
      const routeCount = Math.max(1, this.spawnRoutes.length);
      const queue = [];
      contentWave.groups.forEach((group, groupIndex) => {
        const pattern = Array.isArray(group.routePattern) && group.routePattern.length
          ? group.routePattern
          : [groupIndex];
        const count = this.getAdjustedWaveGroupCount(group);
        for (let index = 0; index < count; index++) {
          const routeIndex = Math.abs(Number(pattern[index % pattern.length]) || 0) % routeCount;
          queue.push({
            type: group.type,
            routeIndex,
            atMs: Math.max(0, Number(group.delayMs) || 0)
              + (index * Math.max(1, Number(group.intervalMs) || 1))
              + (this.spawnRoutes[routeIndex]?.cadenceOffsetMs || 0)
          });
        }
      });
      const campaign = this.getCampaignDefinition();
      const scheduleEntry = campaign?.bossSchedule?.find?.(entry => Number(entry.wave) === Number(number));
      if (scheduleEntry?.bossId) {
        const lastAtMs = queue.reduce((maximum, entry) => Math.max(maximum, entry.atMs), 0);
        queue.push({
          type: scheduleEntry.bossId,
          routeIndex: scheduleEntry.routePolicy === 'farthest' ? routeCount - 1 : 0,
          atMs: lastAtMs + 1400,
          boss: true
        });
      }
      this.waveSpawnQueue = queue.sort((left, right) => left.atMs - right.atMs);
      this.waveSpawnTarget = this.waveSpawnQueue.length;
      this.preloadWaveCharacterBosses(this.waveSpawnQueue);
    }
    if (options.towerMode === true || this.activeBossHuntId) this.gameplayPhase = 'combat';
    this.syncSecondaryObjective();
    this.syncTacticalControls();
    return result;
  };

  proto.updateProfessionalWavePreview = function updateProfessionalWavePreview(number, opening = false) {
    const text = document.getElementById('mission-next-wave-txt');
    if (text) text.textContent = (opening ? 'À engager · ' : 'Prochaine composition · ') + this.describeProfessionalWave(number);
  };

  proto.launchPreparedWave = function launchPreparedWave() {
    if (this.isPaused || this.campaignVictory || this.isGameOver) return false;
    if (this.gameplayPhase === 'preparation') {
      this.waveActive = true;
      this.gameplayPhase = 'combat';
      this.waveStartCitadelHp = this.citadel.hp;
      this.waveRouteKills = new Set();
      this.secondaryObjectiveResult = null;
      this.progressTutorial('launch');
      this.showFeedback('Vague ' + this.wave + ' engagée', '#00f0ff');
      this.syncSecondaryObjective();
      this.syncTacticalControls();
      this.announce('Vague ' + this.wave + ' lancée.');
      return true;
    }
    if (this.gameplayPhase === 'intermission' && !this.waveActive) {
      const bonus = Math.max(0, Math.ceil(this.waveIntermissionTimer) * 2);
      if (bonus > 0) {
        this.coins += bonus;
        this.score += bonus * 4;
      }
      this.advanceWave();
      this.showFeedback('Lancement anticipé · +' + bonus + ' Bio-Coins', '#f59e0b');
      return true;
    }
    return false;
  };

  proto.cycleGameSpeed = function cycleGameSpeed() {
    const speeds = [1, 2, 3];
    this.gameSpeed = speeds[(speeds.indexOf(this.gameSpeed) + 1) % speeds.length];
    this.syncTacticalControls();
    this.announce('Vitesse du jeu multipliée par ' + this.gameSpeed + '.');
    return this.gameSpeed;
  };

  proto.toggleProfessionalPause = function toggleProfessionalPause() {
    if (this.professionalTabConflict) {
      this.announce('Cette session reste verrouillée tant que l’autre partie est ouverte.');
      return false;
    }
    if (this.getTopOpenModal() || this.isGameOver || this.campaignVictory) return false;
    this.isPaused = !this.isPaused;
    this.simulationAccumulator = 0;
    this.syncTacticalControls();
    this.announce(this.isPaused ? 'Combat en pause.' : 'Combat repris.');
    return this.isPaused;
  };

  proto.syncTacticalControls = function syncTacticalControls() {
    const phase = document.getElementById('tactical-phase-txt');
    const launch = document.getElementById('btn-launch-wave');
    const speed = document.getElementById('btn-game-speed');
    const pause = document.getElementById('btn-combat-pause');
    const labels = {
      briefing: 'BRIEFING',
      preparation: 'DÉPLOIEMENT · VAGUE ' + this.wave,
      combat: 'COMBAT · VAGUE ' + this.wave,
      intermission: 'INTERMISSION · ' + Math.max(0, Math.ceil(this.waveIntermissionTimer)) + ' S'
    };
    if (phase) phase.textContent = labels[this.gameplayPhase] || String(this.gameplayPhase || 'COMBAT').toUpperCase();
    if (launch) {
      launch.hidden = !['preparation', 'intermission'].includes(this.gameplayPhase);
      launch.disabled = this.isPaused || this.professionalTabConflict;
      launch.textContent = this.gameplayPhase === 'intermission'
        ? 'LANCER + BONUS'
        : 'LANCER LA VAGUE';
    }
    if (speed) {
      speed.textContent = '×' + this.gameSpeed;
      speed.setAttribute('aria-label', 'Vitesse du jeu : multipliée par ' + this.gameSpeed);
      speed.setAttribute('aria-pressed', String(this.gameSpeed > 1));
    }
    if (pause) {
      pause.textContent = this.isPaused ? 'REPRENDRE' : 'PAUSE';
      pause.setAttribute('aria-pressed', String(this.isPaused));
      pause.setAttribute('aria-label', this.isPaused ? 'Reprendre le combat' : 'Mettre le combat en pause');
    }
  };

  proto.gameLoop = function gameLoopProfessional(timestamp) {
    try {
      if (this.runtimeError) return;
      if (!this.lastTime) this.lastTime = timestamp;
      const frameDelta = Math.min(Math.max(0, (timestamp - this.lastTime) / 1000), 0.3);
      this.lastTime = timestamp;
      this.refreshGamepadStatus(false);
      this.updateGamepadControls(frameDelta);

      const canSimulate = !this.isPaused
        && !this.requiresPortraitOrientation
        && !this.isGameOver
        && !this.campaignVictory;

      if (canSimulate) {
        this.simulationAccumulator += frameDelta * this.gameSpeed;
        let steps = 0;
        while (this.simulationAccumulator >= FIXED_STEP_SECONDS && steps < MAX_SIMULATION_STEPS) {
          const overdriveScale = this.isOverdriveActive ? 0.7 : 1;
          this.update(FIXED_STEP_SECONDS * overdriveScale);
          this.simulationAccumulator -= FIXED_STEP_SECONDS;
          steps++;
        }
        if (steps >= MAX_SIMULATION_STEPS) {
          this.simulationAccumulator = Math.min(this.simulationAccumulator, FIXED_STEP_SECONDS);
        }
      } else {
        this.simulationAccumulator = 0;
      }

      const shouldRender = !document.hidden
        && (!this.isPaused || (timestamp - this.lastPausedRenderTime) >= 250);
      if (shouldRender) {
        this.render();
        if (this.isPaused) this.lastPausedRenderTime = timestamp;
      }
    } catch (error) {
      this.handleRuntimeError(error);
    } finally {
      requestAnimationFrame(time => this.gameLoop(time));
    }
  };

  proto.completeWave = function completeWaveProfessional() {
    if (this.waveRewardClaimed || !this.waveActive) return;
    const completedWave = this.wave;
    const completedTowerFloor = this.isTowerMode ? this.towerFloor : null;
    const objective = this.getSecondaryObjective();
    const objectiveSuccess = Boolean(objective?.evaluate?.(this));
    this.secondaryObjectiveResult = objective ? objectiveSuccess : null;
    if (objectiveSuccess) {
      const bonus = 16 + (completedWave * 2);
      this.coins += bonus;
      this.score += bonus * 5;
    }

    const coinsBeforeBase = this.coins;
    const metaBeforeBase = this.metaCoins;
    const runMetaBeforeBase = this.runMetaCoinsEarned;
    const wasBossHunt = Boolean(this.activeBossHuntId);
    const wasDailyRun = Boolean(this.dailyChallenge);
    const wasPermanentCampaignWave = !this.isTowerMode
      && !this.activeBossHuntId
      && !this.dailyChallenge;

    const result = BASE.completeWave.call(this);

    if (wasBossHunt || wasDailyRun) {
      this.syncSecondaryObjective();
      this.syncTacticalControls();
      this.updateHUD();
      this.saveProgress();
      return result;
    }

    const earnedWaveCoins = Math.max(0, this.coins - coinsBeforeBase);
    if (earnedWaveCoins > 0) {
      const balancedWaveReward = Math.round(earnedWaveCoins * 0.68);
      this.coins = coinsBeforeBase + balancedWaveReward;
    }

    if (wasPermanentCampaignWave) {
      const rewardMultiplier = DIFFICULTY_DATA[this.difficulty]?.reward || 1;
      const legacyWaveMeta = Math.round((8 + (completedWave * 2)) * rewardMultiplier);
      const currentMetaDelta = Math.max(0, this.metaCoins - metaBeforeBase);
      const completionMeta = Math.max(0, currentMetaDelta - legacyWaveMeta);
      const milestoneMeta = completedWave % 5 === 0
        ? Math.round((18 + completedWave) * rewardMultiplier)
        : 0;
      this.metaCoins = metaBeforeBase + completionMeta + milestoneMeta;
      const currentRunMetaDelta = Math.max(0, this.runMetaCoinsEarned - runMetaBeforeBase);
      const completionRunMeta = Math.max(0, currentRunMetaDelta - legacyWaveMeta);
      this.runMetaCoinsEarned = runMetaBeforeBase + completionRunMeta + milestoneMeta;
    }

    if (completedTowerFloor && completedTowerFloor % 10 === 0 && !this.claimedInfinitumMilestones.has(completedTowerFloor)) {
      const milestoneMultiplier = this.getRunModifierProduct('milestoneMetaMultiplier');
      const milestoneReward = Math.round((25 + Math.floor(completedTowerFloor / 2)) * milestoneMultiplier);
      this.claimedInfinitumMilestones.add(completedTowerFloor);
      this.metaCoins += milestoneReward;
      this.runMetaCoinsEarned += milestoneReward;
      if (this.campaignStateBeforeTower) {
        this.campaignStateBeforeTower.metaCoins = (Number(this.campaignStateBeforeTower.metaCoins) || 0) + milestoneReward;
        this.campaignStateBeforeTower.runMetaCoinsEarned = (Number(this.campaignStateBeforeTower.runMetaCoinsEarned) || 0) + milestoneReward;
      }
      this.lastProfessionalInfinitumMilestoneFloor = completedTowerFloor;
      this.showFeedback('Palier Infinitum ' + completedTowerFloor + ' · +' + milestoneReward + ' Crédits Haven', '#a855f7');
    }

    if (!this.campaignVictory && !this.isGameOver && !this.isTowerMode && !this.activeBossHuntId) {
      this.gameplayPhase = 'intermission';
      const rotated = BASE.rotateWorldLayoutBetweenWaves.call(this);
      if (rotated) {
        this.professionalLayoutPreparedForWave = completedWave + 1;
      }
      this.updateProfessionalWavePreview(completedWave + 1, false);
      const balancedCheckpoint = this.createRunCheckpoint();
      if (balancedCheckpoint) {
        this.activeRunCheckpoint = balancedCheckpoint;
        this.savedRunCheckpoint = balancedCheckpoint;
      }
    }

    this.unlockTowersForWave(completedWave);
    this.progressTutorial('wave_complete');
    this.syncSecondaryObjective();
    this.syncTacticalControls();
    this.updateHUD();
    this.saveProgress();
    return result;
  };

  proto.rotateWorldLayoutBetweenWaves = function rotateWorldLayoutBetweenWavesProfessional() {
    if (this.professionalLayoutPreparedForWave === this.wave + 1) {
      this.professionalLayoutPreparedForWave = null;
      return false;
    }
    return BASE.rotateWorldLayoutBetweenWaves.call(this);
  };

  proto.advanceWave = function advanceWaveProfessional() {
    const wasTowerMode = this.isTowerMode;
    const result = BASE.advanceWave.call(this);
    const returnedFromTower = wasTowerMode && !this.isTowerMode;
    if (!returnedFromTower && !this.campaignVictory && !this.isGameOver) {
      this.gameplayPhase = 'combat';
      this.waveStartCitadelHp = this.citadel.hp;
      this.waveRouteKills = new Set();
      this.secondaryObjectiveResult = null;
    }
    this.syncSecondaryObjective();
    this.syncTacticalControls();
    return result;
  };

  proto.updateSpawns = function updateSpawnsProfessional(dt) {
    if (!this.waveActive && this.gameplayPhase === 'preparation') {
      SPAWN_GATE_SECTORS.forEach(side => {
        this.spawnGatePulses[side] = Math.max(0, (this.spawnGatePulses[side] || 0) - dt);
      });
      return;
    }
    const result = BASE.updateSpawns.call(this, dt);
    if (!this.waveActive && this.gameplayPhase === 'intermission') this.syncTacticalControls();
    return result;
  };

  proto.getSecondaryObjective = function getSecondaryObjective() {
    return SECONDARY_OBJECTIVES[this.selectedLayoutId] || SECONDARY_OBJECTIVES.convergence;
  };

  proto.syncSecondaryObjective = function syncSecondaryObjective() {
    const output = document.getElementById('mission-secondary-objective-txt');
    if (!output) return;
    const objective = this.getSecondaryObjective();
    output.textContent = 'Objectif secondaire · ' + objective.label;
    output.dataset.state = this.secondaryObjectiveResult === true
      ? 'complete'
      : (this.secondaryObjectiveResult === false ? 'failed' : 'active');
  };

  proto.progressTutorial = function progressTutorial(eventName) {
    if (!this.tutorialActive || this.tutorialCompleted) return false;
    const expected = TUTORIAL_STEPS[this.tutorialIndex];
    if (!expected || expected.event !== eventName) return false;
    this.tutorialIndex++;
    if (this.tutorialIndex >= TUTORIAL_STEPS.length) {
      this.finishTutorial(false);
      return true;
    }
    this.syncTutorialCoach();
    this.saveProgress();
    return true;
  };

  proto.syncTutorialCoach = function syncTutorialCoach() {
    const coach = document.getElementById('tutorial-coach');
    if (!coach) return;
    const step = TUTORIAL_STEPS[this.tutorialIndex];
    coach.hidden = !this.tutorialActive || this.tutorialCompleted || !step;
    if (!step) return;
    const count = document.getElementById('tutorial-step-txt');
    const title = document.getElementById('tutorial-coach-title');
    const copy = document.getElementById('tutorial-coach-copy');
    if (count) count.textContent = 'ÉTAPE ' + (this.tutorialIndex + 1) + ' / ' + TUTORIAL_STEPS.length;
    if (title) title.textContent = step.title;
    if (copy) copy.textContent = step.copy;
  };

  proto.finishTutorial = function finishTutorial(skipped = false) {
    this.tutorialActive = false;
    this.tutorialCompleted = true;
    this.syncTutorialCoach();
    this.showFeedback(skipped ? 'Tutoriel ignoré · réactivable au briefing' : 'Tutoriel tactique terminé', '#10b981');
    this.saveProgress();
  };

  proto.getUnlockedTowerIds = function getUnlockedTowerIds() {
    if (this.dailyChallenge) return this.getDailyDefenseDeckIds();
    if (this.campaignCompletions > 0 || this.completedCampaignIds.size > 0) return Object.keys(TOWER_TYPES);
    return [...this.unlockedTowerIds];
  };

  proto.unlockTowersForWave = function unlockTowersForWave(waveNumber) {
    let changed = false;
    TOWER_UNLOCK_PLAN
      .filter(entry => Number(entry.wave) <= Number(waveNumber))
      .forEach(entry => entry.ids.forEach(id => {
        if (!this.unlockedTowerIds.has(id)) {
          this.unlockedTowerIds.add(id);
          changed = true;
          this.showFeedback(TOWER_TYPES[id].name + ' débloquée', '#00f0ff');
        }
      }));
    if (changed) this.renderBuildBar();
    return changed;
  };

  proto.renderBuildBar = function renderBuildBarProfessional() {
    ensureProfessionalState(this);
    const unlockedIds = this.getUnlockedTowerIds();
    if (!unlockedIds.includes(this.selectedTowerToBuild?.id)) {
      this.selectedTowerToBuild = TOWER_TYPES[unlockedIds[0]] || TOWER_TYPES.vulcan_turret;
    }
    const result = BASE.renderBuildBar.call(this);
    if (!this.dailyChallenge) {
      document.querySelectorAll('.build-tower-card').forEach(card => {
        if (!unlockedIds.includes(card.dataset.towerId)) card.remove?.();
      });
    }
    return result;
  };

  proto.getEnemyRouteProgress = function getEnemyRouteProgress(enemy) {
    const route = this.spawnRoutes[enemy?.routeIndex] || this.spawnRoutes[0];
    const points = route?.polyline || [];
    if (!points.length) return 0;
    const index = Math.max(1, Math.min(points.length - 1, Number(enemy.waypointIndex) || 1));
    const from = points[index - 1];
    const to = points[index];
    const length = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    const remaining = Math.min(length, Math.hypot(to.x - enemy.x, to.y - enemy.y));
    return (index - 1) + (1 - (remaining / length));
  };

  proto.rebuildEnemySpatialIndex = function rebuildEnemySpatialIndex() {
    const cellSize = this.enemySpatialCellSize || 180;
    const grid = new Map();
    this.enemies.forEach(enemy => {
      if (!enemy || enemy.dead) return;
      const key = Math.floor(enemy.x / cellSize) + ':' + Math.floor(enemy.y / cellSize);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(enemy);
    });
    this.enemySpatialIndex = grid;
  };

  proto.getSpatialEnemyCandidates = function getSpatialEnemyCandidates(x, y, range) {
    if (!(this.enemySpatialIndex instanceof Map) || this.enemySpatialIndex.size === 0) return this.enemies;
    const size = this.enemySpatialCellSize || 180;
    const minX = Math.floor((x - range) / size);
    const maxX = Math.floor((x + range) / size);
    const minY = Math.floor((y - range) / size);
    const maxY = Math.floor((y + range) / size);
    const result = [];
    for (let cellX = minX; cellX <= maxX; cellX++) {
      for (let cellY = minY; cellY <= maxY; cellY++) {
        const bucket = this.enemySpatialIndex.get(cellX + ':' + cellY);
        if (bucket) result.push(...bucket);
      }
    }
    return result;
  };

  proto.getEnemiesInRange = function getEnemiesInRangeProfessional(x, y, range, defense = null) {
    return this.getSpatialEnemyCandidates(x, y, range).filter(enemy => (
      this.canDefenseTargetEnemy(defense, enemy)
      && Math.hypot(enemy.x - x, enemy.y - y) <= range + enemy.radius
    ));
  };

  proto.findTarget = function findTargetProfessional(x, y, range, defense = null) {
    const seleneMultiplier = defense && this.selectedHero?.id === 'selene'
      ? (Number(this.getHeroKit('selene')?.passive?.modifiers?.rangeVsSlowedMultiplier) || 1.14)
      : 1;
    const policy = TARGET_POLICIES.has(defense?.targetPolicy) ? defense.targetPolicy : 'first';
    let best = null;
    let bestAutoPriority = -Infinity;
    let bestManualScore = -Infinity;
    let bestDistance = Infinity;

    this.getSpatialEnemyCandidates(x, y, range * seleneMultiplier).forEach(enemy => {
      if (!this.canDefenseTargetEnemy(defense, enemy)) return;
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      const effectiveRange = range * (enemy.slowTimer > 0 ? seleneMultiplier : 1);
      if (distance > effectiveRange + enemy.radius) return;
      const autoPriority = this.getEnemyPriorityScore(defense, enemy);
      const progress = this.getEnemyRouteProgress(enemy);
      let manualScore = progress;
      if (policy === 'last') manualScore = -progress;
      else if (policy === 'strong') manualScore = Number(enemy.maxHp) || Number(enemy.hp) || 0;
      else if (policy === 'weak') manualScore = -(Number(enemy.hp) || 0);
      else if (policy === 'flying') manualScore = this.isEnemyFlying(enemy) ? 100000 + progress : progress;
      else if (policy === 'elite') manualScore = (enemy.isBoss || SPECIALIST_ENEMY_TYPES.includes(enemy.type)) ? 100000 + progress : progress;

      if (
        autoPriority > bestAutoPriority
        || (autoPriority === bestAutoPriority && manualScore > bestManualScore)
        || (autoPriority === bestAutoPriority && manualScore === bestManualScore && distance < bestDistance)
      ) {
        best = enemy;
        bestAutoPriority = autoPriority;
        bestManualScore = manualScore;
        bestDistance = distance;
      }
    });
    return best;
  };

  proto.renderDefenseManagementModal = function renderDefenseManagementModalProfessional(defense) {
    const result = BASE.renderDefenseManagementModal.call(this, defense);
    const select = document.getElementById('defense-targeting-policy');
    if (select) {
      select.value = TARGET_POLICIES.has(defense?.targetPolicy) ? defense.targetPolicy : 'first';
      select.disabled = ['barrier', 'magnet', 'shrine'].includes(defense?.type);
    }
    return result;
  };

  proto.sanitizeRunCheckpoint = function sanitizeRunCheckpointProfessional(checkpoint) {
    const clean = BASE.sanitizeRunCheckpoint.call(this, checkpoint);
    if (!clean) return null;
    clean.campaignSeed = Math.max(1, Math.floor(Number(checkpoint?.campaignSeed) || Number(this.campaignSeed) || 1)) >>> 0;
    clean.campaignRngCalls = Math.max(0, Math.min(
      1000000,
      Math.floor(Number(checkpoint?.campaignRngCalls) || 0)
    ));
    clean.tutorialActive = checkpoint?.tutorialActive === true;
    clean.tutorialIndex = Math.max(0, Math.min(
      TUTORIAL_STEPS.length - 1,
      Math.floor(Number(checkpoint?.tutorialIndex) || 0)
    ));
    clean.abilityCooldownTimer = Math.max(0, Math.min(3600, Number(checkpoint?.abilityCooldownTimer) || 0));
    const checkpointTowers = Array.isArray(checkpoint?.placedTowers) ? checkpoint.placedTowers : [];
    const usedCheckpointTowerIndexes = new Set();
    clean.placedTowers.forEach(defense => {
      const match = checkpointTowers
        .map((candidate, index) => ({ candidate, index }))
        .filter(entry => !usedCheckpointTowerIndexes.has(entry.index) && entry.candidate?.id === defense.id)
        .sort((left, right) => (
          Math.hypot(Number(left.candidate.x) - defense.x, Number(left.candidate.y) - defense.y)
          - Math.hypot(Number(right.candidate.x) - defense.x, Number(right.candidate.y) - defense.y)
        ))[0];
      if (match) usedCheckpointTowerIndexes.add(match.index);
      const candidate = match?.candidate || {};
      const specialization = this.getDefenseSpecializationOptions(defense)
        .find(option => option.id === defense.specializationId);
      if (specialization) {
        defense.specializationName = specialization.name;
        defense.specializationTraits = (specialization.traits || []).slice();
        defense.targetPriorities = this.getSpecializationTargetPriorities(specialization);
      }
      defense.targetPolicy = TARGET_POLICIES.has(candidate.targetPolicy) ? candidate.targetPolicy : 'first';
      if (Number.isFinite(candidate.remainingCharges)) {
        defense.remainingCharges = Math.max(0, Math.min(20, Math.floor(candidate.remainingCharges)));
      }
      defense.rearmTimer = Math.max(0, Math.min(60, Number(candidate.rearmTimer) || 0));
      defense.specializationHeat = Math.max(0, Math.min(1000, Number(candidate.specializationHeat) || 0));
      defense.specializationRamp = Math.max(0, Math.min(20, Number(candidate.specializationRamp) || 0));
      defense.specializationOriginX = Number.isFinite(Number(candidate.specializationOriginX))
        ? Number(candidate.specializationOriginX) : Number(defense.x) || 0;
      defense.specializationOriginY = Number.isFinite(Number(candidate.specializationOriginY))
        ? Number(candidate.specializationOriginY) : Number(defense.y) || 0;
    });
    return clean;
  };

  proto.restoreRunCheckpoint = function restoreRunCheckpointProfessional(checkpoint) {
    const restored = BASE.restoreRunCheckpoint.call(this, checkpoint);
    if (!restored) return false;
    this.restoreProfessionalCampaignRng(
      checkpoint?.campaignSeed || this.campaignSeed,
      checkpoint?.campaignRngCalls
    );
    this.tutorialActive = checkpoint?.tutorialActive === true && !this.tutorialCompleted;
    this.tutorialIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Math.floor(Number(checkpoint?.tutorialIndex) || 0)));
    this.placedTowers.forEach(defense => {
      if (defense.specializationId !== 'laser_interceptor') return;
      defense.specializationOriginX = Number(defense.x) || 0;
      defense.specializationOriginY = Number(defense.y) || 0;
      defense.specializationPulseTimer = Math.max(0, Number(defense.specializationPulseTimer) || 0);
    });
    this.professionalRunStarted = true;
    this.professionalRunHeroId = this.selectedHero.id;
    this.gameplayPhase = 'preparation';
    this.waveActive = false;
    this.waveIntermissionTimer = 0;
    this.updateProfessionalWavePreview(this.wave, true);
    this.renderBuildBar();
    this.syncTacticalControls();
    if (this.pendingLevelChoices > 0) this.triggerLevelUpModal();
    return true;
  };

  proto.chooseDefenseSpecialization = function chooseDefenseSpecializationProfessional(defense, specializationId) {
    const result = BASE.chooseDefenseSpecialization.call(this, defense, specializationId);
    if (result?.ok) {
      defense.targetPolicy = defense.targetPolicy || 'first';
      const runtime = global.INFERNAL_CITY_SPECIALIZATION_RUNTIME;
      runtime?.initializeDefense?.(defense, result.specialization);
      this.progressTutorial('specialize');
    }
    return result;
  };

  proto.upgradeDefense = function upgradeDefenseProfessional(defense) {
    const result = BASE.upgradeDefense.call(this, defense);
    if (result?.ok) this.progressTutorial('upgrade');
    return result;
  };

  proto.sellDefense = function sellDefenseProfessional(defense) {
    return BASE.sellDefense.call(this, defense);
  };

  proto.buildSelectedTowerAt = (function wrapBuildSelectedTower(baseBuild) {
    return function buildSelectedTowerAtProfessional(x, y) {
      const before = this.placedTowers.length;
      const result = baseBuild.call(this, x, y);
      if (this.placedTowers.length > before) this.progressTutorial('build');
      return result;
    };
  })(proto.buildSelectedTowerAt);

  proto.triggerHeroAbility = function triggerHeroAbilityProfessional() {
    const result = BASE.triggerHeroAbility.call(this);
    if (result?.ok !== false) this.progressTutorial('hero');
    return result;
  };

  proto.triggerOverdrive = function triggerOverdriveProfessional() {
    const before = this.isOverdriveActive;
    const result = BASE.triggerOverdrive.call(this);
    if (!before && this.isOverdriveActive) this.progressTutorial('overdrive');
    return result;
  };

  proto.triggerLevelUpModal = function triggerLevelUpModalProfessional() {
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options-container');
    if (!modal || !container) return BASE.triggerLevelUpModal.call(this);
    const wasOpen = modal.classList.contains('active');
    container.innerHTML = '';

    const available = [];
    Object.values(this.weapons).forEach(weapon => {
      if (weapon.level >= weapon.maxLevel) return;
      available.push({
        type: 'weapon',
        weapon,
        title: weapon.level === 0 ? 'Débloquer ' + weapon.name : 'Améliorer ' + weapon.name + ' (Niveau ' + (weapon.level + 1) + ')',
        description: weapon.desc,
        icon: weapon.icon
      });
    });
    if (this.citadel.hp / Math.max(1, this.citadel.maxHp) <= 0.72) {
      available.push({
        type: 'heal',
        title: 'Réparation d’urgence',
        description: 'Restaure jusqu’à 200 HP. Cette option apparaît seulement si la Citadelle est réellement endommagée.',
        icon: '🛠️'
      });
    }
    if (available.length === 0) {
      available.push({
        type: 'supply',
        title: 'Ravitaillement tactique',
        description: 'Convertit ce niveau en 75 Bio-Coins afin de renforcer ou repositionner la défense.',
        icon: '🪙'
      });
    }

    const options = available
      .map(option => ({ option, order: this.getRunRandom() }))
      .sort((left, right) => left.order - right.order)
      .slice(0, 3)
      .map(entry => entry.option);

    options.forEach(option => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade-card';
      card.innerHTML = '<div class="upgrade-info"><div class="upgrade-icon">' + option.icon
        + '</div><div class="upgrade-text"><h3>' + option.title + '</h3><p>' + option.description + '</p></div></div>';
      card.addEventListener('click', () => {
        if (option.type === 'weapon') {
          option.weapon.level++;
          this.updateWeaponsHUD();
        } else if (option.type === 'heal') {
          this.healCitadel(200);
        } else {
          this.coins += 75;
          this.showFeedback('Ravitaillement · +75 Bio-Coins', '#facc15');
        }
        if (this.pendingLevelChoices > 0) this.pendingLevelChoices--;
        if (this.pendingLevelChoices > 0) this.triggerLevelUpModal();
        else {
          this.closeModal(modal, false);
          this.focusBattlefield();
        }
        this.updateHUD();
      });
      container.appendChild(card);
    });
    this.openModal(modal);
    if (wasOpen) requestAnimationFrame(() => container.querySelector('button')?.focus());
  };

  proto.triggerEvolutionModal = function triggerEvolutionModalProfessional() {
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options-container');
    if (!modal || !container) return BASE.triggerEvolutionModal.call(this);
    const evolvable = Object.values(this.weapons)
      .filter(weapon => weapon.level >= weapon.maxLevel && !weapon.isEvolved);
    if (evolvable.length === 0) return this.triggerLevelUpModal();

    container.replaceChildren();
    evolvable.forEach(weapon => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade-card evolution';
      const info = document.createElement('div');
      info.className = 'upgrade-info';
      const copy = document.createElement('div');
      copy.className = 'upgrade-text';
      const title = document.createElement('h3');
      title.textContent = 'ÉVOLUTION · ' + weapon.evolutionName;
      const description = document.createElement('p');
      description.textContent = weapon.evolutionDesc;
      copy.append(title, description);
      info.appendChild(copy);
      card.appendChild(info);
      card.addEventListener('click', () => {
        if (weapon.isEvolved) return;
        weapon.isEvolved = true;
        weapon.name = weapon.evolutionName;
        weapon.damage *= 2.5;
        this.evolvedWeaponsCount++;
        this.unlockAchievement('super_weapon');
        this.updateWeaponsHUD();
        this.checkGalleryUnlocks();
        this.closeModal(modal, false);
        this.showFeedback(weapon.name + ' déployée', '#f59e0b');
        this.announce('Super-arme choisie : ' + weapon.name + '.');
        this.focusBattlefield();
      });
      container.appendChild(card);
    });
    this.openModal(modal);

    requestAnimationFrame(() => container.querySelector('button')?.focus());
  };
  proto.openRosterModal = function openRosterModalProfessional() {
    if (this.professionalRunStarted) {
      this.showFeedback('La commandante est verrouillée jusqu’à la fin de cette sortie.', '#f59e0b');
      this.announce('Changement de commandante indisponible pendant une sortie active.');
      return;
    }
    return BASE.openRosterModal.call(this);
  };

  proto.openShopModal = function openShopModalProfessional() {
    if (this.professionalRunStarted || this.isSideModeForPermanentProgression()) {
      this.showFeedback('Les améliorations permanentes s’appliquent uniquement entre deux sorties.', '#f59e0b');
      this.announce('Armurerie méta verrouillée pendant une sortie active.');
      return;
    }
    const modal = document.getElementById('shop-modal');
    if (!modal) return;
    this.shopUpgrades.hpBonus = Math.min(META_HP_MAX_RANK, this.shopUpgrades.hpBonus || 0);
    this.shopUpgrades.fireRateBonus = Math.min(META_FIRE_RATE_MAX_RANK, this.shopUpgrades.fireRateBonus || 0);
    this.shopUpgrades.magnetRange = Math.min(META_MAGNET_MAX_RANK, this.shopUpgrades.magnetRange || 0);
    document.getElementById('shop-coins-txt').textContent = this.metaCoins + ' ◆';

    const definitions = [
      { id: 'hpBonus', button: 'buy-hp-btn', base: 90, step: 70, max: META_HP_MAX_RANK },
      { id: 'fireRateBonus', button: 'buy-rate-btn', base: 110, step: 85, max: META_FIRE_RATE_MAX_RANK },
      { id: 'magnetRange', button: 'buy-magnet-btn', base: 80, step: 65, max: META_MAGNET_MAX_RANK }
    ];
    definitions.forEach(definition => {
      const rank = this.shopUpgrades[definition.id];
      const cost = definition.base + (rank * definition.step);
      const button = document.getElementById(definition.button);
      if (!button) return;
      button.textContent = rank >= definition.max ? 'MAX' : cost + ' ◆';
      button.disabled = rank >= definition.max || this.metaCoins < cost;
      button.onclick = () => {
        if (this.professionalRunStarted || button.disabled) return;
        this.metaCoins -= cost;
        this.shopUpgrades[definition.id]++;
        this.saveProgress();
        this.updateHUD();
        this.openShopModal();
      };
    });
    this.openModal(modal);
  };

  proto.getRunRandom = function getRunRandomProfessional() {
    if (this.dailyRng) return this.dailyRng();
    if (!this.campaignRng) {
      this.campaignSeed = this.campaignSeed || (Math.floor(Math.random() * 0xffffffff) >>> 0);
      this.campaignRng = this.createFallbackSeededRng(this.campaignSeed);
      const priorCalls = Math.max(0, Math.min(1000000, Math.floor(Number(this.campaignRngCalls) || 0)));
      for (let index = 0; index < priorCalls; index++) this.campaignRng();
    }
    const value = this.campaignRng();
    this.campaignRngCalls = Math.max(0, Math.floor(Number(this.campaignRngCalls) || 0)) + 1;
    return value;
  };

  proto.openSlotMachineModal = function openSlotMachineModalProfessional() {
    BASE.openSlotMachineModal.call(this);
    const spinButton = document.getElementById('btn-spin-slot');
    if (!spinButton || !spinButton.onclick) return;
    const originalHandler = spinButton.onclick;
    spinButton.onclick = () => {
      const random = Math.random;
      Math.random = () => this.getRunRandom();
      try {
        originalHandler();
      } finally {
        Math.random = random;
        this.saveProgress();
      }
    };
  };

  proto.openTowerInfinitumModal = function openTowerInfinitumModalProfessional() {
    if (this.activeBossHuntId || ['hunt', 'hunt_complete'].includes(this.runMode) || this.endlessMode || this.campaignVictory) {
      this.showFeedback('La Tour est indisponible pendant cette sortie.', '#f59e0b');
      this.announce('Terminez ou quittez cette sortie avant d’entrer dans la Tour Infinitum.');
      return;
    }
    const result = BASE.openTowerInfinitumModal.call(this);
    if (this.dailyChallenge || this.isTowerMode) return result;
    const modal = document.getElementById('tower-infinitum-modal');
    const description = document.getElementById('tower-mutator-txt');
    if (!modal || !description) return result;

    if (
      this.pendingTowerMutatorCandidatesFloor !== this.towerFloor
      || !Array.isArray(this.pendingTowerMutatorCandidates)
      || this.pendingTowerMutatorCandidates.length < 3
    ) {
      const mutators = global.INFERNAL_CITY_CAMPAIGN_CONTENT?.infinitumMutators || EXPANSION.infinitumMutators || [];
      const activeIds = new Set(this.towerMutators.map(mutator => mutator.id));
      const available = mutators.filter(mutator => !activeIds.has(mutator.id));
      const source = available.length >= 3 ? available : mutators;
      const ranked = source
        .map(mutator => ({ mutator, order: this.getRunRandom() }))
        .sort((left, right) => left.order - right.order)
        .map(entry => entry.mutator);
      const selected = this.pendingTowerMutator;
      this.pendingTowerMutatorCandidates = [
        ...(selected ? [selected] : []),
        ...ranked.filter(mutator => mutator.id !== selected?.id)
      ].slice(0, 3);
      this.pendingTowerMutatorCandidatesFloor = this.towerFloor;
    }

    let grid = document.getElementById('infinitum-mutator-choice-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'infinitum-mutator-choice-grid';
      grid.className = 'infinitum-mutator-choice-grid';
      grid.setAttribute('role', 'radiogroup');
      grid.setAttribute('aria-label', 'Choix du mutateur de cet étage');
      description.insertAdjacentElement('afterend', grid);
    }
    grid.replaceChildren();
    this.pendingTowerMutatorCandidates.forEach((mutator, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'infinitum-mutator-choice';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(mutator.id === this.pendingTowerMutator?.id));
      const name = document.createElement('strong');
      name.textContent = mutator.name;
      const copy = document.createElement('span');
      copy.textContent = mutator.description || mutator.desc || 'Modification tactique cumulative.';
      button.append(name, copy);
      button.addEventListener('click', () => {
        this.pendingTowerMutator = mutator;
        description.textContent = mutator.name + ' — ' + (mutator.description || mutator.desc || 'Modification tactique cumulative.');
        grid.querySelectorAll('[role="radio"]').forEach(candidate => {
          candidate.setAttribute('aria-checked', String(candidate === button));
        });
      });
      grid.appendChild(button);
      if (index === 0 && !this.pendingTowerMutator) button.click();
    });
    return result;
  };

  proto.continueEndlessMode = function continueEndlessModeProfessional() {
    const result = BASE.continueEndlessMode.call(this);
    if (this.endlessMode && !this.campaignVictory) {
      this.professionalRunStarted = true;
      this.professionalRunHeroId = this.selectedHero?.id || null;
      this.gameplayPhase = 'combat';
      this.syncTacticalControls();
      this.saveProgress();
    }
    return result;
  };

  proto.spawnMutant = function spawnMutantProfessional(spawnSpec = null) {
    const bossDue = !spawnSpec
      && this.isTowerMode
      && this.wave % 5 === 0
      && !this.bossSpawnedThisWave
      && this.enemiesSpawnedThisWave >= this.waveSpawnTarget - 1;
    if (bossDue) {
      const rotation = Array.isArray(CHARACTER_EXPANSION?.bossIds)
        ? CHARACTER_EXPANSION.bossIds
        : ['hellwarden'];
      const bossIndex = Math.max(0, Math.floor(this.wave / 5) - 1) % Math.max(1, rotation.length);
      return BASE.spawnMutant.call(this, {
        type: rotation[bossIndex] || 'hellwarden',
        routeIndex: this.nextSpawnGateIndex % Math.max(1, this.spawnRoutes.length),
        boss: true
      });
    }
    return BASE.spawnMutant.call(this, spawnSpec);
  };

  const originalCreateRunCheckpoint = proto.createRunCheckpoint;
  proto.createRunCheckpoint = function createRunCheckpointProfessional() {
    const checkpoint = originalCreateRunCheckpoint.call(this);
    if (checkpoint) {
      checkpoint.campaignSeed = this.campaignSeed;
      checkpoint.campaignRngCalls = this.campaignRngCalls;
      checkpoint.tutorialActive = this.tutorialActive;
      checkpoint.tutorialIndex = this.tutorialIndex;
    }
    return checkpoint;
  };

  proto.getEffectiveShopUpgrade = function getEffectiveShopUpgradeProfessional(key) {
    const value = BASE.getEffectiveShopUpgrade.call(this, key);
    if (key === 'hpBonus') {
      return Math.min(META_HP_MAX_RANK, value) * (META_HP_BONUS_PER_RANK / 50);
    }
    if (key === 'fireRateBonus') {
      return Math.min(META_FIRE_RATE_MAX_RANK, value) * (META_FIRE_RATE_PER_RANK / 0.05);
    }
    return value;
  };

  proto.getCoinValueMultiplier = function getCoinValueMultiplierProfessional() {
    const base = BASE.getCoinValueMultiplier.call(this);
    const economyScale = this.difficulty === 'story' ? 0.68 : (this.difficulty === 'nightmare' ? 0.62 : 0.56);
    return base * economyScale;
  };

  proto.killEnemy = function killEnemyProfessional(enemy) {
    const scoreBefore = this.score;
    const routeIndex = Number(enemy?.routeIndex);
    const result = BASE.killEnemy.call(this, enemy);
    if (Number.isFinite(routeIndex)) this.waveRouteKills.add(routeIndex);
    const scoreDelta = Math.max(0, this.score - scoreBefore);
    const multiplier = this.difficulty === 'nightmare' ? 1.35 : (this.difficulty === 'story' ? 0.9 : 1);
    this.score = scoreBefore + Math.round(scoreDelta * multiplier);
    return result;
  };

  proto.triggerCampaignVictory = function triggerCampaignVictoryProfessional() {
    const campaignId = this.activeCampaignId;
    const difficulty = this.difficulty;
    const result = BASE.triggerCampaignVictory.call(this);
    this.completedCampaignIds.add(campaignId);
    this.campaignCompletionsByDifficulty[difficulty] = (this.campaignCompletionsByDifficulty[difficulty] || 0) + 1;
    Object.keys(TOWER_TYPES).forEach(id => this.unlockedTowerIds.add(id));
    this.professionalRunStarted = false;
    this.gameplayPhase = 'briefing';
    this.syncProgressionBriefing();
    this.saveProgress();
    return result;
  };

  proto.triggerDailyVictory = function triggerDailyVictoryProfessional() {
    const challenge = this.dailyChallenge;
    const score = this.score;
    const duration = this.runElapsedSeconds;
    const result = BASE.triggerDailyVictory.call(this);
    this.syncTacticalControls();
    this.syncTutorialCoach();
    if (challenge?.date) {
      const previous = this.dailyRecords[challenge.date] || {};
      this.dailyRecords[challenge.date] = {
        completed: true,
        bestScore: Math.max(Number(previous.bestScore) || 0, score),
        bestTimeSeconds: previous.bestTimeSeconds
          ? Math.min(previous.bestTimeSeconds, duration)
          : duration,
        attempts: (Number(previous.attempts) || 0) + 1
      };
      const dates = Object.entries(this.dailyRecords)
        .filter(([, record]) => record.completed)
        .map(([date]) => date)
        .sort()
        .reverse();
      let streak = 0;
      let cursor = new Date(challenge.date + 'T12:00:00Z');
      for (const date of dates) {
        if (date !== cursor.toISOString().slice(0, 10)) continue;
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      this.dailyStreak = streak;
      this.saveProgress();
    }
    return result;
  };

  proto.triggerGameOver = function triggerGameOverProfessional() {
    const challenge = this.dailyChallenge;
    const score = this.score;
    const wave = this.wave;
    const retryCheckpoint = !challenge
      && !this.isTowerMode
      && this.runMode === 'campaign'
      && this.difficulty !== 'nightmare'
      && this.savedRunCheckpoint
      ? JSON.parse(JSON.stringify(this.savedRunCheckpoint))
      : null;
    const result = BASE.triggerGameOver.call(this);
    if (this.isGameOver && retryCheckpoint) {
      this.savedRunCheckpoint = retryCheckpoint;
      this.activeRunCheckpoint = retryCheckpoint;
      this.professionalRetryCheckpointAvailable = true;
      const restartButton = document.getElementById('btn-restart');
      if (restartButton) restartButton.textContent = 'REPRENDRE AU DERNIER SECTEUR';
      const description = document.getElementById('game-over-description');
      if (description) description.textContent = 'Le dernier secteur sécurisé reste disponible. Vous pouvez reprendre au début de cette vague.';
    }
    if (challenge?.date) {
      const previous = this.dailyRecords[challenge.date] || {};
      this.dailyRecords[challenge.date] = {
        ...previous,
        completed: previous.completed === true,
        bestScore: Math.max(Number(previous.bestScore) || 0, score),
        bestWave: Math.max(Number(previous.bestWave) || 0, wave),
        attempts: (Number(previous.attempts) || 0) + 1
      };
    }
    if (this.isGameOver) {
      this.professionalRunStarted = false;
      this.professionalRunHeroId = null;
      this.gameplayPhase = 'briefing';
    } else if (this.professionalRunStarted) {
      this.professionalRunHeroId = this.selectedHero?.id || this.professionalRunHeroId;
      this.gameplayPhase = this.waveActive ? 'combat' : (this.waveIntermissionTimer > 0 ? 'intermission' : 'preparation');
    } else {
      this.gameplayPhase = 'briefing';
    }
    this.syncTacticalControls();
    this.saveProgress();
    return result;
  };

  proto.recordRunHistory = function recordRunHistoryProfessional(result = {}) {
    const entry = BASE.recordRunHistory.call(this, { ...result, deferSave: true });
    if (!entry) return entry;
    if (entry.seed === null || entry.seed === undefined) {
      entry.seed = Math.max(0, Number(this.campaignSeed) || 0) >>> 0;
    }
    const key = [
      entry.mode,
      entry.campaignId || this.activeCampaignId,
      entry.difficulty || this.difficulty,
      entry.layoutId || this.selectedLayoutId,
      entry.heroId || this.selectedHero.id
    ].join(':');
    const previous = this.records[key] || {};
    this.records[key] = {
      bestScore: Math.max(Number(previous.bestScore) || 0, Number(entry.score) || 0),
      bestWave: Math.max(Number(previous.bestWave) || 0, Number(entry.wave) || 0),
      victories: (Number(previous.victories) || 0) + (entry.victory ? 1 : 0),
      attempts: (Number(previous.attempts) || 0) + 1,
      bestTimeSeconds: entry.victory
        ? (previous.bestTimeSeconds
          ? Math.min(previous.bestTimeSeconds, entry.durationSeconds)
          : entry.durationSeconds)
        : previous.bestTimeSeconds
    };
    if (result.deferSave !== true) this.saveProgress();
    return entry;
  };

  proto.renderRunHistory = function renderRunHistoryProfessional() {
    const list = document.getElementById('run-history-list');
    if (!list) return;
    list.replaceChildren();
    if (this.runHistory.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Aucune sortie archivée. Votre prochaine campagne apparaîtra ici.';
      list.appendChild(empty);
      return;
    }
    this.runHistory.slice(0, 10).forEach(entry => {
      const item = document.createElement('li');
      const date = new Date(entry.date);
      const dateText = Number.isNaN(date.getTime())
        ? 'Date inconnue'
        : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const campaign = CHARACTER_EXPANSION?.campaigns?.[entry.campaignId];
      const layout = EXPANSION?.worldLayouts?.[entry.layoutId];
      const hero = HERO_CLASSES[entry.heroId];
      const difficulty = DIFFICULTY_DATA[entry.difficulty];
      const modeLabel = entry.mode === 'infinitum'
        ? 'Infinitum'
        : (entry.mode === 'daily' ? 'Daily' : (campaign?.name || 'Campagne'));
      const result = entry.victory ? 'Victoire' : (entry.mode === 'infinitum' ? 'Palier ' + entry.wave : 'Vague ' + entry.wave);
      const values = [
        dateText,
        modeLabel + ' · ' + (difficulty?.name || entry.difficulty || 'Standard'),
        (layout?.name || entry.layoutId || 'Convergence') + ' · ' + (hero?.name || entry.heroId || 'Aria'),
        result + ' · ' + String(entry.score || 0)
      ];
      values.forEach(value => {
        const cell = document.createElement('span');
        cell.textContent = value;
        item.appendChild(cell);
      });
      if (entry.seed !== null && entry.seed !== undefined) {
        item.title = 'Seed partageable : ' + entry.seed;
        item.dataset.seed = String(entry.seed);
      }
      item.dataset.result = entry.victory ? 'victory' : 'defeat';
      list.appendChild(item);
    });
  };

  proto.update = function updateProfessional(dt) {
    if (!this.waveActive && this.gameplayPhase === 'preparation') return;
    this.rebuildEnemySpatialIndex();
    const runtime = global.INFERNAL_CITY_SPECIALIZATION_RUNTIME;
    runtime?.beforeUpdate?.(this, dt);
    const result = BASE.update.call(this, dt);
    runtime?.afterUpdate?.(this, dt);
    if (this.projectiles.length > PROJECTILE_CAP) {
      this.projectiles.splice(0, this.projectiles.length - PROJECTILE_CAP);
    }
    if (this.particles.length > PARTICLE_CAP) {
      this.particles.splice(0, this.particles.length - PARTICLE_CAP);
    }
    return result;
  };

  proto.render = function renderProfessional() {
    const result = BASE.render.call(this);
    if (!this.ctx || !this.canvas || !this.buildCursor.visible || this.isPaused) return result;
    const tower = this.selectedTowerToBuild;
    if (!tower) return result;
    const towerCost = this.getInfinitumDefenseCost?.(tower) ?? tower.cost;
    const placement = this.validateDefensePlacement(this.buildCursor.x, this.buildCursor.y);
    const affordable = this.coins >= towerCost;
    const valid = placement.ok && affordable;
    const color = valid ? '#34d399' : '#fb7185';
    const view = this.getBattlefieldView(this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.applyBattlefieldView(view);
    this.ctx.globalAlpha = 0.88;
    this.ctx.fillStyle = valid ? 'rgba(52, 211, 153, 0.13)' : 'rgba(251, 113, 133, 0.14)';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.getReadableWorldSize(2, 1.2);
    this.ctx.setLineDash([8, 6]);
    this.ctx.beginPath();
    this.ctx.arc(this.buildCursor.x, this.buildCursor.y, tower.range, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    this.ctx.arc(this.buildCursor.x, this.buildCursor.y, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = valid ? 'rgba(52, 211, 153, 0.5)' : 'rgba(251, 113, 133, 0.5)';
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.font = '800 ' + this.getReadableWorldSize(14, 11) + 'px Rajdhani';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#fff';
    const reason = affordable
      ? (placement.ok ? tower.name + ' · ' + towerCost : this.getDefensePlacementFailureMessage(placement.reason))
      : 'Bio-Coins insuffisants · ' + towerCost;
    this.ctx.fillText(reason, this.buildCursor.x, this.buildCursor.y - 30);
    this.ctx.restore();
    return result;
  };

  proto.resizeCanvas = function resizeCanvasProfessional() {
    return BASE.resizeCanvas.call(this);
  };

  proto.syncSettingsControls = function syncSettingsControlsProfessional() {
    BASE.syncSettingsControls.call(this);
    const keyboard = document.getElementById('keyboard-preset');
    const blur = document.getElementById('pause-on-blur');
    const deadzone = document.getElementById('gamepad-deadzone');
    const sensitivity = document.getElementById('gamepad-sensitivity');
    if (keyboard) keyboard.value = this.keyboardPreset;
    if (blur) blur.value = this.pauseOnBlur ? 'pause' : 'continue';
    if (deadzone) deadzone.value = String(Math.round(this.gamepadDeadzone * 100));
    if (sensitivity) sensitivity.value = String(Math.round(this.gamepadSensitivity * 100));
    const deadzoneOutput = document.getElementById('gamepad-deadzone-output');
    const sensitivityOutput = document.getElementById('gamepad-sensitivity-output');
    if (deadzoneOutput) deadzoneOutput.textContent = Math.round(this.gamepadDeadzone * 100) + ' %';
    if (sensitivityOutput) sensitivityOutput.textContent = Math.round(this.gamepadSensitivity * 100) + ' %';
  };

  proto.initializeSettingsControls = function initializeSettingsControlsProfessional() {
    BASE.initializeSettingsControls.call(this);
    const bindSelect = (id, callback) => {
      document.getElementById(id)?.addEventListener('change', event => {
        callback(event.target.value);
        this.saveProgress();
      });
    };
    bindSelect('keyboard-preset', value => {
      this.keyboardPreset = ['zqsd', 'wasd', 'arrows'].includes(value) ? value : 'zqsd';
    });
    bindSelect('pause-on-blur', value => {
      this.pauseOnBlur = value !== 'continue';
    });
    const bindRange = (id, outputId, callback) => {
      const input = document.getElementById(id);
      input?.addEventListener('input', event => {
        const value = Number(event.target.value) || 0;
        callback(value);
        const output = document.getElementById(outputId);
        if (output) output.textContent = Math.round(value) + ' %';
      });
      input?.addEventListener('change', () => this.saveProgress());
    };
    bindRange('gamepad-deadzone', 'gamepad-deadzone-output', value => {
      this.gamepadDeadzone = Math.max(0.05, Math.min(0.45, value / 100));
    });
    bindRange('gamepad-sensitivity', 'gamepad-sensitivity-output', value => {
      this.gamepadSensitivity = Math.max(0.5, Math.min(1.8, value / 100));
    });
  };

  proto.getActiveGamepad = function getActiveGamepadProfessional() {
    const gamepad = BASE.getActiveGamepad.call(this);
    if (!gamepad || !Array.isArray(gamepad.axes)) return gamepad;
    const deadzone = this.gamepadDeadzone || 0.18;
    const axes = gamepad.axes.map(rawValue => {
      const value = Number(rawValue) || 0;
      if (Math.abs(value) <= deadzone) return 0;
      const normalized = Math.sign(value) * ((Math.abs(value) - deadzone) / (1 - deadzone));
      return Math.sign(normalized) * (0.18 + (0.82 * Math.abs(normalized)));
    });
    return new Proxy(gamepad, {
      get(target, property) {
        if (property === 'axes') return axes;
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  };

  proto.updateGamepadControls = function updateGamepadControlsProfessional(dt) {
    return BASE.updateGamepadControls.call(this, dt * (this.gamepadSensitivity || 1));
  };

  const originalUpdateHUD = proto.updateHUD;
  proto.updateHUD = function updateHUDProfessional() {
    const result = originalUpdateHUD.call(this);
    this.syncTacticalControls();
    this.syncSecondaryObjective();
    return result;
  };

  global.INFERNAL_CITY_PROFESSIONAL_GAMEPLAY = Object.freeze({
    version: '3.0.0',
    fixedStepSeconds: FIXED_STEP_SECONDS,
    maxSimulationSteps: MAX_SIMULATION_STEPS,
    starterTowerIds: STARTER_TOWER_IDS,
    towerUnlockPlan: TOWER_UNLOCK_PLAN,
    tutorialSteps: TUTORIAL_STEPS,
    secondaryObjectives: SECONDARY_OBJECTIVES
  });
})(typeof window !== 'undefined' ? window : globalThis);
