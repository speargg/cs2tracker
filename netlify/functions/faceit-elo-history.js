// Netlify function to fetch Faceit ELO history
exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  }

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" }),
    }
  }

  try {
    // Get player ID from query parameters
    const playerId = event.queryStringParameters.playerId

    if (!playerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Player ID is required" }),
      }
    }

    // Get optional parameters with defaults
    const size = event.queryStringParameters.size || 100

    // Calculate time range (default: last year)
    const currentTime = Math.floor(Date.now() / 1000)
    const oneYearAgo = currentTime - 365 * 24 * 60 * 60
    const from = event.queryStringParameters.from || oneYearAgo
    const to = event.queryStringParameters.to || currentTime

    // Construct the URL for the unofficial Faceit API
    const url = `https://api.faceit.com/stats/v1/stats/time/users/${playerId}/games/cs2?size=${size}&from=${from}000&to=${to}000`

    console.log(`Fetching ELO history from: ${url}`)

    // Make the request to Faceit API
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Faceit API error: ${response.status} ${response.statusText}`)
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Faceit API error: ${response.status} ${response.statusText}`,
        }),
      }
    }

    // Parse the response
    const data = await response.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No ELO history data available")
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ items: [] }),
      }
    }

    // Process the data to extract ELO information
    const eloHistory = data
      .map((match) => ({
        date: match.date,
        elo: match.elo || null,
        matchId: match.matchId || null,
        gameMode: match.gameMode || null,
      }))
      .filter((item) => item.elo !== null)

    // Sort by date (oldest first)
    eloHistory.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Return the processed data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: eloHistory,
        total: eloHistory.length,
      }),
    }
  } catch (error) {
    console.error("Error in faceit-elo-history function:", error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    }
  }
}
