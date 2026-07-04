// Leaderboard histórico local: guarda las mejores partidas ganadas
// (torneo completado) en el propio navegador del jugador via localStorage.
// No hay servidor ni base de datos: cada dispositivo tiene su propio
// ranking, y si se borran los datos del navegador se pierde.

const LEADERBOARD_STORAGE_KEY = 'spinho_leaderboard_v1';
const LEADERBOARD_MAX_ENTRIES = 10;

// Todas las lecturas/escrituras van envueltas en try/catch: en modo
// privado o con localStorage deshabilitado, el juego debe seguir
// funcionando igual, simplemente sin guardar histórico.
function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// Añade la partida actual, reordena de mayor a menor premio y recorta al
// top N. Devuelve la lista resultante (o [entry] si localStorage falla).
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
  return trimmed;
}
