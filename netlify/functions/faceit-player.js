const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { nickname } = event.queryStringParameters;
    
    if (!nickname) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nickname is required' })
      };
    }

    // Call Faceit API with proper headers
    const response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`, {
      headers: {
        'Authorization': `Bearer YOUR_FACEIT_API_KEY`, // You need to get this from Faceit
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
    console.error('Faceit API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch player data' })
    };
  }
};
