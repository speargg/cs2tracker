const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
  const nickname = event.queryStringParameters.nickname;
  if (!nickname) {
    return { statusCode: 400, body: "Missing ?nickname= in query" };
  }

  // Znajdź player_id po nicku
  const { data: player, error: playerError } = await supabase
    .from('tracked_players')
    .select('player_id')
    .eq('nickname', nickname)
    .maybeSingle();

  if (playerError || !player) {
    return { statusCode: 404, body: "Gracz nie istnieje w tracked_players" };
  }

  // Pobierz historię ELO
  const { data: history, error: historyError } = await supabase
    .from('elo_history')
    .select('elo, recorded_at')
    .eq('player_id', player.player_id)
    .order('recorded_at', { ascending: true });

  if (historyError) {
    return { statusCode: 500, body: "Błąd pobierania historii ELO" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(history),
  };
};
