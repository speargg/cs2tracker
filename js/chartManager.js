// Chart management functions

async function updatePerformanceChart(playerId) {
    if (!window.performanceChart) {
        console.warn("⚠️ performanceChart not ready yet — trying again in 200ms...");
        setTimeout(() => updatePerformanceChart(playerId), 200);
        return;
    }

    console.log("📈 Updating ELO chart for player:", playerId);

    const endpoint = `/.netlify/functions/faceitElo?playerId=${playerId}`;

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Faceit API error: ${res.status}`);

        const items = await res.json();

        if (!Array.isArray(items)) {
            console.warn("⚠️ API response is not an array:", items);
            return;
        }

        const eloHistory = items
            .filter(item => item.elo && item.date)
            .map(item => {
                const elo = parseInt(item.elo);
                const date = new Date(item.date);
                const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                return { elo, label };
            })
            .reverse();

        if (eloHistory.length === 0) {
            console.warn("⚠️ No ELO data to display.");
            return;
        }

        const labels = eloHistory.map(d => d.label);
        const values = eloHistory.map(d => d.elo);

        console.log("✅ ELO:", values);
        console.log("📅 Dates:", labels);

        const minElo = Math.min(...values);
        const maxElo = Math.max(...values);
        const padding = Math.max((maxElo - minElo) * 0.2, 150);

        window.performanceChart.options.scales.y.min = Math.max(0, Math.floor(minElo - padding));
        window.performanceChart.options.scales.y.max = Math.min(5000, Math.ceil(maxElo + padding));
        window.performanceChart.data.labels = labels;
        window.performanceChart.data.datasets[0].data = values;
        window.performanceChart.update();

        updateEloChange();

        console.log("✅ ELO chart updated");

    } catch (err) {
        console.error("❌ Error updating ELO chart:", err);
    }
}

function updateEloChange() {
    if (!window.performanceChart || !window.performanceChart.data.datasets[0].data.length) {
        return;
    }
    
    const data = window.performanceChart.data.datasets[0].data;
    const firstElo = data[0];
    const lastElo = data[data.length - 1];
    const change = lastElo - firstElo;
    const eloChangeElement = document.getElementById('eloChange');
    
    if (!eloChangeElement) return;
    
    if (change >= 0) {
        eloChangeElement.textContent = `+${change} ELO`;
        eloChangeElement.className = 'elo-change elo-positive';
    } else {
        eloChangeElement.textContent = `${change} ELO`;
        eloChangeElement.className = 'elo-change elo-negative';
    }
}

// Make function globally available
window.updatePerformanceChart = updatePerformanceChart;
