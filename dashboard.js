// Dashboard Module for Store Evaluation System
// Handles visualization and data presentation

class Dashboard {
    constructor(dataProcessor, evaluationEngine, competitionAnalyzer) {
        this.dataProcessor = dataProcessor;
        this.evaluationEngine = evaluationEngine;
        this.competitionAnalyzer = competitionAnalyzer;
        this.charts = {};
        this.processedData = [];
    }

    // Initialize dashboard with data
    init() {
        this.renderMasterHeader();
    }

    // Render main sections
    renderSection(sectionName) {
        // PERMISSIVE: Allow rendering even if no data (for headers)
        const perfData = this.dataProcessor.performanceData || {};
        const data = perfData[sectionName] || [];

        switch (sectionName) {
            case 'master':
                this.renderMasterTable(data);
                break;
            case 'sales':
                this.renderSubSection('sales', 'all');
                break;
            case 'subscription':
                this.renderSubSection('subscription', 'all');
                break;
        }
    }

    // Render sub-sections
    renderSubSection(parentSection, subSectionName) {
        // PERMISSIVE: Allow rendering even if no data (for headers)
        const perfData = this.dataProcessor.performanceData || {};
        
        let data;
        if (parentSection === 'sales') {
            data = subSectionName === 'branch' ? 
                   (perfData.salesBranch || []) :
                   (perfData.sales || []);
            this.renderSalesTable(data, subSectionName);
        } else if (parentSection === 'subscription') {
            data = subSectionName === 'branch' ? 
                   (perfData.subscriptionBranch || []) :
                   (perfData.subscription || []);
            this.renderSubscriptionTable(data, subSectionName);
        }
    }

    // Render Master Table Header (Persistent)
    renderMasterHeader() {
        const thead = document.getElementById('master-thead');
        if (!thead) return;

        // Create Master Headers based on NEW screenshot (21 cols)
        thead.innerHTML = `
            <tr class="nested-header">
                <th rowspan="3">구분</th>
                <th rowspan="3">목표</th>
                <th colspan="6">판매금액</th>
                <th colspan="13">구독</th>
            </tr>
            <tr class="nested-header">
                <th rowspan="2">전년<br>마감</th>
                <th rowspan="2">전월<br>마감</th>
                <th rowspan="2">당월</th>
                <th colspan="3" class="highlight-header">신장 및 달성</th>
                <th colspan="2">목표</th>
                <th colspan="4">금액</th>
                <th colspan="3" class="highlight-header">신장 및 달성(금액)</th>
                <th colspan="2">수량</th>
                <th colspan="2" class="highlight-header">신장 및 달성(수량)</th>
            </tr>
            <tr class="nested-header">
                <th>달성률</th>
                <th>전년비<br>(마감)</th>
                <th>전월비<br>(마감)</th>
                <th>목표<br>(금액)</th>
                <th>목표<br>(수량)</th>
                <th>전월마감</th>
                <th>당월</th>
                <th>일시불</th>
                <th>금액 합</th>
                <th>달성률</th>
                <th>전월비<br>(마감)</th>
                <th>비중</th>
                <th>전월마감</th>
                <th>당월</th>
                <th>달성률</th>
                <th>전월비<br>(마감)</th>
            </tr>
        `;
    }

    // Render Master Table Body
    renderMasterTable(data) {
        const tbody = document.getElementById('master-tbody');
        if (!tbody) return;

        // Ensure header is there (idempotent)
        this.renderMasterHeader();

        tbody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.group}</strong></td>
                <!-- Sales (Cols 1-7) -->
                <td class="text-right">${this.formatCurrency(item.target)}</td>
                <td class="text-right">${this.formatCurrency(item.prevYearClose)}</td>
                <td class="text-right">${this.formatCurrency(item.prevMonthClose)}</td>
                <td class="text-right font-bold bg-blue-50">${this.formatCurrency(item.currentMonth)}</td>
                <td class="text-center font-bold">${item.achievement.toFixed(1)}%</td>
                <td class="text-center" style="color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'}">${item.growthYoY.toFixed(1)}%</td>
                <td class="text-center" style="color: ${item.growthMoM >= 0 ? '#10b981' : '#ef4444'}">${item.growthMoM.toFixed(1)}%</td>
                
                <!-- Subscription Target (Cols 8-9) -->
                <td class="text-right">${this.formatCurrency(item.subTargetAmt)}</td>
                <td class="text-right">${this.formatNumber(item.subTargetQty)}</td>
                
