/**
 * API 클라이언트 (로컬 분석 모드)
 * 백엔드 대신 프론트엔드에서 모든 분석 수행
 */

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  VerifyRequest,
  VerifyResponse,
} from "../types/api";

import { analyzeLocally, verifyLocally } from "../utils/riskAnalyzer";

/**
 * 로컬 분석 모드에서는 API 에러가 발생하지 않음
 * 향후 Claude API 연동 시 사용
 */

/**
 * 송금 텍스트 분석 (로컬 처리)
 *
 * @param request 분석 요청 데이터
 * @returns 위험도 분석 결과
 */
export async function analyzeText(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  // 로컬 분석 수행 (백엔드 없음)
  await simulateNetworkDelay(500); // 실제 API처럼 보이도록 딜레이
  return analyzeLocally(request);
}

/**
 * 추가 검증 (로컬 처리)
 *
 * @param request 검증 요청 데이터
 * @returns 다음 행동 지시
 */
export async function verifyTransaction(
  request: VerifyRequest
): Promise<VerifyResponse> {
  // 로컬 검증 수행 (백엔드 없음)
  await simulateNetworkDelay(300);
  return verifyLocally(request);
}

/**
 * 네트워크 딜레이 시뮬레이션
 */
function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * [향후 확장] Claude API 연동
 * LLM 기반 고급 분석이 필요한 경우 활성화
 */
