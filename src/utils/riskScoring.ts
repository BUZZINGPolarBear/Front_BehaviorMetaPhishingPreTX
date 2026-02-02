/**
 * 위험도 점수화 모듈
 * 각 위험 요소별 점수를 명확하게 정의하고 계산
 */

import type { InputSignals } from "../types/api";

/**
 * 위험 요소별 점수 가중치 정의
 */
export const RISK_WEIGHTS = {
  // 입력 행위 패턴 (최대 100점)
  BEHAVIOR: {
    PASTED_TEXT: 30,              // 붙여넣기
    STRESS_TOUCH: 50,             // 스트레스 터치 (3회 이상 머뭇거림) - 보이스피싱 강력 지표
    FREQUENT_HESITATION: 30,      // 머뭇거림 (1.5초+ pause 1~2회) - 보이스피싱 핵심 지표
    NO_TYPING: 20,                // 타이핑 없음
    FAST_TYPING: 20,              // 비정상적으로 빠른 타이핑 (5+ cps)
    REPEATED_CORRECTIONS: 15,     // 반복적 수정 (erase ratio 30%+)
    NO_CORRECTION: 15,            // 수정 없이 입력 (backspace 0회)
    SLOW_DELIBERATE_TYPING: 10,   // 느린 타이핑 (평균 1초+ 간격)
    FREQUENT_FOCUS_CHANGE: 10,    // 잦은 포커스 변경 (5회 이상)
    FAST_INPUT_VS_DURATION: 10,   // 짧은 시간에 긴 텍스트 (10+ cps)
  },

  // 텍스트 내용 분석 (최대 65점)
  CONTENT: {
    URL_DETECTED: 25,             // URL 포함
    HIGH_AMOUNT: 30,              // 고액 거래 (100만원 이상) - suspicious가 medium이 되도록 조정
    ACCOUNT_NUMBER: 10,           // 계좌번호 포함
  },
} as const;

import type { ScoreBreakdown } from "../types/api";

/**
 * 텍스트 내용 분석 결과
 */
interface TextAnalysis {
  hasUrl: boolean;
  amount: number | null;
  accountNumber: string | null;
}

/**
 * 텍스트 내용 분석
 */
function analyzeText(text: string): TextAnalysis {
  // URL 감지
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|kr|co\.kr))/gi;
  const hasUrl = urlPattern.test(text);

  // 금액 추출
  let amount: number | null = null;
  const amountPattern1 = /(\d+(?:,\d{3})*)\s*원/;
  const amountPattern2 = /(\d+)\s*만\s*원?/;

  const match1 = text.match(amountPattern1);
  const match2 = text.match(amountPattern2);

  if (match1) {
    amount = parseInt(match1[1].replace(/,/g, ""));
  } else if (match2) {
    amount = parseInt(match2[1]) * 10000;
  }

  // 계좌번호 추출
  const accountPattern = /(\d{2,4}[-\s]?\d{2,6}[-\s]?\d{2,8})/;
  const accountMatch = text.match(accountPattern);
  const accountNumber = accountMatch ? accountMatch[0] : null;

  return { hasUrl, amount, accountNumber };
}

/**
 * 상세 위험도 점수 계산
 * 각 요소별 점수를 명확하게 계산하고 breakdown 제공
 */
