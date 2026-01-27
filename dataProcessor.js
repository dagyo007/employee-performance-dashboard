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
            let cells = [];
            // First try tab separation
            if (line.includes('\t')) {
                cells = line.split('\t').map(cell => cell.trim());
            }
            
            // If tabs didn't work effectively (1 column) or weren't present, try 2+ spaces
            if (cells.length <= 1) {
                cells = line.split(/\s{2,}/).map(cell => cell.trim());
            }

            // If still 1 column, fallback to single space (risky for names with spaces, but needed for simple copy-pastes)
            if (cells.length <= 1) {
                cells = line.split(/\s+/).map(cell => cell.trim());
            }

            return cells;
        });

        console.log('Parsed Rows Debug:', rows.slice(0, 3)); // Debug log for user

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

        // Data starts from the next row after header (not +2!)
        const dataRows = rows.slice(headerRowIdx + 1);

        return dataRows.map(row => {
            if (!row || row.length === 0 || !row[0]) return null;
            
            // Parse input values
            const target = this.parseNumber(row[1]);
            const prevYearClose = this.parseNumber(row[2]);
            const prevMonthClose = this.parseNumber(row[3]);
            const currentMonth = this.parseNumber(row[4]);
            
            // Auto-calculate if not provided (or use provided values)
            const achievement = row[5] ? this.parseNumber(row[5]) : this.calculateAchievementRate(currentMonth, target);
            const growthYoY = row[6] ? this.parseNumber(row[6]) : this.calculateGrowthRate(currentMonth, prevYearClose);
            const growthMoM = row[7] ? this.parseNumber(row[7]) : this.calculateGrowthRate(currentMonth, prevMonthClose);
            
            // Subscription data
            const subTargetAmt = this.parseNumber(row[8]);
            const subTargetQty = this.parseNumber(row[9]);
            const subAmtPrev = this.parseNumber(row[10]);
            const subAmtCurrent = this.parseNumber(row[11]);
            const subOneTime = this.parseNumber(row[12]);
            const subAmtTotal = this.parseNumber(row[13]);
            const subQtyPrev = this.parseNumber(row[17]);
            const subQtyCurrent = this.parseNumber(row[18]);
            
            // Auto-calculate subscription metrics
            const subAmtAchieve = row[14] ? this.parseNumber(row[14]) : this.calculateAchievementRate(subAmtTotal, subTargetAmt);
            const subAmtMoM = row[15] ? this.parseNumber(row[15]) : this.calculateGrowthRate(subAmtCurrent, subAmtPrev);
            const subShare = this.parseNumber(row[16]);
            const subQtyAchieve = row[19] ? this.parseNumber(row[19]) : this.calculateAchievementRate(subQtyCurrent, subTargetQty);
            const subQtyMoM = row[20] ? this.parseNumber(row[20]) : this.calculateGrowthRate(subQtyCurrent, subQtyPrev);
            
            return {
                group: row[0],
                // Sales
                target,
                prevYearClose,
                prevMonthClose,
                currentMonth,
                achievement,
                growthYoY,
                growthMoM,
                
                // Subscription
                subTargetAmt,
                subTargetQty,
                subAmtPrev,
                subAmtCurrent,
                subOneTime,
                subAmtTotal,
                subAmtAchieve,
                subAmtMoM,
                subShare,
                subQtyPrev,
                subQtyCurrent,
                subQtyAchieve,
                subQtyMoM
            };
        }).filter(item => item !== null && item.group);
    }

    // Process 판매금액 data (Updated to detect Branch vs Summary)
    processSalesData(rows) {
        if (!Array.isArray(rows)) return { data: [], isBranch: false };

        // Detect if it's Branch data (contains '담당' in HEADERS ONLY, not data)
        // Only check first 5 rows to avoid false positives from data containing '담당'
        const branchHeaderIdx = rows.slice(0, 5).findIndex(row => Array.isArray(row) && row.some(cell => String(cell).includes('담당')));
        
        if (branchHeaderIdx !== -1) {
            // Branch structure detected: [담당, 팀, 채널, 지점명, 관리자, 목표, 전년마감, 전월마감, 당월(9 columns)]
            
            // Dynamic Header Skipping:
            // Find the first row that looks like actual data
            let dataStartIdx = branchHeaderIdx + 1;
            
            for (let i = branchHeaderIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Skip Header/Filter rows
                // 1. Exact match for Header titles
                if (['담당', '팀', '채널', '지점명', '구분'].includes(firstCell)) continue;
                
                // 2. Partial match for Filters/Sums
                const isFilterOrSum = ['필터', 'filter', '합계', '소계', '총계', 'total', 'sum'].some(
                    k => firstCell.includes(k)
                );
                
                if (isFilterOrSum) continue;

                // If we reached here, it's not a header or filter
                if (firstCell.length > 0) {
                    dataStartIdx = i;
                    break;
                }
            }

            const dataRows = rows.slice(dataStartIdx);
            
            const data = dataRows.map(row => {
                if (!row || row.length < 4 || !row[3]) return null;
                
                const firstCell = String(row[0] || '').trim();
                if (['필터', 'filter', '합계', '소계', '총계', 'total', 'sum'].some(k => firstCell.includes(k))) return null;
                if (firstCell === '담당') return null;

                // Parse RAW data (cols 0-8 are inputs)
                const target = this.parseNumber(row[5]);
                const prevYearClose = this.parseNumber(row[6]);
                const prevMonthClose = this.parseNumber(row[7]);
                const currentMonth = this.parseNumber(row[8]);
                
                // Helper to check if a value is "empty" (undefined, null, or whitespace string)
                const isEmpty = (val) => val === undefined || val === null || String(val).trim() === '';

                // Auto-calculate if columns 9-11 are missing or empty
                const achievement = !isEmpty(row[9])
                    ? this.parseNumber(row[9]) 
                    : this.calculateAchievementRate(currentMonth, target);
                    
                const growthYoY = !isEmpty(row[10])
                    ? this.parseNumber(row[10]) 
                    : this.calculateGrowthRate(currentMonth, prevYearClose);
                    
                const growthMoM = !isEmpty(row[11])
                    ? this.parseNumber(row[11]) 
                    : this.calculateGrowthRate(currentMonth, prevMonthClose);
                
                return {
                    manager1: row[0],
                    team: row[1],
                    channel: row[2],
                    name: row[3],
                    manager2: row[4],
                    target,
                    prevYearClose,
                    prevMonthClose,
                    currentMonth,
                    achievement,
                    growthYoY,
                    growthMoM
                };
            }).filter(item => item !== null);
            return { data, isBranch: true };
        }

        // Summary structure (Previous)
        const summaryHeaderIdx = rows.findIndex(row => row && row.includes('구분'));
        if (summaryHeaderIdx === -1) {
            return { data: Array.isArray(rows) ? rows : [], isBranch: false };
        }

        // Determine data start index - handle multi-line headers (2 or 3 rows)
        // Check if there are sub-headers after the main header
        let dataStartIdx = summaryHeaderIdx + 2; // Default: skip 2 rows (header + sub-header)
        
        // Check if row after main header contains sub-headers like '전년 마감', '전월 마감', etc.
        if (rows[summaryHeaderIdx + 1] && rows[summaryHeaderIdx + 1].some(cell => 
            String(cell).includes('마감') || String(cell).includes('달성') || String(cell).includes('신장'))) {
            // Check if there's a third header row (e.g., '전년 마감比', '전월마감比')
            if (rows[summaryHeaderIdx + 2] && rows[summaryHeaderIdx + 2].some(cell => 
                String(cell).includes('比') || String(cell).includes('%'))) {
                dataStartIdx = summaryHeaderIdx + 3; // Skip 3 rows for 3-line headers
            }
        }

        const dataRows = rows.slice(dataStartIdx);
        const data = dataRows.map(row => {
            if (!row || row.length === 0 || !row[0]) return null;
            
            // Exclude filter/summary rows explicitly
            const name = String(row[0]).trim();
            const excludeKeywords = ['필터', '합계', '소계', '총계', 'total', 'sum', 'subtotal', 'filter'];
            if (excludeKeywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))) {
                return null;
            }
            
            // Parse RAW data (always present)
            const target = this.parseNumber(row[1]);
            const prevYearClose = this.parseNumber(row[2]);
            const prevMonthClose = this.parseNumber(row[3]);
            const currentMonth = this.parseNumber(row[4]);
            
            // Check if this is a special row (양판n담당) that uses complex Excel formulas
            // These rows use: ((current - SUM(subordinates)) / target) * 100
            // We will auto-calculate this in a second pass
            const isSpecialRow = /양판\d+담당/.test(name);
            
            // Auto-calculate if columns 5-7 are missing or empty
            // This supports both:
            // 1. Full format (8 columns): 구분, 목표, 전년마감, 전월마감, 당월, 달성률, 전년比, 전월比
            // 2. Minimal format (5 columns): 구분, 목표, 전년마감, 전월마감, 당월 (auto-calculate rest)
            // 3. Special rows (양판n담당): May use complex Excel formulas
            let achievement;
            if (row[5] !== undefined && row[5] !== null && row[5] !== '') {
                // Excel value provided - use it directly, don't recalculate
                achievement = this.parseNumber(row[5]);
            } else if (isSpecialRow) {
                // Special row - will be calculated in second pass
                achievement = null;
            } else {
                // Regular row without provided value - defer calculation to second pass
                achievement = null;
            }
                
            const growthYoY = (row[6] !== undefined && row[6] !== null && row[6] !== '') 
                ? this.parseNumber(row[6]) 
                : this.calculateGrowthRate(currentMonth, prevYearClose);
                
            const growthMoM = (row[7] !== undefined && row[7] !== null && row[7] !== '') 
                ? this.parseNumber(row[7]) 
                : this.calculateGrowthRate(currentMonth, prevMonthClose);
            
            return {
                name: row[0],
                target,
                prevYearClose,
                prevMonthClose,
                currentMonth,
                achievement,
                growthYoY,
                growthMoM,
                isSpecialRow
            };
        }).filter(item => item !== null);

        // Second pass: Calculate achievement with special logic
        // 1. Find baseline (하이마트) value
        const baselineItem = data.find(item => item.name === '하이마트');
        const baselineValue = baselineItem ? baselineItem.currentMonth : 0;
        
        // 2. Calculate achievement for 양판n담당 rows (subtract subordinates)
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            
            if (!item.isSpecialRow || item.achievement !== null) {
                continue;
            }
            
            // Find subordinates: ALL rows with target = 0 until next 양판n담당
            // This includes rows even after target>0 rows (which are independent branches)
            let subordinatesSum = 0;
            let j = i + 1;
            
            while (j < data.length) {
                // Stop if we hit another 양판n담당
                if (data[j].isSpecialRow) {
                    break;
                }
                
                // Include this row if target = 0 (subordinate)
                // Skip if target > 0 (independent branch like 서승호)
                if (data[j].target === 0) {
                    subordinatesSum += data[j].currentMonth;
                }
                
                j++;
            }
            
            // Calculate: ((current - subordinatesSum) / target) * 100
            const netCurrent = item.currentMonth - subordinatesSum;
            item.achievement = this.calculateAchievementRate(netCurrent, item.target);
        }
        
        // 3. Apply baseline subtraction to all regular rows (except 하이마트 and 양판n담당)
        for (const item of data) {
            // Skip if already calculated (양판n담당 or Excel value)
            if (item.achievement !== null) {
                continue;
            }
            
            // Set 하이마트 to 0%
            if (item.name === '하이마트') {
                item.achievement = 0;
                continue;
            }
            
            // Subordinates (target=0) get 0% achievement
            if (item.target === 0) {
                item.achievement = 0;
                continue;
            }
            
            // Check if this is an excluded category (uses complex/baseline logic like Net Sales)
            // Individual staff (e.g. Seo Seung-ho) AND Electronic Land (전자랜드) should use Simple Calculation (Current/Target)
            // Only Interbiz (인터비즈) and Yangpan Store (양판점) seem to use complex formulas based on the data
            const isExcludedCategory = ['인터비즈', '양판점'].includes(item.name) || /양판\d+담당/.test(item.name);
            
            if (!isExcludedCategory) {
                // Individual Staff & Electronic Land -> Simple Calculation: (Current / Target) * 100
                item.achievement = this.calculateAchievementRate(item.currentMonth, item.target);
            } else {
                // Excluded Category -> Apply Baseline Subtraction (Net Calculation)
                const netCurrent = item.currentMonth - baselineValue;
                item.achievement = this.calculateAchievementRate(netCurrent, item.target);
            }
        }
        
        // Remove isSpecialRow marker
        data.forEach(item => delete item.isSpecialRow);

        return { data, isBranch: false };
    }

    processSubscriptionData(rows) {
        if (!Array.isArray(rows)) return { data: [], isBranch: false };

        // Handle pre-formatted object array
        if (rows.length > 0 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
            const isBranch = 'manager1' in rows[0];
            return { data: rows, isBranch };
        }
        
        // Detect header row
        const headerRowIdx = rows.findIndex(row => row && 
            (row.includes('담당') || row.includes('지점명') || row.includes('지점') || row.includes('구분')));
        
        if (headerRowIdx === -1) return { data: [], isBranch: false };

        const headers = rows[headerRowIdx];
        const isBranch = headers.includes('담당') && headers.includes('팀');

        if (isBranch) {
            // Complex 18-column Branch structure
            // Dynamic Header Skipping:
            // Find the first row that looks like actual data
            let dataStartIdx = headerRowIdx + 1;
            
            // Iterate to find where actual data begins
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Skip repeated headers
                if (firstCell === '담당' || row.includes('담당')) continue;
                
                // Skip filter rows (User specific request)
                if (firstCell.includes('필터') || firstCell.includes('Filter')) continue;
                
                // If we found a row that doesn't look like a header/filter, start here
                dataStartIdx = i;
                break;
            }

            const dataRows = rows.slice(dataStartIdx);
            const data = dataRows.map(row => {
                if (!row || row.length < 5 || !row[3]) return null;
                
                const firstCell = String(row[0] || '').trim();
                
                // Skip filter rows that might be intermingled
                if (firstCell.includes('필터') || firstCell.includes('Filter')) return null;
                
                // Skip header repetitions
                if (firstCell === '담당') return null;

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
            // Summary structure (Auto-calculation logic added)
            // Skip headers to get to data
            const dataRows = rows.slice(headerRowIdx + 1);
            
            // First pass: Parse raw values and calculate individual metrics
            let parsedData = dataRows.map(row => {
                if (!row || row.length === 0 || !row[0]) return null;
                
                // Exclude filter/summary rows
                const name = String(row[0]).trim();
                const excludeKeywords = ['필터', '합계', '소계', '총계', 'total', 'sum', 'subtotal', 'filter'];
                if (excludeKeywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))) {
                    return null;
                }

                // Raw Data (Inputs)
                const nameVal = row[0];
                const targetAmount = this.parseNumber(row[1]);
                const targetQty = this.parseNumber(row[2]);
                const prevMonthAmount = this.parseNumber(row[3]);
                const currentAmount = this.parseNumber(row[4]);     // 당월 (Recurring)
                const cashAmount = this.parseNumber(row[5]);        // 일시불 (One-time)
                
                // Calculated: Total Amount = Current (Recurring) + One-time
                // If the user provided a total (row[6]), we could use it, but auto-calc is safer if components exist
                let totalAmount = this.parseNumber(row[6]);
                if (currentAmount !== 0 || cashAmount !== 0) {
                     totalAmount = currentAmount + cashAmount;
                }

                // Calculated: Achievement (Amount)
                // If Target is 0, Ach is 0
                const achAmount = this.calculateAchievementRate(totalAmount, targetAmount);

                // Calculated: Growth (Amount) - Based on Recurring (Current vs Prev)
                // Note: User methodology seems to be (Current - Prev) / Prev
                const growthAmount = this.calculateGrowthRate(currentAmount, prevMonthAmount);

                // Qty Data
                const prevMonthQty = this.parseNumber(row[10]);
                const currentQty = this.parseNumber(row[11]);
                const achQty = this.calculateAchievementRate(currentQty, targetQty);
                const growthQty = this.calculateGrowthRate(currentQty, prevMonthQty);

                return {
                    name: nameVal,
                    targetAmount,
                    targetQty,
                    prevMonthAmount,
                    currentAmount,
                    cashAmount,
                    totalAmount,
                    achAmount,
                    growthAmount,
                    ratio: 0, // Will calculate in second pass
                    prevMonthQty,
                    currentQty,
                    achQty,
                    growthQty
                };
            }).filter(item => item !== null);

            // Second pass: Calculate Shares ( 비중 )
            const grandTotal = parsedData.reduce((sum, item) => sum + item.totalAmount, 0);

            parsedData = parsedData.map(item => {
                let ratio = 0;
                if (grandTotal !== 0) {
                    ratio = (item.totalAmount / grandTotal) * 100;
                }
                return { ...item, ratio };
            });

            return {
                data: parsedData,
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

    // Calculate achievement rate (달성률)
    calculateAchievementRate(current, target) {
        if (!target || target === 0) return 0;
        return (current / target) * 100;
    }

    // Calculate growth rate (성장률: 전년 비, 전월 비)
    calculateGrowthRate(current, previous) {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
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

    // ============= NEW AGGREGATION FUNCTIONS =============
    
    /**
     * Aggregate sales data by team
     * @param {Array} salesData - Branch-level sales data
     * @returns {Array} Team-level aggregated data with calculated metrics
     */
    aggregateByTeam(salesData) {
        if (!Array.isArray(salesData) || salesData.length === 0) return [];
        
        const teamMap = {};
        
        salesData.forEach(item => {
            const teamKey = item.team || '미분류';
            
            if (!teamMap[teamKey]) {
                teamMap[teamKey] = {
                    team: teamKey,
                    target: 0,
                    prevYearClose: 0,
                    prevMonthClose: 0,
                    currentMonth: 0,
                    count: 0
                };
            }
            
            teamMap[teamKey].target += item.target || 0;
            teamMap[teamKey].prevYearClose += item.prevYearClose || 0;
            teamMap[teamKey].prevMonthClose += item.prevMonthClose || 0;
            teamMap[teamKey].currentMonth += item.currentMonth || 0;
            teamMap[teamKey].count += 1;
        });
        
        // Calculate derived metrics for each team
        return Object.values(teamMap).map(team => ({
            name: team.team,
            target: team.target,
            prevYearClose: team.prevYearClose,
            prevMonthClose: team.prevMonthClose,
            currentMonth: team.currentMonth,
            achievement: this.calculateAchievementRate(team.currentMonth, team.target),
            growthYoY: this.calculateGrowthRate(team.currentMonth, team.prevYearClose),
            growthMoM: this.calculateGrowthRate(team.currentMonth, team.prevMonthClose),
            storeCount: team.count
        }));
    }
    
    /**
     * Aggregate sales data by channel
     * @param {Array} salesData - Branch-level sales data
     * @returns {Array} Channel-level aggregated data with calculated metrics
     */
    aggregateByChannel(salesData) {
        if (!Array.isArray(salesData) || salesData.length === 0) return [];
        
        const channelMap = {};
        
        salesData.forEach(item => {
            const channelKey = item.channel || '미분류';
            
            if (!channelMap[channelKey]) {
                channelMap[channelKey] = {
                    channel: channelKey,
                    target: 0,
                    prevYearClose: 0,
                    prevMonthClose: 0,
                    currentMonth: 0,
                    count: 0
                };
            }
            
            channelMap[channelKey].target += item.target || 0;
            channelMap[channelKey].prevYearClose += item.prevYearClose || 0;
            channelMap[channelKey].prevMonthClose += item.prevMonthClose || 0;
            channelMap[channelKey].currentMonth += item.currentMonth || 0;
            channelMap[channelKey].count += 1;
        });
        
        // Calculate derived metrics for each channel
        return Object.values(channelMap).map(channel => ({
            name: channel.channel,
            target: channel.target,
            prevYearClose: channel.prevYearClose,
            prevMonthClose: channel.prevMonthClose,
            currentMonth: channel.currentMonth,
            achievement: this.calculateAchievementRate(channel.currentMonth, channel.target),
            growthYoY: this.calculateGrowthRate(channel.currentMonth, channel.prevYearClose),
            growthMoM: this.calculateGrowthRate(channel.currentMonth, channel.prevMonthClose),
            storeCount: channel.count
        }));
    }
    
    /**
     * Get grand total for sales data
     * @param {Array} salesData - Any sales data
     * @returns {Object} Total aggregated data
     */
    getGrandTotal(salesData) {
        if (!Array.isArray(salesData) || salesData.length === 0) {
            return {
                name: '전체',
                target: 0,
                prevYearClose: 0,
                prevMonthClose: 0,
                currentMonth: 0,
                achievement: 0,
                growthYoY: 0,
                growthMoM: 0,
                count: 0
            };
        }
        
        const total = salesData.reduce((acc, item) => {
            acc.target += item.target || 0;
            acc.prevYearClose += item.prevYearClose || 0;
            acc.prevMonthClose += item.prevMonthClose || 0;
            acc.currentMonth += item.currentMonth || 0;
            acc.count += 1;
            return acc;
        }, {
            target: 0,
            prevYearClose: 0,
            prevMonthClose: 0,
            currentMonth: 0,
            count: 0
        });
        
        return {
            name: '전체',
            target: total.target,
            prevYearClose: total.prevYearClose,
            prevMonthClose: total.prevMonthClose,
            currentMonth: total.currentMonth,
            achievement: this.calculateAchievementRate(total.currentMonth, total.target),
            growthYoY: this.calculateGrowthRate(total.currentMonth, total.prevYearClose),
            growthMoM: this.calculateGrowthRate(total.currentMonth, total.prevMonthClose),
            count: total.count
        };
    }
}

// Export for use in other modules
window.DataProcessor = DataProcessor;
