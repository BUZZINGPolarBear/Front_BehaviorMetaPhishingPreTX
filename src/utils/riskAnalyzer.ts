/**
 * 로컬 위험도 분석 엔진
 * 백엔드 없이 프론트엔드에서 행위 메타데이터 기반 위험도 계산
 */

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  VerifyRequest,
  VerifyResponse,
  RiskLevel,
  RiskReason,
  ExtractedInfo,
} from "../types/api";

/**
 * 위험도 점수 계산
 */
export function calculateRiskScore(request: AnalyzeRequest): number {
  let score = 0;
  const { text, signals } = request;

  // 1. 붙여넣기 감지 (30점)
  if (signals.wasPasted) {
    score += 30;
  }

  // 2. 타이핑 속도 (20점)
  // 매우 빠른 타이핑 (5 cps 이상) 또는 타이핑 없음 (0 cps)
  if (signals.typingSpeedCps === 0 || signals.typingSpeedCps > 5) {
    score += 20;
  }

  // 3. 백스페이스 적음 (15점)
  // 정상적인 타이핑은 백스페이스가 있음
  if (signals.backspaceCount === 0 && text.length > 10) {
    score += 15;
  }

  // 4. 과도한 포커스/블러 (10점)
  if (signals.focusBlurCount > 5) {
    score += 10;
  }

  // 5. 텍스트 분석
  const textAnalysis = analyzeTextContent(text);

  // URL 포함 (25점)
  if (textAnalysis.hasUrl) {
    score += 25;
  }

  // 고액 거래 (100만원 이상) (20점)
  if (textAnalysis.amount && textAnalysis.amount >= 1000000) {
    score += 20;
  }

  // 계좌번호 포함 (10점)
  if (textAnalysis.accountNumber) {
    score += 10;
  }

  // 6. 짧은 입력 시간 대비 긴 텍스트 (10점)
  const charsPerSecond = text.length / (signals.durationMs / 1000);
  if (charsPerSecond > 10 && text.length > 20) {
    score += 10;
  }

  // 최대 100점으로 제한
  return Math.min(score, 100);
}

/**
 * 위험 수준 판단
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * 위험 요인 추출
 */
export function extractRiskReasons(request: AnalyzeRequest): RiskReason[] {
  const reasons: RiskReason[] = [];
  const { text, signals } = request;
  const textAnalysis = analyzeTextContent(text);

  if (signals.wasPasted) {
    reasons.push({
      code: "PASTED_TEXT",
      message: "텍스트가 붙여넣기되었습니다",
      weight: 0.3,
    });
  }

  if (signals.typingSpeedCps === 0 && text.length > 0) {
    reasons.push({
      code: "NO_TYPING",
      message: "직접 타이핑하지 않았습니다",
      weight: 0.2,
    });
  } else if (signals.typingSpeedCps > 5) {
    reasons.push({
      code: "FAST_TYPING",
      message: "비정상적으로 빠른 타이핑 속도",
      weight: 0.2,
    });
  }

  if (signals.backspaceCount === 0 && text.length > 10) {
    reasons.push({
      code: "NO_CORRECTION",
      message: "수정 없이 입력됨",
      weight: 0.15,
    });
  }

  if (textAnalysis.hasUrl) {
    reasons.push({
      code: "URL_DETECTED",
      message: "URL이 포함되어 있습니다",
      weight: 0.25,
    });
  }

  if (textAnalysis.amount && textAnalysis.amount >= 1000000) {
    reasons.push({
      code: "HIGH_AMOUNT",
      message: "고액 거래입니다",
      weight: 0.2,
    });
  }

  if (signals.focusBlurCount > 5) {
    reasons.push({
      code: "FREQUENT_FOCUS_CHANGE",
      message: "입력 필드 이탈이 잦습니다",
      weight: 0.1,
    });
  }

  return reasons;
}

/**
 * 텍스트 내용 분석
 */
