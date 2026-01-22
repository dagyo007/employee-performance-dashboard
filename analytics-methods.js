    // Render Analytics Dashboard
    renderAnalytics() {
        const perfData = this.dataProcessor.performanceData || {};
        
        // Combine all data for analytics
        const allData = [
            ...(perfData.master || []),
            ...(perfData.sales || []),
            ...(perfData.subscription || [])
        ];

        if (allData.length === 0) {
            // Show empty state
            document.getElementById('analytics-total-count').textContent = '0';
            document.getElementById('analytics-avg-achievement').textContent = '0%';
            document.getElementById('analytics-avg-growth').textContent = '0%';
            document.getElementById('analytics-excellent-count').textContent = '0';
            return;
        }

        // Calculate summary stats
        const totalCount = allData.length;
        const avgAchievement = allData.reduce((sum, item) => sum + (item.achievement || 0), 0) / totalCount;
        const avgGrowth = allData.reduce((sum, item) => sum + (item.growthYoY || item.growthMoM || 0), 0) / totalCount;
        const excellentCount = allData.filter(item => (item.achievement || 0) >= 100).length;

        // Update summary cards
        document.getElementById('analytics-total-count').textContent = totalCount;
        document.getElementById('analytics-avg-achievement').textContent = avgAchievement.toFixed(1) + '%';
        document.getElementById('analytics-avg-growth').textContent = avgGrowth.toFixed(1) + '%';
        document.getElementById('analytics-excellent-count').textContent = excellentCount;

        // Render charts
        this.renderAnalyticsCharts(allData);

        // Render rankings
        this.renderAnalyticsRankings(allData);
    }

    // Render Analytics Charts
    renderAnalyticsCharts(data) {
        // Achievement Distribution Chart
        const achievementCtx = document.getElementById('analytics-achievement-chart');
        if (achievementCtx) {
            const ranges = {
                '150%+': 0,
                '120-150%': 0,
                '100-120%': 0,
                '80-100%': 0,
                '<80%': 0
            };

            data.forEach(item => {
                const ach = item.achievement || 0;
                if (ach >= 150) ranges['150%+']++;
                else if (ach >= 120) ranges['120-150%']++;
                else if (ach >= 100) ranges['100-120%']++;
                else if (ach >= 80) ranges['80-100%']++;
                else ranges['<80%']++;
            });

            if (this.charts.achievementChart) {
                this.charts.achievementChart.destroy();
            }

            this.charts.achievementChart = new Chart(achievementCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(ranges),
                    datasets: [{
                        data: Object.values(ranges),
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(220, 38, 38, 0.8)'
                        ],
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#ffffff',
                                font: { size: 11, family: 'Inter' }
                            }
                        }
                    }
                }
            });
        }

        // Growth Chart
        const growthCtx = document.getElementById('analytics-growth-chart');
        if (growthCtx) {
            const sorted = [...data].sort((a, b) => (b.growthYoY || b.growthMoM || 0) - (a.growthYoY || a.growthMoM || 0));
            const top10 = sorted.slice(0, 10);
            
            const labels = top10.map((item, idx) => item.name || item.group || `항목 ${idx + 1}`);
            const growthData = top10.map(item => item.growthYoY || item.growthMoM || 0);

            if (this.charts.growthChart) {
                this.charts.growthChart.destroy();
            }

            this.charts.growthChart = new Chart(growthCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '성장률 (%)',
                        data: growthData,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff',
                                font: { size: 12, family: 'Inter' }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                callback: (value) => value + '%'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: { size: 10 }
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }

    // Render Analytics Rankings
    renderAnalyticsRankings(data) {
        // Top 10
        const topSorted = [...data].sort((a, b) => (b.achievement || 0) - (a.achievement || 0));
        const top10 = topSorted.slice(0, 10);
        
        const topTableBody = document.querySelector('#analytics-top-table tbody');
        if (topTableBody) {
            topTableBody.innerHTML = '';
            top10.forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
                    <td><strong>${item.name || item.group || '-'}</strong></td>
                    <td style="text-align: right;">${this.formatCurrency(item.currentMonth || item.currentAmount || 0)}</td>
                    <td style="text-align: center; font-weight: 600; color: ${(item.achievement || 0) >= 100 ? '#10b981' : '#f59e0b'};">${(item.achievement || 0).toFixed(1)}%</td>
                `;
                topTableBody.appendChild(tr);
            });
        }

        // Bottom 10
        const bottomSorted = [...data].sort((a, b) => (a.achievement || 0) - (b.achievement || 0));
        const bottom10 = bottomSorted.slice(0, 10);
        
        const bottomTableBody = document.querySelector('#analytics-bottom-table tbody');
        if (bottomTableBody) {
            bottomTableBody.innerHTML = '';
            bottom10.forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
                    <td><strong>${item.name || item.group || '-'}</strong></td>
                    <td style="text-align: right;">${this.formatCurrency(item.currentMonth || item.currentAmount || 0)}</td>
                    <td style="text-align: center; font-weight: 600; color: ${(item.achievement || 0) >= 100 ? '#10b981' : '#ef4444'};">${(item.achievement || 0).toFixed(1)}%</td>
                `;
                bottomTableBody.appendChild(tr);
            });
        }
    }

    // Clear charts on data clear
    clearCharts() {
        if (this.charts.achievementChart) {
            this.charts.achievementChart.destroy();
            delete this.charts.achievementChart;
        }
        if (this.charts.growthChart) {
            this.charts.growthChart.destroy();
            delete this.charts.growthChart;
        }
        // Add other chart cleanup as needed
    }
