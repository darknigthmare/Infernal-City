(() => {
  'use strict';

  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  const canRegister = window.isSecureContext || localHosts.has(window.location.hostname);

  if (!('serviceWorker' in navigator) || !canRegister) return;

  const banner = document.getElementById('pwa-status-banner');
  const title = document.getElementById('pwa-status-title');
  const message = document.getElementById('pwa-status-message');
  const installButton = document.getElementById('btn-install-update');
  let waitingWorker = null;
  let reloading = false;

  const showStatus = (state, heading, copy, actionable = false) => {
    if (!banner) return;
    banner.hidden = false;
    banner.dataset.state = state;
    banner.dataset.actionable = String(Boolean(actionable));
    if (title) title.textContent = heading;
    if (message) message.textContent = copy;
    if (installButton) installButton.hidden = !actionable;
  };

  const hideStatus = () => {
    if (banner && !waitingWorker) banner.hidden = true;
  };

  const announceWaitingUpdate = (worker) => {
    waitingWorker = worker;
    showStatus(
      'update',
      'MISE À JOUR PRÊTE',
      'Une nouvelle version est téléchargée. Installez-la au moment qui vous convient.',
      true
    );
  };

  installButton?.addEventListener('click', () => {
    if (!waitingWorker) return;
    installButton.disabled = true;
    installButton.textContent = 'INSTALLATION…';
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  });

  window.addEventListener('offline', () => {
    showStatus('offline', 'MODE HORS LIGNE', 'Le pack local permet de continuer la campagne et les modes déjà installés.');
  });
  window.addEventListener('online', hideStatus);
  if (!navigator.onLine) {
    showStatus('offline', 'MODE HORS LIGNE', 'Le pack local permet de continuer la campagne et les modes déjà installés.');
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });

      if (registration.waiting) announceWaitingUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            announceWaitingUpdate(registration.waiting || installing);
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });

      registration.update().catch((error) => {
        console.warn('La vérification de mise à jour hors ligne a échoué.', error);
      });
    } catch (error) {
      console.warn('Le mode hors ligne n’a pas pu être activé.', error);
      showStatus('error', 'MODE HORS LIGNE INDISPONIBLE', 'Le jeu reste jouable en ligne, mais le pack local n’a pas pu être installé.');
    }
  }, { once: true });
})();
