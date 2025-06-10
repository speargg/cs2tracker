export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
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
    // Fetch both world and Europe rankings
    const [worldResponse, europeResponse] = await Promise.all([
      fetch(`https://open.faceit.com/data/v4/rankings/games/cs2/regions/world/players/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${FACEIT_API_KEY}`
        }
      }),
      fetch(`https://open.faceit.com/data/v4/rankings/games/cs2/regions/europe/players/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${FACEIT_API_KEY}`
        }
      })
    ]);

    const results = {
      world: null,
      europe: null
    };

    // Handle world ranking
    if (worldResponse.ok) {
      const worldData = await worldResponse.json();
      results.world = worldData.position;
    } else if (worldResponse.status !== 404) {
      console.error('World ranking API error:', worldResponse.status);
    }

    // Handle Europe ranking
    if (europeResponse.ok) {
      const europeData = await europeResponse.json();
      results.europe = europeData.position;
    } else if (europeResponse.status !== 404) {
      console.error('Europe ranking API error:', europeResponse.status);
    }

    res.json(results);
  } catch (error) {
    console.error('Rankings API Error:', error);
    res.status(500).json({ error: 'API error', details: error.message });
  }
}
