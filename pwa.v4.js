(() => {
  'use strict';

  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  const canRegister = window.isSecureContext || localHosts.has(window.location.hostname);

  if (!('serviceWorker' in navigator) || !canRegister) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });

      registration.update().catch((error) => {
        console.warn('La vérification de mise à jour hors ligne a échoué.', error);
      });
    } catch (error) {
      console.warn('Le mode hors ligne n’a pas pu être activé.', error);
    }
  }, { once: true });
})();
