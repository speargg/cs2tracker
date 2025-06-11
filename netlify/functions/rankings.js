exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const elo = event.queryStringParameters.elo;
    const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

    if (!elo || !FACEIT_API_KEY) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing elo or API key' })
      };
    }

    const res = await fetch(`https://open.faceit.com/data/v4/rankings/games/cs2/regions/EU?elo=${elo}&limit=1`, {
      headers: {
        Authorization: `Bearer ${FACEIT_API_KEY}`
      }
    });

    const data = await res.json();

    // Sample response manipulation — adjust as needed
    const ranking = {
      europe: data.position || null,
      world: null // If you don't have global ranking data
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(ranking)
    };

  } catch (error) {
    console.error('Ranking API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch ranking' })
    };
  }
};
