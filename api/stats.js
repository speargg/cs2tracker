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
    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/stats/cs2`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Stats not found for this player' });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'API error', details: error.message });
  }
}