                <!-- Subscription Amount (Cols 10-13) -->
                <td class="text-right">${this.formatCurrency(item.subAmtPrev)}</td>
                <td class="text-right">${this.formatCurrency(item.subAmtCurrent)}</td>
                <td class="text-right">${this.formatCurrency(item.subOneTime)}</td>
                <td class="text-right font-bold">${this.formatCurrency(item.subAmtTotal)}</td>
                
                <!-- Subscription Growth Amt (Cols 14-16) -->
                <td class="text-center font-bold">${item.subAmtAchieve.toFixed(1)}%</td>
                <td class="text-center" style="color: ${item.subAmtMoM >= 0 ? '#10b981' : '#ef4444'}">${item.subAmtMoM.toFixed(1)}%</td>
                <td class="text-center">${item.subShare.toFixed(1)}%</td>
                
                <!-- Subscription Qty (Cols 17-18) -->
                <td class="text-right">${this.formatNumber(item.subQtyPrev)}</td>
                <td class="text-right font-bold">${this.formatNumber(item.subQtyCurrent)}</td>
                
                <!-- Subscription Growth Qty (Cols 19-20) -->
                <td class="text-center font-bold">${item.subQtyAchieve.toFixed(1)}%</td>
                <td class="text-center" style="color: ${item.subQtyMoM >= 0 ? '#10b981' : '#ef4444'}">${item.subQtyMoM.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Render Sales Table (Updated to distinguish All vs Branch)
    renderSalesTable(data, subType) {
        const tableId = subType === 'all' ? 'sales-all-table' : 'sales-branch-table';
        const table = document.getElementById(tableId);
        if (!table) return;

        if (subType === 'branch') {
            table.innerHTML = `
                <thead>
                    <tr class="nested-header">
                        <th rowspan="2">담당</th>
                        <th rowspan="2">팀</th>
                        <th rowspan="2">채널</th>
                        <th rowspan="2">지점명</th>
                        <th rowspan="2">관리자</th>
                        <th rowspan="2">목표</th>
                        <th colspan="4">판매금액</th>
                        <th colspan="2">신장률</th>
                    </tr>
                    <tr class="nested-header">
                        <th>전년마감</th>
                        <th>전월마감</th>
                        <th>당월</th>
                        <th>달성률</th>
                        <th>전년比</th>
                        <th>전월比</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.manager1 || '-'}</td>
                            <td>${item.team || '-'}</td>
                            <td><span class="badge badge-info">${item.channel || '-'}</span></td>
                            <td><strong>${item.name}</strong></td>
                            <td>${item.manager2 || '-'}</td>
                            <td class="text-right">${this.formatCurrency(item.target)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevYearClose)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevMonthClose)}</td>
                            <td class="text-right" style="font-weight: bold; background: rgba(102, 126, 234, 0.1);">${this.formatCurrency(item.currentMonth)}</td>
                            <td class="text-center" style="background: ${item.achievement >= 100 ? 'rgba(16, 185, 129, 0.1)' : 'transparent'}">${item.achievement.toFixed(1)}%</td>
                            <td class="text-center" style="color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'}">${item.growthYoY >= 0 ? '+' : ''}${item.growthYoY.toFixed(1)}%</td>
                            <td class="text-center" style="color: ${item.growthMoM >= 0 ? '#10b981' : '#ef4444'}">${item.growthMoM >= 0 ? '+' : ''}${item.growthMoM.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            table.innerHTML = `
                <thead>
                    <tr class="nested-header">
                        <th rowspan="2">구분</th>
                        <th rowspan="2">목표</th>
                        <th colspan="4">판매금액</th>
                        <th colspan="2">신장률</th>
                    </tr>
                    <tr class="nested-header">
                        <th>전년 마감</th>
                        <th>전월 마감</th>
                        <th>당월</th>
                        <th>달성률</th>
                        <th>전년比</th>
                        <th>전월比</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td><strong>${item.name}</strong></td>
                            <td class="text-right">${this.formatCurrency(item.target)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevYearClose)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevMonthClose)}</td>
                            <td class="text-right" style="background: rgba(102, 126, 234, 0.1); font-weight: bold;">${this.formatCurrency(item.currentMonth)}</td>
                            <td class="text-center" style="background: ${item.achievement >= 100 ? 'rgba(16, 185, 129, 0.1)' : 'transparent'}">
                                ${item.achievement.toFixed(1)}%
                            </td>
                            <td class="text-center" style="color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthYoY >= 0 ? '+' : ''}${item.growthYoY.toFixed(1)}%
                            </td>
                            <td class="text-center" style="color: ${item.growthMoM >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthMoM >= 0 ? '+' : ''}${item.growthMoM.toFixed(1)}%
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        }
    }

    // Render Subscription Table
    renderSubscriptionTable(data, subType) {
        const tableId = subType === 'all' ? 'subscription-all-table' : 'subscription-branch-table';
        const table = document.getElementById(tableId);
        if (!table) return;

        if (subType === 'branch') {
            table.innerHTML = `
                <thead>
                    <tr>
                        <th rowspan="3">담당</th>
                        <th rowspan="3">팀</th>
                        <th rowspan="3">채널</th>
                        <th rowspan="3">지점명</th>
                        <th rowspan="3">관리자</th>
                        <th colspan="2">목표</th>
                        <th colspan="11">구독</th>
                    </tr>
                    <tr>
                        <th rowspan="2">금액</th>
                        <th rowspan="2">수량</th>
                        <th colspan="7">금액</th>
                        <th colspan="4">수량</th>
                    </tr>
                    <tr>
                        <th>전월마감</th>
                        <th>당월</th>
                        <th>일시불</th>
                        <th>금액 합</th>
                        <th>달성률</th>
                        <th>전월마감比</th>
                        <th>비중</th>
                        <th>전월마감</th>
                        <th>당월</th>
                        <th>달성률</th>
                        <th>전월마감比</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.manager1}</td>
                            <td>${item.team}</td>
                            <td>${item.channel}</td>
                            <td style="font-weight: 600;">${item.name}</td>
                            <td>${item.manager2}</td>
                            <td class="text-right">${this.formatCurrency(item.targetAmount || 0)}</td>
                            <td class="text-right">${item.targetQty || 0}</td>
                            <td class="text-right">${this.formatCurrency(item.prevMonthAmount || 0)}</td>
                            <td class="text-right">${this.formatCurrency(item.currentAmount || 0)}</td>
                            <td class="text-right">${this.formatCurrency(item.cashAmount || 0)}</td>
                            <td class="text-right" style="font-weight: bold; background: rgba(102, 126, 234, 0.1);">${this.formatCurrency(item.totalAmount || 0)}</td>
                            <td class="text-center">${(item.achAmount || 0).toFixed(1)}%</td>
                            <td class="text-center" style="color: ${item.growthAmount >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthAmount >= 0 ? '▲' : '△'}${Math.abs(item.growthAmount).toFixed(1)}
                            </td>
                            <td class="text-center">${(item.ratio || 0).toFixed(1)}%</td>
                            <td class="text-right">${item.prevMonthQty || 0}</td>
                            <td class="text-right">${item.currentQty || 0}</td>
                            <td class="text-center">${(item.achQty || 0).toFixed(1)}%</td>
                            <td class="text-center" style="color: ${item.growthQty >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthQty >= 0 ? '▲' : '△'}${Math.abs(item.growthQty).toFixed(1)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            return;
        }

        table.innerHTML = `
            <thead>
                <tr>
                    <th rowspan="2">구분</th>
                    <th colspan="2">목표</th>
                    <th colspan="7">금액</th>
                    <th colspan="4">수량</th>
                </tr>
                <tr>
                    <th>금액</th>
                    <th>수량</th>
                    <th>전월마감</th>
                    <th>당월</th>
                    <th>일시불</th>
                    <th>금액 합</th>
                    <th>달성률</th>
                    <th>전월마감比</th>
                    <th>비중</th>
                    <th>전월마감</th>
                    <th>당월</th>
                    <th>달성률</th>
                    <th>전월마감比</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td style="font-weight: 600;">${item.name}</td>
                        <td class="text-right">${this.formatCurrency(item.targetAmount || 0)}</td>
                        <td class="text-right">${item.targetQty || 0}</td>
                        <td class="text-right">${this.formatCurrency(item.prevMonthAmount || 0)}</td>
                        <td class="text-right">${this.formatCurrency(item.currentAmount || 0)}</td>
                        ${item.name === '전자랜드' ? 
                            `<td class="text-right">${this.formatCurrency(item.cashAmount || 0)}</td>` : 
                            `<td class="text-center" style="color: #ccc;">#######</td>`
                        }
                        ${item.name === '전자랜드' || item.name === '양판1담당' || item.name === '서승호' ?
                            `<td class="text-right" style="font-weight: bold; background: rgba(102, 126, 234, 0.1);">${this.formatCurrency(item.totalAmount || 0)}</td>` :
                             `<td class="text-center" style="color: #ccc;">#######</td>`
                        }
                        <td class="text-center">${(item.achAmount || 0).toFixed(1)}</td>
                        <td class="text-center" style="color: ${item.growthAmount >= 0 ? '#10b981' : '#ef4444'}">
                            ${item.growthAmount >= 0 ? '' : '△'}${Math.abs(item.growthAmount).toFixed(1)}
                        </td>
                        <td class="text-center" style="background: ${item.ratio >= 10 ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}">${(item.ratio || 0).toFixed(1)}</td>
                        <td class="text-right">${item.prevMonthQty || 0}</td>
                        <td class="text-right">${item.currentQty || 0}</td>
                        <td class="text-center">${item.achQty !== 0 ? (item.achQty || 0).toFixed(1) : ''}</td>
                         <td class="text-center" style="color: ${item.growthQty >= 0 ? '#10b981' : '#ef4444'}">
                            ${Math.abs(item.growthQty) > 0 ? (item.growthQty >= 0 ? '' : '△') + Math.abs(item.growthQty).toFixed(1) : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }

    // Helper: Format currency
    formatCurrency(val) {
        return new Intl.NumberFormat('ko-KR').format(Math.round(val));
    }

    // Helper: Format number
    formatNumber(val) {
        return new Intl.NumberFormat('ko-KR').format(Math.round(val));
    }

    // Show empty state
    showEmptyState() {
        document.getElementById('total-stores').textContent = '0';
        document.getElementById('avg-score').textContent = '0';
        document.getElementById('avg-ms').textContent = '0%';
        document.getElementById('excellent-count').textContent = '0';
    }

    // Update summary cards
    updateSummaryCards() {
        const totalStores = this.processedData.length;
        
        const avgScore = totalStores > 0
            ? this.processedData.reduce((sum, store) => sum + store.evaluation.총점, 0) / totalStores
            : 0;
        
        const avgMs = totalStores > 0
            ? this.processedData.reduce((sum, store) => sum + (store.competition?.currentMs || 0), 0) / totalStores
            : 0;
        
        const excellentCount = this.processedData.filter(store => 
            store.evaluation.scoreRatio >= 0.9
        ).length;

        document.getElementById('total-stores').textContent = totalStores;
        document.getElementById('avg-score').textContent = avgScore.toFixed(1);
        document.getElementById('avg-ms').textContent = avgMs.toFixed(1) + '%';
        document.getElementById('excellent-count').textContent = excellentCount;
    }

    // Render charts
    renderCharts() {
        this.renderScoreDistributionChart();
        this.renderChannelComparisonChart();
        this.renderMSTrendChart();
    }

    // Render score distribution chart
    renderScoreDistributionChart() {
        const ctx = document.getElementById('score-chart');
        if (!ctx) return;

        // Group by score ranges
        const ranges = {
            '우수(90%+)': 0,
            '양호(75-90%)': 0,
            '보통(60-75%)': 0,
            '미흡(40-60%)': 0,
            '개선필요(<40%)': 0
        };

        this.processedData.forEach(store => {
            const ratio = store.evaluation.scoreRatio;
            if (ratio >= 0.9) ranges['우수(90%+)']++;
            else if (ratio >= 0.75) ranges['양호(75-90%)']++;
            else if (ratio >= 0.6) ranges['보통(60-75%)']++;
            else if (ratio >= 0.4) ranges['미흡(40-60%)']++;
            else ranges['개선필요(<40%)']++;
        });

        if (this.charts.scoreChart) {
            this.charts.scoreChart.destroy();
        }

        this.charts.scoreChart = new Chart(ctx, {
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
                            font: { size: 11, family: 'Inter' },
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(18, 19, 31, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                        borderWidth: 1,
                        padding: 12
                    }
                }
            }
        });
    }

    // Render channel comparison chart
    renderChannelComparisonChart() {
        const ctx = document.getElementById('channel-chart');
        if (!ctx) return;

        const channels = this.dataProcessor.getChannels();
        const channelScores = channels.map(channel => {
            const stores = this.dataProcessor.filterByChannel(channel);
            const avgScore = stores.reduce((sum, s) => {
                const evaluated = this.processedData.find(p => p.name === s.name);
                return sum + (evaluated?.evaluation.총점 || 0);
            }, 0) / stores.length;
            return avgScore;
        });

        const channelMs = channels.map(channel => {
            const stores = this.dataProcessor.filterByChannel(channel);
            const avgMs = stores.reduce((sum, s) => sum + (s.competition?.currentMs || 0), 0) / stores.length;
            return avgMs;
        });

        if (this.charts.channelChart) {
            this.charts.channelChart.destroy();
        }

        this.charts.channelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: channels,
                datasets: [
                    {
                        label: '평균 점수',
                        data: channelScores,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        yAxisID: 'y'
                    },
                    {
                        label: '평균 MS (%)',
                        data: channelMs,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        yAxisID: 'y1'
                    }
                ]
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
                    },
                    tooltip: {
                        backgroundColor: 'rgba(18, 19, 31, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: (value) => value + '%'
                        },
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render MS trend chart (top 10 stores)
    renderMSTrendChart() {
        const ctx = document.getElementById('ms-chart');
        if (!ctx) return;

        const top10 = [...this.processedData]
            .sort((a, b) => (b.competition?.currentMs || 0) - (a.competition?.currentMs || 0))
            .slice(0, 10);

        const storeNames = top10.map(s => s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name);
        const msValues = top10.map(s => s.competition?.currentMs || 0);
        const channelAvgs = top10.map(s => s.competition?.channelAvgMs || 0);

        if (this.charts.msChart) {
            this.charts.msChart.destroy();
        }

        this.charts.msChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: storeNames,
                datasets: [
                    {
                        label: '현재 MS',
                        data: msValues,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    },
                    {
                        label: '채널 평균 MS',
                        data: channelAvgs,
                        backgroundColor: 'rgba(245, 158, 11, 0.5)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { size: 11, family: 'Inter' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(18, 19, 31, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: (value) => value + '%'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
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

    // Render store performance table
    renderStoreTable() {
        const tbody = document.getElementById('store-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.processedData.forEach(store => {
            const row = document.createElement('tr');
            
            const evalLevel = store.evaluation.level;
            const compAnalysis = store.competitionAnalysis;
            const aiFeedbackLevel = this.evaluationEngine.getAIFeedbackLevel(store.aiFeedback?.level || 'neutral');
            
            row.innerHTML = `
                <td><strong>${store.name}</strong></td>
                <td><span class="badge badge-info">${store.channel}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong>${store.evaluation.총점.toFixed(1)}</strong>
                        <span style="color: var(--color-text-secondary);">/ ${store.evaluation.최대점수}</span>
                    </div>
                    <div class="progress-bar" style="margin-top: 0.375rem;">
                        <div class="progress-fill" style="width: ${(store.evaluation.scoreRatio * 100).toFixed(0)}%; background: ${evalLevel.color};"></div>
                    </div>
                </td>
                <td><span class="badge badge-${evalLevel.class}">${evalLevel.icon} ${evalLevel.label}</span></td>
                <td>${store.evaluation.Gross평점?.toFixed(1) || 'N/A'}</td>
                <td>${store.evaluation.경쟁력평점?.toFixed(1) || 'N/A'}</td>
                <td>${store.evaluation['M&B평점']?.toFixed(1) || 'N/A'}</td>
                <td>${store.evaluation.구독평점?.toFixed(1) || 'N/A'}</td>
                <td>
                    ${store.competition?.currentMs ? store.competition.currentMs.toFixed(1) + '%' : 'N/A'}
                    <br>
                    <small style="color: ${compAnalysis.msStatus.class === 'excellent' || compAnalysis.msStatus.class === 'good' ? '#10b981' : '#ef4444'};">
                        ${compAnalysis.msStatus.diff || ''}
                    </small>
                </td>
                <td>
                    <span class="badge badge-${compAnalysis.improvementStatus.class}">
                        ${compAnalysis.improvementStatus.icon} ${this.competitionAnalyzer.formatImprovement(store.competition?.ytImprovement)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="dashboard.showStoreDetail('${store.name.replace(/'/g, "\\'")}')">
                        상세보기
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        this.setupFiltering();
    }

    // Setup table filtering
    setupFiltering() {
        const searchInput = document.getElementById('search-store');
        const channelFilter = document.getElementById('filter-channel');

        if (!searchInput || !channelFilter) return;

        const filterTable = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedChannel = channelFilter.value;
            
            const rows = document.querySelectorAll('#store-table-body tr');
            
            rows.forEach(row => {
                const name = row.cells[0].textContent.toLowerCase();
                const channel = row.cells[1].textContent;
                
                const matchesSearch = name.includes(searchTerm);
                const matchesChannel = !selectedChannel || channel.includes(selectedChannel);
                
                row.style.display = matchesSearch && matchesChannel ? '' : 'none';
            });
        };

        searchInput.addEventListener('input', filterTable);
        channelFilter.addEventListener('change', filterTable);
    }

    // Show store detail modal
    showStoreDetail(storeName) {
        const store = this.processedData.find(s => s.name === storeName);
        if (!store) return;

        const insights = this.competitionAnalyzer.generateInsights(store);
        const evalBreakdown = store.evaluation.breakdown;

        let detailHTML = `
            <div class="modal-overlay" id="detail-modal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${store.name}</h3>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('detail-modal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-section">
                            <h4>📊 평가 점수 상세</h4>
                            ${evalBreakdown.map(item => `
                                <div class="score-detail-item">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span>${item.name}</span>
                                        <strong>${item.score.toFixed(1)}</strong>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${item.percentage}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="detail-section">
                            <h4>🎯 경쟁력 분석</h4>
                            <div class="metric-grid">
                                <div class="metric-item">
                                    <span class="metric-label">현재 MS</span>
                                    <span class="metric-value">${this.competitionAnalyzer.formatMS(store.competition?.currentMs)}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">채널 평균 MS</span>
                                    <span class="metric-value">${this.competitionAnalyzer.formatMS(store.competition?.channelAvgMs)}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">개선율</span>
                                    <span class="metric-value">${this.competitionAnalyzer.formatImprovement(store.competition?.ytImprovement)}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">경쟁력 등급</span>
                                    <span class="metric-value">${store.competition?.yrdRating || 'N/A'}/10</span>
                                </div>
                            </div>
                        </div>

                        ${insights.length > 0 ? `
                            <div class="detail-section">
                                <h4>💡 인사이트</h4>
                                ${insights.map(insight => `
                                    <div class="insight-item insight-${insight.type}">
                                        ${insight.type === 'strength' ? '✅' : insight.type === 'weakness' ? '⚠️' : '📌'}
                                        ${insight.message}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${store.aiFeedback?.summary ? `
                            <div class="detail-section">
                                <h4>🤖 AI 피드백</h4>
                                <div class="ai-feedback-box">
                                    ${store.aiFeedback.summary}
                                </div>
                                ${store.aiFeedback.strengths?.length > 0 ? `
                                    <div style="margin-top: 1rem;">
                                        <strong>강점:</strong>
                                        <ul>
                                            ${store.aiFeedback.strengths.map(s => `<li>${s}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                ${store.aiFeedback.weaknesses?.length > 0 ? `
                                    <div style="margin-top: 1rem;">
                                        <strong>약점:</strong>
                                        <ul>
                                            ${store.aiFeedback.weaknesses.map(w => `<li>${w}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailHTML);
    }

    // Check and display alerts
    checkAndDisplayAlerts() {
        const anomalies = this.dataProcessor.detectAnomalies();
        
        const alertsCard = document.getElementById('alerts-card');
        if (!alertsCard) return;

        if (anomalies.length === 0) {
            alertsCard.style.display = 'none';
            return;
        }

        alertsCard.style.display = 'block';
        
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) return;
        
        alertsContainer.innerHTML = '';

        anomalies.forEach(anomaly => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert-item';
            alertDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${anomaly.storeName}</strong> (${anomaly.channel})
                        <p style="margin-top: 0.5rem; color: var(--color-text-secondary);">${anomaly.message}</p>
                    </div>
                    <span class="badge badge-${anomaly.severity}">${anomaly.type}</span>
                </div>
            `;
            alertsContainer.appendChild(alertDiv);
        });
    }

    // Get processed data for export
    getProcessedData() {
        return this.processedData;
    }

    // Clear all charts
    clearCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Export for use in other modules
window.Dashboard = Dashboard;
