// updateLeaderboard.js
import fetch from 'node-fetch';

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const EDGE_CONFIG_TOKEN = process.env.EDGE_CONFIG_TOKEN;
const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

const regions = ['europe', 'world'];
const LIMIT = 20000;

async function fetchLeaderboard(region) {
  console.log(`📥 Fetching ${region.toUpperCase()} leaderboard...`);
  const res = await fetch(`https://open.faceit.com/data/v4/rankings/games/cs2/regions/${region}?limit=${LIMIT}`, {
    headers: { Authorization: `Bearer ${FACEIT_API_KEY}` }
  });

  if (!res.ok) {
    throw new Error(`❌ Failed to fetch leaderboard for ${region}: ${res.status}`);
  }

  const data = await res.json();
  return data.items.map(item => ({
    elo: parseInt(item.stats.elo),
    position: item.position
  })).filter(e => !isNaN(e.elo));
}

async function updateEdgeConfig(region, leaderboard) {
  console.log(`📤 Uploading ${region.toUpperCase()} leaderboard to Edge Config...`);

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${EDGE_CONFIG_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: region, value: leaderboard }]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update Edge Config: ${errorText}`);
  }

  console.log(`✅ ${region.toUpperCase()} updated (${leaderboard.length} entries)`);
}

(async () => {
  try {
    for (const region of regions) {
      const leaderboard = await fetchLeaderboard(region);
      await updateEdgeConfig(region, leaderboard);
    }
    console.log('🎉 All leaderboards updated!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
