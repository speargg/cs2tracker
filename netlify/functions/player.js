exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const nickname = event.queryStringParameters.nickname;
    const API_KEY = process.env.FACEIT_API_KEY;

    // 🔍 Próbujemy dokładnie dopasować
    let response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    // Jeśli znaleziono gracza – zwracamy
    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // 🔁 Jeśli nie znaleziono (np. 404) – robimy wyszukiwanie ogólne
    const searchRes = await fetch(`https://open.faceit.com/data/v4/search/players?nickname=${nickname}&limit=10`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const searchData = await searchRes.json();

    // Znajdź pierwszy pasujący nick (case-insensitive)
    const match = searchData.items?.find(player => 
      player.nickname.toLowerCase() === nickname.toLowerCase()
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
