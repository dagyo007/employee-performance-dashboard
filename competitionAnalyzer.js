// Competition Analyzer Module
// Handles competitive analysis and market share metrics

class CompetitionAnalyzer {
    constructor() {
        this.msThresholds = {
            excellent: 60,
            good: 50,
            average: 40,
            poor: 30
        };

        this.improvementThresholds = {
            excellent: 10,
            good: 5,
            neutral: 0,
            poor: -5
        };
    }

    // Analyze competition metrics for a single store
    analyzeStore(store) {
        const comp = store.competition || {};
        
        return {
            ...comp,
            msStatus: this.getMSStatus(comp.currentMs, comp.channelAvgMs),
            improvementStatus: this.getImprovementStatus(comp.ytImprovement),
            ratingStatus: this.getRatingStatus(comp.yrdRating),
            channelPosition: this.getChannelPosition(comp.currentMs, comp.channelAvgMs),
            trend: this.getTrend(comp.ytImprovement),
            competitiveStrength: this.calculateCompetitiveStrength(comp)
        };
    }

    // Get MS status compared to channel average
    getMSStatus(currentMs, channelAvgMs) {
        if (!currentMs || !channelAvgMs) {
            return { label: 'N/A', class: 'neutral', icon: 'ℹ️' };
        }

        const diff = currentMs - channelAvgMs;
        
        if (diff > 10) {
            return { label: '매우 높음', class: 'excellent', icon: '🔥', diff: `+${diff.toFixed(1)}%` };
        } else if (diff > 5) {
            return { label: '높음', class: 'good', icon: '📈', diff: `+${diff.toFixed(1)}%` };
        } else if (diff > 0) {
            return { label: '평균 이상', class: 'info', icon: '✅', diff: `+${diff.toFixed(1)}%` };
        } else if (diff > -5) {
            return { label: '평균 이하', class: 'warning', icon: '⚠️', diff: `${diff.toFixed(1)}%` };
        } else {
            return { label: '낮음', class: 'danger', icon: '❌', diff: `${diff.toFixed(1)}%` };
        }
    }

    // Get improvement status
    getImprovementStatus(ytImprovement) {
        if (ytImprovement === null || ytImprovement === undefined) {
            return { label: 'N/A', class: 'neutral', icon: 'ℹ️' };
        }

        if (ytImprovement >= this.improvementThresholds.excellent) {
            return { label: '크게 개선', class: 'excellent', icon: '🚀' };
        } else if (ytImprovement >= this.improvementThresholds.good) {
            return { label: '개선', class: 'good', icon: '📈' };
        } else if (ytImprovement >= this.improvementThresholds.neutral) {
            return { label: '유지', class: 'info', icon: '➡️' };
        } else if (ytImprovement >= this.improvementThresholds.poor) {
            return { label: '미미한 감소', class: 'warning', icon: '📉' };
        } else {
            return { label: '크게 감소', class: 'danger', icon: '⬇️' };
        }
    }

    // Get rating status (1-10 scale)
    getRatingStatus(yrdRating) {
        if (!yrdRating) {
            return { label: 'N/A', class: 'neutral', icon: 'ℹ️' };
        }

        if (yrdRating >= 8) {
            return { label: '우수', class: 'excellent', icon: '⭐', rating: yrdRating };
        } else if (yrdRating >= 6) {
            return { label: '양호', class: 'good', icon: '👍', rating: yrdRating };
        } else if (yrdRating >= 4) {
            return { label: '보통', class: 'info', icon: '📊', rating: yrdRating };
        } else {
            return { label: '미흡', class: 'warning', icon: '⚠️', rating: yrdRating };
        }
    }

    // Get channel position
    getChannelPosition(currentMs, channelAvgMs) {
        if (!currentMs || !channelAvgMs) return 'N/A';
        
        const diff = currentMs - channelAvgMs;
        const percentage = (diff / channelAvgMs) * 100;
        
        if (percentage > 20) return 'Top Tier';
        if (percentage > 10) return 'Above Average';
        if (percentage > -10) return 'Average';
        if (percentage > -20) return 'Below Average';
        return 'Bottom Tier';
    }

    // Get trend direction
    getTrend(ytImprovement) {
        if (ytImprovement === null || ytImprovement === undefined) return 'neutral';
        if (ytImprovement > 5) return 'strong-up';
        if (ytImprovement > 0) return 'up';
        if (ytImprovement > -5) return 'down';
        return 'strong-down';
    }

