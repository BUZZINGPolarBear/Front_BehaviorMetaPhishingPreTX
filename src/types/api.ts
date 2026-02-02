/**
 * 행위 메타데이터 기반 피싱 선제 탐지 - API Type Definitions
 * 프론트엔드용 타입 정의
 */

// ============================================
// POST /api/analyze - 송금 텍스트 분석
// ============================================

/**
 * 사용자 입력 시 수집되는 행위 시그널
 */
export interface InputSignals {
  /** 붙여넣기 여부 */
  wasPasted: boolean;
  /** 타이핑 속도 (문자/초) */
  typingSpeedCps: number;
  /** 백스페이스 횟수 */
  backspaceCount: number;
  /** 포커스/블러 발생 횟수 */
  focusBlurCount: number;
  /** 필드 간 이동(탭/클릭) 횟수 */
  fieldHops: number;
  /** 입력에 소요된 총 시간 (밀리초) */
  durationMs: number;
  /** 머뭇거림 횟수 (1.5초 이상 pause) */
  hesitationCount: number;
  /** 평균 타이핑 간격 (밀리초) */
  avgTypingInterval: number;
  /** 최대 타이핑 간격 (밀리초) */
  maxTypingInterval: number;
  /** 반복 수정 비율 (backspace/입력 길이) */
  eraseInputRatio: number;
}

/**
 * 클라이언트 정보
 */
export interface ClientInfo {
  /** User-Agent 문자열 */
  userAgent: string;
  /** 사용자 로케일 (선택) */
  locale?: string;
}

/**
 * POST /api/analyze 요청 페이로드
 */
export interface AnalyzeRequest {
  /** 분석할 텍스트 (송금 메시지 등) */
  text: string;
  /** 입력 행위 시그널 */
  signals: InputSignals;
  /** 클라이언트 환경 정보 */
  client: ClientInfo;
}

/**
 * 위험 수준 (Low/Medium/High)
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * 위험 판단 근거
 */
export interface RiskReason {
  /** 이유 코드 (예: "PASTED_TEXT", "HIGH_AMOUNT") */
  code: string;
  /** 사용자에게 표시할 메시지 */
  message: string;
  /** 위험도 가중치 (0~1) */
  weight: number;
}

/**
 * 텍스트에서 추출된 정보
 */
export interface ExtractedInfo {
  /** 추출된 금액 (예: "1000000") */
  amount?: string;
  /** 은행 힌트 (예: "햇살", "은하") */
  bankHint?: string;
  /** 마스킹된 계좌번호 (예: "110-***-****56") */
  accountMasked?: string;
  /** URL 감지 여부 */
  urlDetected?: boolean;
}

/**
 * 점수 상세 정보
 */
export interface ScoreBreakdown {
  totalScore: number;
  maxPossibleScore: number;
  behaviorScore: number;
  contentScore: number;
  appliedFactors: Array<{
    code: string;
    name: string;
    score: number;
    category: 'behavior' | 'content';
  }>;
}

/**
 * POST /api/analyze 응답 페이로드
 */
export interface AnalyzeResponse {
  /** 위험 점수 (0~100) */
  riskScore: number;
  /** 위험 수준 */
  riskLevel: RiskLevel;
  /** 위험 판단 근거 목록 */
  reasons: RiskReason[];
  /** 텍스트에서 추출된 정보 */
  extracted: ExtractedInfo;
  /** 사용자에게 제공할 권고사항 */
  recommendations: string[];
  /** 점수 상세 정보 */
  scoreBreakdown?: ScoreBreakdown;
}

// ============================================
// POST /api/verify - 고위험 시 추가 검증
// ============================================

/**
 * 사용자 체크리스트 응답
 * (각 항목은 boolean 플래그)
 */
export interface VerifyChecklist {
  /** 송금 요청자를 직접 알고 있는가? */
  knowSender?: boolean;
  /** 전화나 다른 채널로 확인했는가? */
  verifiedViaPhone?: boolean;
  /** 계좌번호가 이전에 사용한 것과 일치하는가? */
  accountMatches?: boolean;
  /** 금액이 평소 거래 금액과 비슷한가? */
  amountIsNormal?: boolean;
  /** 기타 사용자 정의 플래그들 */
  [key: string]: boolean | undefined;
}

/**
 * POST /api/verify 요청 페이로드
 */
export interface VerifyRequest {
  /** 사용자가 응답한 체크리스트 */
  checklist: VerifyChecklist;
  /** 스크린샷 첨부 여부 (MVP: 로컬 미리보기만 수행) */
  hasScreenshot: boolean;
  /**
   * [향후 확장] 스크린샷 파일 업로드를 위한 필드
   * MVP에서는 사용하지 않으나, 추후 백엔드 업로드 시 활용 가능
   */
  screenshotFile?: File | null;
}

/**
 * 다음 행동 지시 (Block/Warn/Allow)
 */
export type NextAction = "block" | "warn" | "allow";

/**
 * POST /api/verify 응답 페이로드
 */
export interface VerifyResponse {
  /** 다음 행동 (차단/경고/허용) */
  nextAction: NextAction;
  /** 사용자에게 표시할 메시지 */
  message: string;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * API 에러 응답 공통 형식
 */
export interface ApiError {
  /** HTTP 상태 코드 */
  status: number;
  /** 에러 코드 */
  code: string;
  /** 에러 메시지 */
  message: string;
  /** 추가 세부 정보 (선택) */
  details?: Record<string, unknown>;
}

/**
 * API 호출 상태 추적을 위한 제네릭 타입
 */
export type ApiState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError };

// ============================================
// 백엔드 보이스피싱 유사도 매칭 API
// POST /api/v1/match
// ============================================

/**
 * 백엔드 매칭 요청 (POST /api/v1/match)
 */
export interface MatchRequest {
  /** 상담/내점 메모 원문 텍스트 */
  notes: string;
  /** 금액 (원) */
  amount_krw?: number;
  /** 채널 유형 */
  channel?: "branch" | "call" | "sms" | "messenger" | "web" | "app";
  /** 직원이 체크한 행동코드 리스트 */
  observed_behaviors?: string[];
  /** 반환할 상위 케이스 수 (기본: 5) */
  top_k?: number;
}

/**
 * 최상위 매칭 결과
 */
export interface TopMatchResult {
  /** 사기 유형명 */
  scam_type: string;
  /** 유사도 점수 (0~1) */
  similarity: number;
  /** 매칭 근거 (상위 4개 행동코드 설명) */
  reasons: string[];
  /** 사용자 메시지 */
  message: string;
}

/**
 * 개별 케이스 요약
 */
export interface CaseSummary {
  /** 케이스 ID */
  case_id: string;
  /** 유사도 점수 (0~1) */
  similarity: number;
  /** 케이스 요약 */
  summary: string;
  /** 사기 유형 */
  scam_type?: string;
}

/**
 * 백엔드 매칭 응답 (POST /api/v1/match)
 */
export interface MatchResponse {
  /** 최상위 매칭 결과 */
  top_match: TopMatchResult;
  /** 상위 유사 케이스 목록 */
  top_cases: CaseSummary[];
  /** 디버그 정보 (DEV 모드) */
  debug?: {
    used_behaviors: string[];
    source: "claude" | "manual" | "hybrid";
    claude_response?: Record<string, unknown>;
  };
}
