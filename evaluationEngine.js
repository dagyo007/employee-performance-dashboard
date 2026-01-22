// Evaluation Engine for Store Performance
// Handles multi-dimensional scoring and evaluation logic

class EvaluationEngine {
    constructor() {
        // Evaluation weights (can be customized)
        this.weights = {
            Gross평점: 0.30,
            경쟁력평점: 0.30,
            'M&B평점': 0.20,
            구독평점: 0.20
        };

        // Rating thresholds
        this.ratingLevels = {
            excellent: 0.9,  // 90%+
            good: 0.75,      // 75-90%
            average: 0.6,    // 60-75%
            poor: 0.4,       // 40-60%
            critical: 0      // <40%
        };
    }

    // Calculate or validate evaluation scores
    // If scores already exist in data, validate them; otherwise calculate
    evaluateStore(store) {
        const evaluation = store.evaluation || {};
        
        // If evaluation already has scores, use them
        if (evaluation.총점 !== undefined && evaluation.총점 !== 0) {
            return {
                ...evaluation,
                scoreRatio: evaluation.총점 / (evaluation.최대점수 || 19),
                level: this.getEvaluationLevel(evaluation.총점 / (evaluation.최대점수 || 19)),
                breakdown: this.getScoreBreakdown(evaluation)
            };
        }

        // Otherwise, calculate new scores (basic estimation)
        const calculated = this.calculateEvaluation(store);
        return calculated;
    }

    // Calculate evaluation scores from raw data
    calculateEvaluation(store) {
        const grossScore = this.calculateGrossScore(store.gross);
        const competitionScore = this.calculateCompetitionScore(store.competition);
        const mbScore = this.calculateMBScore(store.mb);
        const subscriptionScore = this.calculateSubscriptionScore(store);

        const 최대점수 = 19;
        const 총점 = 
            (grossScore * this.weights.Gross평점 +
            competitionScore * this.weights.경쟁력평점 +
            mbScore * this.weights['M&B평점'] +
            subscriptionScore * this.weights.구독평점) * 최대점수 / 100;

        return {
            총점: parseFloat(총점.toFixed(2)),
            최대점수: 최대점수,
            Gross평점: parseFloat(grossScore.toFixed(2)),
            경쟁력평점: parseFloat(competitionScore.toFixed(2)),
            'M&B평점': parseFloat(mbScore.toFixed(2)),
            구독평점: parseFloat(subscriptionScore.toFixed(2)),
            scoreRatio: 총점 / 최대점수,
            level: this.getEvaluationLevel(총점 / 최대점수),
            breakdown: this.getScoreBreakdown({
                Gross평점: grossScore,
                경쟁력평점: competitionScore,
                'M&B평점': mbScore,
                구독평점: subscriptionScore
            })
        };
    }

