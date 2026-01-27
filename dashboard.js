// Dashboard Module for Store Evaluation System
// Handles visualization and data presentation

class Dashboard {
    constructor(dataProcessor, evaluationEngine, competitionAnalyzer, dashboardHelper) {
        this.dataProcessor = dataProcessor;
        this.evaluationEngine = evaluationEngine;
        this.competitionAnalyzer = competitionAnalyzer;
        this.dashboardHelper = dashboardHelper;
        this.masterAIFeedback = new MasterAIFeedback();
        this.charts = {};
        this.processedData = [];
        // Store current data handles for selective export
        this.currentMasterData = [];
        this.currentSalesAllData = [];
        this.currentSalesBranchData = [];
        this.currentSubscriptionAllData = [];
        this.currentSubscriptionBranchData = [];
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
                this.renderSubSection('sales', 'branch');
                break;
            case 'subscription':
                this.renderSubSection('subscription', 'all');
                this.renderSubSection('subscription', 'branch');
                break;
            case 'analytics':
                this.renderAnalytics();
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

        // Create Master Headers based on NEW screenshot (22 cols with AI Feedback)
        thead.innerHTML = `
            <tr class="nested-header">
                <th rowspan="3" style="width: 40px;"><input type="checkbox" id="master-check-all"></th>
                <th rowspan="3">구분</th>
                <th rowspan="3">목표</th>
                <th colspan="6">판매금액</th>
                <th colspan="13">구독</th>
                <th rowspan="3" style="background: rgba(102, 126, 234, 0.1); font-weight: 700; min-width: 200px;">🤖 AI 개선점</th>
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

        // Store data for export
        this.currentMasterData = data;

        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            const aiFeedback = this.masterAIFeedback.formatCompactFeedback(item);
            const aiDetailedFeedback = this.masterAIFeedback.formatDetailedFeedback(item);
            
            row.innerHTML = `
                <td class="text-center"><input type="checkbox" class="master-checkbox" data-index="${index}"></td>
                <td><strong>${item.group}</strong></td>
                <!-- Sales (Cols 1-7) -->
                <td class="text-right">${this.formatCurrency(item.target)}</td>
                <td class="text-right">${this.formatCurrency(item.prevYearClose)}</td>
                <td class="text-right">${this.formatCurrency(item.prevMonthClose)}</td>
                <td class="text-right font-bold bg-blue-50">${this.formatCurrency(item.currentMonth)}</td>
                <td class="text-center font-bold">${this.formatPercentage(item.achievement)}%</td>
                <td class="text-center" style="color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'}">${this.formatPercentage(item.growthYoY)}%</td>
                <td class="text-center" style="color: ${item.growthMoM >= 0 ? '#10b981' : '#ef4444'}">${this.formatPercentage(item.growthMoM)}%</td>
                
                <!-- Subscription Target (Cols 8-9) -->
                <td class="text-right">${this.formatCurrency(item.subTargetAmt)}</td>
                <td class="text-right">${this.formatNumber(item.subTargetQty)}</td>
                
                <!-- Subscription Amount (Cols 10-13) -->
                <td class="text-right">${this.formatCurrency(item.subAmtPrev)}</td>
                <td class="text-right">${this.formatCurrency(item.subAmtCurrent)}</td>
                <td class="text-right">${this.formatCurrency(item.subOneTime)}</td>
                <td class="text-right font-bold">${this.formatCurrency(item.subAmtTotal)}</td>
                
                <!-- Subscription Growth Amt (Cols 14-16) -->
                <td class="text-center font-bold">${this.formatPercentage(item.subAmtAchieve)}%</td>
                <td class="text-center" style="color: ${item.subAmtMoM >= 0 ? '#10b981' : '#ef4444'}">${this.formatPercentage(item.subAmtMoM)}%</td>
                <td class="text-center">${this.formatPercentage(item.subShare)}%</td>
                
                <!-- Subscription Qty (Cols 17-18) -->
                <td class="text-right">${this.formatNumber(item.subQtyPrev)}</td>
                <td class="text-right font-bold">${this.formatNumber(item.subQtyCurrent)}</td>
                
                <!-- Subscription Growth Qty (Cols 19-20) -->
                <td class="text-center font-bold">${this.formatPercentage(item.subQtyAchieve)}%</td>
                <td class="text-center" style="color: ${item.subQtyMoM >= 0 ? '#10b981' : '#ef4444'}">${this.formatPercentage(item.subQtyMoM)}%</td>
                
                <!-- AI Feedback (Col 22) -->
                <td class="ai-feedback-cell" style="font-size: 0.85rem; padding: 0.75rem; cursor: pointer; position: relative;" 
                    title="클릭하여 상세 분석 보기"
                    onclick="dashboard.showAIFeedbackDetail('${item.group.replace(/'/g, "\\'")}')"
                    data-detailed-feedback='${aiDetailedFeedback.replace(/'/g, "\'")}'>
                    ${aiFeedback}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Setup checkbox handlers
        if (this.dashboardHelper) {
            this.dashboardHelper.setupCheckboxHandlers('master-table');
        }

        // Render analytics for master data
        this.renderMasterAnalytics(data);
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
                        <th rowspan="2" style="width: 40px;"><input type="checkbox" id="sales-branch-check-all"></th>
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
                    ${data.map((item, index) => `
                        <tr>
                            <td class="text-center"><input type="checkbox" class="sales-branch-checkbox" data-index="${index}"></td>
                            <td>${item.manager1 || '-'}</td>
                            <td>${item.team || '-'}</td>
                            <td><span class="badge badge-info">${item.channel || '-'}</span></td>
                            <td><strong>${item.name}</strong></td>
                            <td>${item.manager2 || '-'}</td>
                            <td class="text-right">${this.formatCurrency(item.target)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevYearClose)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevMonthClose)}</td>
                            <td class="text-right" style="font-weight: bold; background: rgba(102, 126, 234, 0.1);">${this.formatCurrency(item.currentMonth)}</td>
                            <td class="text-center" style="background: ${item.achievement >= 100 ? 'rgba(16, 185, 129, 0.1)' : 'transparent'}">${this.formatPercentage(item.achievement)}%</td>
                            <td class="text-center" style="color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'}">${item.growthYoY >= 0 ? '+' : ''}${this.formatPercentage(item.growthYoY)}%</td>
                            <td class="text-center" style="color: ${item.growthMoM >= 0 ? '#10b981' : '#ef4444'}">${item.growthMoM >= 0 ? '+' : ''}${this.formatPercentage(item.growthMoM)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            table.innerHTML = `
                <thead>
                    <tr class="nested-header">
                        <th rowspan="2" style="width: 40px;"><input type="checkbox" id="sales-all-check-all"></th>
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
                    ${data.map((item, index) => `
                        <tr>
                            <td class="text-center"><input type="checkbox" class="sales-all-checkbox" data-index="${index}"></td>
                            <td><strong>${item.name}</strong></td>
                            <td class="text-right">${this.formatCurrency(item.target)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevYearClose)}</td>
                            <td class="text-right">${this.formatCurrency(item.prevMonthClose)}</td>
                            <td class="text-right" style="background: rgba(102, 126, 234, 0.1); font-weight: bold;">${this.formatCurrency(item.currentMonth)}</td>
                            <td class="text-center" style="background: ${item.achievement >= 100 ? 'rgba(16, 185, 129, 0.1)' : 'transparent'}">
                                ${this.formatPercentage(item.achievement)}%
                            </td>
                            <td class="text-center" style="color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthYoY >= 0 ? '+' : ''}${this.formatPercentage(item.growthYoY)}%
                            </td>
                            <td class="text-center" style="color: ${item.growthMoM >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthMoM >= 0 ? '+' : ''}${this.formatPercentage(item.growthMoM)}%
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        }

        if (subType === 'branch') {
            this.currentSalesBranchData = data;
        } else {
            this.currentSalesAllData = data;
        }

        // Setup checkbox handlers
        if (this.dashboardHelper) {
            this.dashboardHelper.setupCheckboxHandlers(tableId);
        }

        // Render analytics for sales data
        this.renderSalesAnalytics(data, subType);
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
                        <th rowspan="3" style="width: 40px;"><input type="checkbox" id="subscription-branch-check-all"></th>
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
                    ${data.map((item, index) => `
                        <tr>
                            <td class="text-center"><input type="checkbox" class="subscription-branch-checkbox" data-index="${index}"></td>
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
                            <td class="text-center">${this.formatPercentage(item.achAmount || 0)}%</td>
                            <td class="text-center" style="color: ${item.growthAmount >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthAmount >= 0 ? '▲' : '△'}${this.formatPercentage(Math.abs(item.growthAmount))}
                            </td>
                            <td class="text-center">${this.formatPercentage(item.ratio || 0)}%</td>
                            <td class="text-right">${item.prevMonthQty || 0}</td>
                            <td class="text-right">${item.currentQty || 0}</td>
                            <td class="text-center">${this.formatPercentage(item.achQty || 0)}%</td>
                            <td class="text-center" style="color: ${item.growthQty >= 0 ? '#10b981' : '#ef4444'}">
                                ${item.growthQty >= 0 ? '▲' : '△'}${this.formatPercentage(Math.abs(item.growthQty))}
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
                    <th rowspan="2" style="width: 40px;"><input type="checkbox" id="subscription-all-check-all"></th>
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
                ${data.map((item, index) => `
                    <tr>
                        <td class="text-center"><input type="checkbox" class="subscription-all-checkbox" data-index="${index}"></td>
                        <td style="font-weight: 600;">${item.name}</td>
                        <td class="text-right">${this.formatCurrency(item.targetAmount || 0)}</td>
                        <td class="text-right">${item.targetQty || 0}</td>
                        <td class="text-right">${this.formatCurrency(item.prevMonthAmount || 0)}</td>
                        <td class="text-right">${this.formatCurrency(item.currentAmount || 0)}</td>
                        <td class="text-right">${this.formatCurrency(item.cashAmount || 0)}</td>
                        <td class="text-right" style="font-weight: bold; background: rgba(102, 126, 234, 0.1);">${this.formatCurrency(item.totalAmount || 0)}</td>
                        <td class="text-center">${this.formatPercentage(item.achAmount || 0)}</td>
                        <td class="text-center" style="color: ${item.growthAmount >= 0 ? '#10b981' : '#ef4444'}">
                            ${item.growthAmount >= 0 ? '' : '△'}${this.formatPercentage(Math.abs(item.growthAmount))}
                        </td>
                        <td class="text-center" style="background: ${item.ratio >= 10 ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}">${this.formatPercentage(item.ratio || 0)}</td>
                        <td class="text-right">${item.prevMonthQty || 0}</td>
                        <td class="text-right">${item.currentQty || 0}</td>
                        <td class="text-center">${item.achQty !== 0 ? this.formatPercentage(item.achQty || 0) : ''}</td>
                         <td class="text-center" style="color: ${item.growthQty >= 0 ? '#10b981' : '#ef4444'}">
                            ${Math.abs(item.growthQty) > 0 ? (item.growthQty >= 0 ? '' : '△') + this.formatPercentage(Math.abs(item.growthQty)) : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        if (subType === 'branch') {
            this.currentSubscriptionBranchData = data;
        } else {
            this.currentSubscriptionAllData = data;
        }

        // Setup checkbox handlers
        if (this.dashboardHelper) {
            this.dashboardHelper.setupCheckboxHandlers(tableId);
        }

        // Render analytics for subscription data
        this.renderSubscriptionAnalytics(data, subType);
    }

    // Helper: Format currency
    formatCurrency(val) {
        return new Intl.NumberFormat('ko-KR').format(Math.round(val));
    }

    // Helper: Format number
    formatNumber(val) {
        return new Intl.NumberFormat('ko-KR').format(Math.round(val));
    }

    // Helper: Format percentage with floor rounding (내림)
    formatPercentage(val, decimals = 1) {
        const multiplier = Math.pow(10, decimals);
        return (Math.floor(val * multiplier) / multiplier).toFixed(decimals);
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
        document.getElementById('avg-score').textContent = this.formatPercentage(avgScore);
        document.getElementById('avg-ms').textContent = this.formatPercentage(avgMs) + '%';
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
                            label: (context) => context.dataset.label + ': ' + this.formatPercentage(context.parsed.x) + '%'
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
                        <div class="progress-fill" style="width: ${this.formatPercentage(store.evaluation.scoreRatio * 100)}%; background: ${evalLevel.color};"></div>
                    </div>
                </td>
                <td><span class="badge badge-${evalLevel.class}">${evalLevel.icon} ${evalLevel.label}</span></td>
                <td>${store.evaluation.Gross평점?.toFixed(1) || 'N/A'}</td>
                <td>${store.evaluation.경쟁력평점?.toFixed(1) || 'N/A'}</td>
                <td>${store.evaluation['M&B평점']?.toFixed(1) || 'N/A'}</td>
                <td>${store.evaluation.구독평점?.toFixed(1) || 'N/A'}</td>
                <td>
                    ${store.competition?.currentMs ? this.formatPercentage(store.competition.currentMs) + '%' : 'N/A'}
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

    // Show AI Feedback Detail Modal
    showAIFeedbackDetail(groupName) {
        const perfData = this.dataProcessor.performanceData || {};
        const masterData = perfData.master || [];
        const item = masterData.find(i => i.group === groupName);
        
        if (!item) return;

        const feedback = this.masterAIFeedback.generateFeedback(item);
        
        let modalHTML = `
            <div class="modal-overlay" id="ai-feedback-modal" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                    <div class="modal-header">
                        <div>
                            <h3>🤖 AI 개선 제안</h3>
                            <p style="margin: 0.5rem 0 0; color: var(--color-text-secondary); font-weight: normal; font-size: 0.9rem;">${groupName}</p>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('ai-feedback-modal').remove()">✕</button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                        <!-- Status Overview -->
                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                                <div>
                                    <span style="font-size: 1.5rem;">${feedback.status.icon}</span>
                                    <strong style="margin-left: 0.5rem; font-size: 1.1rem; color: ${feedback.status.color};">${feedback.status.label}</strong>
                                </div>
                                <div style="text-align: right;">
                                    <small style="color: var(--color-text-secondary);">우선순위</small><br>
                                    <span style="padding: 0.25rem 0.75rem; background: ${feedback.priority.color}22; color: ${feedback.priority.color}; border-radius: 4px; font-weight: 600;">
                                        ${feedback.priority.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        ${feedback.strengths.length > 0 ? `
                            <div class="detail-section" style="margin-bottom: 1.5rem;">
                                <h4 style="color: #10b981; margin-bottom: 0.75rem;">✅ 강점</h4>
                                <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                                    ${feedback.strengths.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${feedback.concerns.length > 0 ? `
                            <div class="detail-section" style="margin-bottom: 1.5rem;">
                                <h4 style="color: #ef4444; margin-bottom: 0.75rem;">⚠️ 우려사항</h4>
                                <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                                    ${feedback.concerns.map(c => `<li>${c}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${feedback.suggestions.length > 0 ? `
                            <div class="detail-section">
                                <h4 style="color: #3b82f6; margin-bottom: 0.75rem;">💡 개선 제안</h4>
                                <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                                    ${feedback.suggestions.map(s => `<li style="margin-bottom: 0.75rem;">${s}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        <!-- Performance Metrics Summary -->
                        <div class="detail-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
                            <h4 style="margin-bottom: 1rem;">📊 성과 요약</h4>
                            <div class="metric-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div style="padding: 0.75rem; background: rgba(102, 126, 234, 0.05); border-radius: 6px;">
                                    <small style="color: var(--color-text-secondary);">판매 달성률</small><br>
                                    <strong style="font-size: 1.2rem; color: ${item.achievement >= 100 ? '#10b981' : '#ef4444'};">${this.formatPercentage(item.achievement || 0)}%</strong>
                                </div>
                                <div style="padding: 0.75rem; background: rgba(102, 126, 234, 0.05); border-radius: 6px;">
                                    <small style="color: var(--color-text-secondary);">전년 대비 성장률</small><br>
                                    <strong style="font-size: 1.2rem; color: ${item.growthYoY >= 0 ? '#10b981' : '#ef4444'};">${item.growthYoY >= 0 ? '+' : ''}${this.formatPercentage(item.growthYoY || 0)}%</strong>
                                </div>
                                <div style="padding: 0.75rem; background: rgba(102, 126, 234, 0.05); border-radius: 6px;">
                                    <small style="color: var(--color-text-secondary);">구독 금액 달성률</small><br>
                                    <strong style="font-size: 1.2rem; color: ${item.subAmtAchieve >= 100 ? '#10b981' : '#ef4444'};">${this.formatPercentage(item.subAmtAchieve || 0)}%</strong>
                                </div>
                                <div style="padding: 0.75rem; background: rgba(102, 126, 234, 0.05); border-radius: 6px;">
                                    <small style="color: var(--color-text-secondary);">구독 수량 달성률</small><br>
                                    <strong style="font-size: 1.2rem; color: ${item.subQtyAchieve >= 100 ? '#10b981' : '#ef4444'};">${this.formatPercentage(item.subQtyAchieve || 0)}%</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
        document.getElementById('analytics-avg-achievement').textContent = this.formatPercentage(avgAchievement) + '%';
        document.getElementById('analytics-avg-growth').textContent = this.formatPercentage(avgGrowth) + '%';
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
            const ranges = { '150%+': 0, '120-150%': 0, '100-120%': 0, '80-100%': 0, '<80%': 0 };

            data.forEach(item => {
                const ach = item.achievement || 0;
                if (ach >= 150) ranges['150%+']++;
                else if (ach >= 120) ranges['120-150%']++;
                else if (ach >= 100) ranges['100-120%']++;
                else if (ach >= 80) ranges['80-100%']++;
                else ranges['<80%']++;
            });

            if (this.charts.achievementChart) this.charts.achievementChart.destroy();

            this.charts.achievementChart = new Chart(achievementCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(ranges),
                    datasets: [{
                        data: Object.values(ranges),
                        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(220, 38, 38, 0.8)'],
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'right', labels: { color: '#ffffff', font: { size: 11 } } } }
                }
            });
        }

        // Growth Chart
        const growthCtx = document.getElementById('analytics-growth-chart');
        if (growthCtx) {
            const sorted = [...data].sort((a, b) => (b.growthYoY || b.growthMoM || 0) - (a.growthYoY || a.growthMoM || 0));
            const top10 = sorted.slice(0, 10);
            
            const labels = top10.map(item => item.name || item.group || '-');
            const growthData = top10.map(item => item.growthYoY || item.growthMoM || 0);

            if (this.charts.growthChart) this.charts.growthChart.destroy();

            this.charts.growthChart = new Chart(growthCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ label: '성장률 (%)', data: growthData, backgroundColor: 'rgba(102, 126, 234, 0.8)', borderWidth: 2, borderRadius: 8 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: 'rgba(255, 255, 255, 0.7)', callback: (v) => v + '%' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                        x: { ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 10 } }, grid: { display: false } }
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
                    <td style="text-align: center; font-weight: 600; color: ${(item.achievement || 0) >= 100 ? '#10b981' : '#f59e0b'};">${this.formatPercentage(item.achievement || 0)}%</td>
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
                    <td style="text-align: center; font-weight: 600; color: ${(item.achievement || 0) >= 100 ? '#10b981' : '#ef4444'};">${this.formatPercentage(item.achievement || 0)}%</td>
                `;
                bottomTableBody.appendChild(tr);
            });
        }
    }

    // Clear all charts
    clearCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    // Generate AI Feedback based on performance data
    generateAIFeedback(item) {
        const feedbacks = [];
        
        // 달성률 기반 피드백
        const achievement = item.achievement || item.salesAchieve || item.subAmtAchieve || 0;
        if (achievement >= 150) {
            feedbacks.push('🌟 탁월한 성과');
        } else if (achievement >= 120) {
            feedbacks.push('✅ 목표 초과 달성');
        } else if (achievement >= 100) {
            feedbacks.push('👍 목표 달성');
        } else if (achievement >= 80) {
            feedbacks.push('⚠️ 개선 필요');
        } else {
            feedbacks.push('🔴 심각한 저조');
        }
        
        // 성장률 기반 피드백
        const growthYoY = item.growthYoY || item.salesYoY || 0;
        const growthMoM = item.growthMoM || item.salesMoM || item.subAmtMoM || 0;
        
        if (growthYoY > 30) {
            feedbacks.push('📈 전년 대비 고성장');
        } else if (growthYoY < -10) {
            feedbacks.push('📉 전년 대비 하락');
        }
        
        if (growthMoM > 20) {
            feedbacks.push('⬆️ 전월 대비 급성장');
        } else if (growthMoM < -10) {
            feedbacks.push('⬇️ 전월 대비 감소');
        }
        
        // 기본 피드백 - 최소 2개 유지
        if (feedbacks.length === 1) {
            if (achievement >= 100) {
                feedbacks.push('🔍 지속 유지 필요');
            } else {
                feedbacks.push('🔍 개선 전략 필요');
            }
        }
        
        return feedbacks.join(' | ');
    }

    // ================================
    // Individual Analytics Methods
    // ================================

    // Render Master Analytics
    renderMasterAnalytics(data) {
        if (!data || data.length === 0) {
            this.clearAnalytics('master');
            return;
        }

        // Calculate statistics
        const totalCount = data.length;
        const avgAchievement = data.reduce((sum, item) => sum + (item.achievement || 0), 0) / totalCount;
        const avgGrowth = data.reduce((sum, item) => sum + (item.growthYoY || 0), 0) / totalCount;
        const excellentCount = data.filter(item => (item.achievement || 0) >= 100).length;

        // Update stat cards
        document.getElementById('master-total-count').textContent = totalCount;
        document.getElementById('master-avg-achievement').textContent = this.formatPercentage(avgAchievement) + '%';
        document.getElementById('master-avg-growth').textContent = this.formatPercentage(avgGrowth) + '%';
        document.getElementById('master-excellent-count').textContent = excellentCount;

        // Render charts
        this.renderAchievementChart(data, 'master-achievement-chart');
        this.renderTopRankings(data, 'master-top-table', 5);
    }

    // Render Sales Analytics
    renderSalesAnalytics(data, subType) {
        const prefix = subType === 'all' ? 'sales-all' : 'sales-branch';
        
        if (!data || data.length === 0) {
            this.clearAnalytics(prefix);
            return;
        }

        // Calculate statistics
        const totalCount = data.length;
        const avgAchievement = data.reduce((sum, item) => sum + (item.achievement || 0), 0) / totalCount;
        const avgGrowth = data.reduce((sum, item) => sum + (item.growthYoY || 0), 0) / totalCount;
        const excellentCount = data.filter(item => (item.achievement || 0) >= 100).length;

        // Update stat cards
        document.getElementById(`${prefix}-total-count`).textContent = totalCount;
        document.getElementById(`${prefix}-avg-achievement`).textContent = this.formatPercentage(avgAchievement) + '%';
        document.getElementById(`${prefix}-avg-growth`).textContent = this.formatPercentage(avgGrowth) + '%';
        document.getElementById(`${prefix}-excellent-count`).textContent = excellentCount;

        // Render charts
        this.renderAchievementChart(data, `${prefix}-achievement-chart`);
        this.renderTopRankings(data, `${prefix}-top-table`, 5);
    }

    // Render Subscription Analytics (unified for both tabs)
    renderSubscriptionAnalytics(data, subType) {
        // Use unified prefix for subscription analytics (shared by both tabs)
        const prefix = 'subscription';
        
        if (!data || data.length === 0) {
            this.clearAnalytics(prefix);
            return;
        }

        // Calculate statistics (using achAmount for subscription)
        const totalCount = data.length;
        const avgAchievement = data.reduce((sum, item) => sum + (item.achAmount || 0), 0) / totalCount;
        const avgGrowth = data.reduce((sum, item) => sum + (item.growthAmount || 0), 0) / totalCount;
        const excellentCount = data.filter(item => (item.achAmount || 0) >= 100).length;

        // Update stat cards
        document.getElementById(`${prefix}-total-count`).textContent = totalCount;
        document.getElementById(`${prefix}-avg-achievement`).textContent = this.formatPercentage(avgAchievement) + '%';
        document.getElementById(`${prefix}-avg-growth`).textContent = this.formatPercentage(avgGrowth) + '%';
        document.getElementById(`${prefix}-excellent-count`).textContent = excellentCount;

        // Render charts (use achAmount as achievement metric)
        this.renderAchievementChart(data, `${prefix}-achievement-chart`, 'achAmount');
        this.renderTopRankings(data, `${prefix}-top-table`, 5, 'achAmount');
    }

    // Render Achievement Distribution Chart
    renderAchievementChart(data, canvasId, achievementField = 'achievement') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ranges = {
            '150%+': 0,
            '120-150%': 0,
            '100-120%': 0,
            '80-100%': 0,
            '<80%': 0
        };

        data.forEach(item => {
            const ach = item[achievementField] || 0;
            if (ach >= 150) ranges['150%+']++;
            else if (ach >= 120) ranges['120-150%']++;
            else if (ach >= 100) ranges['100-120%']++;
            else if (ach >= 80) ranges['80-100%']++;
            else ranges['<80%']++;
        });

        // Destroy existing chart if exists
        const chartKey = `chart_${canvasId}`;
        if (this.charts[chartKey]) {
            this.charts[chartKey].destroy();
        }

        this.charts[chartKey] = new Chart(canvas, {
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

    // Render Top Rankings Table
    renderTopRankings(data, tableId, limit = 5, achievementField = 'achievement') {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Sort by achievement and get top N
        const topItems = [...data]
            .sort((a, b) => (b[achievementField] || 0) - (a[achievementField] || 0))
            .slice(0, limit);

        tbody.innerHTML = '';
        topItems.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const name = item.name || item.group || '-';
            const achievement = this.formatPercentage(item[achievementField] || 0);
            
            tr.innerHTML = `
                <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
                <td><strong>${name}</strong></td>
                <td style="text-align: center; font-weight: 600; color: ${achievement >= 100 ? '#10b981' : '#f59e0b'};">${achievement}%</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Clear analytics section
    clearAnalytics(prefix) {
        const ids = [
            `${prefix}-total-count`,
            `${prefix}-avg-achievement`,
            `${prefix}-avg-growth`,
            `${prefix}-excellent-count`
        ];

        ids.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                if (id.includes('count')) elem.textContent = '0';
                else elem.textContent = '0%';
            }
        });

        // Clear chart and table
        const chartCanvas = document.getElementById(`${prefix}-achievement-chart`);
        if (chartCanvas) {
            const chartKey = `chart_${prefix}-achievement-chart`;
            if (this.charts[chartKey]) {
                this.charts[chartKey].destroy();
                delete this.charts[chartKey];
            }
        }

        const table = document.getElementById(`${prefix}-top-table`);
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody) tbody.innerHTML = '';
        }
    }
}

// Export for use in other modules
window.Dashboard = Dashboard;