    // Calculate overall competitive strength (0-100)
    calculateCompetitiveStrength(competition) {
        let strength = 50; // Base

        // MS factor
        if (competition.currentMs) {
            if (competition.currentMs > 60) strength += 20;
            else if (competition.currentMs > 50) strength += 10;
            else if (competition.currentMs < 30) strength -= 20;
        }

        // Improvement factor
        if (competition.ytImprovement) {
            if (competition.ytImprovement > 10) strength += 15;
            else if (competition.ytImprovement > 5) strength += 10;
            else if (competition.ytImprovement < -5) strength -= 15;
        }

        // Rating factor
        if (competition.yrdRating) {
            strength += (competition.yrdRating - 5) * 3;
        }

        // Channel comparison
        if (competition.currentMs && competition.channelAvgMs) {
            const diff = competition.currentMs - competition.channelAvgMs;
            strength += diff;
        }

        return Math.max(0, Math.min(100, strength));
    }

    // Compare stores within same channel
    compareWithinChannel(stores, channel) {
        const channelStores = stores.filter(s => s.channel === channel);
        
        if (channelStores.length === 0) return [];

        return channelStores.map(store => {
            const analysis = this.analyzeStore(store);
            const rank = this.getRankInChannel(store, channelStores);
            
            return {
                storeName: store.name,
                currentMs: store.competition?.currentMs || 0,
                ytImprovement: store.competition?.ytImprovement || 0,
                yrdRating: store.competition?.yrdRating || 0,
                rank: rank,
                analysis: analysis
            };
        }).sort((a, b) => a.rank - b.rank);
    }

    // Get rank within channel based on MS
    getRankInChannel(store, channelStores) {
        const sorted = [...channelStores].sort((a, b) => 
            (b.competition?.currentMs || 0) - (a.competition?.currentMs || 0)
        );
        
        return sorted.findIndex(s => s.name === store.name) + 1;
    }

    // Get channel statistics
    getChannelStatistics(stores, channel) {
        const channelStores = stores.filter(s => s.channel === channel);
        
        if (channelStores.length === 0) return null;

        const msValues = channelStores.map(s => s.competition?.currentMs || 0).filter(v => v > 0);
        const improvementValues = channelStores.map(s => s.competition?.ytImprovement || 0);
        const ratingValues = channelStores.map(s => s.competition?.yrdRating || 0).filter(v => v > 0);

        return {
            storeCount: channelStores.length,
            avgMs: this.average(msValues),
            maxMs: Math.max(...msValues, 0),
            minMs: Math.min(...msValues, 100),
            avgImprovement: this.average(improvementValues),
            avgRating: this.average(ratingValues),
            topPerformers: channelStores
                .sort((a, b) => (b.competition?.currentMs || 0) - (a.competition?.currentMs || 0))
                .slice(0, 3)
                .map(s => ({ name: s.name, ms: s.competition?.currentMs }))
        };
    }

    // Calculate average
    average(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    }

    // Generate competition insights
    generateInsights(store) {
        const insights = [];
        const comp = store.competition || {};

        // MS insights
        if (comp.currentMs && comp.channelAvgMs) {
            const diff = comp.currentMs - comp.channelAvgMs;
            if (diff > 10) {
                insights.push({
                    type: 'strength',
                    message: `시장점유율이 채널 평균보다 ${diff.toFixed(1)}% 높아 경쟁우위를 가지고 있습니다.`
                });
            } else if (diff < -10) {
                insights.push({
                    type: 'weakness',
                    message: `시장점유율이 채널 평균보다 ${Math.abs(diff).toFixed(1)}% 낮아 시장점유율 확대가 필요합니다.`
                });
            }
        }

        // Improvement insights
        if (comp.ytImprovement !== undefined) {
            if (comp.ytImprovement > 10) {
                insights.push({
                    type: 'strength',
                    message: `전년 대비 ${comp.ytImprovement.toFixed(1)}% 개선되어 성장세가 우수합니다.`
                });
            } else if (comp.ytImprovement < -5) {
                insights.push({
                    type: 'action',
                    message: `전년 대비 ${Math.abs(comp.ytImprovement).toFixed(1)}% 감소하여 즉각적인 개선 조치가 필요합니다.`
                });
            }
        }

        // Rating insights
        if (comp.yrdRating) {
            if (comp.yrdRating >= 8) {
                insights.push({
                    type: 'strength',
                    message: `경쟁력 등급 ${comp.yrdRating}/10으로 최상위권에 위치하고 있습니다.`
                });
            } else if (comp.yrdRating < 4) {
                insights.push({
                    type: 'action',
                    message: `경쟁력 등급이 ${comp.yrdRating}/10으로 낮아 경쟁력 강화가 시급합니다.`
                });
            }
        }

        return insights;
    }

    // Format MS for display
    formatMS(ms) {
        return ms ? `${ms.toFixed(1)}%` : 'N/A';
    }

    // Format improvement for display
    formatImprovement(improvement) {
        if (improvement === null || improvement === undefined) return 'N/A';
        const sign = improvement >= 0 ? '+' : '';
        return `${sign}${improvement.toFixed(1)}%`;
    }
}

// Export for use in other modules
window.CompetitionAnalyzer = CompetitionAnalyzer;
