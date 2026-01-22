// Incentive Engine Module
// Handles complex incentive calculations based on channel, subscription ratio, grade, and other factors

class IncentiveEngine {
    constructor() {
        // Allowance policy configuration
        this.ALLOWANCE_POLICY = {
            '이마트': [
                { min: 0, max: 15, allowance: 20 },
                { min: 15, max: 25, allowance: 0 },  // 수정: 15→0 (구독비중 15-25%는 수당 없음)
                { min: 25, max: 35, allowance: 20 },
                { min: 35, max: 100, allowance: 30 }
            ],
            '홈플러스': [
                { min: 0, max: 10, allowance: 30 },
                { min: 10, max: 20, allowance: 10 },  // 수정: -10→10 (마이너스 수당은 비정상)
                { min: 20, max: 30, allowance: 20 },
                { min: 30, max: 100, allowance: 30 }
            ],
            '전자랜드': [
                { min: 0, max: 10, allowance: 30 },
                { min: 10, max: 20, allowance: 10 },  // 수정: -10→10 (마이너스 수당은 비정상)
                { min: 20, max: 30, allowance: 20 },
                { min: 30, max: 100, allowance: 30 }
            ]
        };

        // Grade bonus multipliers
        this.GRADE_BONUS = {
            'Junior': 1.0,
            'Senior': 1.2,
            'Manager': 1.5
        };

        // Achievement rate bonus tiers
        this.ACHIEVEMENT_BONUS = [
            { min: 0, max: 80, multiplier: 0.0 },
            { min: 80, max: 100, multiplier: 1.0 },
            { min: 100, max: 120, multiplier: 1.2 },
            { min: 120, max: 150, multiplier: 1.5 },
            { min: 150, max: Infinity, multiplier: 2.0 }
        ];

        // Maximum incentive cap
        this.MAX_INCENTIVE = 5000000; // 5백만원
    }

    // Calculate base allowance based on channel and subscription ratio
    calculateBaseAllowance(channel, subscriptionRatio) {
        const policy = this.ALLOWANCE_POLICY[channel];
        
        if (!policy) {
            console.warn(`Unknown channel: ${channel}`);
            return 0;
        }

        for (const tier of policy) {
            if (subscriptionRatio >= tier.min && subscriptionRatio < tier.max) {
                return tier.allowance;
            }
        }

        return 0;
    }

    // Calculate achievement rate
    calculateAchievementRate(salesAmount, targetAmount) {
        if (targetAmount === 0) return 0;
        return (salesAmount / targetAmount) * 100;
    }

    // Get achievement bonus multiplier
    getAchievementMultiplier(achievementRate) {
        for (const tier of this.ACHIEVEMENT_BONUS) {
            if (achievementRate >= tier.min && achievementRate < tier.max) {
                return tier.multiplier;
            }
        }
        return 0;
    }

    // Get grade bonus multiplier
    getGradeMultiplier(grade) {
        return this.GRADE_BONUS[grade] || 1.0;
    }

    // Calculate adjustments (가감점)
    calculateAdjustments(data) {
        let adjustment = 0;

        // Example adjustment rules (customize as needed)
        
        // Bonus for high subscription ratio in any channel
        if (data.subscriptionRatio >= 40) {
            adjustment += 50000; // 5만원 추가
        }

        // Penalty for very low subscription ratio
        if (data.subscriptionRatio < 5) {
            adjustment -= 20000; // 2만원 감점
        }

        // Bonus for exceptional performance
        if (data.achievementRate >= 150) {
            adjustment += 100000; // 10만원 추가
        }

        // Multi-channel bonus (if applicable)
        // This would require additional data about cross-selling

        return adjustment;
    }

