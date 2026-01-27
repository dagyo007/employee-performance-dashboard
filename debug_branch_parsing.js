
class DataProcessor {
    constructor() { }

    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            let val = value.trim();
            // Handle Korean negative markers: △ or ▲
            let multiplier = 1;
            if (val.includes('△') || val.includes('▲')) multiplier = -1;
            
            const cleaned = val.replace(/[^0-9.-]/g, '');
            let num = parseFloat(cleaned) || 0;
            
            if (multiplier === -1 && num > 0) num *= -1;
            return num;
        }
        return 0;
    }

    calculateAchievementRate(current, target) {
        if (!target || target === 0) return 0;
        return (current / target) * 100;
    }

    calculateGrowthRate(current, previous) {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }
    
    parseRawText(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        return lines.map(line => {
            let cells = [];
            if (line.includes('\t')) {
                cells = line.split('\t').map(cell => cell.trim());
            }
            if (cells.length <= 1) {
                cells = line.split(/\s{2,}/).map(cell => cell.trim());
            }
            return cells;
        });
    }

    processSubscriptionData(rows) {
        if (!Array.isArray(rows)) return { data: [], isBranch: false };

        const headerRowIdx = rows.findIndex(row => row && 
            (row.includes('담당') || row.includes('지점명') || row.includes('지점') || row.includes('구분')));
        
        if (headerRowIdx === -1) return { data: [], isBranch: false };

        // Branch logic
        const dataStartIdx = headerRowIdx + 1;
        const dataRows = rows.slice(dataStartIdx);

        const data = dataRows.map((row, idx) => {
            if (!row || row.length < 5 || !row[3]) return null;
            const firstCell = String(row[0] || '').trim();
            if (firstCell.includes('필터') || firstCell === '담당') return null;

            console.log(`Row ${idx} Length: ${row.length}`);
            console.log('Row Dump:', row);

            const targetAmount = this.parseNumber(row[5]);
            const targetQty = this.parseNumber(row[6]);
            const prevMonthAmount = this.parseNumber(row[7]);
            const currentAmount = this.parseNumber(row[8]);
            const cashAmount = this.parseNumber(row[9]);
            
            let totalAmount = this.parseNumber(row[10]);
            if ((!totalAmount || totalAmount === 0) && (currentAmount !== 0 || cashAmount !== 0)) {
                totalAmount = currentAmount + cashAmount;
            }

            let achAmount = this.parseNumber(row[11]);
            if ((!achAmount || achAmount === 0) && targetAmount > 0) {
                achAmount = this.calculateAchievementRate(totalAmount, targetAmount);
            }

            let growthAmount = this.parseNumber(row[12]);
            if (!growthAmount && prevMonthAmount > 0) {
                    growthAmount = this.calculateGrowthRate(currentAmount, prevMonthAmount);
            }

            // check index 13 just in case
            const ratio = this.parseNumber(row[13]);

            return {
                name: row[3],
                targetAmount,
                totalAmount,
                achAmount,
                growthAmount,
                ratio
            };
        }).filter(item => item !== null);

        return { data, isBranch: true };
    }
}

// Emulate User Paste exactly as it likely appears (spaces may vary, assuming string literal)
// I will copy the text from the prompt carefully
const rawText = `담당	팀	채널	지점명	관리자	목표		구독										
담당	팀	채널	지점명	관리자	목표		금액							수량			
담당	팀	채널	지점명	관리자	금액	수량	전월마감	당월	일시불	금액 합	달성율	전월마감比	비중	전월마감	당월	달성률	전월마감比
필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터	필터
양판1담당	혼매동부산팀	전자랜드	전자랜드 기장메가마트점	서승호			 4.6 	 7.5 	33.5	41.0		63.1	18.3	4	5		25.0`;

const processor = new DataProcessor();
console.log('Parsing Text...');
const rows = processor.parseRawText(rawText);
console.log('Processed Rows (Headers + Data):', rows.length);

console.log('Running processSubscriptionData...');
const result = processor.processSubscriptionData(rows);

const item = result.data.find(d => d.name === '전자랜드 기장메가마트점');
console.log('Parsed Item:', item);

if (item) {
    if (item.growthAmount === 0) {
        console.error('FAIL: Growth Amount is 0');
    } else {
        console.log('SUCCESS: Growth Amount is ' + item.growthAmount);
    }
} else {
    console.error('FAIL: Item not found');
}
