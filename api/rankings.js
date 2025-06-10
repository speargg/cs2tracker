export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
  const { playerId } = req.query;

  if (!playerId) {
    return res.status(400).json({ error: 'Player ID required' });
  }

  if (!FACEIT_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Fetch player profile to get some ranking-related info
    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Faceit API returned status ${response.status}`);
    }

    const playerData = await response.json();

    // Faceit API only exposes ranking if player is in top 100 (or top 20k in some cases)
    const world = playerData.games?.cs2?.ranking?.position || null;
    const europe = playerData.games?.cs2?.region_ranking?.position || null;

    res.json({
      world: world ?? 0,
      europe: europe ?? 0
    });
  } catch (error) {
    console.error('Rankings API Error:', error);
    res.status(500).json({ error: 'API error', details: error.message });
  }
}
