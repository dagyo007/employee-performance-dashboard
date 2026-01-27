/**
 * Demo Data for Store Evaluation System
 * Extracted and simulated based on user screenshots
 */

const DEMO_DATA = {
    master: [
        ["구분", "목표", "판매금액", "", "", "신장 및 달성", "", "", "", "", "", "구독", "", "", "", "", "", "", "", "", "수량"],
        ["", "", "전년마감", "전월마감", "당월", "달성률", "전년比", "전월比", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["울산점", 215.1, 181.5, 180.3, 363.0, 168.8, 100.0, 101.3, 0, 0, 0, 50.3, 0, 0, 0, 0, 0, 0, 0, 0, 48],
        ["해운대점", 153.6, 89.1, 365.8, 251.0, 163.4, 181.7, -31.4, 0, 0, 0, 42.1, 0, 0, 0, 0, 0, 0, 0, 0, 35],
        ["기장점", 120.0, 131.4, 114.0, 150.0, 125.0, 14.2, 31.6, 0, 0, 0, 28.5, 0, 0, 0, 0, 0, 0, 0, 0, 22],
        ["센텀점", 135.9, 170.5, 162.0, 180.0, 132.4, 5.6, 11.1, 0, 0, 0, 33.2, 0, 0, 0, 0, 0, 0, 0, 0, 31]
    ],
    sales: [
        ["구분", "목표", "판매금액", "", "", "", "신장률", ""],
        ["", "", "전년 마감", "전월 마감", "당월", "달성률", "전년比", "전월比"],
        ["인터비즈", 15621, 26404, 25329, 31587, 121.7, 19.6, 24.7],
        ["양판점", 5692, 15889, 20749, 21770, 161.6, 37.0, 4.9],
        ["양판1담당", 1105, 4523, 6394, 7325, 151.4, 61.9, 14.6],
        ["전자랜드", 5692, 5396, 6861, 9197, 161.6, 70.4, 34.1]
    ],
    salesBranch: [
        {
            manager1: "양판1담당",
            team: "혼매동부산팀",
            channel: "전자랜드",
            name: "전자랜드 기장메가마트점",
            manager2: "서승호",
            target: 40.2,
            prevYearClose: 24.7,
            prevMonthClose: 39.6,
            currentMonth: 41.0,
            achievement: 102.0,
            growthYoY: 66.0,
            growthMoM: 3.6
        },
        {
            manager1: "양판1담당",
            team: "혼매동부산팀",
            channel: "전자랜드",
            name: "전자랜드 기장점_가전",
            manager2: "서승호",
            target: 53.0,
            prevYearClose: 24.9,
            prevMonthClose: 64.9,
            currentMonth: 101.0,
            achievement: 190.6,
            growthYoY: 305.8,
            growthMoM: 55.5
        },
        {
            manager1: "양판1담당",
            team: "혼매동부산팀",
            channel: "하이마트",
            name: "하이마트 기장점",
            manager2: "기명식",
            target: 0,
            prevYearClose: 52.9,
            prevMonthClose: 51.2,
            currentMonth: 33.0,
            achievement: 0,
            growthYoY: -37.7,
            growthMoM: -35.5
        }
    ],
    // [첨부 이미지1] 구독 메뉴의 구독 표 (Summary)
    subscription: [
        ["구분", "목표_금액", "목표_수량", "금액_전월마감", "금액_당월", "금액_일시불", "금액_합계", "금액_달성률", "금액_성장률", "금액_비중", "수량_전월마감", "수량_당월", "수량_달성률", "수량_성장률"],
        ["인터비즈", 0, 0, 1932.0, 2629.0, 0, 0, 0, 36.1, 7.1, 1328, 1409, 0, 6.1],
        ["전자랜드", 0, 0, 843.7, 1096.5, 7937.7, 9034.2, 0, 30.0, 8.2, 575, 599, 0, 4.2],
        ["양판1담당", 0, 0, 156.3, 180.0, 1461.0, 1641.0, 0, 15.1, 9.1, 117, 110, 0, -6.0],
        ["서승호", 0, 0, 65.5, 72.0, 683.0, 755.0, 0, 9.9, 10.5, 55, 57, 0, 3.6]
    ],
    // [첨부 이미지2] 구독 메뉴의 지점별 표
    subscriptionBranch: [
        {
            manager1: "양판1담당",
            team: "혼매동부산팀",
            channel: "전자랜드",
            name: "전자랜드 기장메가마트점",
            manager2: "서승호",
            targetAmount: 0,
            targetQty: 0,
            prevMonthAmount: 4.6,
            currentAmount: 7.5,
            cashAmount: 33.5,
            totalAmount: 41.0,
            achAmount: 0,
            growthAmount: 63.1,
            ratio: 18.3,
            prevMonthQty: 4,
            currentQty: 5,
            achQty: 0,
            growthQty: 25.0
        },
        {
            manager1: "양판1담당",
            team: "혼매동부산팀",
            channel: "전자랜드",
            name: "전자랜드 기장점_가전",
            manager2: "서승호",
            targetAmount: 0,
            targetQty: 0,
            prevMonthAmount: 11.2,
            currentAmount: 3.0,
            cashAmount: 98.0,
            totalAmount: 101.0,
            achAmount: 0,
            growthAmount: -73.2,
            ratio: 3.0,
            prevMonthQty: 11,
            currentQty: 2,
            achQty: 0,
            growthQty: -81.8
        }
    ]
};

if (typeof window !== 'undefined') {
    window.DEMO_DATA = DEMO_DATA;
}
