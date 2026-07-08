// Widget reutilizable de récords (leaderboard mundial). Se pinta en la
// pantalla de registro (pie del formulario y pestaña RECORDS) y en la de bust
// out. Cada instancia recuerda el modo seleccionado (ARCADE/FREEZEOUT), lo
// cambia con sus botones y refetch. Lee de Supabase; si no hay red, avisa.

const RECORDS_MODES = [
  { key: 'ARCADE', label: 'Arcade' },
  { key: 'FREEZEOUT', label: 'Freezeout' }
];

function renderRecordsWidget(container, initialMode) {
  if (!container) return;
  let mode = initialMode || 'ARCADE';

  container.innerHTML =
    '<div class="records-modes" role="tablist"></div>' +
    '<p class="records-champion" aria-live="polite"></p>' +
    '<ol class="records-list"></ol>' +
    '<p class="records-status hidden"></p>';

  const modesEl = container.querySelector('.records-modes');
  const championEl = container.querySelector('.records-champion');
  const listEl = container.querySelector('.records-list');
  const statusEl = container.querySelector('.records-status');

  RECORDS_MODES.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'records-mode-btn';
    btn.textContent = m.label;
    btn.dataset.mode = m.key;
    btn.addEventListener('click', () => { mode = m.key; load(); });
    modesEl.appendChild(btn);
  });

  function setStatus(text) {
    statusEl.textContent = text || '';
    statusEl.classList.toggle('hidden', !text);
  }

  function highlightMode() {
    modesEl.querySelectorAll('.records-mode-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  async function load() {
    highlightMode();
    setStatus('Cargando récords…');
    listEl.innerHTML = '';
    championEl.textContent = '';

    const rows = await fetchScoresByMode(mode, 10);
    if (rows === null) {
      setStatus('No se pudo cargar el ranking mundial (sin conexión).');
      return;
    }
    setStatus('');

    if (!rows.length) {
      championEl.textContent = 'Aún no hay campeón en este modo. ¡Sé el primero!';
      listEl.innerHTML = '<li class="records-empty">Sin puntuaciones todavía.</li>';
      return;
    }

    const champ = rows[0];
    championEl.innerHTML = `Campeón actual: <strong>"${escapeHtml(champ.alias || champ.name)}"</strong>`;
    rows.forEach((r) => {
      const li = document.createElement('li');
      const aliasHtml = r.alias ? ` "${escapeHtml(r.alias)}"` : '';
      li.innerHTML =
        `<span class="records-name">${escapeHtml(r.name)}${aliasHtml}</span>` +
        `<span class="records-amount">${formatEuros(r.totalPrize)}</span>`;
      listEl.appendChild(li);
    });
  }

  load();
}
