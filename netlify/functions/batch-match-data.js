exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    try {
        const matchIds = event.queryStringParameters.matchIds.split(',');
        const playerId = event.queryStringParameters.playerId;
        const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

        const batchResults = await Promise.all(matchIds.map(async matchId => {
            const [detailsRes, statsRes] = await Promise.all([
                fetch(`https://open.faceit.com/data/v4/matches/${matchId}`, {
                    headers: { Authorization: `Bearer ${FACEIT_API_KEY}` }
                }),
                fetch(`https://open.faceit.com/data/v4/matches/${matchId}/stats`, {
                    headers: { Authorization: `Bearer ${FACEIT_API_KEY}` }
                })
            ]);

            const details = await detailsRes.json();
            const stats = await statsRes.json();

            return processMatchData(details, stats, playerId);
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(batchResults)
        };

    } catch (error) {
        console.error('Batch API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch batch data' })
        };
    }
};

function processMatchData(details, stats, playerId) {
    // Same processing logic you had in fetchDetailedMatchData
    // Return simplified object with just what you need for the UI
}
