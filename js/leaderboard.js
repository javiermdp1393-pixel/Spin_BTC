// Leaderboard global vía Supabase.
//
// Cada torneo ganado se envía a la tabla `scores` de Supabase y el ranking
// se lee de ahí, así que es compartido entre todos los dispositivos. La API
// se usa por REST (fetch) para no depender de ninguna librería externa ni
// paso de build: es un sitio estático.
//
// Si no hay red o Supabase falla, se cae a un histórico local en
// localStorage: el juego debe seguir mostrando algo aunque no haya conexión.

const LEADERBOARD_STORAGE_KEY = 'spinho_leaderboard_v1';
const LEADERBOARD_MAX_ENTRIES = 10;

// --- Supabase (REST) --------------------------------------------------------

function scoresEndpoint(query) {
  return `${SUPABASE_CONFIG.url}/rest/v1/scores${query || ''}`;
}

function supabaseHeaders(extra) {
  return Object.assign(
    {
      apikey: SUPABASE_CONFIG.key,
      Authorization: `Bearer ${SUPABASE_CONFIG.key}`
    },
    extra || {}
  );
}

// Normaliza una fila de Supabase a la forma que usa la UI.
function normalizeScoreRow(row) {
  return {
    id: row.id,
    name: row.player_name,
    alias: row.alias,
    totalPrize: row.total_prize,
    mode: row.mode,
    rivalReached: row.rival_reached
  };
}

// Envía una partida ganada a Supabase. Devuelve la fila insertada normalizada
// (con id) o null si falla (sin red, RLS, validación...). Nunca lanza.
async function submitScore(entry) {
  try {
    const res = await fetch(scoresEndpoint(), {
      method: 'POST',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }),
      body: JSON.stringify({
        player_name: entry.name,
        alias: entry.alias || null,
        total_prize: entry.totalPrize,
        mode: entry.mode,
        rival_reached: entry.rivalReached || null
      })
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? normalizeScoreRow(rows[0]) : null;
  } catch (e) {
    return null;
  }
}

// Lee el top global de Supabase (mayor premio primero, desempate por fecha).
// Devuelve una lista normalizada, o null si falla la petición.
async function fetchTopScores(limit) {
  const n = limit || LEADERBOARD_MAX_ENTRIES;
  try {
    const res = await fetch(
      scoresEndpoint(
        `?select=id,player_name,alias,total_prize,mode,rival_reached,created_at` +
          `&order=total_prize.desc,created_at.asc&limit=${n}`
      ),
      { headers: supabaseHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(normalizeScoreRow) : null;
  } catch (e) {
    return null;
  }
}

// --- Fallback local (offline) ----------------------------------------------

// Todas las lecturas/escrituras van envueltas en try/catch: en modo privado
// o con localStorage deshabilitado, el juego debe seguir funcionando.
function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// Añade la partida actual al histórico local, reordena de mayor a menor premio
// y recorta al top N. Devuelve la lista normalizada para la UI.
function saveRunToLeaderboard(entry) {
  const list = getLeaderboard();
  list.push(entry);
  list.sort((a, b) => b.totalPrize - a.totalPrize);
  const trimmed = list.slice(0, LEADERBOARD_MAX_ENTRIES);
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Sin almacenamiento disponible: se muestra igualmente para esta sesión.
  }
  return trimmed.map((e) => ({
    id: e.date,
    name: e.name,
    alias: e.alias,
    totalPrize: e.totalPrize,
    mode: e.mode,
    rivalReached: e.rivalReached
  }));
}
