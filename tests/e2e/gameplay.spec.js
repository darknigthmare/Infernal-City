const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  page: async ({ page }, use) => {
    const runtimeFailures = [];
    page.on('pageerror', error => runtimeFailures.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') runtimeFailures.push(`console: ${message.text()}`);
    });
    await use(page);
    expect(runtimeFailures, 'aucune erreur JavaScript/console ne doit atteindre le joueur').toEqual([]);
  }
});

async function openBriefing(page) {
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForFunction(() => (
    Boolean(window.__INFERNAL_CITY_GAME__)
    && !window.__infernalBootError
  ));
  const gate = page.locator('#adult-gate-modal');
  await expect(gate).toBeVisible();
  await expect(gate).toHaveClass(/active/);
  await page.locator('#btn-enter-adult').click();
  const briefing = page.locator('#mission-briefing-modal');
  await expect(briefing).toBeVisible();
  await expect(briefing).toHaveClass(/active/);
  return briefing;
}

async function beginCampaign(page) {
  await openBriefing(page);
  const tutorialToggle = page.locator('#guided-tutorial-toggle');
  if (await tutorialToggle.isChecked()) await tutorialToggle.uncheck();
  await page.locator('#btn-start-campaign').click();
  await expect(page.locator('#mission-briefing-modal')).not.toHaveClass(/active/);
  await expect(page.locator('#tactical-phase-txt')).toContainText('DÉPLOIEMENT');
  await expect(page.locator('#game-canvas')).toBeVisible();
}

function parseCoins(text) {
  return Number(String(text).replace(/[^0-9]/g, ''));
}

async function placeDefenses(page, requestedCount = 1) {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box, 'le champ de bataille doit avoir une surface interactive').not.toBeNull();
  const clearScreenPoints = await page.evaluate((count) => {
    const game = window.__INFERNAL_CITY_GAME__;
    const canvasNode = document.getElementById('game-canvas');
    const rect = canvasNode.getBoundingClientRect();
    const view = game.getBattlefieldView();
    const bounds = game.getDefensePlacementBounds(18);
    const points = [];
    const candidates = [
      [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8],
      [0.35, 0.3], [0.65, 0.3], [0.35, 0.7], [0.65, 0.7],
      [0.5, 0.25], [0.5, 0.75]
    ];
    for (const [xRatio, yRatio] of candidates) {
      const world = game.findValidDefensePlacement(
        bounds.minX + ((bounds.maxX - bounds.minX) * xRatio),
        bounds.minY + ((bounds.maxY - bounds.minY) * yRatio),
        { radius: 18, defenses: game.placedTowers }
      );
      if (!world) continue;
      const canvasX = view.screenCenterX + ((world.x - view.worldCenterX) * view.scale);
      const canvasY = view.screenCenterY + ((world.y - view.worldCenterY) * view.scale);
      const x = canvasX * (rect.width / canvasNode.width);
      const y = canvasY * (rect.height / canvasNode.height);
      if (x < 1 || x > rect.width - 1 || y < 1 || y > rect.height - 1) continue;
      const hit = document.elementFromPoint(rect.left + x, rect.top + y);
      if (hit === canvasNode) points.push({ x, y });
      if (points.length >= count + 4) break;
    }
    return points;
  }, requestedCount);
  expect(clearScreenPoints.length, 'une zone de construction visible doit rester accessible').toBeGreaterThanOrEqual(requestedCount);

  const cards = page.locator('.build-tower-card:not([disabled])');
  await expect(cards.first()).toBeVisible();
  await cards.first().click();

  let placed = 0;
  let coins = parseCoins(await page.locator('#hud-coins-txt').innerText());

  for (const position of clearScreenPoints) {
    if (placed >= requestedCount) break;
    await canvas.click({ position });
    await page.waitForTimeout(80);

    const managementModal = page.locator('#defense-management-modal.active');
    if (await managementModal.count()) {
      await managementModal.locator('.btn-close').click();
      continue;
    }

    const nextCoins = parseCoins(await page.locator('#hud-coins-txt').innerText());
    if (nextCoins < coins) {
      placed++;
      coins = nextCoins;
    }
  }

  expect(placed, 'au moins une défense doit pouvoir être placée par les interactions normales').toBeGreaterThanOrEqual(requestedCount);
  return placed;
}

async function dismissBlockingCombatModal(page) {
  const levelUp = page.locator('#level-up-modal.active');
  if (await levelUp.count()) {
    await levelUp.locator('.upgrade-card:not([disabled])').first().click();
    return true;
  }
  const cinematic = page.locator('#cinematic-modal.active');
  if (await cinematic.count()) {
    await page.locator('#btn-cinematic-continue').click();
    return true;
  }
  return false;
}

