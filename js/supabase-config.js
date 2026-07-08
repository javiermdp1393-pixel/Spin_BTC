// Configuración pública de Supabase para el leaderboard global (proyecto
// SPINHOBTC). La "publishable key" está diseñada para incrustarse en el
// frontend: NO es un secreto. El acceso real lo controlan las políticas RLS
// de la tabla `scores` en Supabase (lectura pública + inserción anónima
// validada por CHECK), así que exponerla aquí es seguro y esperado.
const SUPABASE_CONFIG = {
  url: 'https://gtnkwiufoutimkakcuvw.supabase.co',
  key: 'sb_publishable__3esNRjWkxZBdDdyN8mn3w_3IpZMLzu'
};
