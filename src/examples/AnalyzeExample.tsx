/**
 * 송금 텍스트 분석 예시 컴포넌트
 *
 * 이 컴포넌트는 다음 기능을 보여줍니다:
 * 1. 행위 메타데이터 수집 (타이핑, 붙여넣기 등)
 * 2. POST /api/analyze 호출
 * 3. 위험도 결과 표시
 * 4. 고위험 시 추가 검증 화면으로 이동
 */

import { useRef, useState } from "react";
import { analyzeText } from "../services/apiClient";
import { useBehaviorTracker } from "../utils/behaviorTracker";
import type { AnalyzeResponse, RiskLevel } from "../types/api";

interface AnalyzeState {
  isAnalyzing: boolean;
  result: AnalyzeResponse | null;
  error: string | null;
}

export function AnalyzeExample() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { getSignals, reset } = useBehaviorTracker(inputRef);

  const [state, setState] = useState<AnalyzeState>({
    isAnalyzing: false,
    result: null,
    error: null,
  });

  /**
   * 분석 실행
   */
  const handleAnalyze = async () => {
    const text = inputRef.current?.value;
    if (!text) {
      setState((prev) => ({
        ...prev,
        error: "텍스트를 입력해주세요.",
      }));
      return;
    }

    const signals = getSignals();
    if (!signals) {
      setState((prev) => ({
        ...prev,
        error: "행위 데이터를 수집할 수 없습니다.",
      }));
      return;
    }

    setState({
      isAnalyzing: true,
      result: null,
      error: null,
    });

    try {
      const result = await analyzeText({
        text,
        signals,
        client: {
          userAgent: navigator.userAgent,
          locale: navigator.language,
        },
      });

      setState({
        isAnalyzing: false,
        result,
        error: null,
      });
    } catch (error: any) {
      setState({
        isAnalyzing: false,
        result: null,
        error: error.message || "분석 중 오류가 발생했습니다.",
      });
    }
  };

  /**
   * 초기화
   */
  const handleReset = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    reset();
    setState({
      isAnalyzing: false,
      result: null,
      error: null,
    });
  };

  /**
   * 위험도 색상 반환
   */
  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case "low":
        return "#10b981"; // green
      case "medium":
        return "#f59e0b"; // orange
      case "high":
        return "#ef4444"; // red
    }
  };

  /**
   * 위험도 레이블 반환
   */
  const getRiskLabel = (level: RiskLevel): string => {
    switch (level) {
      case "low":
        return "낮음";
      case "medium":
        return "중간";
      case "high":
        return "높음";
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>
        송금 텍스트 분석
      </h1>

      {/* 입력 영역 */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "#374151",
          }}
        >
          송금 메시지 입력
        </label>
        <textarea
          ref={inputRef}
          placeholder="예: 계좌번호 110-123-456789로 100만원 보내주세요"
          rows={5}
          style={{
            width: "100%",
            padding: "14px 16px",
            border: "1.5px solid #E5E7EB",
            borderRadius: "12px",
            fontSize: "16px",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={handleAnalyze}
          disabled={state.isAnalyzing}
          style={{
            flex: 1,
            background: state.isAnalyzing
              ? "#9CA3AF"
              : "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: state.isAnalyzing ? "not-allowed" : "pointer",
            minHeight: "48px",
          }}
        >
          {state.isAnalyzing ? "분석 중..." : "위험도 분석"}
        </button>
        <button
          onClick={handleReset}
          style={{
            background: "white",
            color: "#6366F1",
            border: "1.5px solid #E5E7EB",
            borderRadius: "12px",
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: "48px",
          }}
        >
          초기화
        </button>
      </div>

      {/* 에러 표시 */}
      {state.error && (
        <div
          style={{
            padding: "16px",
            background: "#FEE2E2",
            borderRadius: "12px",
            color: "#DC2626",
            marginBottom: "16px",
          }}
        >
          {state.error}
        </div>
      )}

      {/* 결과 표시 */}
      {state.result && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            분석 결과
          </h2>

          {/* 위험도 */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#6B7280" }}>
                위험 수준
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: getRiskColor(state.result.riskLevel),
                }}
              >
                {getRiskLabel(state.result.riskLevel)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "14px", color: "#6B7280" }}>
                위험 점수
              </span>
              <span style={{ fontSize: "24px", fontWeight: 700 }}>
                {state.result.riskScore}
              </span>
            </div>
          </div>

          {/* 추출된 정보 */}
          {state.result.extracted && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                추출된 정보
              </h3>
              {state.result.extracted.amount && (
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                  금액: {state.result.extracted.amount}원
                </div>
              )}
              {state.result.extracted.bankHint && (
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                  은행: {state.result.extracted.bankHint}
                </div>
              )}
              {state.result.extracted.accountMasked && (
                <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                  계좌: {state.result.extracted.accountMasked}
                </div>
              )}
              {state.result.extracted.urlDetected && (
                <div style={{ fontSize: "14px", color: "#EF4444" }}>
                  ⚠️ URL 감지됨
                </div>
              )}
            </div>
          )}

          {/* 위험 요인 */}
          {state.result.reasons.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                위험 요인
              </h3>
              {state.result.reasons.map((reason, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px 12px",
                    background: "#FEF3C7",
                    borderRadius: "8px",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {reason.message} (가중치: {reason.weight})
                </div>
              ))}
            </div>
          )}

          {/* 권고사항 */}
          {state.result.recommendations.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                권고사항
              </h3>
              <ul style={{ paddingLeft: "20px", margin: 0 }}>
                {state.result.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    style={{ fontSize: "14px", marginBottom: "4px" }}
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 고위험 시 추가 검증 안내 */}
          {state.result.riskLevel === "high" && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "#FEE2E2",
                borderRadius: "12px",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", color: "#DC2626" }}>
                ⚠️ 고위험 거래로 판단되었습니다. 추가 검증을 진행해주세요.
              </p>
              <button
                style={{
                  marginTop: "12px",
                  width: "100%",
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  // TODO: 검증 페이지로 이동
                  alert("검증 페이지로 이동 (미구현)");
                }}
              >
                추가 검증 시작
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalyzeExample;
