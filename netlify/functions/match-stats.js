exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const matchId = event.queryStringParameters.matchId;
    const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

    if (!matchId || !FACEIT_API_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Match ID or API key missing' })
      };
    }

    const response = await fetch(`https://open.faceit.com/data/v4/matches/${matchId}/stats`, {
      headers: {
        Authorization: `Bearer ${FACEIT_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const matchStats = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(matchStats)
    };

  } catch (error) {
    console.error('Match stats API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch match stats' })
    };
  }
};
