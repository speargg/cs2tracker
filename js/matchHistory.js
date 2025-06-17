// Match history management functions

async function updateMatchHistory(matches, playerId) {
    const matchesList = document.querySelector('.matches-list');
    if (!matchesList) return;
    
    window.isMatchesExpanded = false;
    const expandBtn = document.querySelector('.expand-btn');
    if (expandBtn) {
        expandBtn.textContent = 'Show More Matches';
    }

    // Clear existing match cards
    const existingMatches = matchesList.querySelectorAll('.match-card');
    existingMatches.forEach(match => match.remove());

    // Filter only 5v5 matches
    const fiveVFiveMatches = matches.filter(match => {
        return match.game_mode === '5v5' || 
               (match.teams?.faction1?.players?.length === 5 && match.teams?.faction2?.players?.length === 5);
    });

    // Split data into visible and hidden
    const visibleMatches = fiveVFiveMatches.slice(0, 5);
    const hiddenMatches = fiveVFiveMatches.slice(5, 10);

    // Create visible match cards in parallel
    const visibleMatchCards = await Promise.all(
        visibleMatches.map(m => createEnhancedMatchCard(m, playerId))
    );
    visibleMatchCards.forEach(card => matchesList.appendChild(card));

    // Create hidden match cards in parallel
    const hiddenMatchCards = await Promise.all(
        hiddenMatches.map(m => createEnhancedMatchCard(m, playerId))
    );
    hiddenMatchCards.forEach(card => {
        card.classList.add('hidden-matches');
        card.style.display = 'none';
        matchesList.appendChild(card);
    });
}

async function createEnhancedMatchCard(match, playerId) {
    const matchCard = document.createElement('div');
    matchCard.className = 'match-card';
    
    try {
        // Extract basic match info
        const matchId = match.match_id || match.id;
        const status = match.status || 'unknown';
        
        // Determine which team the player was on
        let playerTeam = null;
        let enemyTeam = null;
        
        if (match.teams && match.teams.faction1 && match.teams.faction2) {
            const inFaction1 = match.teams.faction1.players.some(player => player.player_id === playerId);
            const inFaction2 = match.teams.faction2.players.some(player => player.player_id === playerId);
            
            if (inFaction1) {
                playerTeam = 'faction1';
                enemyTeam = 'faction2';
            } else if (inFaction2) {
                playerTeam = 'faction2';
                enemyTeam = 'faction1';
            }
        }
        
        // Initial values
        let mapName = 'Loading...';
        let scoreDisplay = '- - -';
        let playerStats = { kills: '-', deaths: '-', adr: '-', hsPercent: '-', kdRatio: '-' };
        
        // Determine match result
        const result = determineMatchResult(match, playerTeam, status);
        const dateDisplay = formatMatchDate(match);
        
        // Calculate ELO change
        const eloChange = calculateEloChange(match.started_at || match.finished_at, matchId);
        let eloChangeDisplay = '';
        let eloChangeClass = 'match-elo-neutral';
        
        if (eloChange > 0) {
            eloChangeDisplay = `+${eloChange} ELO`;
            eloChangeClass = 'match-elo-positive';
        } else if (eloChange < 0) {
            eloChangeDisplay = `${eloChange} ELO`;
            eloChangeClass = 'match-elo-negative';
        } else {
            eloChangeDisplay = 'N/A';
        }
        
        // Create initial card with loading state
        matchCard.innerHTML = `
            <div class="match-left">
                <div class="match-result-container">
                    <div class="match-result ${result.class}">${result.symbol}</div>
                    ${dateDisplay ? `<div class="match-date">${dateDisplay}</div>` : ''}
                </div>
                <div class="match-info">
                    <div class="match-map">${mapName}</div>
                    <div class="match-elo-change ${eloChangeClass}">${eloChangeDisplay}</div>
                </div>
            </div>
            <div class="match-score">
                <div class="match-score-main">${scoreDisplay}</div>
                <div class="match-kd-ratio">${playerStats.kdRatio}</div>
            </div>
            <div class="match-stats">
                <div class="match-stat-value">${playerStats.adr}</div>
                <div class="match-stat-value">${playerStats.hsPercent}</div>
            </div>
        `;
        
        // Fetch detailed match data asynchronously
        if (status === 'finished') {
            fetchDetailedMatchData(matchId, playerId).then(details => {
                if (details) {
                    updateEnhancedMatchCard(matchCard, details, result, eloChangeDisplay, eloChangeClass, dateDisplay);
                }
            }).catch(error => {
                console.error('Error loading match details:', error);
                updateEnhancedMatchCardBasic(matchCard, match, result, playerTeam, enemyTeam, eloChangeDisplay, eloChangeClass, dateDisplay);
            });
        } else {
            updateEnhancedMatchCardBasic(matchCard, match, result, playerTeam, enemyTeam, eloChangeDisplay, eloChangeClass, dateDisplay);
        }
        
    } catch (error) {
        console.error('Error creating match card:', error, match);
        matchCard.innerHTML = `
            <div class="match-left">
                <div class="match-result-container">
                    <div class="match-result loss">L</div>
                </div>
                <div class="match-info">
                    <div class="match-map">Unknown Match</div>
                    <div class="match-elo-change match-elo-neutral">N/A</div>
                </div>
            </div>
            <div class="match-score">
                <div class="match-score-main">- - -</div>
                <div class="match-kd-ratio">-</div>
            </div>
            <div class="match-stats">
                <div class="match-stat-value">-</div>
                <div class="match-stat-value">-</div>
            </div>
        `;
    }
    
    return matchCard;
}

