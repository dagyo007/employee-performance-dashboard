// Master AI Feedback Generator
// Provides intelligent improvement suggestions for MASTER data

class MasterAIFeedback {
    constructor() {
        this.performanceThresholds = {
            excellent: 150,
            good: 120,
            adequate: 100,
            needsImprovement: 80,
            critical: 50
        };
    }

    /**
     * Generate comprehensive AI feedback for a master row
     * @param {Object} item - Master data item
     * @returns {Object} AI feedback with suggestions
     */
    generateFeedback(item) {
        const analysis = {
            status: this.getOverallStatus(item),
            priority: this.getPriorityLevel(item),
            suggestions: [],
            strengths: [],
            concerns: []
        };

        // Analyze sales performance
        this.analyzeSalesPerformance(item, analysis);

        // Analyze subscription performance
        this.analyzeSubscriptionPerformance(item, analysis);

        // Analyze growth trends
        this.analyzeGrowthTrends(item, analysis);

        // Generate actionable recommendations
        this.generateRecommendations(item, analysis);

        return analysis;
    }

    /**
     * Get overall performance status
     */
    getOverallStatus(item) {
        const achievement = item.achievement || 0;
        
        if (achievement >= this.performanceThresholds.excellent) {
            return { level: 'excellent', label: '탁월', icon: '🌟', color: '#10b981' };
        } else if (achievement >= this.performanceThresholds.good) {
            return { level: 'good', label: '우수', icon: '✅', color: '#3b82f6' };
        } else if (achievement >= this.performanceThresholds.adequate) {
            return { level: 'adequate', label: '양호', icon: '👍', color: '#f59e0b' };
        } else if (achievement >= this.performanceThresholds.needsImprovement) {
            return { level: 'needs-improvement', label: '개선필요', icon: '⚠️', color: '#ef4444' };
        } else {
            return { level: 'critical', label: '긴급조치', icon: '🚨', color: '#dc2626' };
        }
    }

    /**
     * Determine priority level for action
     */
    getPriorityLevel(item) {
        const achievement = item.achievement || 0;
        const growthYoY = item.growthYoY || 0;
        const growthMoM = item.growthMoM || 0;

        // Critical: Low achievement and declining
        if (achievement < 80 && (growthYoY < -5 || growthMoM < -5)) {
            return { level: 'critical', label: '최우선', color: '#dc2626' };
        }
        // High: Low achievement or significant decline
        else if (achievement < 90 || growthYoY < -10 || growthMoM < -10) {
            return { level: 'high', label: '높음', color: '#ef4444' };
        }
        // Medium: Moderate performance
        else if (achievement < 110) {
            return { level: 'medium', label: '보통', color: '#f59e0b' };
        }
        // Low: Good performance
        else {
            return { level: 'low', label: '낮음', color: '#10b981' };
        }
    }

    /**
     * Analyze sales performance
     */
    analyzeSalesPerformance(item, analysis) {
        const achievement = item.achievement || 0;
        const target = item.target || 0;
        const currentMonth = item.currentMonth || 0;
        const gap = target - currentMonth;

        if (achievement >= 150) {
            analysis.strengths.push('판매금액 목표를 크게 상회하는 뛰어난 실적');
        } else if (achievement >= 120) {
            analysis.strengths.push('판매금액 목표 초과 달성');
        } else if (achievement >= 100) {
            analysis.strengths.push('판매금액 목표 달성');
        } else if (achievement >= 80) {
            analysis.concerns.push(`목표 대비 ${this.formatNumber(gap)}원 부족 (${this.formatPercentage(100 - achievement)}% 미달)`);
            analysis.suggestions.push(`판매금액 ${this.formatPercentage(20 - (achievement - 80))}% 증대 필요`);
        } else {
            analysis.concerns.push(`심각한 판매 부진: 목표 대비 ${this.formatPercentage(100 - achievement)}% 미달`);
            analysis.suggestions.push('긴급 판매 전략 재수립 및 집중 관리 필요');
        }

        // Check sales ratio vs subscription
        if (item.subAmtTotal && currentMonth) {
            const salesRatio = (currentMonth / (currentMonth + item.subAmtTotal)) * 100;
            if (salesRatio < 40) {
                analysis.suggestions.push('일시불 판매 확대 전략 필요 (현재 구독 의존도 높음)');
            } else if (salesRatio > 85) {
                analysis.suggestions.push('구독 전환율 향상으로 안정적 수익 구조 확보 권장');
            }
        }
    }

