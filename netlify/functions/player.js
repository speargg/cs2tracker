exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const nickname = event.queryStringParameters.nickname;

    const res = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
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
