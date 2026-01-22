// AI 피드백 생성 로직
function generateAIFeedback(item) {
    const feedbacks = [];
    
    // 달성률 기반 피드백
    const achievement = item.achievement || 0;
    if (achievement >= 150) {
        feedbacks.push('🌟 목표 대비 탁월한 성과');
    } else if (achievement >= 120) {
        feedbacks.push('✅ 목표 초과 달성');
    } else if (achievement >= 100) {
        feedbacks.push('👍 목표 달성');
    } else if (achievement >= 80) {
        feedbacks.push('⚠️ 목표 미달 (개선 필요)');
    } else {
        feedbacks.push('🔴 심각한 목표 미달');
    }
    
    // 성장률 기반 피드백
    const growthYoY = item.growthYoY || 0;
    const growthMoM = item.growthMoM || 0;
    
    if (growthYoY > 30) {
        feedbacks.push('📈 전년 대비 고성장');
    } else if (growthYoY < -10) {
        feedbacks.push('📉 전년 대비 하락세');
    }
    
    if (growthMoM > 20) {
        feedbacks.push('⬆️ 전월 대비 급성장');
    } else if (growthMoM < -10) {
        feedbacks.push('⬇️ 전월 대비 감소');
    }
    
    // 기본 피드백
    if (feedbacks.length === 1) {
        feedbacks.push('🔍 지속적인 모니터링 필요');
    }
    
    return feedbacks.join(' | ');
}

// Export for global use
window.generateAIFeedback = generateAIFeedback;
