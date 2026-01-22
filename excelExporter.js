// Excel Exporter for Store Evaluation System
// Generates comprehensive Excel reports

class ExcelExporter {
    constructor(dataProcessor, evaluationEngine, competitionAnalyzer) {
        this.dataProcessor = dataProcessor;
        this.evaluationEngine = evaluationEngine;
        this.competitionAnalyzer = competitionAnalyzer;
    }

    // Export comprehensive store evaluation report
    exportStoreEvaluationReport(processedData) {
        const workbook = XLSX.utils.book_new();

        // 1. Store Evaluation Sheet
        const evaluationData = processedData.map(store => ({
            '지점명': store.name,
            '채널': store.channel,
            '총점': store.evaluation.총점,
            '최대점수': store.evaluation.최대점수,
            '점수비율(%)': (store.evaluation.scoreRatio * 100).toFixed(1),
            'Gross평점': store.evaluation.Gross평점?.toFixed(1) || 'N/A',
            '경쟁력평점': store.evaluation.경쟁력평점?.toFixed(1) || 'N/A',
            'M&B평점': store.evaluation['M&B평점']?.toFixed(1) || 'N/A',
            '구독평점': store.evaluation.구독평점?.toFixed(1) || 'N/A',
            '평가등급': store.evaluation.level?.label || 'N/A'
        }));

        const ws1 = XLSX.utils.json_to_sheet(evaluationData);
        ws1['!cols'] = Array(10).fill({ wch: 15 });
        XLSX.utils.book_append_sheet(workbook, ws1, '지점 평가');

        // 2. Competition Analysis Sheet
        const competitionData = processedData.map(store => ({
            '지점명': store.name,
            '채널': store.channel,
            'YTD MS': store.competition?.ytdMs?.toFixed(1) || 'N/A',
            '현재 MS': store.competition?.currentMs?.toFixed(1) || 'N/A',
            '채널평균 MS': store.competition?.channelAvgMs?.toFixed(1) || 'N/A',
            'MS차이': store.competitionAnalysis?.msStatus?.diff || 'N/A',
            '개선율(%)': store.competition?.ytImprovement?.toFixed(1) || 'N/A',
            '경쟁력등급': `${store.competition?.yrdRating || 'N/A'}/10`,
            '경쟁력강도': store.competitionAnalysis?.competitiveStrength?.toFixed(1) || 'N/A'
        }));

        const ws2 = XLSX.utils.json_to_sheet(competitionData);
        ws2['!cols'] = Array(9).fill({ wch: 15 });
        XLSX.utils.book_append_sheet(workbook, ws2, '경쟁력 분석');

        // 3. Channel Summary Sheet
        const channels = this.dataProcessor.getChannels();
        const channelSummary = channels.map(channel => {
            const channelStores = processedData.filter(s => s.channel === channel);
            const avgScore = channelStores.reduce((sum, s) => sum + s.evaluation.총점, 0) / channelStores.length;
            const avgMs = channelStores.reduce((sum, s) => sum + (s.competition?.currentMs || 0), 0) / channelStores.length;
            const excellentCount = channelStores.filter(s => s.evaluation.scoreRatio >= 0.9).length;

            return {
                '채널': channel,
                '지점수': channelStores.length,
                '평균점수': avgScore.toFixed(1),
                '평균MS': avgMs.toFixed(1),
                '우수매장수': excellentCount,
                '우수비율(%)': ((excellentCount / channelStores.length) * 100).toFixed(1)
            };
        });

        const ws3 = XLSX.utils.json_to_sheet(channelSummary);
        ws3['!cols'] = Array(6).fill({ wch: 15 });
        XLSX.utils.book_append_sheet(workbook, ws3, '채널별 요약');

        // 4. AI Feedback Sheet
        const aiFeedbackData = processedData
            .filter(store => store.aiFeedback?.summary)
            .map(store => ({
                '지점명': store.name,
                '채널': store.channel,
                'AI평가등급': store.aiFeedback.level,
                '패턴': store.aiFeedback.pattern,
                '피드백요약': store.aiFeedback.summary.replace(/<[^>]*>/g, '').substring(0, 200) // Strip HTML
            }));

        if (aiFeedbackData.length > 0) {
            const ws4 = XLSX.utils.json_to_sheet(aiFeedbackData);
            ws4['!cols'] = [
                { wch: 25 },
                { wch: 12 },
                { wch: 12 },
                { wch: 15 },
                { wch: 50 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws4, 'AI 피드백');
        }

        // 5. Alerts Sheet
        const anomalies = this.dataProcessor.detectAnomalies();
        if (anomalies.length > 0) {
            const alertsData = anomalies.map(anomaly => ({
                '유형': anomaly.type,
                '심각도': anomaly.severity,
                '지점명': anomaly.storeName,
                '채널': anomaly.channel,
                '메시지': anomaly.message,
                '값': anomaly.value || 'N/A'
            }));

            const ws5 = XLSX.utils.json_to_sheet(alertsData);
            ws5['!cols'] = [
                { wch: 20 },
                { wch: 10 },
                { wch: 25 },
                { wch: 12 },
                { wch: 50 },
                { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws5, '알림');
        }

        // 6. Overall Summary
        const totalStores = processedData.length;
        const avgTotalScore = processedData.reduce((sum, s) => sum + s.evaluation.총점, 0) / totalStores;
        const avgMs = processedData.reduce((sum, s) => sum + (s.competition?.currentMs || 0), 0) / totalStores;
        const excellentStores = processedData.filter(s => s.evaluation.scoreRatio >= 0.9).length;

        const summaryData = [
            ['전체 지점 평가 요약', ''],
            ['', ''],
            ['항목', '값'],
            ['총 지점 수', totalStores],
            ['평균 평가 점수', avgTotalScore.toFixed(1)],
            ['평균 MS (%)', avgMs.toFixed(1)],
            ['우수 지점 수', excellentStores],
            ['우수 비율 (%)', ((excellentStores / totalStores) * 100).toFixed(1)],
            ['채널 수', channels.length],
            ['이상값 감지 수', anomalies.length],
            ['', ''],
            ['생성일시', new Date().toLocaleString('ko-KR')]
        ];

        const ws6 = XLSX.utils.aoa_to_sheet(summaryData);
        ws6['!cols'] = [{ wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, ws6, '전체 요약');

        // Download file
        const fileName = `지점평가리포트_${this.getDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        return fileName;
    }

    // Export MASTER 관리 report
    exportMasterReport(data) {
        const workbook = XLSX.utils.book_new();
        const exportData = data.map(item => ({
            '구분': item.group,
            '목표': item.target,
            '전년마감': item.prevYearClose,
            '전월마감': item.prevMonthClose,
            '당월': item.currentMonth,
            '달성률(%)': item.achievement,
            '전년比(%)': item.growthYoY,
            '전월比(%)': item.growthMoM,
            '구독금액': item.subAmount,
            '구독수량': item.subQty
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, ws, 'MASTER 관리');
        
        const fileName = `MASTER_관리_${this.getDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        return fileName;
    }

    // Export Sales report
    exportSalesReport(data) {
        const workbook = XLSX.utils.book_new();
        const exportData = data.map(item => ({
            '구분': item.name,
            '목표': item.target,
            '전년 마감': item.prevYearClose,
            '전월 마감': item.prevMonthClose,
            '당월': item.currentMonth,
            '달성률(%)': item.achievement,
            '전년比(%)': item.growthYoY,
            '전월比(%)': item.growthMoM
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, ws, '판매금액 실적');
        
        const fileName = `판매금액_실적_${this.getDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        return fileName;
    }

    // Export Subscription report
    exportSubscriptionReport(data) {
        const workbook = XLSX.utils.book_new();
        const exportData = data.map(item => ({
            '지점명': item.name,
            '관리자': item.manager,
            '전월마감': item.prevMonthClose,
            '당월': item.currentMonth,
            '전월마감比(%)': item.growthRatio,
            '일시불': item.cashAmount,
            '금액 합': item.totalAmount,
            '수량_전월': item.qtyPrevMonth,
            '수량_당월': item.qtyCurrent
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, ws, '구독 실적');
        
        const fileName = `구독_실적_${this.getDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        return fileName;
    }

    // Export top/bottom performers
    exportPerformersReport(processedData) {
        const workbook = XLSX.utils.book_new();

        const topStores = [...processedData]
            .sort((a, b) => b.evaluation.총점 - a.evaluation.총점)
            .slice(0, 20);

        const bottomStores = [...processedData]
            .sort((a, b) => a.evaluation.총점 - b.evaluation.총점)
            .slice(0, 20);

        // Top performers
        const topData = topStores.map((store, index) => ({
            '순위': index + 1,
            '지점명': store.name,
            '채널': store.channel,
            '총점': store.evaluation.총점.toFixed(1),
            '점수비율(%)': (store.evaluation.scoreRatio * 100).toFixed(1),
            '현재MS(%)': store.competition?.currentMs?.toFixed(1) || 'N/A',
            '개선율(%)': store.competition?.ytImprovement?.toFixed(1) || 'N/A'
        }));

        const ws1 = XLSX.utils.json_to_sheet(topData);
        ws1['!cols'] = Array(7).fill({ wch: 15 });
        XLSX.utils.book_append_sheet(workbook, ws1, 'Top 20 우수 지점');

        // Bottom performers
        const bottomData = bottomStores.map((store, index) => ({
            '순위': index + 1,
            '지점명': store.name,
            '채널': store.channel,
            '총점': store.evaluation.총점.toFixed(1),
            '점수비율(%)': (store.evaluation.scoreRatio * 100).toFixed(1),
            '현재MS(%)': store.competition?.currentMs?.toFixed(1) || 'N/A',
            '개선율(%)': store.competition?.ytImprovement?.toFixed(1) || 'N/A',
            '개선필요사항': this.getImprovementSuggestion(store)
        }));

        const ws2 = XLSX.utils.json_to_sheet(bottomData);
        ws2['!cols'] = [
            { wch: 8 },
            { wch: 25 },
            { wch: 12 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 40 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws2, 'Bottom 20 개선 필요');

        const fileName = `우수개선지점_${this.getDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        return fileName;
    }

    // Export channel comparison
    exportChannelReport(processedData) {
        const workbook = XLSX.utils.book_new();
        const channels = this.dataProcessor.getChannels();

        channels.forEach(channel => {
            const channelStores = processedData.filter(s => s.channel === channel);
            
            const channelData = channelStores.map(store => ({
                '지점명': store.name,
                '총점': store.evaluation.총점.toFixed(1),
                'Gross평점': store.evaluation.Gross평점?.toFixed(1) || 'N/A',
                '경쟁력평점': store.evaluation.경쟁력평점?.toFixed(1) || 'N/A',
                'M&B평점': store.evaluation['M&B평점']?.toFixed(1) || 'N/A',
                '구독평점': store.evaluation.구독평점?.toFixed(1) || 'N/A',
                '현재MS': store.competition?.currentMs?.toFixed(1) || 'N/A',
                '개선율': store.competition?.ytImprovement?.toFixed(1) || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(channelData);
            ws['!cols'] = Array(8).fill({ wch: 15 });
            XLSX.utils.book_append_sheet(workbook, ws, channel.substring(0, 31)); // Excel sheet name limit
        });

        const fileName = `채널별상세리포트_${this.getDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        return fileName;
    }

    // Get improvement suggestion
    getImprovementSuggestion(store) {
        const suggestions = [];
        
        if (store.evaluation.Gross평점 < 50) {
            suggestions.push('매출 개선');
        }
        if (store.evaluation.경쟁력평점 < 50) {
            suggestions.push('경쟁력 강화');
        }
        if (store.competition?.currentMs < store.competition?.channelAvgMs) {
            suggestions.push('MS 확대');
        }
        if (store.competition?.ytImprovement < 0) {
            suggestions.push('성장률 회복');
        }

        return suggestions.length > 0 ? suggestions.join(', ') : '종합적 개선 필요';
    }

    // Get formatted date string for filename
    getDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
}

// Export for use in other modules
window.ExcelExporter = ExcelExporter;