    /**
     * Analyze subscription performance
     */
    analyzeSubscriptionPerformance(item, analysis) {
        const subAmtAchieve = item.subAmtAchieve || 0;
        const subQtyAchieve = item.subQtyAchieve || 0;
        const subShare = item.subShare || 0;

        // Amount achievement
        if (subAmtAchieve >= 120) {
            analysis.strengths.push('구독 금액 목표 크게 초과 달성');
        } else if (subAmtAchieve >= 100) {
            analysis.strengths.push('구독 금액 목표 달성');
        } else if (subAmtAchieve < 80) {
            analysis.concerns.push(`구독 금액 달성률 저조 (${this.formatPercentage(subAmtAchieve)}%)`);
            analysis.suggestions.push('구독 상품 프로모션 강화 및 고객 전환율 개선 필요');
        }

        // Quantity achievement
        if (subQtyAchieve >= 120) {
            analysis.strengths.push('구독 수량 목표 크게 초과');
        } else if (subQtyAchieve < 80 && subQtyAchieve > 0) {
            analysis.concerns.push(`구독 건수 부족 (달성률 ${this.formatPercentage(subQtyAchieve)}%)`);
            analysis.suggestions.push('신규 구독자 확보 캠페인 실시 권장');
        }

        // Share analysis
        if (subShare < 5) {
            analysis.suggestions.push('전체 매출 대비 구독 비중 낮음 - 구독 모델 강화 필요');
        } else if (subShare >= 15) {
            analysis.strengths.push(`안정적인 구독 비중 확보 (${this.formatPercentage(subShare)}%)`);
        }

        // Amount vs Quantity discrepancy
        if (Math.abs(subAmtAchieve - subQtyAchieve) > 20 && subAmtAchieve > 0 && subQtyAchieve > 0) {
            if (subAmtAchieve > subQtyAchieve) {
                analysis.suggestions.push('고가 구독 상품 비중 높음 - 대중적 상품 라인업 확대 검토');
            } else {
                analysis.suggestions.push('저가 구독 비중 높음 - 프리미엄 상품 판매 강화로 수익성 개선');
            }
        }
    }

    /**
     * Analyze growth trends
     */
    analyzeGrowthTrends(item, analysis) {
        const growthYoY = item.growthYoY || 0;
        const growthMoM = item.growthMoM || 0;
        const subAmtMoM = item.subAmtMoM || 0;

        // Year-over-Year analysis
        if (growthYoY >= 30) {
            analysis.strengths.push(`전년 대비 ${this.formatPercentage(growthYoY)}% 고성장 기록`);
            analysis.suggestions.push('성장 모멘텀 유지를 위한 추가 리소스 투입 검토');
        } else if (growthYoY >= 10) {
            analysis.strengths.push('전년 대비 안정적 성장세 유지');
        } else if (growthYoY >= 0) {
            analysis.suggestions.push('성장률 개선을 위한 신규 고객 확보 전략 필요');
        } else if (growthYoY >= -10) {
            analysis.concerns.push(`전년 대비 ${this.formatPercentage(Math.abs(growthYoY))}% 감소`);
            analysis.suggestions.push('고객 이탈 방지 및 재구매율 향상 프로그램 도입');
        } else {
            analysis.concerns.push(`전년 대비 심각한 매출 하락 (${this.formatPercentage(Math.abs(growthYoY))}%)`);
            analysis.suggestions.push('긴급 대책 회의 및 전면적 영업 전략 재수립 필요');
        }

        // Month-over-Month analysis
        if (growthMoM >= 20) {
            analysis.strengths.push('전월 대비 급격한 성장');
            analysis.suggestions.push('성공 요인 분석 및 타 지점 확산 권장');
        } else if (growthMoM < -15) {
            analysis.concerns.push(`전월 대비 ${this.formatPercentage(Math.abs(growthMoM))}% 급락`);
            analysis.suggestions.push('즉시 원인 파악 및 복구 계획 수립 필요');
        }

        // Subscription growth
        if (subAmtMoM >= 20) {
            analysis.strengths.push('구독 매출 전월 대비 급성장');
        } else if (subAmtMoM < -10) {
            analysis.concerns.push('구독 매출 감소 추세');
            analysis.suggestions.push('구독 갱신율 점검 및 고객 유지 프로그램 강화');
        }

        // Trend consistency
        if (growthYoY > 0 && growthMoM < -10) {
            analysis.concerns.push('최근 성장세 둔화 징후');
            analysis.suggestions.push('단기 실적 회복을 위한 집중 관리 필요');
        }
    }

