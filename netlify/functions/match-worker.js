// match-worker.js
self.onmessage = function(e) {
    // Process matches data
    const processedMatches = processMatches(e.data.matches, e.data.playerId);
    
    // Send back to main thread
    self.postMessage(processedMatches);
};

function processMatches(matches, playerId) {
    // Your match processing logic here
    return matches.map(match => {
        return {
            mapName: match.map || 'Unknown',
            score: match.score || '0-0',
            stats: match.stats || {}
        };
    });
}
