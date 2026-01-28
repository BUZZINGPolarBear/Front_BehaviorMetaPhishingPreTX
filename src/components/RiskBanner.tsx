/**
 * 위험도 알림 배너
 * 송금창 위에 자연스럽게 표시되는 침착한 보안 알림
 */

import { useState, useRef } from 'react';
import type { AnalyzeResponse, RiskLevel } from '../types/api';
import { getRelatedFraudCases } from '../data/fraudCases';
import './RiskBanner.css';

interface RiskBannerProps {
  analysis: AnalyzeResponse;
}

export function RiskBanner({ analysis }: RiskBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checklist, setChecklist] = useState({
    knowSender: false,
    verifiedViaPhone: false,
    accountMatches: false,
    amountIsNormal: false,
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { riskLevel, reasons, recommendations } = analysis;
  const relatedFraudCases = riskLevel === 'high' ? getRelatedFraudCases(reasons.map(r => r.code)) : [];

  // 위험도별 아이콘
  const getIcon = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return '✓';
      case 'medium':
        return '⚠';
      case 'high':
        return '●';
    }
  };

  // 위험도별 색상 클래스
  const getColorClass = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return 'risk-low';
      case 'medium':
        return 'risk-medium';
      case 'high':
        return 'risk-high';
    }
  };

  // 위험도별 메시지 (Calm Security 원칙)
  const getMessage = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return '안전한 거래로 보입니다';
      case 'medium':
        return '한 번 더 확인해주세요';
      case 'high':
        return '주의가 필요합니다';
    }
  };

  // 체크리스트 토글
  const handleChecklistChange = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 스크린샷 업로드
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
    }
  };

  return (
    <div className={`risk-banner ${getColorClass(riskLevel)} ${isExpanded ? 'expanded' : ''}`}>
      {/* 기본 정보 (항상 표시) */}
      <div className="risk-banner-main" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="risk-indicator">
          <span className="risk-icon">{getIcon(riskLevel)}</span>
          <span className="risk-message">{getMessage(riskLevel)}</span>
        </div>
        <div className="risk-toggle">
          {isExpanded ? '접기 ▲' : '상세 ▼'}
        </div>
      </div>

      {/* 상세 정보 (펼쳤을 때) */}
      {isExpanded && (
        <div className="risk-banner-details">
          {/* 위험 요인 */}
          {reasons.length > 0 && (
            <div className="risk-section">
              <div className="risk-section-title">확인된 사항</div>
              <ul className="risk-reasons">
                {reasons.map((reason, index) => (
                  <li key={index} className="risk-reason-item">
                    {reason.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 권고사항 */}
          {recommendations.length > 0 && (
            <div className="risk-section">
              <div className="risk-section-title">권장 확인 사항</div>
              <ul className="risk-recommendations">
                {recommendations.map((rec, index) => (
                  <li key={index} className="risk-recommendation-item">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medium 레벨: 체크리스트 */}
          {riskLevel === 'medium' && (
            <div className="risk-section">
              <div className="risk-section-title">다음 사항을 확인하세요</div>
              <div className="checklist">
                <label className="checklist-item">
                  <input
                    type="checkbox"
                    checked={checklist.knowSender}
                    onChange={() => handleChecklistChange('knowSender')}
                  />
                  <span>송금 요청자를 직접 알고 있습니다</span>
                </label>
                <label className="checklist-item">
                  <input
                    type="checkbox"
                    checked={checklist.verifiedViaPhone}
                    onChange={() => handleChecklistChange('verifiedViaPhone')}
                  />
                  <span>전화나 다른 채널로 본인 확인을 했습니다</span>
                </label>
                <label className="checklist-item">
                  <input
                    type="checkbox"
                    checked={checklist.accountMatches}
                    onChange={() => handleChecklistChange('accountMatches')}
                  />
                  <span>계좌번호가 이전에 사용한 것과 일치합니다</span>
                </label>
                <label className="checklist-item">
                  <input
                    type="checkbox"
                    checked={checklist.amountIsNormal}
                    onChange={() => handleChecklistChange('amountIsNormal')}
                  />
                  <span>금액이 평소 거래 금액과 비슷합니다</span>
                </label>
              </div>
            </div>
          )}

          {/* High 레벨: 유사 사기 사례 + 스크린샷 업로드 */}
          {riskLevel === 'high' && (
            <>
              {/* 유사 사기 사례 */}
              <div className="risk-section">
                <div className="risk-section-title">⚠️ 유사한 사기 사례</div>
                <div className="fraud-cases">
                  {relatedFraudCases.map((fraudCase) => (
                    <div key={fraudCase.id} className="fraud-case">
                      <div className="fraud-case-title">{fraudCase.title}</div>
                      <div className="fraud-case-desc">{fraudCase.description}</div>
                      <div className="fraud-case-warning">💡 {fraudCase.warning}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 스크린샷 업로드 */}
              <div className="risk-section">
                <div className="risk-section-title">증거 자료 첨부 (선택)</div>
                <div className="screenshot-upload">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {screenshot ? '📷 스크린샷 첨부됨' : '📷 대화 스크린샷 첨부하기'}
                  </button>
                  {screenshot && (
                    <div className="screenshot-info">
                      <span className="screenshot-name">{screenshot.name}</span>
                      <button
                        className="screenshot-remove"
                        onClick={() => setScreenshot(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="upload-hint">
                    메신저 대화 내용을 캡처하여 첨부하면 추후 신고 시 증거로 활용할 수 있습니다
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
