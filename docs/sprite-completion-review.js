/* Native-cell review viewer. Run from the same HTTP server as the game. */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('sprite');
  const context = canvas.getContext('2d');
  let manifest, entries = [], selected, image, playing = true, started = 0, request = 0;
  function options(select, values) {
    select.replaceChildren(...values.map(([value, text]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = text; return option;
    }));
  }
  function refreshState() {
    const sequence = selected?.sequenceFrames;
    $('frame').max = sequence ? 7 : selected?.columns - 1 || 0;
    $('frame').value = 0; started = performance.now();
  }
  async function selectAsset() {
    selected = entries.find(entry => entry.key === $('asset').value);
    if (!selected) return;
    const id = ++request;
    $('error').textContent = '';
    const source = `../${selected.src}`;
    $('source').href = source; $('sheet').src = source;
    $('speed').value = selected.fps || 10;
    options($('state'), selected.sequenceFrames
      ? [['0', 'Séquence complète · 8 images']]
      : selected.states.map((state, row) => [String(row), state]));
    $('status').textContent = selected.approved
      ? (selected.preparedOnly ? 'Validé · ressource préparée, intégration à venir' : 'Activé en combat')
      : 'En revue · ancien sprite conservé';
    $('details').replaceChildren();
    for (const text of [selected.key, `${selected.width} × ${selected.height} px · ${selected.columns} × ${selected.rows} cellules`,
      `${(selected.bytes / 1048576).toFixed(2)} Mio · PNG natif`, `SHA-256 ${selected.sha256}`]) {
      const line = document.createElement('div'); line.textContent = text; $('details').append(line);
    }
    refreshState(); image = null;
    const next = new Image(); next.src = source;
    try { await next.decode(); if (id === request) image = next; }
    catch { if (id === request) $('error').textContent = 'Image non disponible. Vérifiez le serveur local et le chemin du manifeste.'; }
  }
  function filter() {
    const category = $('category').value;
    entries = manifest.files.filter(entry => category === 'all' || entry.key.startsWith(`${category}/`));
    options($('asset'), entries.map(entry => [entry.key, entry.key]));
    selectAsset();
  }
  function tick(now) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (selected && image) {
      const fps = Math.max(1, Math.min(30, Number($('speed').value) || 10));
      const count = Number($('frame').max) + 1;
      const frame = playing ? Math.floor((now - started) * fps / 1000) % count : Number($('frame').value);
      if (playing) $('frame').value = frame;
      const sequence = selected.sequenceFrames;
      const row = sequence ? Math.floor(frame / selected.columns) : Number($('state').value);
      const col = frame % selected.columns;
      const sw = image.width / selected.columns, sh = image.height / selected.rows;
      const ratio = Math.min(320 / sw, 320 / sh);
      context.drawImage(image, col * sw, row * sh, sw, sh,
        (canvas.width - sw * ratio) / 2, (canvas.height - sh * ratio) / 2, sw * ratio, sh * ratio);
      $('frame-label').textContent = `Image ${frame + 1} / ${count}`;
    }
    requestAnimationFrame(tick);
  }
  $('category').addEventListener('change', filter);
  $('asset').addEventListener('change', selectAsset);
  $('state').addEventListener('change', refreshState);
  $('toggle').addEventListener('click', () => { playing = !playing; started = performance.now() - Number($('frame').value) * 1000 / (Number($('speed').value) || 10); $('toggle').textContent = playing ? 'Pause' : 'Lire'; });
  $('frame').addEventListener('input', () => { playing = false; $('toggle').textContent = 'Lire'; });
  try {
    const response = await fetch('../assets/animations/completion-v1/manifest.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    manifest = await response.json();
    $('summary').textContent = `${manifest.present} / ${manifest.expected} atlas présents · ${manifest.approved} validés · ${manifest.presentFrames} cellules dessinées recensées`;
    filter(); requestAnimationFrame(tick);
  } catch (error) { $('error').textContent = `Impossible de lire le manifeste : ${error.message}. Lancez python -m http.server à la racine du dépôt.`; }
})();
