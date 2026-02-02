/**
 * 보이스피싱 의심 경고 전체 화면
 * riskLevel === 'high'일 때 표시되는 별도의 경고/확인 화면
 */

import { useState, useRef } from 'react';
import type { AnalyzeResponse, MatchResponse } from '../types/api';
import './PhishingWarningScreen.css';

interface PhishingWarningScreenProps {
  analysis: AnalyzeResponse;
  matchResult?: MatchResponse | null;
  onProceedAnyway: () => void;
  onCancel: () => void;
}

// 사기 유형별 체크리스트
const SCAM_TYPE_CHECKLISTS: Record<string, { question: string; warning: string }[]> = {
  '기관사칭형': [
    { question: '검찰, 경찰, 금융기관에서 전화로 송금을 요청받았나요?', warning: '공공기관은 절대 전화로 송금을 요구하지 않습니다' },
    { question: '계좌가 범죄에 연루되었다는 말을 들었나요?', warning: '이것은 대표적인 보이스피싱 수법입니다' },
    { question: '"안전계좌"로 돈을 옮기라는 지시를 받았나요?', warning: '안전계좌는 존재하지 않습니다' },
    { question: '가족이나 다른 사람에게 비밀로 하라고 했나요?', warning: '비밀 유지 요구는 사기의 전형적인 특징입니다' },
  ],
  '대출빙자형': [
    { question: '대출 승인 전 수수료나 보증금을 요구받았나요?', warning: '정상적인 대출은 선수수료를 요구하지 않습니다' },
    { question: '저금리 대출을 빙자하여 기존 대출을 갚으라고 했나요?', warning: '대환대출 사기의 전형적인 수법입니다' },
    { question: '카드론이나 현금서비스를 먼저 받으라고 했나요?', warning: '추가 대출을 유도하는 것은 사기입니다' },
    { question: '가상계좌나 특정 계좌로 입금하라고 했나요?', warning: '정상적인 금융기관은 이런 요구를 하지 않습니다' },
  ],
  '로맨스스캠형': [
    { question: '온라인에서 만난 사람이 돈을 요청했나요?', warning: '실제로 만난 적 없는 사람의 금전 요구는 의심해야 합니다' },
    { question: '투자 기회나 수익을 약속했나요?', warning: '로맨스와 투자를 결합한 것은 사기 수법입니다' },
    { question: '급하게 송금해달라고 재촉하나요?', warning: '시간 압박은 사기범들의 대표적인 전술입니다' },
    { question: '영상통화나 실제 만남을 피하나요?', warning: '신원 확인을 회피하는 것은 사기의 징후입니다' },
  ],
  '투자사기형': [
    { question: '원금 보장과 고수익을 동시에 약속했나요?', warning: '원금 보장 + 고수익은 불가능하며 사기입니다' },
    { question: '지인이나 SNS를 통해 투자를 권유받았나요?', warning: '지인 사칭이나 SNS 투자 권유는 사기가 많습니다' },
    { question: '추가 입금을 계속 요구하나요?', warning: '계속되는 추가 입금 요구는 사기의 특징입니다' },
    { question: '출금이 어렵거나 조건이 붙나요?', warning: '출금 제한은 사기 플랫폼의 특징입니다' },
  ],
  default: [
    { question: '모르는 사람이 갑자기 돈을 요청했나요?', warning: '낯선 사람의 금전 요구는 항상 의심해야 합니다' },
    { question: '급하게 송금해야 한다고 재촉받았나요?', warning: '시간 압박은 판단력을 흐리게 하는 사기 수법입니다' },
    { question: '메신저나 문자로만 연락하나요?', warning: '전화 확인을 회피하는 것은 사기의 징후입니다' },
    { question: '이 송금에 대해 불안하거나 의심이 드나요?', warning: '직감을 믿으세요. 조금이라도 이상하면 멈추세요' },
  ],
};

