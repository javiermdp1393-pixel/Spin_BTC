// Widget reutilizable de récords (leaderboard mundial). Se pinta en la
// pantalla de registro (pie del formulario y pestaña RECORDS) y en la de bust
// out. Cada instancia recuerda el modo seleccionado (ARCADE/FREEZEOUT), lo
// cambia con sus botones y refetch. Lee de Supabase; si no hay red, avisa.

const RECORDS_MODES = [
  { key: 'ARCADE', label: 'Arcade' },
  { key: 'FREEZEOUT', label: 'Freezeout' }
];

// Deduplica la lista de ganadores del desafío diario por jugador (nombre+apodo)
// quedándose con su mejor premio, y ordena de mayor a menor.
function dedupeDailyWinners(winners) {
  const seen = new Map();
  (winners || []).forEach((w) => {
    const key = `${w.name}|${w.alias || ''}`;
    if (!seen.has(key) || seen.get(key).totalPrize < w.totalPrize) seen.set(key, w);
  });
  return [...seen.values()].sort((a, b) => b.totalPrize - a.totalPrize);
}

// Filas <li> de una lista ya deduplicada de ganadores del desafío diario.
function dailyWinnersRowsHtml(list) {
  return list.map((w) => {
    const aliasTxt = w.alias ? ` "${escapeHtml(w.alias)}"` : '';
    return `<li><span class="records-name">${escapeHtml(w.name)}${aliasTxt}</span>` +
      `<span class="records-amount">${formatEuros(w.totalPrize)}</span></li>`;
  }).join('');
}

function renderRecordsWidget(container, initialMode) {
  if (!container) return;
  let mode = initialMode || 'ARCADE';

  container.innerHTML =
    '<div class="records-modes" role="tablist"></div>' +
    '<p class="records-champion" aria-live="polite"></p>' +
    '<ol class="records-list"></ol>' +
    '<p class="records-status hidden"></p>' +
    '<div class="records-daily"></div>';

  const modesEl = container.querySelector('.records-modes');
  const championEl = container.querySelector('.records-champion');
  const listEl = container.querySelector('.records-list');
  const statusEl = container.querySelector('.records-status');
  const dailyEl = container.querySelector('.records-daily');

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

  // Ganadores del desafío diario de HOY. Es independiente del toggle de modo,
  // así que se carga una sola vez al montar el widget.
  async function loadDailyWinners() {
    const winners = await fetchDailyWinners(50);
    if (winners === null) { dailyEl.innerHTML = ''; return; } // sin conexión: se oculta
    const list = dedupeDailyWinners(winners);
    if (!list.length) {
      dailyEl.innerHTML =
        '<p class="zone-label">Han batido el desafío diario de hoy</p>' +
        '<p class="records-daily-empty">Nadie lo ha batido todavía. ¿Serás el primero?</p>';
      return;
    }
    dailyEl.innerHTML =
      `<p class="zone-label">Han batido el desafío diario de hoy (${list.length})</p>` +
      `<ol class="records-list">${dailyWinnersRowsHtml(list)}</ol>`;
  }

  load();
  loadDailyWinners();
}
