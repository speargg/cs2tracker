// Global variables
let isMatchesExpanded = false;
let currentLeetifyData = null;
let playerEloHistory = [];
let currentPlayerData = null;
let performanceChart = null;

// API configuration
const API_BASE_URL = '/.netlify/functions';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeChart();
    handleURLRouting();
    setupEventListeners();
});

// Theme management
function initializeTheme() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.onclick = toggleTheme;
    toggleBtn.innerHTML = '<span class="theme-icon">🌙</span>';
    document.body.appendChild(toggleBtn);

    const savedTheme = localStorage.getItem('theme');
    const themeIcon = toggleBtn.querySelector('.theme-icon');

    if (savedTheme === 'black') {
        document.body.classList.add('black-theme');
        themeIcon.textContent = '☀️';
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    body.classList.toggle('black-theme');
    
    if (body.classList.contains('black-theme')) {
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'black');
    } else {
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'blue');
    }
}

// Chart initialization
function initializeChart() {
    // Wait for Chart.js to load
    const checkChart = () => {
        if (typeof Chart !== 'undefined') {
            const canvas = document.getElementById('performanceChart');
            if (!canvas) {
                console.error('❌ Chart canvas not found!');
                return;
            }

            const ctx = canvas.getContext('2d');
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Faceit ELO',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 20, 25, 0.95)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: 'rgba(37, 99, 235, 0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                title: context => `${context[0].label}`,
                                label: context => {
                                    const currentElo = context.parsed.y;
                                    const index = context.dataIndex;
                                    const data = context.dataset.data;
                                    if (index === 0) return `ELO: ${currentElo}`;
                                    const diff = currentElo - data[index - 1];
                                    return [`ELO: ${currentElo}`, diff >= 0 ? `+${diff}` : `${diff}`];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                stepSize: 100,
                                color: '#94a3b8',
                                font: { family: 'Inter' }
                            },
                            grid: { color: 'rgba(37, 99, 235, 0.2)' }
                        },
                        x: {
                            ticks: {
                                color: '#94a3b8',
                                font: { family: 'Inter' }
                            },
                            grid: { color: 'rgba(37, 99, 235, 0.2)' }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
            console.log('✅ Chart initialized');
        } else {
            setTimeout(checkChart, 100);
        }
    };
    checkChart();
}

// URL routing and nickname handling
function handleURLRouting() {
    let nickname = window.location.pathname.replace(/^\/+|\/+$/g, '');
    
    if (nickname && nickname !== 'main.html' && nickname !== 'index.html') {
        const input = document.querySelector('.search-input');
        if (input) {
            input.value = nickname;
            searchPlayer();
        }
    }
}

// Event listeners
function setupEventListeners() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPlayer();
            }
        });
    }
}

// Main search function with parallel API calls
async function searchPlayer() {
    console.log("🔍 Starting search...");
    
    const searchInput = document.querySelector('.search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('Please enter a Faceit nickname or Steam ID 64');
        return;
    }

    window.history.pushState({}, '', `/${query}`);
    
    const searchBtn = document.querySelector('.search-btn');
    const originalContent = searchBtn.innerHTML;
    
    try {
        // Show mini loading indicator
        searchBtn.innerHTML = `
            <div style="
                width: 16px;
                height: 16px;
                border: 2px solid #fff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
        `;
        
        console.log("📡 Fetching all data in parallel...");
        
        // Fetch player data first to get player ID
        const playerData = await fetchPlayerData(query);
        currentPlayerData = playerData;
        
        // Now fetch all other data in parallel using the player ID
        const [playerStats, matchHistory, eloHistory, leetifyData] = await Promise.all([
            fetchPlayerStats(playerData.player_id),
            fetchMatchHistory(playerData.player_id),
            fetchEloHistory(playerData.player_id),
            playerData.games?.cs2?.game_player_id ? 
                fetchLeetifyData(playerData.games.cs2.game_player_id) : 
                Promise.resolve(null)
        ]);
        
        console.log("✅ All data received");
        
        playerEloHistory = eloHistory || [];
        
        // Update UI
        updatePlayerProfile(playerData, playerStats, matchHistory, leetifyData);
        
        if (playerData.player_id) {
            updatePerformanceChart(playerData.player_id);
        }
        
    } catch (error) {
        console.error("❌ Error in searchPlayer:", error);
        alert('Player not found or API error. Please try again.');
    } finally {
        searchBtn.innerHTML = originalContent;
        console.log("🏁 Search process finished");
    }
}

// API fetch functions
async function fetchPlayerData(nickname) {
    const response = await fetch(`${API_BASE_URL}/player?nickname=${encodeURIComponent(nickname)}`);
    if (!response.ok) {
        throw new Error(`Player not found (${response.status})`);
    }
    return response.json();
}

async function fetchPlayerStats(playerId) {
    const response = await fetch(`${API_BASE_URL}/stats?playerId=${encodeURIComponent(playerId)}`);
    if (!response.ok) {
        throw new Error(`Stats not found (${response.status})`);
    }
    return response.json();
}

async function fetchMatchHistory(playerId) {
    const response = await fetch(`${API_BASE_URL}/matches?playerId=${encodeURIComponent(playerId)}`);
    if (!response.ok) {
        throw new Error(`Match history not found (${response.status})`);
    }
    return response.json();
}

async function fetchEloHistory(playerId) {
    try {
        const response = await fetch(`/.netlify/functions/faceitElo?playerId=${playerId}`);
        if (!response.ok) return [];
        return response.json();
    } catch (error) {
        console.error('❌ Error fetching ELO history:', error);
        return [];
    }
}

async function fetchLeetifyData(steamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/leetify-stats?steamId=${encodeURIComponent(steamId)}`);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('⚠️ Player not found on Leetify');
                return null;
            }
            throw new Error(`Leetify API error: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('❌ Error fetching Leetify data:', error);
        return null;
    }
}

// Utility functions
function updateStatSafely(elementId, source, keys, fallback = 'N/A', transform = val => val) {
    try {
        let value = source;
        for (let key of keys) {
            if (value && key in value) {
                value = value[key];
            } else {
                value = null;
                break;
            }
        }
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value != null ? transform(value) : fallback;
        }
    } catch (e) {
        console.warn(`⚠️ Failed to update stat: ${elementId}`, e);
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = fallback;
        }
    }
}

function getPremierRatingColor(rating) {
    if (rating >= 30000) return 'premier-rating-gold';
    if (rating >= 25000) return 'premier-rating-red';
    if (rating >= 20000) return 'premier-rating-pink';
    if (rating >= 15000) return 'premier-rating-purple';
    if (rating >= 10000) return 'premier-rating-blue';
    if (rating >= 5000) return 'premier-rating-light-blue';
    return 'premier-rating-grey';
}

function formatPremierRating(rating) {
    return rating.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Make functions globally available
window.searchPlayer = searchPlayer;
window.toggleMoreMatches = toggleMoreMatches;

// Import other modules
import './playerProfile.js';
import './matchHistory.js';
import './chartManager.js';
