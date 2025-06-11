exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*' };
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS' };
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization' };
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return return { statusCode: 200).end( };
  }

  const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
  const { playerId } = req.query;

  if (!playerId) {
    return return { statusCode: 400, body: JSON.stringify({ error: 'Player ID required' } };
  }

  if (!FACEIT_API_KEY) {
    return return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' } };
  }

  try {
    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/stats/cs2`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    } };
    
    if (!response.ok) {
      if (response.status === 404) {
        return return { statusCode: 404, body: JSON.stringify({ error: 'Stats not found for this player' } };
      }
      throw new Error(`HTTP error! status: ${response.status}` };
    }
    
    const data = await response.json( };
    res.json(data };
  } catch (error) {
    console.error('API Error:', error };
    return { statusCode: 500, body: JSON.stringify({ error: 'API error', details: error.message } };
  }
}