export function calculateDetailedRiskScore(
  text: string,
  signals: InputSignals
): ScoreBreakdown {
  const appliedFactors: ScoreBreakdown['appliedFactors'] = [];
  let behaviorScore = 0;
  let contentScore = 0;

  // ===== 행위 패턴 분석 =====
  // durationMs가 0이면 실제 입력 행위가 없었음 (샘플 선택 등) - 행위 분석 건너뛰기
  const hasActualInput = signals.durationMs > 0;

  if (hasActualInput) {
    // 1. 붙여넣기 감지
    if (signals.wasPasted) {
      const score = RISK_WEIGHTS.BEHAVIOR.PASTED_TEXT;
      behaviorScore += score;
      appliedFactors.push({
        code: 'PASTED_TEXT',
        name: '텍스트 붙여넣기',
        score,
        category: 'behavior',
      });
    }

    // 2. 타이핑 속도 분석
    if (signals.typingSpeedCps === 0 && text.length > 0) {
      // 타이핑 없음 (전부 붙여넣기)
      const score = RISK_WEIGHTS.BEHAVIOR.NO_TYPING;
      behaviorScore += score;
      appliedFactors.push({
        code: 'NO_TYPING',
        name: '직접 타이핑 없음',
        score,
        category: 'behavior',
      });
    } else if (signals.typingSpeedCps > 5) {
      // 비정상적으로 빠른 타이핑
      const score = RISK_WEIGHTS.BEHAVIOR.FAST_TYPING;
      behaviorScore += score;
      appliedFactors.push({
        code: 'FAST_TYPING',
        name: '비정상적으로 빠른 타이핑',
        score,
        category: 'behavior',
      });
    }

    // 3. 수정 없이 입력
    if (signals.backspaceCount === 0 && text.length > 10 && !signals.wasPasted) {
      const score = RISK_WEIGHTS.BEHAVIOR.NO_CORRECTION;
      behaviorScore += score;
      appliedFactors.push({
        code: 'NO_CORRECTION',
        name: '수정 없이 완벽한 입력',
        score,
        category: 'behavior',
      });
    }

    // 4. 머뭇거림 감지 (보이스피싱 핵심 지표)
    // 3회 이상은 "스트레스 터치" - 전화 지시를 받으며 입력하는 강력한 패턴
    if (signals.hesitationCount >= 3) {
      const score = RISK_WEIGHTS.BEHAVIOR.STRESS_TOUCH;
      behaviorScore += score;
      appliedFactors.push({
        code: 'STRESS_TOUCH',
        name: `스트레스 터치 감지: ${signals.hesitationCount}회 반복적 멈칫거림 (보이스피싱 강력 의심)`,
        score,
        category: 'behavior',
      });
    } else if (signals.hesitationCount >= 1) {
      const score = RISK_WEIGHTS.BEHAVIOR.FREQUENT_HESITATION;
      behaviorScore += score;
      appliedFactors.push({
        code: 'FREQUENT_HESITATION',
        name: `입력 중 ${signals.hesitationCount}회 멈칫거림 (보이스피싱 의심)`,
        score,
        category: 'behavior',
      });
    }

    // 5. 반복적인 수정 패턴
    if (signals.eraseInputRatio > 0.3 && signals.backspaceCount > 5) {
      const score = RISK_WEIGHTS.BEHAVIOR.REPEATED_CORRECTIONS;
      behaviorScore += score;
      appliedFactors.push({
        code: 'REPEATED_CORRECTIONS',
        name: `반복적인 수정 (${Math.round(signals.eraseInputRatio * 100)}%)`,
        score,
        category: 'behavior',
      });
    }

    // 6. 느린 타이핑 (지시 받는 패턴)
    if (signals.avgTypingInterval > 1000 && signals.avgTypingInterval < 10000) {
      const score = RISK_WEIGHTS.BEHAVIOR.SLOW_DELIBERATE_TYPING;
      behaviorScore += score;
      appliedFactors.push({
        code: 'SLOW_DELIBERATE_TYPING',
        name: `느린 타이핑 (평균 ${(signals.avgTypingInterval / 1000).toFixed(1)}초 간격)`,
        score,
        category: 'behavior',
      });
    }

    // 7. 잦은 포커스 변경
    if (signals.focusBlurCount > 5) {
      const score = RISK_WEIGHTS.BEHAVIOR.FREQUENT_FOCUS_CHANGE;
      behaviorScore += score;
      appliedFactors.push({
        code: 'FREQUENT_FOCUS_CHANGE',
        name: `${signals.focusBlurCount}회 포커스 변경`,
        score,
        category: 'behavior',
      });
    }

    // 8. 짧은 시간에 긴 텍스트
    const charsPerSecond = text.length / (signals.durationMs / 1000);
    if (charsPerSecond > 10 && text.length > 20) {
      const score = RISK_WEIGHTS.BEHAVIOR.FAST_INPUT_VS_DURATION;
      behaviorScore += score;
      appliedFactors.push({
        code: 'FAST_INPUT_VS_DURATION',
        name: '짧은 시간에 긴 텍스트 입력',
        score,
        category: 'behavior',
      });
    }
  }

  // ===== 텍스트 내용 분석 =====
  const textAnalysis = analyzeText(text);

  // 1. URL 감지
  if (textAnalysis.hasUrl) {
    const score = RISK_WEIGHTS.CONTENT.URL_DETECTED;
    contentScore += score;
    appliedFactors.push({
      code: 'URL_DETECTED',
      name: 'URL 링크 포함',
      score,
      category: 'content',
    });
  }

  // 2. 고액 거래
  if (textAnalysis.amount && textAnalysis.amount >= 1000000) {
    const score = RISK_WEIGHTS.CONTENT.HIGH_AMOUNT;
    contentScore += score;
    appliedFactors.push({
      code: 'HIGH_AMOUNT',
      name: `고액 거래 (${(textAnalysis.amount / 10000).toFixed(0)}만원)`,
      score,
      category: 'content',
    });
  }

  // 3. 계좌번호 포함
  if (textAnalysis.accountNumber) {
    const score = RISK_WEIGHTS.CONTENT.ACCOUNT_NUMBER;
    contentScore += score;
    appliedFactors.push({
      code: 'ACCOUNT_NUMBER',
      name: '계좌번호 포함',
      score,
      category: 'content',
    });
  }

  // ===== 최종 점수 계산 =====
  const totalScore = Math.min(behaviorScore + contentScore, 100);
  const maxPossibleScore = 100;

  return {
    totalScore,
    maxPossibleScore,
    behaviorScore,
    contentScore,
    appliedFactors,
  };
}

/**
 * 점수를 기반으로 위험 수준 판단
 */
export function getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * 점수를 백분율로 변환
 */
export function scoreToPercentage(score: number): number {
  return Math.round((score / 100) * 100);
}

/**
 * 점수별 색상 클래스
 */
export function getScoreColorClass(score: number): string {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}