function analyzeTextContent(text: string): {
  hasUrl: boolean;
  amount: number | null;
  accountNumber: string | null;
  bankName: string | null;
} {
  // URL 감지
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|kr|co\.kr))/gi;
  const hasUrl = urlPattern.test(text);

  // 금액 추출 (예: "100만원", "1,000,000원", "50만")
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

  // 계좌번호 추출 (예: "110-123-456789", "110123456789")
  const accountPattern = /(\d{2,4}[-\s]?\d{2,6}[-\s]?\d{2,8})/;
  const accountMatch = text.match(accountPattern);
  const accountNumber = accountMatch ? accountMatch[0] : null;

  // 은행명 추출
  const bankNames = ["국민", "신한", "우리", "하나", "기업", "농협", "KB", "NH"];
  let bankName: string | null = null;
  for (const bank of bankNames) {
    if (text.includes(bank)) {
      bankName = bank;
      break;
    }
  }

  return { hasUrl, amount, accountNumber, bankName };
}

/**
 * 추출된 정보 반환
 */
export function extractInfo(text: string): ExtractedInfo {
  const analysis = analyzeTextContent(text);

  return {
    amount: analysis.amount?.toString(),
    bankHint: analysis.bankName || undefined,
    accountMasked: analysis.accountNumber
      ? maskAccountNumber(analysis.accountNumber)
      : undefined,
    urlDetected: analysis.hasUrl,
  };
}

/**
 * 계좌번호 마스킹
 */
function maskAccountNumber(account: string): string {
  const cleaned = account.replace(/[-\s]/g, "");
  if (cleaned.length < 8) return account;

  const first = cleaned.slice(0, 3);
  const last = cleaned.slice(-2);
  const masked = "*".repeat(cleaned.length - 5);

  return `${first}-${masked}-${last}`;
}

/**
 * 권고사항 생성
 */
export function generateRecommendations(
  riskLevel: RiskLevel,
  reasons: RiskReason[]
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === "high") {
    recommendations.push("송금 전 반드시 전화로 본인 확인을 하세요");
    recommendations.push("메신저 외 다른 채널로 재확인하세요");
  }

  if (riskLevel === "medium") {
    recommendations.push("송금 요청자와 직접 통화로 확인하세요");
  }

  if (reasons.some((r) => r.code === "URL_DETECTED")) {
    recommendations.push("URL 링크는 클릭하지 마세요");
  }

  if (reasons.some((r) => r.code === "HIGH_AMOUNT")) {
    recommendations.push("고액 거래는 여러 차례 확인하세요");
  }

  if (reasons.some((r) => r.code === "PASTED_TEXT")) {
    recommendations.push("복사된 내용은 출처를 확인하세요");
  }

  if (recommendations.length === 0) {
    recommendations.push("안전한 거래로 보이지만, 한 번 더 확인하세요");
  }

  return recommendations;
}

/**
 * 전체 분석 수행
 */
export function analyzeLocally(request: AnalyzeRequest): AnalyzeResponse {
  const score = calculateRiskScore(request);
  const riskLevel = getRiskLevel(score);
  const reasons = extractRiskReasons(request);
  const extracted = extractInfo(request.text);
  const recommendations = generateRecommendations(riskLevel, reasons);

  return {
    riskScore: score,
    riskLevel,
    reasons,
    extracted,
    recommendations,
  };
}

/**
 * 검증 수행
 */
export function verifyLocally(request: VerifyRequest): VerifyResponse {
  const { checklist, hasScreenshot } = request;

  // 체크리스트 점수 계산
  let positiveCount = 0;
  let totalCount = 0;

  for (const value of Object.values(checklist)) {
    if (typeof value === "boolean") {
      totalCount++;
      if (value === true) {
        positiveCount++;
      }
    }
  }

  const positiveRatio = totalCount > 0 ? positiveCount / totalCount : 0;

  // 판단 기준
  if (positiveRatio >= 0.75 && hasScreenshot) {
    return {
      nextAction: "allow",
      message: "확인되었습니다. 안전한 거래로 보입니다.",
    };
  } else if (positiveRatio >= 0.5) {
    return {
      nextAction: "warn",
      message:
        "일부 항목이 확인되지 않았습니다. 신중하게 진행하세요.",
    };
  } else {
    return {
      nextAction: "block",
      message: "위험한 거래일 가능성이 높습니다. 송금을 재고하세요.",
    };
  }
}
