/**
 * 보이스피싱 의심 경고 전체 화면
 * phishing-prevention-dashboard 디자인 기반
 * 백엔드 TypeDB 기반 유사 사례만 표시 (프론트엔드 데이터 사용 안함)
 */

import { useState, useRef, useEffect } from 'react';
import type { AnalyzeResponse, MatchResponse, ScreenshotAnalysisResponse } from '../types/api';
import { analyzeScreenshot } from '../services/apiClient';
import { ScreenshotAnalysisModal } from './ScreenshotAnalysisModal';
import './PhishingWarningScreen.css';

interface PhishingWarningScreenProps {
  analysis: AnalyzeResponse;
  matchResult?: MatchResponse | null;
  onProceedAnyway: () => void;
  onCancel: () => void;
}

// 체크리스트 질문
const CHECKLIST_QUESTIONS = [
  '지금 검찰이나 금융감독원에서 전화가 왔나요?',
  '조용한 곳으로 이동하라고 했나요?',
  '통화 내용을 다른 사람에게 말하지 말라고 했나요?',
  '지금 바로 송금해야 한다고 했나요?',
];

export function PhishingWarningScreen({
  analysis,
  matchResult,
  onProceedAnyway,
  onCancel,
}: PhishingWarningScreenProps) {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [riskScoreAnimated, setRiskScoreAnimated] = useState(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);
  const [screenshotAnalysisResult, setScreenshotAnalysisResult] = useState<ScreenshotAnalysisResponse | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [show1394Modal, setShow1394Modal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { riskScore, scoreBreakdown } = analysis;

  // 백엔드 TypeDB 데이터 (matchResult에서 가져옴)
  const topMatch = matchResult?.top_match;
  const topCases = matchResult?.top_cases || [];
  const similarity = topMatch ? Math.round(topMatch.similarity * 100) : riskScore;

  // 위험도 점수 애니메이션
  useEffect(() => {
    window.scrollTo(0, 0);
    setRiskScoreAnimated(0);
    const targetScore = similarity;
    const interval = setInterval(() => {
      setRiskScoreAnimated((prev) => {
        if (prev >= targetScore) {
          clearInterval(interval);
          return targetScore;
        }
        return prev + 2;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [similarity]);

  // 체크리스트 토글
  const toggleCheck = (index: number) => {
    setCheckedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // 스크린샷 업로드 및 분석
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      setIsAnalyzingScreenshot(true);
      try {
        const result = await analyzeScreenshot(file);
        if (result) {
          setScreenshotAnalysisResult(result);
          setShowAnalysisModal(true);
        }
      } catch (error) {
        console.error('스크린샷 분석 실패:', error);
      } finally {
        setIsAnalyzingScreenshot(false);
      }
    }
  };

  // 1394 전화하기 모달 열기
  const handleCall1394 = () => {
    setShow1394Modal(true);
  };

  // 감지된 위험 신호 목록 생성 (행위 분석 기반)
  const detectedSignals: Array<{ icon: string; name: string }> = [];

  // 행위 분석 결과에서 신호 추출
  if (scoreBreakdown?.appliedFactors) {
    scoreBreakdown.appliedFactors.forEach(factor => {
      if (factor.category === 'behavior') {
        if (factor.name.includes('스트레스') || factor.name.includes('화면')) {
          detectedSignals.push({ icon: '⚡', name: '높은 스트레스' });
        }
        if (factor.name.includes('지움') || factor.name.includes('삭제')) {
          detectedSignals.push({ icon: '✏️', name: '반복 수정' });
        }
        if (factor.name.includes('포커스') || factor.name.includes('전환')) {
          detectedSignals.push({ icon: '👀', name: '주의 분산' });
        }
      }
    });
  }

  // 분석 이유에서 신호 추출
  analysis.reasons.forEach(reason => {
    if (reason.code === 'STRESS_TOUCH') {
      if (!detectedSignals.find(s => s.name === '높은 스트레스')) {
        detectedSignals.push({ icon: '⚡', name: '높은 스트레스' });
      }
    }
    if (reason.code === 'BEHAVIOR_PATTERN') {
      detectedSignals.push({ icon: '📞', name: '전화 지시 의심' });
    }
  });

  // 기본 신호 (아무것도 없을 때)
  if (detectedSignals.length === 0) {
    detectedSignals.push({ icon: '⚠️', name: '위험 패턴 감지' });
  }

  return (
    <div className="phishing-warning-screen">
      {/* 헤더 */}
      <header className="warning-header">
        <button className="back-button" onClick={onCancel}>←</button>
        <div className="header-content">
          <div className="header-icon">🛡️</div>
          <div className="header-text">
            <h1 className="warning-title">잠깐! 안전 확인이 필요합니다</h1>
            <p className="warning-subtitle">AI가 위험 상황을 감지했습니다</p>
          </div>
        </div>
        <button className="close-button" onClick={onCancel}>✕</button>
      </header>

      <div className="warning-content">
        {/* 백엔드 TypeDB 기반 사례 매칭 경고 */}
        <div className="case-match-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            {topMatch ? (
              <>
                <p className="alert-main">
                  TypeDB 분석 결과: <span className="highlight">'{topMatch.scam_type}'</span> 유형과{' '}
                  <span className="match-percent">{similarity}% 유사</span>
                </p>
                <p className="alert-sub">
                  {topMatch.message}
                </p>
              </>
            ) : (
              <>
                <p className="alert-main">
                  스트레스 터치 분석: <span className="highlight">보이스피싱 의심</span>{' '}
                  <span className="match-percent">{riskScore}점</span>
                </p>
                <p className="alert-sub">
                  입력 중 불안정한 행동 패턴이 감지되었습니다.
                </p>
              </>
            )}
          </div>
        </div>

        {/* 위험도 점수 게이지 */}
        <div className="risk-gauge-section">
          <div className="gauge-header">
            <div className="gauge-title">
              <span className="gauge-icon">📊</span>
              <span>{topMatch ? '사기 유형 일치도' : '스트레스 터치 점수'}</span>
            </div>
            <span className="gauge-value">{riskScoreAnimated}%</span>
          </div>
          <div className="gauge-bar">
            <div
              className="gauge-fill"
              style={{ width: `${riskScoreAnimated}%` }}
            />
          </div>
          <p className="gauge-description">
            {topMatch
              ? `'${topMatch.scam_type}' 유형과의 유사도`
              : '입력 행동 패턴 분석 결과'}
          </p>
        </div>

        {/* 현재 상황 vs 백엔드 TypeDB 유사 사례 비교 */}
        <div className="comparison-section">
          <h3 className="comparison-title">
            {topMatch ? '현재 상황 vs TypeDB 유사 사례' : '감지된 위험 신호'}
          </h3>
          <div className="comparison-grid">
            {/* 현재 상황 */}
            <div className="comparison-card current">
              <div className="card-label">현재 상황</div>
              <div className="signals-list">
                {detectedSignals.slice(0, 4).map((signal, index) => (
                  <div key={index} className="signal-item">
                    <span className="signal-icon">{signal.icon}</span>
                    <span className="signal-name">{signal.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 백엔드 TypeDB 유사 사례 */}
            {topMatch && (
              <div className="comparison-card past">
                <div className="card-label">
                  <span className="calendar-icon">📋</span>
                  TypeDB 매칭 근거
                </div>
                <div className="signals-list">
                  {topMatch.reasons.slice(0, 4).map((reason, index) => (
                    <div key={index} className="signal-item">
                      <span className="signal-icon">⚠️</span>
                      <span className="signal-name">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 체크리스트 */}
        <div className="checklist-section">
          <h3 className="checklist-title">다음 질문을 확인해 주세요</h3>
          <div className="checklist-items">
            {CHECKLIST_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                className={`checklist-item ${checkedItems.includes(idx) ? 'checked' : ''}`}
                onClick={() => toggleCheck(idx)}
              >
                <div className="check-circle">
                  {checkedItems.includes(idx) && <span className="check-x">✕</span>}
                </div>
                <span className="check-text">{question}</span>
              </button>
            ))}
          </div>
          {checkedItems.length > 0 && (
            <div className="checklist-result">
              <span className="result-count">{checkedItems.length}개 항목</span>이 해당됩니다.
              보이스피싱일 가능성이 매우 높습니다!
            </div>
          )}
        </div>

        {/* 백엔드 TypeDB 유사 사례 목록 */}
        {topMatch && (
          <div className="real-case-section">
            <div className="case-header">
              <div className="case-info">
                <p className="case-id">TypeDB 매칭 사기 유형</p>
                <p className="case-victim">{topMatch.scam_type}</p>
              </div>
              <span className="case-arrow">›</span>
            </div>
            {topMatch.message && (
              <p className="case-quote">{topMatch.message}</p>
            )}
            <div className="case-location">
              <span className="location-icon">⚠️</span>
              <span>유사도 {similarity}%</span>
            </div>
          </div>
        )}

        {/* 백엔드 TypeDB 추가 유사 사례 */}
        {topCases.length > 0 && (
          <div className="additional-cases">
            <h4 className="additional-cases-title">다른 유사 사기 유형</h4>
            {topCases.slice(0, 3).map((caseItem) => (
              <div key={caseItem.case_id} className="mini-case-card">
                <span className="mini-case-title">
                  {caseItem.scam_type || caseItem.case_id}
                </span>
                <span className="mini-case-warning">
                  유사도 {Math.round(caseItem.similarity * 100)}%{caseItem.summary ? ` - ${caseItem.summary}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 스크린샷 업로드 */}
        <div className="screenshot-section">
          <h3 className="section-title">증거 자료 저장 (선택)</h3>
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
            disabled={isAnalyzingScreenshot}
          >
            {isAnalyzingScreenshot ? (
              <>⏳ AI가 분석 중...</>
            ) : screenshot ? (
              <>✓ {screenshot.name}</>
            ) : (
              <>📷 대화 스크린샷 첨부하기</>
            )}
          </button>
          {screenshot && screenshotAnalysisResult && (
            <button
              className="screenshot-analyze"
              onClick={() => setShowAnalysisModal(true)}
            >
              분석 결과 보기
            </button>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="action-buttons">
        <button className="cancel-button-primary" onClick={onCancel}>
          송금 취소하기 (권장)
        </button>
        <button className="call-button" onClick={handleCall1394}>
          📞 보이스피싱 상담센터 1394
        </button>
        <button className="proceed-button" onClick={onProceedAnyway}>
          본인 확인 완료, 계속 진행
        </button>
      </div>

      {/* 스크린샷 분석 결과 모달 */}
      {showAnalysisModal && screenshotAnalysisResult && (
        <ScreenshotAnalysisModal
          result={screenshotAnalysisResult}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}

      {/* 1394 상담센터 안내 모달 */}
      {show1394Modal && (
        <div className="modal-overlay" onClick={() => setShow1394Modal(false)}>
          <div className="modal-container modal-1394" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrapper">
                <span className="modal-icon">📞</span>
              </div>
              <h2 className="modal-title">보이스피싱 상담센터</h2>
              <button className="modal-close" onClick={() => setShow1394Modal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="phone-number-display">
                <span className="phone-label">전화번호</span>
                <span className="phone-number">1394</span>
              </div>

              <div className="modal-info-section">
                <div className="info-item">
                  <span className="info-icon">🕐</span>
                  <div className="info-content">
                    <span className="info-title">운영시간</span>
                    <span className="info-desc">24시간 연중무휴</span>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">💰</span>
                  <div className="info-content">
                    <span className="info-title">통화료</span>
                    <span className="info-desc">무료</span>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🛡️</span>
                  <div className="info-content">
                    <span className="info-title">상담내용</span>
                    <span className="info-desc">보이스피싱 피해 신고 및 상담</span>
                  </div>
                </div>
              </div>

              <div className="modal-notice">
                <span className="notice-icon">ℹ️</span>
                <p className="notice-text">
                  데모 버전으로 실제 통화는 연결되지 않습니다.<br/>
                  실제 의심되는 경우 직접 <strong>1394</strong>로 전화해주세요.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-button-primary"
                onClick={() => {
                  // 실제 전화 연결 시도 (모바일에서만 작동)
                  window.location.href = 'tel:1394';
                }}
              >
                📞 1394 전화하기
              </button>
              <button
                className="modal-button-secondary"
                onClick={() => setShow1394Modal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