export function PhishingWarningScreen({
  analysis,
  matchResult,
  onProceedAnyway,
  onCancel,
}: PhishingWarningScreenProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { riskScore, reasons, scoreBreakdown } = analysis;

  // 매칭된 사기 유형
  const scamType = matchResult?.top_match?.scam_type || 'default';
  const similarityPercent = matchResult?.top_match
    ? Math.round(matchResult.top_match.similarity * 100)
    : null;

  // 해당 사기 유형에 맞는 체크리스트
  const checklist = SCAM_TYPE_CHECKLISTS[scamType] || SCAM_TYPE_CHECKLISTS.default;

  // 체크리스트 토글
  const handleChecklistToggle = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // 체크된 항목 수 (위험 신호)
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  // 스크린샷 업로드
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
    }
  };

  // 1394 전화하기
  const handleCall1394 = () => {
    alert('보이스피싱 상담센터 1394로 연결됩니다.\n\n(MVP 버전으로 실제 통화는 연결되지 않습니다)\n\n실제 의심되는 경우 직접 1394로 전화해주세요.');
  };

  // 그럼에도 불구하고 송금하기
  const handleProceedClick = () => {
    if (checkedCount > 0) {
      // 체크리스트에 하나라도 체크했으면 강력 경고
      setShowConfirmDialog(true);
    } else {
      onProceedAnyway();
    }
  };

  // 최종 확인 다이얼로그에서 송금 진행
  const handleFinalProceed = () => {
    setShowConfirmDialog(false);
    onProceedAnyway();
  };

  return (
    <div className="phishing-warning-screen">
      {/* 헤더 */}
      <header className="warning-header">
        <button className="back-button" onClick={onCancel}>
          ←
        </button>
        <h1 className="warning-title">보이스피싱 의심</h1>
        <div className="warning-badge">위험</div>
      </header>

      {/* 메인 경고 */}
      <div className="warning-main">
        <div className="warning-icon">⚠️</div>
        <h2 className="warning-headline">이 거래가 의심됩니다</h2>
        <p className="warning-subtext">
          송금 전 아래 내용을 반드시 확인해주세요
        </p>
      </div>

      {/* 위험도 점수 */}
      <div className="risk-score-section">
        <div className="risk-score-circle">
          <span className="risk-score-value">{riskScore}</span>
          <span className="risk-score-unit">점</span>
        </div>
        <div className="risk-score-label">위험도 점수</div>
      </div>

      {/* 유사도 매칭 결과 */}
      {matchResult?.top_match && (
        <div className="similarity-section">
          <div className="similarity-header">
            <span className="similarity-icon">🔍</span>
            <span className="similarity-title">사기 패턴 분석 결과</span>
          </div>
          <div className="similarity-content">
            <div className="similarity-type">
              <span className="type-label">의심 유형:</span>
              <span className="type-value">{matchResult.top_match.scam_type}</span>
            </div>
            <div className="similarity-percent">
              <span className="percent-label">유사도:</span>
              <span className={`percent-value ${similarityPercent && similarityPercent >= 70 ? 'high' : ''}`}>
                {similarityPercent}%
              </span>
            </div>
            {matchResult.top_match.reasons.length > 0 && (
              <div className="similarity-reasons">
                <div className="reasons-title">유사 판단 근거:</div>
                <ul className="reasons-list">
                  {matchResult.top_match.reasons.slice(0, 4).map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 감지된 위험 요소 */}
      {scoreBreakdown && scoreBreakdown.appliedFactors.length > 0 && (
        <div className="detected-risks-section">
          <h3 className="section-title">감지된 위험 요소</h3>
          <div className="detected-risks-list">
            {scoreBreakdown.appliedFactors.map((factor, index) => (
              <div key={index} className={`risk-factor ${factor.category}`}>
                <span className="factor-icon">
                  {factor.category === 'behavior' ? '👆' : '📝'}
                </span>
                <span className="factor-name">{factor.name}</span>
                <span className="factor-score">+{factor.score}점</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 사기 유형별 체크리스트 */}
      <div className="checklist-section">
        <h3 className="section-title">
          혹시 이런 상황인가요?
          <span className="checklist-warning">
            ({scamType !== 'default' ? scamType : '일반'} 유형 체크리스트)
          </span>
        </h3>
        <p className="checklist-guide">해당하는 항목이 있다면 체크해주세요</p>

        <div className="checklist-items">
          {checklist.map((item, index) => (
            <div
              key={index}
              className={`checklist-item ${checkedItems[index] ? 'checked' : ''}`}
              onClick={() => handleChecklistToggle(index)}
            >
              <div className="checkbox">
                {checkedItems[index] && <span className="checkmark">✓</span>}
              </div>
              <div className="checklist-content">
                <div className="checklist-question">{item.question}</div>
                {checkedItems[index] && (
                  <div className="checklist-warning-text">
                    ⚠️ {item.warning}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {checkedCount > 0 && (
          <div className="checklist-result danger">
            <span className="result-icon">🚨</span>
            <span className="result-text">
              {checkedCount}개 항목이 체크되었습니다. 보이스피싱일 가능성이 매우 높습니다.
            </span>
          </div>
        )}
      </div>

      {/* 스크린샷 업로드 */}
      <div className="screenshot-section">
        <h3 className="section-title">증거 자료 저장 (선택)</h3>
        <p className="screenshot-guide">
          의심스러운 대화 내용을 스크린샷으로 저장해두세요.
          신고 시 증거로 활용할 수 있습니다.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          style={{ display: 'none' }}
        />

        <button
          className="screenshot-button"
          onClick={() => fileInputRef.current?.click()}
        >
          {screenshot ? (
            <>
              <span className="screenshot-icon">✓</span>
              <span>스크린샷 첨부됨: {screenshot.name}</span>
            </>
          ) : (
            <>
              <span className="screenshot-icon">📷</span>
              <span>대화 스크린샷 첨부하기</span>
            </>
          )}
        </button>

        {screenshot && (
          <button
            className="screenshot-remove"
            onClick={() => setScreenshot(null)}
          >
            첨부 취소
          </button>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="action-buttons">
        <button
          className="call-button"
          onClick={handleCall1394}
        >
          <span className="button-icon">📞</span>
          <span className="button-text">보이스피싱 상담센터 1394</span>
        </button>

        <button
          className="proceed-button"
          onClick={handleProceedClick}
        >
          <span className="button-text">그럼에도 불구하고 송금하기</span>
        </button>

        <button
          className="cancel-button-large"
          onClick={onCancel}
        >
          송금 취소하기
        </button>
      </div>

      {/* 최종 확인 다이얼로그 */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="dialog-icon">🚨</div>
            <h3 className="dialog-title">정말 송금하시겠습니까?</h3>
            <p className="dialog-message">
              체크리스트에서 {checkedCount}개 항목이 해당된다고 하셨습니다.
              <br /><br />
              <strong>이 거래는 보이스피싱일 가능성이 매우 높습니다.</strong>
              <br /><br />
              송금 후에는 되돌릴 수 없습니다.
            </p>
            <div className="dialog-buttons">
              <button
                className="dialog-cancel"
                onClick={() => setShowConfirmDialog(false)}
              >
                다시 생각해볼게요
              </button>
              <button
                className="dialog-proceed"
                onClick={handleFinalProceed}
              >
                그래도 송금하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
