/**
 * API 클라이언트
 * 로컬 분석 + 백엔드 유사도 매칭 API 연동
 */

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  VerifyRequest,
  VerifyResponse,
  MatchRequest,
  MatchResponse,
} from "../types/api";

import { analyzeLocally, verifyLocally } from "../utils/riskAnalyzer";

// 환경변수에서 백엔드 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://web-production-3607a.up.railway.app";

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
 * 텍스트와 행위 신호에서 백엔드 행동코드를 추출
 * Claude API 키가 없을 때 프론트엔드에서 자동으로 행동코드 생성
 */
function extractBehaviorCodes(text: string): string[] {
  const codes: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  // 텍스트 기반 행동코드 추출
  // 기관사칭 관련 키워드
  if (/검찰|경찰|금감원|금융감독|수사관|조사관|사기계좌|대포통장|범죄|피의자/.test(text)) {
    codes.add("B09"); // 공공기관 사칭 연락
    codes.add("B30"); // 대포통장 연루 언급
  }

  // 대출 관련 키워드
  if (/대출|저금리|대환대출|빚|카드론|신용회복|한도|이자/.test(text)) {
    codes.add("B19"); // 대출 빙자 수수료/보증금 요구
    codes.add("B33"); // 서민금융/저금리 대출 빙자
  }

  // 수수료/선금 관련
  if (/수수료|선금|보증금|계약금|세금|공탁금/.test(text)) {
    codes.add("B29"); // 선금/계약금 명목 송금 요구
  }

  // 투자 관련 키워드
  if (/투자|수익|주식|코인|비트코인|고수익|수익률|배당/.test(text)) {
    codes.add("B23"); // 투자/고수익 기회 언급
  }

  // 로맨스 관련 키워드
  if (/사랑|연인|보고싶|결혼|여자친구|남자친구|만나|데이트/.test(text)) {
    codes.add("B22"); // 온라인 연인 관계 언급
  }

  // 해외 관련
  if (/해외|외국|달러|환전|외화|송금/.test(text)) {
    codes.add("B24"); // 해외 송금 요청
  }

  // 취업 관련
  if (/취업|채용|면접|입사|계약직|급여|월급/.test(text)) {
    codes.add("B27"); // 취업/채용 관련 자금 요구
  }

  // 가족 사칭 관련
  if (/엄마|아빠|아들|딸|부모님|자녀|가족|아버지|어머니/.test(text)) {
    codes.add("B20"); // 가족/지인 개인정보 노출 언급
  }

  // 긴급/급한 상황
  if (/급하|빨리|지금당장|즉시|오늘안|시간없|위급|긴급/.test(text)) {
    codes.add("B05"); // 조급해하며 빠른 처리 재촉
  }

  // 계좌/송금 지시
  if (/계좌|입금|송금|이체|보내|振込/.test(text)) {
    codes.add("B26"); // 가상계좌/특정계좌 입금 지시
    codes.add("B11"); // 타행 계좌로 송금 요청
  }

  // 개인정보 요구
  if (/신분증|주민등록|비밀번호|OTP|보안카드|공인인증|인증서/.test(text)) {
    codes.add("B34"); // 신분증/개인정보 전송 요구
    codes.add("B35"); // 통장/비밀번호 전달 요구
  }

  // 고액 금액 감지
  const amountMatch = text.match(/(\d+)(?:,\d{3})*\s*(?:만|백만|천만|억)?(?:원)?/);
  if (amountMatch) {
    const numStr = amountMatch[0].replace(/[,원\s]/g, '');
    let amount = parseInt(numStr) || 0;
    if (amountMatch[0].includes('만')) amount *= 10000;
    if (amountMatch[0].includes('백만')) amount *= 1000000;
    if (amountMatch[0].includes('천만')) amount *= 10000000;
    if (amountMatch[0].includes('억')) amount *= 100000000;

    if (amount >= 10000000) {
      codes.add("B03"); // 고액 현금 인출 요청
    }
  }

  // URL 포함
  if (/(https?:\/\/|www\.|\.com|\.kr|\.net)/.test(lowerText)) {
    codes.add("B08"); // 악성앱/원격제어 앱 설치됨 (의심)
  }

  // 붙여넣기된 텍스트는 지시를 받는 것으로 간주
  // (긴 텍스트면 지시를 받을 가능성이 높음)
  if (text.length > 30) {
    codes.add("B01"); // 전화/메신저 지시를 실시간으로 따름
    codes.add("B16"); // 통장/계좌번호를 누군가에게 받아야 함
  }

  return Array.from(codes);
}

/**
 * 백엔드 보이스피싱 유사도 매칭 API 호출
 *
 * @param notes 분석할 텍스트 (상담 메모, 메시지 등)
 * @param options 추가 옵션 (금액, 채널 등)
 * @returns 유사도 매칭 결과 (사기 유형, 유사도 %, 근거 등)
 */
export async function matchPhishing(
  notes: string,
  options?: Partial<Omit<MatchRequest, "notes">>
): Promise<MatchResponse | null> {
  try {
    // 백엔드에 Claude API 키가 있으면 백엔드에서 추출
    // 없으면 프론트엔드에서 키워드 기반 추출 (폴백)
    const request: MatchRequest = {
      notes,
      top_k: 5,
      ...options,
    };

    // observed_behaviors가 명시적으로 제공되지 않으면 백엔드 Claude에 맡김
    // 백엔드 Claude가 실패하면 프론트엔드 추출 결과로 재시도
    if (!options?.observed_behaviors) {
      console.log("백엔드 Claude API로 행동코드 추출 시도:", notes.slice(0, 50) + "...");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    // 백엔드에서 행동코드 부족 오류가 나면 프론트엔드 추출로 폴백
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 행동코드 부족 오류 (Claude API 미설정 or 추출 실패)
      if (response.status === 400 && !options?.observed_behaviors) {
        console.warn("백엔드 Claude 추출 실패, 프론트엔드 키워드 추출로 폴백");
        const fallbackBehaviors = extractBehaviorCodes(notes);

        if (fallbackBehaviors.length === 0) {
          console.warn("프론트엔드에서도 행동코드를 추출할 수 없습니다.");
          return null;
        }

        // 폴백 요청
        const fallbackRequest: MatchRequest = {
          ...request,
          observed_behaviors: fallbackBehaviors,
        };

        const fallbackResponse = await fetch(`${API_BASE_URL}/api/v1/match`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fallbackRequest),
        });

        if (!fallbackResponse.ok) {
          console.error("폴백 요청도 실패:", fallbackResponse.status);
          return null;
        }

        const fallbackData: MatchResponse = await fallbackResponse.json();
        console.log("폴백 매칭 응답:", fallbackData.top_match?.scam_type, Math.round((fallbackData.top_match?.similarity || 0) * 100) + "%");
        return fallbackData;
      }

      console.error("백엔드 매칭 API 오류:", response.status, errorData);
      return null;
    }

    const data: MatchResponse = await response.json();
    console.log("백엔드 매칭 응답 (Claude):", data.top_match?.scam_type, Math.round((data.top_match?.similarity || 0) * 100) + "%");
    return data;
  } catch (error) {
    console.error("백엔드 매칭 API 호출 실패:", error);
    return null;
  }
}

/**
 * 백엔드 헬스체크
 *
 * @returns 백엔드 연결 가능 여부
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