test('portail adulte → briefing → déploiement → combat, contrôles tactiques et QG', async ({ page }) => {
  await beginCampaign(page);

  const buildCards = page.locator('.build-tower-card');
  await expect(buildCards).toHaveCount(6);

  const zoomText = page.locator('#camera-zoom-txt');
  const initialZoom = await zoomText.innerText();
  await page.locator('#btn-camera-zoom-in').click();
  await expect(zoomText).not.toHaveText(initialZoom);

  await placeDefenses(page, 1);
  await page.locator('#btn-launch-wave').click();
  await expect(page.locator('#tactical-phase-txt')).toContainText('COMBAT');

  await page.locator('#btn-game-speed').click();
  await expect(page.locator('#btn-game-speed')).toHaveText('×2');
  await page.locator('#btn-game-speed').click();
  await expect(page.locator('#btn-game-speed')).toHaveText('×3');

  await page.locator('#btn-combat-pause').click();
  await expect(page.locator('#btn-combat-pause')).toHaveText('REPRENDRE');
  await expect(page.locator('#btn-combat-pause')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#btn-combat-pause').click();
  await expect(page.locator('#btn-combat-pause')).toHaveText('PAUSE');

  await page.locator('#btn-open-hq').click();
  await expect(page.locator('#hq-menu-modal')).toHaveClass(/active/);
  await page.locator('#btn-resume-combat').click();
  await expect(page.locator('#hq-menu-modal')).not.toHaveClass(/active/);

  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    orientationBlocked: !document.getElementById('short-landscape-notice')?.hidden
  }));
  expect(layout.document).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.orientationBlocked).toBe(false);
});

test('un checkpoint de vague survit au rechargement', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'parcours long exécuté une seule fois sur Chromium desktop');
  test.setTimeout(90_000);
  await beginCampaign(page);
  await placeDefenses(page, 3);
  await page.locator('#btn-launch-wave').click();
  await page.locator('#btn-game-speed').click();
  await page.locator('#btn-game-speed').click();

  const deadline = Date.now() + 55_000;
  while (Date.now() < deadline) {
    await dismissBlockingCombatModal(page);
    if ((await page.locator('#tactical-phase-txt').innerText()).includes('INTERMISSION')) break;
    await page.waitForTimeout(250);
  }
  await expect(page.locator('#tactical-phase-txt')).toContainText('INTERMISSION');

  const checkpoint = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('valkyrie_sweeper_save'));
    return save?.activeRun || null;
  });
  expect(checkpoint).toBeTruthy();
  expect(checkpoint.nextWave).toBeGreaterThanOrEqual(2);

  await page.reload();
  await page.locator('#btn-enter-adult').click();
  await expect(page.locator('#checkpoint-card')).toBeVisible();
  await page.locator('#btn-continue-run').click();
  await expect(page.locator('#tactical-phase-txt')).toContainText('DÉPLOIEMENT');
  await expect(page.locator('#hud-wave-txt')).toHaveText(String(checkpoint.nextWave));
});

test('le Défi du jour impose un contrat déterministe et un deck de trois défenses', async ({ page }) => {
  await openBriefing(page);
  await expect(page.locator('#daily-challenge-date')).not.toHaveText('—');
  const date = await page.locator('#daily-challenge-date').innerText();
  const layout = await page.locator('#daily-challenge-layout').innerText();
  await page.locator('#btn-daily-challenge').click();

  await expect(page.locator('#tactical-phase-txt')).toContainText('DÉPLOIEMENT');
  await expect(page.locator('.build-tower-card')).toHaveCount(3);
  await expect(page.locator('#hud-wave-txt')).toHaveText('1');

  await page.reload();
  await page.locator('#btn-enter-adult').click();
  await expect(page.locator('#daily-challenge-date')).toHaveText(date);
  await expect(page.locator('#daily-challenge-layout')).toHaveText(layout);
});

test('une panne de stockage déclenche une alerte persistante et actionnable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'contrat de résilience indépendant du viewport');
  await page.addInitScript(() => {
    Storage.prototype.setItem = function blockedStorageWrite() {
      throw new DOMException('Quota intentionally unavailable in E2E', 'QuotaExceededError');
    };
  });
  await page.goto('/');
  await page.locator('#btn-enter-adult').click();
  const banner = page.locator('#save-failure-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(/stockage local|sauvegarde/i);
  await expect(page.locator('#btn-emergency-export')).toBeVisible();
});
