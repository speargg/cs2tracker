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
    const { playerId, size = '20' } = event.queryStringParameters;
    
    if (!playerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Player ID is required' })
      };
    }

    // Wywołaj API Faceit Stats bez klucza API (może nie być wymagany)
    const response = await fetch(
      `https://api.faceit.com/stats/v1/stats/time/users/${playerId}/games/cs2?size=${size}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CS2-Stats-Tracker'
        }
      }
    );

    if (!response.ok) {
      console.error(`Faceit Stats API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Faceit Stats API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('Faceit Stats API response:', JSON.stringify(data, null, 2));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Faceit ELO API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch ELO history',
        details: error.message
      })
    };
  }
};