    // Main incentive calculation
    calculateIncentive(employeeData) {
        // 1. Calculate achievement rate
        const achievementRate = this.calculateAchievementRate(
            employeeData.totalSales || employeeData.salesAmount,
            employeeData.totalTarget || employeeData.targetAmount
        );

        // 2. Get base allowance from subscription ratio and channel
        const baseAllowance = this.calculateBaseAllowance(
            employeeData.channel,
            employeeData.subscriptionRatio
        );

        // 3. Get achievement multiplier
        const achievementMultiplier = this.getAchievementMultiplier(achievementRate);

        // 4. Get grade multiplier
        const gradeMultiplier = this.getGradeMultiplier(employeeData.grade);

        // 5. Calculate base incentive
        // Base allowance is per unit, multiply by sales amount factor
        const salesFactor = Math.min(
            (employeeData.totalSales || employeeData.salesAmount) / 1000000,
            100
        ); // Cap at 100
        
        let baseIncentive = baseAllowance * salesFactor * achievementMultiplier * gradeMultiplier;

        // 6. Apply adjustments
        const adjustmentData = {
            subscriptionRatio: employeeData.subscriptionRatio,
            achievementRate: achievementRate,
            channel: employeeData.channel
        };
        const adjustment = this.calculateAdjustments(adjustmentData);

        // 7. Calculate total incentive
        let totalIncentive = baseIncentive + adjustment;

        // 8. Apply maximum cap
        if (totalIncentive > this.MAX_INCENTIVE) {
            totalIncentive = this.MAX_INCENTIVE;
        }

        // 9. Ensure non-negative (unless policy allows negative)
        totalIncentive = Math.max(totalIncentive, 0);

        return {
            achievementRate: parseFloat(achievementRate.toFixed(2)),
            baseAllowance: baseAllowance,
            baseIncentive: Math.round(baseIncentive),
            gradeMultiplier: gradeMultiplier,
            achievementMultiplier: achievementMultiplier,
            adjustment: adjustment,
            totalIncentive: Math.round(totalIncentive),
            cappedAt: totalIncentive >= this.MAX_INCENTIVE
        };
    }

    // Batch calculate incentives for multiple employees
    batchCalculate(employeesData) {
        return employeesData.map(employee => {
            const incentiveDetails = this.calculateIncentive(employee);
            return {
                ...employee,
                ...incentiveDetails
            };
        });
    }

    // Calculate N/S (New/Sustainable) metrics
    // This is a placeholder - adjust based on actual business logic
    calculateNS(salesData) {
        // Example: New customers vs Returning customers
        // In real scenario, this would require customer transaction history
        
        return {
            newCustomers: 0,
            sustainableCustomers: 0,
            newRevenue: 0,
            sustainableRevenue: 0,
            nsRatio: 0
        };
    }

    // Get performance status based on achievement rate
    getPerformanceStatus(achievementRate) {
        if (achievementRate >= 120) {
            return { label: '우수', class: 'success', icon: '🌟' };
        } else if (achievementRate >= 100) {
            return { label: '달성', class: 'success', icon: '✅' };
        } else if (achievementRate >= 80) {
            return { label: '양호', class: 'info', icon: '📊' };
        } else if (achievementRate >= 50) {
            return { label: '미달', class: 'warning', icon: '⚠️' };
        } else {
            return { label: '저조', class: 'danger', icon: '❌' };
        }
    }

    // Format currency for display
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Format number with commas
    formatNumber(num) {
        return new Intl.NumberFormat('ko-KR').format(num);
    }

    // Get incentive breakdown for reporting
    getIncentiveBreakdown(employeeData) {
        const calculation = this.calculateIncentive(employeeData);
        
        return {
            사원명: employeeData.employeeName,
            지점: employeeData.branch,
            채널: employeeData.channel,
            Grade: employeeData.grade,
            판매실적: this.formatCurrency(employeeData.totalSales || employeeData.salesAmount),
            목표: this.formatCurrency(employeeData.totalTarget || employeeData.targetAmount),
            달성률: `${calculation.achievementRate}%`,
            구독비중: `${employeeData.subscriptionRatio}%`,
            기본수당: this.formatCurrency(calculation.baseIncentive),
            가감점: this.formatCurrency(calculation.adjustment),
            총인센티브: this.formatCurrency(calculation.totalIncentive),
            상한선적용: calculation.cappedAt ? 'Y' : 'N'
        };
    }
}

// Export for use in other modules
window.IncentiveEngine = IncentiveEngine;