    /**
     * Generate specific actionable recommendations
     */
    generateRecommendations(item, analysis) {
        const achievement = item.achievement || 0;
        const growthYoY = item.growthYoY || 0;

        // Strategic recommendations based on performance quadrant
        if (achievement >= 100 && growthYoY >= 10) {
            // High performance, high growth
            analysis.suggestions.unshift('✨ 우수 성과 - 현재 전략 유지 및 확대 적용 권장');
        } else if (achievement >= 100 && growthYoY < 0) {
            // High achievement but declining
            analysis.suggestions.unshift('⚡ 성과는 우수하나 성장세 둔화 - 중장기 성장 동력 확보 필요');
        } else if (achievement < 90 && growthYoY >= 10) {
            // Growing but underperforming
            analysis.suggestions.unshift('🎯 성장세는 양호하나 목표 미달 - 목표 대비 격차 해소에 집중');
        } else if (achievement < 90 && growthYoY < 0) {
            // Underperforming and declining
            analysis.suggestions.unshift('🚨 긴급 개선 필요 - 즉각적인 대응 조치 및 집중 관리 체계 구축');
        }

        // Limit suggestions to top 3-4 most important
        if (analysis.suggestions.length > 4) {
            analysis.suggestions = analysis.suggestions.slice(0, 4);
        }
    }

    /**
     * Format feedback for display in table cell
     */
    formatCompactFeedback(item) {
        const feedback = this.generateFeedback(item);
        const parts = [];

        // Status with icon
        parts.push(`${feedback.status.icon} ${feedback.status.label}`);

        // Top suggestion if exists
        if (feedback.suggestions.length > 0) {
            // Get first suggestion and truncate if too long
            const suggestion = feedback.suggestions[0].replace(/[✨⚡🎯🚨]/g, '').trim();
            const truncated = suggestion.length > 50 ? suggestion.substring(0, 47) + '...' : suggestion;
            parts.push(truncated);
        }

        return parts.join(' • ');
    }

    /**
     * Format detailed feedback for tooltip or modal
     */
    formatDetailedFeedback(item) {
        const feedback = this.generateFeedback(item);
        let html = `<div class="ai-feedback-detailed">`;

        // Status header
        html += `<div class="ai-status" style="color: ${feedback.status.color}; font-weight: 600; margin-bottom: 0.75rem;">`;
        html += `${feedback.status.icon} ${feedback.status.label} (우선순위: ${feedback.priority.label})`;
        html += `</div>`;

        // Strengths
        if (feedback.strengths.length > 0) {
            html += `<div class="ai-section" style="margin-bottom: 0.75rem;">`;
            html += `<strong style="color: #10b981;">✅ 강점</strong>`;
            html += `<ul style="margin: 0.25rem 0 0 1.25rem; font-size: 0.85rem;">`;
            feedback.strengths.forEach(s => html += `<li>${s}</li>`);
            html += `</ul></div>`;
        }

        // Concerns
        if (feedback.concerns.length > 0) {
            html += `<div class="ai-section" style="margin-bottom: 0.75rem;">`;
            html += `<strong style="color: #ef4444;">⚠️ 우려사항</strong>`;
            html += `<ul style="margin: 0.25rem 0 0 1.25rem; font-size: 0.85rem;">`;
            feedback.concerns.forEach(c => html += `<li>${c}</li>`);
            html += `</ul></div>`;
        }

        // Recommendations
        if (feedback.suggestions.length > 0) {
            html += `<div class="ai-section">`;
            html += `<strong style="color: #3b82f6;">💡 개선 제안</strong>`;
            html += `<ul style="margin: 0.25rem 0 0 1.25rem; font-size: 0.85rem;">`;
            feedback.suggestions.forEach(s => html += `<li>${s}</li>`);
            html += `</ul></div>`;
        }

        html += `</div>`;
        return html;
    }

    /**
     * Helper: Format number with commas
     */
    formatNumber(num) {
        return new Intl.NumberFormat('ko-KR').format(Math.round(num));
    }

    /**
     * Helper: Format percentage with one decimal
     */
    formatPercentage(val) {
        return (Math.floor(val * 10) / 10).toFixed(1);
    }
}

// Export for global use
window.MasterAIFeedback = MasterAIFeedback;
