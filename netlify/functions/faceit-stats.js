const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { playerId } = event.queryStringParameters;
    
    if (!playerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Player ID is required' })
      };
    }

    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/stats/cs2`, {
      headers: {
        'Authorization': `Bearer YOUR_FACEIT_API_KEY`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Faceit API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Faceit Stats API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch player stats' })
    };
  }
};
