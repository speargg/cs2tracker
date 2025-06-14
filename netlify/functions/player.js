exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const query = event.queryStringParameters.nickname; // Nadal używamy parametru 'nickname' ale może to być Steam ID
    const API_KEY = process.env.FACEIT_API_KEY;

    // 🔍 Sprawdź czy to Steam ID 64 (17 cyfr, zaczyna się od 765)
    const isSteamId = /^765\d{14}$/.test(query);
    
    let response;
    
    if (isSteamId) {
      console.log('🎮 Searching by Steam ID 64:', query);
      // Wyszukaj po Steam ID 64 używając game_player_id
      response = await fetch(`https://open.faceit.com/data/v4/players?game_player_id=${query}&game=cs2`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      });
    } else {
      console.log('👤 Searching by nickname:', query);
      // 🔍 Próbujemy dokładnie dopasować nickname
      response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${query}`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      });
    }

    // Jeśli znaleziono gracza – zwracamy
    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // 🔁 Jeśli nie znaleziono po Steam ID, nie próbujemy dalej
    if (isSteamId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Player not found with this Steam ID 64' })
      };
    }

    // 🔁 Jeśli nie znaleziono po nickname – robimy wyszukiwanie ogólne
    const searchRes = await fetch(`https://open.faceit.com/data/v4/search/players?nickname=${query}&limit=10`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const searchData = await searchRes.json();

    // Znajdź pierwszy pasujący nick (case-insensitive)
    const match = searchData.items?.find(player => 
      player.nickname.toLowerCase() === query.toLowerCase()
    );

    if (!match) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Player not found' })
      };
    }

    // Gdy znajdziemy, pobieramy dane ponownie
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
