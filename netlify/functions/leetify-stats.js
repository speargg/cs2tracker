exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const steamId = event.queryStringParameters.steamId;

    if (!steamId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Steam ID is required' })
      };
    }

    const response = await fetch(`https://api-public.cs-prod.leetify.com/v2/profiles/${steamId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Player not found on Leetify' })
        };
      }
      throw new Error(`Leetify API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Leetify API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch Leetify data' })
    };
  }
};
