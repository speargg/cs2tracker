const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const FACEIT_API_KEY = process.env.FACEIT_API_KEY_TRACKING;

exports.handler = async () => {
  const { data: players } = await supabase.from('tracked_players').select('*');
  if (!players) return { statusCode: 200, body: 'Brak graczy' };

  for (const p of players) {
    try {
      const res = await fetch(`https://open.faceit.com/data/v4/players/${p.player_id}`, {
        headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
      });

      if (!res.ok) continue;

      const json = await res.json();
      const currentELO = json.games?.cs2?.faceit_elo;
      const matchId = json.games?.cs2?.faceit_match_id;

      if (currentELO != null && currentELO !== p.last_elo) {
        const delta = currentELO - (p.last_elo ?? 0);

        await supabase.from('elo_history').insert({
          player_id: p.player_id,
          elo: currentELO,
          delta,
          match_id: matchId,
        });

        await supabase.from('tracked_players')
          .update({ last_elo: currentELO, last_match_id: matchId })
          .eq('player_id', p.player_id);
      }

      await new Promise(r => setTimeout(r, 250)); // Faceit API throttle

    } catch (err) {
      console.error('Błąd:', err);
    }
  }

  return { statusCode: 200, body: 'ELO tracking done' };
};
