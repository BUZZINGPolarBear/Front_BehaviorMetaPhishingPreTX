/**
 * 스크린샷 분석 결과 모달
 * Claude Vision API 분석 결과를 보여주는 모달
 */

import type { ScreenshotAnalysisResponse } from '../types/api';
import './ScreenshotAnalysisModal.css';

interface ScreenshotAnalysisModalProps {
  result: ScreenshotAnalysisResponse;
  onClose: () => void;
}

export function ScreenshotAnalysisModal({
  result,
  onClose,
}: ScreenshotAnalysisModalProps) {
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="screenshot-modal-overlay" onClick={onClose}>
      <div className="screenshot-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={`modal-header ${result.is_suspicious ? 'danger' : 'safe'}`}>
          <span className="modal-icon">
            {result.is_suspicious ? '🚨' : '✅'}
          </span>
          <h2 className="modal-title">
            {result.is_suspicious ? '사기 의심 대화 감지' : '분석 완료'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* 본문 */}
        <div className="modal-body">
          {/* 신뢰도 */}
          <div className="confidence-section">
            <div className="confidence-label">분석 신뢰도</div>
            <div className="confidence-bar">
              <div
                className={`confidence-fill ${result.is_suspicious ? 'danger' : 'safe'}`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <div className="confidence-value">{confidencePercent}%</div>
          </div>

          {/* 사기 유형 (의심되는 경우) */}
          {result.is_suspicious && result.scam_type_name && (
            <div className="scam-type-section">
              <div className="scam-type-label">의심 사기 유형</div>
              <div className="scam-type-badge">
                <span className="scam-type-icon">⚠️</span>
                <span className="scam-type-name">{result.scam_type_name}</span>
              </div>
            </div>
          )}

          {/* 위험 신호 */}
          {result.risk_indicators.length > 0 && (
            <div className="risk-indicators-section">
              <div className="section-label">감지된 위험 신호</div>
              <ul className="risk-indicators-list">
                {result.risk_indicators.map((indicator, index) => (
                  <li key={index} className="risk-indicator-item">
                    <span className="indicator-icon">🔴</span>
                    <span className="indicator-text">{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 추출된 대화 내용 */}
          {result.extracted_text && (
            <div className="extracted-text-section">
              <div className="section-label">분석된 대화 내용</div>
              <div className="extracted-text-box">
                {result.extracted_text}
              </div>
            </div>
          )}

          {/* 권고 사항 */}
          {result.recommendation && (
            <div className="recommendation-section">
              <div className="section-label">권고 사항</div>
              <div className={`recommendation-box ${result.is_suspicious ? 'danger' : 'safe'}`}>
                <span className="recommendation-icon">
                  {result.is_suspicious ? '⚠️' : 'ℹ️'}
                </span>
                <span className="recommendation-text">{result.recommendation}</span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="modal-footer">
          {result.is_suspicious ? (
            <>
              <button className="modal-btn danger" onClick={onClose}>
                송금 중단하기
              </button>
              <button className="modal-btn secondary" onClick={onClose}>
                닫기
              </button>
            </>
          ) : (
            <button className="modal-btn primary" onClick={onClose}>
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
