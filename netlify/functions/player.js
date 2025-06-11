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
  const { nickname } = req.query;

  console.log('API Key exists:', !!FACEIT_API_KEY };
  console.log('Searching for nickname:', nickname };

  if (!nickname) {
    return return { statusCode: 400, body: JSON.stringify({ error: 'Nickname required' } };
  }

  if (!FACEIT_API_KEY) {
    console.error('FACEIT_API_KEY not found in environment variables' };
    return return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' } };
  }

  try {
    console.log('Making request to FACEIT API...' };
    const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    } };
    
    console.log('FACEIT API response status:', response.status };
    
    if (!response.ok) {
      const errorText = await response.text( };
      console.error('FACEIT API error:', response.status, errorText };
      
      if (response.status === 404) {
        return return { statusCode: 404, body: JSON.stringify({ error: 'Player not found' } };
      }
      if (response.status === 401) {
        return return { statusCode: 500, body: JSON.stringify({ error: 'Invalid API key' } };
      }
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}` };
    }
    
    const data = await response.json( };
    console.log('Successfully retrieved player data' };
    res.json(data };
  } catch (error) {
    console.error('API Error:', error };
    return { statusCode: 500, body: JSON.stringify({ error: 'API error', details: error.message } };
  }
}
