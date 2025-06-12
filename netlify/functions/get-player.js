const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Supabase i Faceit API
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const FACEIT_API_KEY = process.env.FACEIT_API_KEY_TRACKING;

exports.handler = async (event) => {
  const nickname = event.queryStringParameters.nickname;

  if (!nickname) {
    return { statusCode: 400, body: "Missing ?nickname= in query" };
  }

  try {
    // Pobierz dane z Faceit API
    const faceitRes = await fetch(`https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`, {
      headers: { Authorization: `Bearer ${FACEIT_API_KEY}` }
    });

    if (!faceitRes.ok) {
      return { statusCode: 404, body: "Gracz nie znaleziony w Faceit API" };
    }

    const data = await faceitRes.json();

    const player = {
      player_id: data.player_id,
      nickname: data.nickname,
      last_elo: data.games?.cs2?.faceit_elo ?? null,
      last_match_id: data.games?.cs2?.faceit_match_id ?? null,
    };

    // Sprawdź, czy już istnieje w Supabase
    const { data: existing } = await supabase
      .from('tracked_players')
      .select('player_id')
      .eq('player_id', player.player_id)
      .maybeSingle();

    // Jeśli nie istnieje — dodaj do trackingu
    if (!existing) {
      await supabase.from('tracked_players').insert(player);
      console.log(`✅ Dodano gracza ${player.nickname} do trackingu`);
    } else {
      console.log(`🔁 Gracz ${player.nickname} już istnieje`);
    }

    // Zwróć dane gracza
    return {
      statusCode: 200,
      body: JSON.stringify({
        nickname: player.nickname,
        player_id: player.player_id,
        elo: player.last_elo
      }),
    };

  } catch (error) {
    console.error("❌ Błąd:", error);
    return { statusCode: 500, body: "Błąd serwera" };
  }
};
