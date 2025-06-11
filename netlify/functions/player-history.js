// player-stats.js - Netlify function for player statistics
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const playerId = event.queryStringParameters.playerId;
    const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

    if (!playerId || !FACEIT_API_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Player ID or API key missing' })
      };
    }

    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}`, {
      headers: {
        Authorization: `Bearer ${FACEIT_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const playerData = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(playerData)
    };

  } catch (error) {
    console.error('Player stats API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch player stats' })
    };
  }
};
