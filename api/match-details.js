export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
  const { matchId } = req.query;

  if (!matchId || !FACEIT_API_KEY) {
    return res.status(400).json({ error: 'Match ID required' });
  }

  try {
    const response = await fetch(`https://open.faceit.com/data/v4/matches/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const matchDetails = await response.json();
    res.json(matchDetails);
  } catch (error) {
    console.error('Match details API Error:', error);
    res.status(500).json({ error: 'Failed to fetch match details' });
  }
}
