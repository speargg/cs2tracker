import {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
 get } from '@vercel/edge-config';

exports.handler = async function(event, context) {
  const { elo } = req.query;
  if (!elo) return return { statusCode: 400, body: JSON.stringify({ error: 'Missing ELO' } };

  const eloValue = parseInt(elo };

  const estimateRank = (leaderboard) => {
    for (let i = 1; i < leaderboard.length; i++) {
      const current = leaderboard[i];
      const prev = leaderboard[i - 1];
      if (eloValue >= current.elo && eloValue <= prev.elo) {
        const ratio = (eloValue - current.elo) / (prev.elo - current.elo };
        return Math.round(current.position + ratio * (prev.position - current.position) };
      }
    }
    return leaderboard[leaderboard.length - 1]?.position + 1 || 99999;
  };

  const worldBoard = await get('world' };
  const europeBoard = await get('europe' };

  const result = {
    world: estimateRank(worldBoard),
    europe: estimateRank(europeBoard)
  };

  res.json(result };
}
