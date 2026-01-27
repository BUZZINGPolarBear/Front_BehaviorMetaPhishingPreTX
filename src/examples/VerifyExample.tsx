/**
 * 추가 검증 예시 컴포넌트
 *
 * 이 컴포넌트는 다음 기능을 보여줍니다:
 * 1. 체크리스트 UI
 * 2. 스크린샷 업로드 (로컬 미리보기)
 * 3. POST /api/verify 호출
 * 4. 최종 판단 결과 표시
 */

import React, { useState } from "react";
import { verifyTransaction } from "../services/apiClient";
import { useScreenshot } from "../hooks/useScreenshot";
import type { VerifyChecklist, VerifyResponse, NextAction } from "../types/api";

interface ChecklistItem {
  key: keyof VerifyChecklist;
  label: string;
  description: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: "knowSender",
    label: "송금 요청자를 직접 알고 있습니까?",
    description: "이름, 전화번호 등을 통해 본인 확인이 가능한 경우",
  },
  {
    key: "verifiedViaPhone",
    label: "전화나 다른 채널로 확인했습니까?",
    description: "메신저 외 전화, 문자 등으로 송금 요청을 재확인한 경우",
  },
  {
    key: "accountMatches",
    label: "이전에 사용한 계좌번호와 일치합니까?",
    description: "과거 송금 이력이 있고 동일한 계좌인 경우",
  },
  {
    key: "amountIsNormal",
    label: "금액이 평소 거래 금액과 비슷합니까?",
    description: "평소 주고받던 금액과 크게 차이나지 않는 경우",
  },
];

export function VerifyExample() {
  const { screenshot, handleFileSelect, clearScreenshot } = useScreenshot();
  const [checklist, setChecklist] = useState<VerifyChecklist>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 체크리스트 항목 토글
   */
  const handleChecklistChange = (key: keyof VerifyChecklist, value: boolean) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * 검증 실행
   */
  const handleVerify = async () => {
    // 체크리스트 검증
    const answeredCount = Object.values(checklist).filter(
      (v) => v !== undefined
    ).length;
    if (answeredCount < CHECKLIST_ITEMS.length) {
      setError("모든 질문에 답변해주세요.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const verifyResult = await verifyTransaction({
        checklist,
        hasScreenshot: !!screenshot.file,
        screenshotFile: screenshot.file,
      });

      setResult(verifyResult);
      setIsVerifying(false);
    } catch (err: any) {
      setError(err.message || "검증 중 오류가 발생했습니다.");
      setIsVerifying(false);
    }
  };

  /**
   * 초기화
   */
  const handleReset = () => {
    setChecklist({});
    clearScreenshot();
    setResult(null);
    setError(null);
  };

  /**
   * NextAction 색상 반환
   */
  const getActionColor = (action: NextAction): string => {
    switch (action) {
      case "allow":
        return "#10b981"; // green
      case "warn":
        return "#f59e0b"; // orange
      case "block":
        return "#ef4444"; // red
    }
  };

  /**
   * NextAction 레이블 반환
   */
  const getActionLabel = (action: NextAction): string => {
    switch (action) {
      case "allow":
        return "✅ 송금 허용";
      case "warn":
        return "⚠️ 주의 필요";
      case "block":
        return "🚫 송금 차단 권고";
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>
        추가 검증
      </h1>

      {!result ? (
        <>
          {/* 체크리스트 */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              보안 체크리스트
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px" }}>
              다음 질문에 답변하여 송금의 안전성을 확인해주세요.
            </p>

            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.key}
                style={{
                  padding: "16px",
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  marginBottom: "12px",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ fontSize: "14px" }}>{item.label}</strong>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleChecklistChange(item.key, true)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border:
                        checklist[item.key] === true
                          ? "2px solid #10b981"
                          : "1.5px solid #E5E7EB",
                      background:
                        checklist[item.key] === true ? "#D1FAE5" : "white",
                      color:
                        checklist[item.key] === true ? "#065F46" : "#374151",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    예
                  </button>
                  <button
                    onClick={() => handleChecklistChange(item.key, false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border:
                        checklist[item.key] === false
                          ? "2px solid #EF4444"
                          : "1.5px solid #E5E7EB",
                      background:
                        checklist[item.key] === false ? "#FEE2E2" : "white",
                      color:
                        checklist[item.key] === false ? "#991B1B" : "#374151",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    아니오
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 스크린샷 업로드 */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              스크린샷 첨부 (선택)
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "12px" }}>
              송금 요청 메시지 스크린샷을 첨부하면 더 정확한 분석이 가능합니다.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              style={{ display: "none" }}
              id="screenshot-upload"
            />
            <label
              htmlFor="screenshot-upload"
              style={{
                display: "block",
                padding: "40px 20px",
                border: "2px dashed #D1D5DB",
                borderRadius: "12px",
                textAlign: "center",
                cursor: "pointer",
                background: "#F9FAFB",
              }}
            >
              {screenshot.previewUrl ? (
                <div>
                  <img
                    src={screenshot.previewUrl}
                    alt="스크린샷 미리보기"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      clearScreenshot();
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    제거
                  </button>
                </div>
              ) : (
                <div style={{ color: "#6B7280", fontSize: "14px" }}>
                  📷 클릭하여 스크린샷 업로드
                  <br />
                  <span style={{ fontSize: "12px" }}>
                    (PNG, JPG, GIF - 최대 10MB)
                  </span>
                </div>
              )}
            </label>

            {screenshot.error && (
              <p style={{ color: "#EF4444", fontSize: "14px", marginTop: "8px" }}>
                {screenshot.error}
              </p>
            )}
          </div>

          {/* 에러 표시 */}
          {error && (
            <div
              style={{
                padding: "16px",
                background: "#FEE2E2",
                borderRadius: "12px",
                color: "#DC2626",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* 검증 버튼 */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            style={{
              width: "100%",
              background: isVerifying
                ? "#9CA3AF"
                : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: isVerifying ? "not-allowed" : "pointer",
              minHeight: "48px",
            }}
          >
            {isVerifying ? "검증 중..." : "검증 완료"}
          </button>
        </>
      ) : (
        <>
          {/* 검증 결과 */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
              }}
            >
              {result.nextAction === "allow"
                ? "✅"
                : result.nextAction === "warn"
                ? "⚠️"
                : "🚫"}
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: getActionColor(result.nextAction),
                marginBottom: "16px",
              }}
            >
              {getActionLabel(result.nextAction)}
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#374151",
                lineHeight: "1.5",
                marginBottom: "0",
              }}
            >
              {result.message}
            </p>
          </div>

          {/* 다시 검증 버튼 */}
          <button
            onClick={handleReset}
            style={{
              width: "100%",
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
            다시 검증하기
          </button>
        </>
      )}
    </div>
  );
}

export default VerifyExample;
