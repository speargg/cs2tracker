exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const playerId = event.queryStringParameters.playerId;

    const res = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?game=cs2&limit=10`, {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
      }
    });

    const data = await res.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
