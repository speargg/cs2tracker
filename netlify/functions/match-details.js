exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  res.setHeader('Access-Control-Allow-Origin', '*' };
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS' };
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization' };
  
  if (req.method === 'OPTIONS') {
    return return { statusCode: 200).end( };
  }

  const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
  const { matchId } = req.query;

  if (!matchId || !FACEIT_API_KEY) {
    return return { statusCode: 400, body: JSON.stringify({ error: 'Match ID required' } };
  }

  try {
    const response = await fetch(`https://open.faceit.com/data/v4/matches/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    } };
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}` };
    }
    
    const matchDetails = await response.json( };
    res.json(matchDetails };
  } catch (error) {
    console.error('Match details API Error:', error };
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch match details' } };
  }
}
