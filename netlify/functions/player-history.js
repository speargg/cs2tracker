// player-history.js - New Netlify function
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const playerId = event.queryStringParameters.playerId;
    const limit = event.queryStringParameters.limit || 20;
    const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

    if (!playerId || !FACEIT_API_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Player ID or API key missing' })
      };
    }

    // Try the player match history endpoint
    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?game=csgo&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${FACEIT_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const historyData = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(historyData)
    };

  } catch (error) {
    console.error('Player history API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch player history' })
    };
  }
};
