const fetch = require("node-fetch");

/**
 * Netlify Serverless Function to proxy Faceit Stats API and bypass CORS
 * GET /.netlify/functions/faceitElo?playerId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
exports.handler = async function (event) {
  const playerId = event.queryStringParameters.playerId;

  if (!playerId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing playerId in query string" }),
    };
  }

  const endpoint = `https://api.faceit.com/stats/v1/stats/time/users/${playerId}/games/cs2?size=20`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        // optionally add fake headers to mimic browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Faceit API returned status ${res.status}`);
    }

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Access-Control-Allow-Origin": "*", // allow from any frontend
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    console.error("❌ Failed to fetch Faceit stats:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch Faceit data", details: err.message }),
    };
  }
};