    // Calculate Gross score (0-100 scale)
    calculateGrossScore(gross) {
        if (!gross || !gross.currentGross) return 0;

        let score = 50; // Base score

        // Growth rate bonus
        if (gross.prevYearGross && gross.currentGross) {
            const growthRate = ((gross.currentGross - gross.prevYearGross) / gross.prevYearGross) * 100;
            if (growthRate > 20) score += 30;
            else if (growthRate > 10) score += 20;
            else if (growthRate > 5) score += 10;
            else if (growthRate < 0) score -= 20;
        }

        // Target achievement bonus
        if (gross.targetGross && gross.currentGross) {
            const achievement = (gross.currentGross / gross.targetGross) * 100;
            if (achievement >= 100) score += 20;
            else if (achievement >= 90) score += 10;
            else if (achievement < 70) score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    // Calculate Competition score based on MS and improvement (0-100 scale)
    calculateCompetitionScore(competition) {
        if (!competition) return 0;

        let score = 50; // Base score

        // MS vs channel average
        if (competition.currentMs && competition.channelAvgMs) {
            const msDiff = competition.currentMs - competition.channelAvgMs;
            if (msDiff > 10) score += 25;
            else if (msDiff > 5) score += 15;
            else if (msDiff > 0) score += 5;
            else if (msDiff < -10) score -= 25;
            else if (msDiff < -5) score -= 15;
        }

        // YTD improvement
        if (competition.ytImprovement !== undefined) {
            if (competition.ytImprovement > 10) score += 15;
            else if (competition.ytImprovement > 5) score += 10;
            else if (competition.ytImprovement > 0) score += 5;
            else if (competition.ytImprovement < -5) score -= 15;
        }

        // Rating (1-10 scale)
        if (competition.yrdRating) {
            score += (competition.yrdRating - 5) * 2; // -10 to +10
        }

        return Math.max(0, Math.min(100, score));
    }

    // Calculate M&B score (0-100 scale)
    // This is a placeholder - adjust based on actual M&B data structure
    calculateMBScore(mbData) {
        if (!mbData || mbData.length === 0) return 50;

        // Basic scoring based on array items
        // Adjust this logic based on actual M&B data structure
        const avgValue = mbData.reduce((sum, item) => {
            if (typeof item === 'number') return sum + item;
            if (typeof item === 'object' && item.value) return sum + item.value;
            return sum;
        }, 0) / mbData.length;

        // Normalize to 0-100
        return Math.max(0, Math.min(100, avgValue));
    }

    // Calculate Subscription score (0-100 scale)
    // This is a placeholder - adjust based on actual subscription data
    calculateSubscriptionScore(store) {
        // Default good score if no specific data
        return 70;
    }

    // Get evaluation level based on score ratio
    getEvaluationLevel(ratio) {
        if (ratio >= this.ratingLevels.excellent) return {
            label: '우수',
            class: 'excellent',
            icon: '🌟',
            color: '#10b981'
        };
        if (ratio >= this.ratingLevels.good) return {
            label: '양호',
            class: 'good',
            icon: '👍',
            color: '#3b82f6'
        };
        if (ratio >= this.ratingLevels.average) return {
            label: '보통',
            class: 'average',
            icon: '📊',
            color: '#f59e0b'
        };
        if (ratio >= this.ratingLevels.poor) return {
            label: '미흡',
            class: 'poor',
            icon: '⚠️',
            color: '#ef4444'
        };
        return {
            label: '개선필요',
            class: 'critical',
            icon: '❌',
            color: '#dc2626'
        };
    }

    // Get AI feedback level styling
    getAIFeedbackLevel(level) {
        const levels = {
            excellent: { label: '탁월', class: 'excellent', icon: '⭐', color: '#10b981' },
            good: { label: '좋음', class: 'good', icon: '✅', color: '#3b82f6' },
            neutral: { label: '보통', class: 'neutral', icon: 'ℹ️', color: '#6b7280' },
            needs_improvement: { label: '개선필요', class: 'warning', icon: '⚠️', color: '#f59e0b' },
            poor: { label: '불량', class: 'danger', icon: '❌', color: '#ef4444' }
        };
        
        return levels[level] || levels.neutral;
    }

    // Get score breakdown for visualization
    getScoreBreakdown(evaluation) {
        return [
            {
                name: 'Gross평점',
                score: evaluation.Gross평점 || 0,
                maxScore: 100,
                percentage: (evaluation.Gross평점 || 0),
                weight: this.weights.Gross평점
            },
            {
                name: '경쟁력평점',
                score: evaluation.경쟁력평점 || 0,
                maxScore: 100,
                percentage: (evaluation.경쟁력평점 || 0),
                weight: this.weights.경쟁력평점
            },
            {
                name: 'M&B평점',
                score: evaluation['M&B평점'] || 0,
                maxScore: 100,
                percentage: (evaluation['M&B평점'] || 0),
                weight: this.weights['M&B평점']
            },
            {
                name: '구독평점',
                score: evaluation.구독평점 || 0,
                maxScore: 100,
                percentage: (evaluation.구독평점 || 0),
                weight: this.weights.구독평점
            }
        ];
    }

    // Batch evaluate all stores
    batchEvaluate(stores) {
        return stores.map(store => {
            const evaluation = this.evaluateStore(store);
            return {
                ...store,
                evaluation: evaluation
            };
        });
    }

    // Format score for display
    formatScore(score, decimals = 1) {
        return parseFloat(score || 0).toFixed(decimals);
    }

    // Get performance summary
    getPerformanceSummary(store) {
        const evaluation = this.evaluateStore(store);
        const competition = store.competition || {};

        return {
            storeName: store.name,
            channel: store.channel,
            총점: evaluation.총점,
            최대점수: evaluation.최대점수,
            점수비율: `${(evaluation.scoreRatio * 100).toFixed(1)}%`,
            등급: evaluation.level.label,
            경쟁력등급: competition.yrdRating ? `${competition.yrdRating}/10` : 'N/A',
            MS현황: competition.currentMs ? `${competition.currentMs}%` : 'N/A',
            개선율: competition.ytImprovement ? `${competition.ytImprovement.toFixed(1)}%` : 'N/A',
            AI평가: store.aiFeedback?.level || 'N/A'
        };
    }
}

// Export for use in other modules
window.EvaluationEngine = EvaluationEngine;
