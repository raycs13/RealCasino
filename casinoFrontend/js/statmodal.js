let stats = null;

    async function fetchStats() {
            try {
                const response = await fetch('/api/roulette/stats');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching stats:', error);
                return null;
            }
    }

    function getColorClass(color) {
            switch(color.toLowerCase()) {
                case 'red': return 'color-red';
                case 'black': return 'color-black';
                case 'green': return 'color-green';
                default: return '';
            }
    }

    function renderStats(stats) {
            const formatNumber = num => new Intl.NumberFormat().format(num);
            
            const content = `
                <div class="stat-card">
                    <div class="stat-title">Longest Color Streak</div>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <span>
                                <span class="color-indicator ${getColorClass(stats.colorStreaks[0].winColor)}"></span>
                                ${stats.colorStreaks[0].winColor}
                            </span>
                            <span>${formatNumber(stats.colorStreaks[0].streak_length)} spins</span>
                        </div>
                        <div class="stat-item">
                            <span>Start Round</span>
                            <span>#${formatNumber(stats.colorStreaks[0].start_roundid)}</span>
                        </div>
                        <div class="stat-item">
                            <span>End Round</span>
                            <span>#${formatNumber(stats.colorStreaks[0].end_roundid)}</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Most Frequent Numbers</div>
                    <div class="stat-grid">
                        ${stats.topNumbers.map(num => `
                            <div class="stat-item">
                                <span>Number ${num.winNumber}</span>
                                <span>${formatNumber(num.count)} times</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Color Distribution</div>
                    <div class="stat-grid">
                        ${stats.colorDistribution.map(color => `
                            <div class="stat-item">
                                <span>
                                    <span class="color-indicator ${getColorClass(color.winColor)}"></span>
                                    ${color.winColor}
                                </span>
                                <span>${formatNumber(color.count)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Number Patterns</div>
                    <div class="stat-grid">
                        ${stats.evenOddDistribution.map(dist => `
                            <div class="stat-item">
                                <span>${dist.type.charAt(0).toUpperCase() + dist.type.slice(1)}</span>
                                <span>${formatNumber(dist.count)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Section Distribution</div>
                    <div class="stat-grid">
                        ${stats.sectionDistribution.map(section => `
                            <div class="stat-item">
                                <span>${section.section.toUpperCase()}</span>
                                <span>${formatNumber(section.count)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">High/Low Distribution</div>
                    <div class="stat-grid">
                        ${stats.highLowDistribution.map(dist => `
                            <div class="stat-item">
                                <span>${dist.range_type.charAt(0).toUpperCase() + dist.range_type.slice(1)}</span>
                                <span>${formatNumber(dist.count)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.getElementById('statsContent').innerHTML = content;
    }

    async function openModal() {
            document.getElementById('statsModal').style.display = 'block';
            if (!stats) {
                stats = await fetchStats();
                if (stats) {
                    renderStats(stats);
                } else {
                    document.getElementById('statsContent').innerHTML = 
                        '<div class="error">Error loading statistics. Please try again later.</div>';
                }
            }
        }

        function closeModal() {
            document.getElementById('statsModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('statsModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // Close modal on ESC key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
    });