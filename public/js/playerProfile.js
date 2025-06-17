// Player profile management functions

function updatePlayerProfile(playerData, playerStats, matchHistory, leetifyData = null) {
    try {
        // Store Leetify data globally
        window.currentLeetifyData = leetifyData;
        
        // Header info
        if (playerData?.nickname) {
            const nicknameElement = document.querySelector('.nickname');
            if (nicknameElement) {
                nicknameElement.textContent = playerData.nickname;
            }
            
            const avatarContainer = document.querySelector('.avatar');
            if (avatarContainer && playerData.avatar) {
                avatarContainer.innerHTML = `<img id="player-avatar" src="${playerData.avatar}" alt="Player avatar" />`;
            }
        }

        // Update Leetify statistics
        updateLeetifyStats(leetifyData);
        
        // Update FACEIT statistics
        updateFaceitStats(playerStats);

        // Update header ratings
        updateHeaderRatings(playerData, leetifyData);

        // Update social links
        updateSocialLinks(playerData, leetifyData);

        // Update matches
        const playerId = playerData?.player_id;
        if (matchHistory?.items && playerId) {
            window.updateMatchHistory(matchHistory.items, playerId);
        }

    } catch (error) {
        console.error("❌ Error updating player profile:", error);
        alert("Error displaying player data. Please try again.");
    }
}

function updateLeetifyStats(leetifyData) {
    if (leetifyData) {
        // Leetify Rating
        updateStatSafely('leetify-rating', leetifyData, ['ranks', 'leetify'], 'N/A', val => parseFloat(val).toFixed(2));
        
        // Matches (without thousands separator)
        updateStatSafely('leetify-matches', leetifyData, ['total_matches'], 'N/A', val => val.toString());
        
        // Winrate (convert to percentage)
        updateStatSafely('leetify-winrate', leetifyData, ['winrate'], 'N/A', val => Math.round(val * 100) + '%');
        
        // Aim Rating
        updateStatSafely('leetify-aim', leetifyData, ['rating', 'aim'], 'N/A', val => Math.round(val));
        
        // Utility
        updateStatSafely('leetify-utility', leetifyData, ['rating', 'utility'], 'N/A', val => Math.round(val));
        
        // Reaction Time (formatted with ms suffix)
        updateStatSafely('leetify-reaction', leetifyData, ['stats', 'reaction_time_ms'], 'N/A', val => parseFloat(val).toFixed(2) + ' ms');
    } else {
        // Set all Leetify stats to N/A if no data
        const leetifyStats = ['leetify-rating', 'leetify-matches', 'leetify-winrate', 'leetify-aim', 'leetify-utility', 'leetify-reaction'];
        leetifyStats.forEach(statId => {
            const element = document.getElementById(statId);
            if (element) element.textContent = 'N/A';
        });
    }
}

function updateFaceitStats(playerStats) {
    if (playerStats?.lifetime) {
        const stats = playerStats.lifetime;
        
        // K/D Ratio
        updateStatSafely('faceit-kd', stats, ['Average K/D Ratio'], 'N/A', val => parseFloat(val).toFixed(2));
        
        // ADR
        updateStatSafely('faceit-adr', stats, ['ADR'], 'N/A', val => Math.round(parseFloat(val)));
        
        // Matches (without thousands separator)
        updateStatSafely('faceit-matches', stats, ['Matches'], 'N/A', val => parseInt(val).toString());
        
        // Winrate
        updateStatSafely('faceit-winrate', stats, ['Win Rate %'], 'N/A', val => Math.round(parseFloat(val)) + '%');
        
        // Headshot %
        updateStatSafely('faceit-hs', stats, ['Average Headshots %'], 'N/A', val => Math.round(parseFloat(val)) + '%');
        
        // Longest Win Streak
        updateStatSafely('faceit-streak', stats, ['Longest Win Streak'], 'N/A', val => parseInt(val));
    } else {
        // Set all FACEIT stats to N/A if no data
        const faceitStats = ['faceit-kd', 'faceit-adr', 'faceit-matches', 'faceit-winrate', 'faceit-hs', 'faceit-streak'];
        faceitStats.forEach(statId => {
            const element = document.getElementById(statId);
            if (element) element.textContent = 'N/A';
        });
    }
}

function updateHeaderRatings(playerData, leetifyData) {
    // Update Premier rating with color coding
    if (leetifyData?.ranks?.premier) {
        const premierElement = document.querySelector('.premier-rating');
        if (premierElement) {
            const rating = Math.round(leetifyData.ranks.premier);
            const colorClass = getPremierRatingColor(rating);
            
            // Remove all existing color classes
            premierElement.className = premierElement.className.replace(/premier-rating-\w+/g, '');
            // Add new color class
            premierElement.classList.add(colorClass);
            
            premierElement.textContent = formatPremierRating(rating);
        }
    }

    // Update FACEIT rating
    if (playerData?.games?.cs2?.faceit_elo) {
        const faceitElement = document.querySelector('.faceit-rating');
        const levelElement = document.querySelector('.rating-elo');
        if (faceitElement) {
            faceitElement.textContent = Math.round(playerData.games.cs2.faceit_elo).toString();
        }
        if (levelElement && playerData.games.cs2.skill_level) {
            levelElement.textContent = `Level ${playerData.games.cs2.skill_level}`;
        }
    }
}

function updateSocialLinks(playerData, leetifyData) {
    const steamLink = document.getElementById('steam-link');
    const faceitLink = document.getElementById('faceit-link');
    const leetifyLink = document.getElementById('leetify-link');
    const csstatsLink = document.getElementById('csstats-link');

    // Steam link
    if (playerData?.games?.cs2?.game_player_id && steamLink) {
        steamLink.href = `https://steamcommunity.com/profiles/${playerData.games.cs2.game_player_id}`;
    }

    // Faceit link
    if (playerData?.nickname && faceitLink) {
        faceitLink.href = `https://www.faceit.com/en/players/${playerData.nickname}`;
    }

    // Leetify link
    if (playerData?.games?.cs2?.game_player_id && leetifyLink) {
        leetifyLink.href = `https://leetify.com/app/profile/${playerData.games.cs2.game_player_id}`;
    }

    // CSStats link
    if (playerData?.games?.cs2?.game_player_id && csstatsLink) {
        csstatsLink.href = `https://csstats.gg/player/${playerData.games.cs2.game_player_id}`;
    }
}

// Make function globally available
window.updatePlayerProfile = updatePlayerProfile;
