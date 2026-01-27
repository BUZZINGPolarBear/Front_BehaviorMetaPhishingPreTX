/**
 * 위험도 알림 배너
 * 송금창 위에 자연스럽게 표시되는 침착한 보안 알림
 */

import React, { useState } from 'react';
import type { AnalyzeResponse, RiskLevel } from '../types/api';
import './RiskBanner.css';

interface RiskBannerProps {
  analysis: AnalyzeResponse;
}

export function RiskBanner({ analysis }: RiskBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { riskLevel, riskScore, reasons, recommendations } = analysis;

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
        return '확인이 필요합니다';
      case 'high':
        return '주의가 필요합니다';
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

          {/* 추가 검증 버튼 (고위험일 때만) */}
          {riskLevel === 'high' && (
            <button className="verify-button">
              추가 확인하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
