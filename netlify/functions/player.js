exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  const API_KEY = process.env.FACEIT_API_KEY;

  try {
    const { nickname, steamId } = event.queryStringParameters;

    let response;

    if (steamId) {
      // 🔍 Szukamy po SteamID64
      response = await fetch(`https://open.faceit.com/data/v4/players?game=cs2&steam_id=${steamId}`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ error: `SteamID lookup failed`, details: text })
        };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    if (!nickname) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing nickname or steamId' })
      };
    }

    // 🔍 Próbujemy dokładnie dopasować po nicku
    response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // 🔁 Jeśli nie znaleziono – szukamy ogólnie
    const searchRes = await fetch(`https://open.faceit.com/data/v4/search/players?nickname=${nickname}&limit=10`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const searchData = await searchRes.json();
    const match = searchData.items?.find(player => player.nickname.toLowerCase() === nickname.toLowerCase());

    if (!match) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Player not found by nickname' })
      };
    }

    response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${match.nickname}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const finalData = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(finalData)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
