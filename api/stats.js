export default async function handler(req, res) {
  const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
  const { playerId } = req.query;

  try {
    const response = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/stats/cs2`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'API error' });
  }
}