function determineMatchResult(match, playerTeam, status) {
    if (status === 'finished' && match.results) {
        if (match.results.winner === playerTeam) {
            return { symbol: 'W', class: 'win' };
        } else {
            return { symbol: 'L', class: 'loss' };
        }
    } else if (status === 'ongoing') {
        return { symbol: '?', class: 'ongoing' };
    } else if (status === 'cancelled' || status === 'aborted') {
        return { symbol: '-', class: 'cancelled' };
    } else {
        return { symbol: 'L', class: 'loss' };
    }
}

function formatMatchDate(match) {
    if (match.started_at || match.finished_at) {
        const timestamp = match.started_at || match.finished_at;
        const matchDate = new Date(timestamp * 1000);
        return matchDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
    return '';
}

function calculateEloChange(matchTimestamp, matchId) {
    if (!window.playerEloHistory || window.playerEloHistory.length === 0) {
        return 0;
    }

    // Find the ELO entry for this match
    const matchEloEntry = window.playerEloHistory.find(entry => {
        const entryDate = new Date(entry.date);
        const matchDate = new Date(matchTimestamp * 1000);
        // Allow for some time difference (within 1 hour)
        return Math.abs(entryDate.getTime() - matchDate.getTime()) < 3600000;
    });

    if (!matchEloEntry) {
        return 0;
    }

    // Find the previous ELO entry
    const currentIndex = window.playerEloHistory.indexOf(matchEloEntry);
    if (currentIndex === -1 || currentIndex === window.playerEloHistory.length - 1) {
        return 0;
    }

    const previousEloEntry = window.playerEloHistory[currentIndex + 1]; // Array is in reverse chronological order
    if (!previousEloEntry) {
        return 0;
    }

    const currentElo = parseInt(matchEloEntry.elo);
    const previousElo = parseInt(previousEloEntry.elo);
    
    return currentElo - previousElo;
}

async function fetchDetailedMatchData(matchId, playerId) {
    try {
        const [matchDetails, matchStats] = await Promise.all([
            fetch(`/.netlify/functions/match-details?matchId=${matchId}`).then(res => res.json()),
            fetch(`/.netlify/functions/match-stats?matchId=${matchId}`).then(res => res.json())
        ]);
        
        const result = {
            mapName: 'Unknown',
            score: '- - -',
            playerStats: { kills: '-', deaths: '-', adr: '-', hsPercent: '-', kdRatio: '-' }
        };

        // Map name
        if (matchDetails?.voting?.map?.entities?.[0]?.game_map_id) {
            result.mapName = cleanMapName(matchDetails.voting.map.entities[0].game_map_id);
        } else if (matchDetails?.rounds?.[0]?.round_stats?.Map) {
            result.mapName = cleanMapName(matchDetails.rounds[0].round_stats.Map);
        } else if (matchDetails?.map) {
            result.mapName = cleanMapName(matchDetails.map);
        } else if (matchDetails?.voting?.map?.name) {
            result.mapName = cleanMapName(matchDetails.voting.map.name);
        }

        // Score
        try {
            let score1 = null;
            let score2 = null;

            if (matchStats?.rounds?.[0]?.teams) {
                const teams = matchStats.rounds[0].teams;
                
                if (teams.length >= 2) {
                    if (teams[0].team_stats?.['Final Score'] && teams[1].team_stats?.['Final Score']) {
                        score1 = parseInt(teams[0].team_stats['Final Score']);
                        score2 = parseInt(teams[1].team_stats['Final Score']);
                    } else if (teams[0].team_stats?.['Rounds Won'] && teams[1].team_stats?.['Rounds Won']) {
                        score1 = parseInt(teams[0].team_stats['Rounds Won']);
                        score2 = parseInt(teams[1].team_stats['Rounds Won']);
                    }
                }
            }

            if (score1 != null && score2 != null && (score1 > 1 || score2 > 1)) {
                result.score = `${score1}:${score2}`;
            }
        } catch (err) {
            console.warn('❌ Error determining score:', err);
        }

        // Player stats
        if (matchStats?.rounds?.[0]?.teams) {
            const teams = matchStats.rounds[0].teams;
            let playerMatchStats = null;

            for (const team of teams) {
                const found = team.players.find(p => p.player_id === playerId);
                if (found) {
                    playerMatchStats = found;
                    break;
                }
            }

            if (playerMatchStats?.player_stats) {
                const stats = playerMatchStats.player_stats;
                
                const adrValue = stats['Average Damage per Round'] || 
                                stats['ADR'] || 
                                stats['adr'] || 
                                stats['Damage/Round'];
                
                const kills = stats.Kills || stats.kills || 0;
                const deaths = stats.Deaths || stats.deaths || 1;
                
                result.playerStats = {
                    kills: kills,
                    deaths: deaths,
                    adr: adrValue ? Math.round(parseFloat(adrValue)) : '-',
                    hsPercent: stats['Headshots %'] || stats['HS%'] || stats['headshots_percentage']
                        ? `${Math.round(parseFloat(stats['Headshots %'] || stats['HS%'] || stats['headshots_percentage']))}%`
                        : '-',
                    kdRatio: `${kills}/${deaths}`
                };
            }
        }

        return result;

    } catch (error) {
        console.error('❌ Error fetching detailed match data:', error);
        return null;
    }
}

function cleanMapName(mapName) {
    if (!mapName || mapName === 'Unknown') return 'Unknown';
    
    // Remove common prefixes and clean up
    let cleaned = mapName.replace(/^(de_|cs_|ar_)/, '').replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    cleaned = cleaned.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return cleaned;
}

function updateEnhancedMatchCard(matchCard, details, result, eloChangeDisplay, eloChangeClass, dateDisplay) {
    matchCard.innerHTML = `
        <div class="match-left">
            <div class="match-result-container">
                <div class="match-result ${result.class}">${result.symbol}</div>
                ${dateDisplay ? `<div class="match-date">${dateDisplay}</div>` : ''}
            </div>
            <div class="match-info">
                <div class="match-map">${details.mapName}</div>
                <div class="match-elo-change ${eloChangeClass}">${eloChangeDisplay}</div>
            </div>
        </div>
        <div class="match-score">
            <div class="match-score-main">${details.score}</div>
            <div class="match-kd-ratio">${details.playerStats.kdRatio}</div>
        </div>
        <div class="match-stats">
            <div class="match-stat-value">${details.playerStats.adr}</div>
            <div class="match-stat-value">${details.playerStats.hsPercent}</div>
        </div>
    `;
}

function updateEnhancedMatchCardBasic(matchCard, match, result, playerTeam, enemyTeam, eloChangeDisplay, eloChangeClass, dateDisplay) {
    let scoreDisplay = '- - -';
    
    if (match.results && match.results.score && playerTeam && enemyTeam) {
        const playerScore = match.results.score[playerTeam] || 0;
        const enemyScore = match.results.score[enemyTeam] || 0;
        scoreDisplay = `${playerScore}:${enemyScore}`;
    }
    
    let mapName = 'Unknown';
    
    if (match.voting?.map?.name) {
        mapName = cleanMapName(match.voting.map.name);
    } else if (match.voting?.map?.pick?.[0]) {
        mapName = cleanMapName(match.voting.map.pick[0]);
    } else if (match.map) {
        mapName = cleanMapName(match.map);
    } else if (match.maps?.[0]) {
        mapName = cleanMapName(match.maps[0]);
    } else {
        mapName = '5v5 Matchmaking';
    }
    
    const mapElement = matchCard.querySelector('.match-map');
    const scoreElement = matchCard.querySelector('.match-score-main');
    
    if (mapElement && mapElement.textContent === 'Loading...') {
        mapElement.textContent = mapName;
    }
    if (scoreElement) scoreElement.textContent = scoreDisplay;
}

function toggleMoreMatches() {
    const hiddenMatches = document.querySelectorAll('.match-card.hidden-matches');
    const expandBtn = document.querySelector('.expand-btn');
    
    if (!hiddenMatches.length || !expandBtn) return;
    
    if (window.isMatchesExpanded) {
        // Hide matches
        hiddenMatches.forEach(match => {
            match.style.display = 'none';
        });
        expandBtn.textContent = 'Show More Matches';
        window.isMatchesExpanded = false;
    } else {
        // Show matches
        hiddenMatches.forEach(match => {
            match.style.display = 'grid';
        });
        expandBtn.textContent = 'Show Less Matches';
        window.isMatchesExpanded = true;
    }
}

// Make functions globally available
window.updateMatchHistory = updateMatchHistory;
window.toggleMoreMatches = toggleMoreMatches;
