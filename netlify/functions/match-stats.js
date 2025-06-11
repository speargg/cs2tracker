exports.handler = async function(event, context) {
  try {
    // Optional CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Converted logic from match-stats.js goes here
    // Example dummy response (replace this with actual logic)
    const data = { message: "This is the Netlify version of match-stats.js" };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
