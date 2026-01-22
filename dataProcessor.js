// Data Processor for Store Evaluation System
// Handles JSON/Excel parsing and store data processing

class DataProcessor {
    constructor() {
        this.storeData = [];
        this.rawData = null;
        this.performanceData = {}; // Initialize to empty object
    }

    // Parse JSON data
    parseJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            throw new Error('JSON 파싱 실패: ' + error.message);
        }
    }

    // Parse Excel file using SheetJS
    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Generic parser for performance files
    async parsePerformanceFile(file, type) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Most systems provide data in the first sheet
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                        raw: false,
                        header: ['master', 'sales'].includes(type) ? 1 : 0 // Use raw array for complex headers
                    });
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Parse raw text data (from textarea paste)
    parseRawText(text, type) {
        if (!text || text.trim() === '') {
            throw new Error('입력된 데이터가 없습니다.');
        }

        // Split by newlines
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        // Convert each line to array (split by tabs or multiple spaces)
        const rows = lines.map(line => {
            // First try tab separation
            if (line.includes('\t')) {
                return line.split('\t').map(cell => cell.trim());
            }
            // Otherwise split by 2 or more spaces
            return line.split(/\s{2,}/).map(cell => cell.trim());
        });

        // Process based on type
        switch (type) {
            case 'master':
                return this.processMasterData(rows);
            case 'sales':
                return this.processSalesData(rows);
            case 'subscription':
                return this.processSubscriptionData(rows);
            default:
                return rows;
        }
    }

    // Load and process specific performance data
    async loadPerformanceData(data, type) {
        if (!this.performanceData) this.performanceData = {};
        
        switch (type) {
            case 'master':
                this.performanceData.master = this.processMasterData(data);
                break;
            case 'sales':
                let processedSales = this.processSalesData(data);
                if (processedSales.isBranch) {
                    this.performanceData.salesBranch = processedSales.data;
                } else {
                    this.performanceData.sales = processedSales.data;
                }
                break;
            case 'subscription':
                let processedSub = this.processSubscriptionData(data);
                if (processedSub.isBranch) {
                    this.performanceData.subscriptionBranch = processedSub.data;
                } else {
                    this.performanceData.subscription = processedSub.data;
                }
                break;
        }
        return this.performanceData[type];
    }

    // Process MASTER 관리 data (Complex structure)
    processMasterData(rows) {
        if (!Array.isArray(rows)) return [];
        
        const headerRowIdx = rows.findIndex(row => Array.isArray(row) && (row.includes('구분') || row.includes('지점명')));
        if (headerRowIdx === -1) return [];

        // In nested header structures, data usually starts 2 rows after the main header row
        const dataRows = rows.slice(headerRowIdx + 2);

        return dataRows.map(row => {
            if (!row || row.length === 0 || !row[0]) return null;
            return {
                group: row[0],
                // Sales
                target: this.parseNumber(row[1]),
                prevYearClose: this.parseNumber(row[2]),
                prevMonthClose: this.parseNumber(row[3]),
                currentMonth: this.parseNumber(row[4]),
                achievement: this.parseNumber(row[5]),
                growthYoY: this.parseNumber(row[6]),
                growthMoM: this.parseNumber(row[7]),
                
                // Subscription
                subTargetAmt: this.parseNumber(row[8]),
                subTargetQty: this.parseNumber(row[9]),
                subAmtPrev: this.parseNumber(row[10]),
                subAmtCurrent: this.parseNumber(row[11]),
                subOneTime: this.parseNumber(row[12]),
                subAmtTotal: this.parseNumber(row[13]),
                subAmtAchieve: this.parseNumber(row[14]),
                subAmtMoM: this.parseNumber(row[15]),
                subShare: this.parseNumber(row[16]),
                subQtyPrev: this.parseNumber(row[17]),
                subQtyCurrent: this.parseNumber(row[18]),
                subQtyAchieve: this.parseNumber(row[19]),
                subQtyMoM: this.parseNumber(row[20])
            };
        }).filter(item => item !== null && item.group);
    }

    // Process 판매금액 data (Updated to detect Branch vs Summary)
    processSalesData(rows) {
        if (!Array.isArray(rows)) return { data: [], isBranch: false };

        // Detect if it's Branch data (contains '담당')
        const branchHeaderIdx = rows.findIndex(row => Array.isArray(row) && row.some(cell => String(cell).includes('담당')));
        
        if (branchHeaderIdx !== -1) {
            // Branch structure detected: [담당, 팀, 채널, 지점명, 관리자, 목표, 판매금액(4), 신장률(2)]
            const dataRows = rows.slice(branchHeaderIdx + 3); // Usually 3 header rows
            const data = dataRows.map(row => {
                if (!row || row.length < 4 || !row[3]) return null;
                return {
                    manager1: row[0],
                    team: row[1],
                    channel: row[2],
                    name: row[3],
                    manager2: row[4],
                    target: this.parseNumber(row[5]),
                    prevYearClose: this.parseNumber(row[6]),
                    prevMonthClose: this.parseNumber(row[7]),
                    currentMonth: this.parseNumber(row[8]),
                    achievement: this.parseNumber(row[9]),
                    growthYoY: this.parseNumber(row[10]),
                    growthMoM: this.parseNumber(row[11])
                };
            }).filter(item => item !== null);
            return { data, isBranch: true };
        }

        // Summary structure (Previous)
        const summaryHeaderIdx = rows.findIndex(row => row && row.includes('구분'));
        if (summaryHeaderIdx === -1) {
            return { data: Array.isArray(rows) ? rows : [], isBranch: false };
        }

        const dataRows = rows.slice(summaryHeaderIdx + 2);
        const data = dataRows.map(row => {
            if (!row || row.length === 0 || !row[0]) return null;
            return {
                name: row[0],
                target: this.parseNumber(row[1]),
                prevYearClose: this.parseNumber(row[2]),
                prevMonthClose: this.parseNumber(row[3]),
                currentMonth: this.parseNumber(row[4]),
                achievement: this.parseNumber(row[5]),
                growthYoY: this.parseNumber(row[6]),
                growthMoM: this.parseNumber(row[7])
            };
        }).filter(item => item !== null);

        return { data, isBranch: false };
    }

    processSubscriptionData(rows) {
        if (!Array.isArray(rows)) return { data: [], isBranch: false };

        // Handle pre-formatted object array (e.g. from DEMO_DATA.subscriptionBranch)
        if (rows.length > 0 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
            const isBranch = 'manager1' in rows[0];
            return { data: rows, isBranch };
        }
        
        // Detect header row (for both Branch and Summary data)
        const headerRowIdx = rows.findIndex(row => row && (row.includes('담당') || row.includes('지점명') || row.includes('지점') || row.includes('구분')));
        if (headerRowIdx === -1) return { data: [], isBranch: false };

        const headers = rows[headerRowIdx];
        const isBranch = headers.includes('담당') && headers.includes('팀');

        if (isBranch) {
            // Complex 18-column Branch structure
            // We skip 3 header rows based on the image provided
            const dataRows = rows.slice(headerRowIdx + 3);
            const data = dataRows.map(row => {
                if (!row || row.length < 5 || !row[3]) return null;
                return {
                    manager1: row[0] || '',
                    team: row[1] || '',
                    channel: row[2] || '',
                    name: row[3] || '',
                    manager2: row[4] || '',
                    targetAmount: this.parseNumber(row[5]),
                    targetQty: this.parseNumber(row[6]),
                    prevMonthAmount: this.parseNumber(row[7]),
                    currentAmount: this.parseNumber(row[8]),
                    cashAmount: this.parseNumber(row[9]),
                    totalAmount: this.parseNumber(row[10]),
                    achAmount: this.parseNumber(row[11]),
                    growthAmount: this.parseNumber(row[12]),
                    ratio: this.parseNumber(row[13]),
                    prevMonthQty: this.parseNumber(row[14]),
                    currentQty: this.parseNumber(row[15]),
                    achQty: this.parseNumber(row[16]),
                    growthQty: this.parseNumber(row[17])
                };
            }).filter(item => item !== null);
            return { data, isBranch: true };
        } else {
            // New 14-column Summary structure from image
            const dataRows = rows.slice(headerRowIdx + 1);
            return {
                data: dataRows.map(row => {
                    if (!row || row.length === 0 || !row[0]) return null;
                    // Mapped based on index from the new demo data structure
                    return {
                        name: row[0],
                        targetAmount: this.parseNumber(row[1]),
                        targetQty: this.parseNumber(row[2]),
                        prevMonthAmount: this.parseNumber(row[3]),
                        currentAmount: this.parseNumber(row[4]),
                        cashAmount: this.parseNumber(row[5]),
                        totalAmount: this.parseNumber(row[6]),
                        achAmount: this.parseNumber(row[7]),
                        growthAmount: this.parseNumber(row[8]),
                        ratio: this.parseNumber(row[9]),
                        prevMonthQty: this.parseNumber(row[10]),
                        currentQty: this.parseNumber(row[11]),
                        achQty: this.parseNumber(row[12]),
                        growthQty: this.parseNumber(row[13])
                    };
                }).filter(item => item !== null),
                isBranch: false
            };
        }
    }

    // Normalize store data to standard format
    normalizeStoreData(data) {
        return data.map(store => {
            return {
                name: store.name || store['지점명'] || '',
                channel: store.channel || store['채널'] || '',
                
                // Gross data
                gross: this.normalizeGross(store.gross || {}),
                
                // Competition metrics
                competition: {
                    ytdMs: this.parseNumber(store.competition?.ytdMs),
                    channelAvgMs: this.parseNumber(store.competition?.channelAvgMs),
                    currentMs: this.parseNumber(store.competition?.currentMs),
                    ytImprovement: this.parseNumber(store.competition?.ytImprovement),
                    yrdRating: this.parseNumber(store.competition?.yrdRating)
                },
                
                // M&B data
                mb: Array.isArray(store.mb) ? store.mb : [],
                
                // Evaluation scores
                evaluation: {
                    총점: this.parseNumber(store.evaluation?.총점),
                    최대점수: this.parseNumber(store.evaluation?.최대점수 || 19),
                    Gross평점: this.parseNumber(store.evaluation?.Gross평점),
                    경쟁력평점: this.parseNumber(store.evaluation?.경쟁력평점),
                    'M&B평점': this.parseNumber(store.evaluation?.['M&B평점']),
                    구독평점: this.parseNumber(store.evaluation?.구독평점)
                },
                
                // AI Feedback
                aiFeedback: {
                    summary: store.aiFeedback?.summary || '',
                    level: store.aiFeedback?.level || 'neutral',
                    pattern: store.aiFeedback?.pattern || '',
                    strengths: Array.isArray(store.aiFeedback?.strengths) ? store.aiFeedback.strengths : [],
                    weaknesses: Array.isArray(store.aiFeedback?.weaknesses) ? store.aiFeedback.weaknesses : []
                }
            };
        });
    }

    // Normalize gross data
    normalizeGross(gross) {
        return {
            prevYearGross: this.parseNumber(gross.prevYearGross || gross.prevYearClose),
            currentGross: this.parseNumber(gross.currentGross || gross.current),
            targetGross: this.parseNumber(gross.targetGross || gross.target),
            growthRate: this.parseNumber(gross.growthRate)
        };
    }

    // Parse number (handle various formats, including Korean negative triangles)
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            let val = value.trim();
            // Handle Korean negative markers: △ or ▲
            let multiplier = 1;
            if (val.includes('△') || val.includes('▲')) multiplier = -1;
            
            const cleaned = val.replace(/[^0-9.-]/g, '');
            let num = parseFloat(cleaned) || 0;
            
            // If negative marker was found, ensure the number is negative
            if (multiplier === -1 && num > 0) num *= -1;
            
            return num;
        }
        return 0;
    }

    // Get all store data
    getStoreData() {
        return this.storeData;
    }

    // Clear all data
    clearData() {
        this.storeData = [];
        this.rawData = null;
        this.performanceData = {};
    }

    // Filter stores by channel
    filterByChannel(channel) {
        if (!channel) return this.storeData;
        return this.storeData.filter(store => store.channel === channel);
    }

    // Get unique channels
    getChannels() {
        return [...new Set(this.storeData.map(store => store.channel))].filter(Boolean);
    }

    // Group by channel
    groupByChannel() {
        const grouped = {};
        
        this.storeData.forEach(store => {
            if (!grouped[store.channel]) {
                grouped[store.channel] = [];
            }
            grouped[store.channel].push(store);
        });
        
        return grouped;
    }

    // Calculate channel statistics
    getChannelStats(channel) {
        const stores = this.filterByChannel(channel);
        
        if (stores.length === 0) {
            return null;
        }

        const avgEvaluation = {
            총점: this.average(stores.map(s => s.evaluation.총점)),
            Gross평점: this.average(stores.map(s => s.evaluation.Gross평점)),
            경쟁력평점: this.average(stores.map(s => s.evaluation.경쟁력평점)),
            'M&B평점': this.average(stores.map(s => s.evaluation['M&B평점'])),
            구독평점: this.average(stores.map(s => s.evaluation.구독평점))
        };

        const avgCompetition = {
            ytdMs: this.average(stores.map(s => s.competition.ytdMs)),
            currentMs: this.average(stores.map(s => s.competition.currentMs)),
            ytImprovement: this.average(stores.map(s => s.competition.ytImprovement)),
            yrdRating: this.average(stores.map(s => s.competition.yrdRating))
        };

        return {
            storeCount: stores.length,
            avgEvaluation,
            avgCompetition
        };
    }

    // Calculate average
    average(numbers) {
        const valid = numbers.filter(n => !isNaN(n) && n !== null);
        if (valid.length === 0) return 0;
        return valid.reduce((sum, n) => sum + n, 0) / valid.length;
    }

    // Get top performing stores
    getTopStores(limit = 10, sortBy = '총점') {
        return [...this.storeData]
            .sort((a, b) => (b.evaluation[sortBy] || 0) - (a.evaluation[sortBy] || 0))
            .slice(0, limit);
    }

    // Get bottom performing stores
    getBottomStores(limit = 10, sortBy = '총점') {
        return [...this.storeData]
            .sort((a, b) => (a.evaluation[sortBy] || 0) - (b.evaluation[sortBy] || 0))
            .slice(0, limit);
    }

    // Detect anomalies
    detectAnomalies() {
        const anomalies = [];

        this.storeData.forEach(store => {
            // Low total score
            const scoreRatio = store.evaluation.총점 / store.evaluation.최대점수;
            if (scoreRatio < 0.5) {
                anomalies.push({
                    type: 'low_score',
                    severity: 'warning',
                    storeName: store.name,
                    channel: store.channel,
                    message: `총점이 낮습니다: ${store.evaluation.총점}/${store.evaluation.최대점수} (${(scoreRatio * 100).toFixed(1)}%)`,
                    value: store.evaluation.총점
                });
            }

            // Negative improvement
            if (store.competition.ytImprovement < -10) {
                anomalies.push({
                    type: 'negative_improvement',
                    severity: 'danger',
                    storeName: store.name,
                    channel: store.channel,
                    message: `개선율이 매우 낮습니다: ${store.competition.ytImprovement.toFixed(1)}%`,
                    value: store.competition.ytImprovement
                });
            }

            // Low MS compared to channel average
            if (store.competition.currentMs < store.competition.channelAvgMs - 10) {
                anomalies.push({
                    type: 'low_ms',
                    severity: 'warning',
                    storeName: store.name,
                    channel: store.channel,
                    message: `MS가 채널 평균보다 낮습니다: ${store.competition.currentMs} vs ${store.competition.channelAvgMs}`,
                    value: store.competition.currentMs
                });
            }

            // Low rating
            if (store.competition.yrdRating < 3) {
                anomalies.push({
                    type: 'low_rating',
                    severity: 'danger',
                    storeName: store.name,
                    channel: store.channel,
                    message: `경쟁력 등급이 낮습니다: ${store.competition.yrdRating}/10`,
                    value: store.competition.yrdRating
                });
            }
        });

        return anomalies;
    }

    // Validate store data
    validateStoreData(store) {
        const errors = [];

        if (!store.name || store.name.trim() === '') {
            errors.push('지점명은 필수입니다.');
        }

        if (!store.channel || store.channel.trim() === '') {
            errors.push('채널은 필수입니다.');
        }

        if (!store.evaluation || typeof store.evaluation.총점 === 'undefined') {
            errors.push('평가 점수가 없습니다.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format number for display
    formatNumber(num, decimals = 1) {
        return parseFloat(num).toFixed(decimals);
    }
}

// Export for use in other modules
window.DataProcessor = DataProcessor;
