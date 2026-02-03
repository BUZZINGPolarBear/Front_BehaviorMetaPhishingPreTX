/**
 * 보이스피싱 의심 경고 전체 화면
 * phishing-prevention-dashboard 디자인 기반
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { riskScore, scoreBreakdown } = analysis;

  // 위험도 점수 애니메이션
  useEffect(() => {
    window.scrollTo(0, 0);
    setRiskScoreAnimated(0);
    const interval = setInterval(() => {
      setRiskScoreAnimated((prev) => {
        if (prev >= riskScore) {
          clearInterval(interval);
          return riskScore;
        }
        return prev + 2;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [riskScore]);

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

  // 1394 전화하기
  const handleCall1394 = () => {
    alert('보이스피싱 상담센터 1394로 연결됩니다.\n\n(데모 버전으로 실제 통화는 연결되지 않습니다)\n\n실제 의심되는 경우 직접 1394로 전화해주세요.');
  };

  // 감지된 위험 신호 목록 생성
  const detectedSignals = [];
  if (matchResult?.top_match) {
    detectedSignals.push({ icon: '📞', name: '검찰/금감원 언급', type: 'content' });
  }
  if (scoreBreakdown?.appliedFactors) {
    scoreBreakdown.appliedFactors.forEach(factor => {
      if (factor.category === 'behavior') {
        if (factor.name.includes('스트레스') || factor.name.includes('급함')) {
          detectedSignals.push({ icon: '⚡', name: '높은 스트레스', type: 'behavior' });
        }
        if (factor.name.includes('머뭇') || factor.name.includes('망설')) {
          detectedSignals.push({ icon: '⏸️', name: '망설임 감지', type: 'behavior' });
        }
        if (factor.name.includes('빠른') || factor.name.includes('급')) {
          detectedSignals.push({ icon: '⏰', name: '급박한 행동', type: 'behavior' });
        }
      }
    });
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
        {/* 실제 사례 매칭 경고 */}
        <div className="case-match-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <p className="alert-main">
              현재 상황이 <span className="highlight">2026년 1월 4일 강남역</span>에서 발생한
              '검찰 사칭 자금 세탁 사건'과 <span className="match-percent">{riskScore}% 유사</span>합니다.
            </p>
            <p className="alert-sub">
              해당 사건 피해자(62세 남성)는 동일한 패턴으로 8,200만원의 피해를 입었습니다.
            </p>
          </div>
        </div>

        {/* 위험도 점수 게이지 */}
        <div className="risk-gauge-section">
          <div className="gauge-header">
            <div className="gauge-title">
              <span className="gauge-icon">📊</span>
              <span>FSS 사기 패턴 일치도</span>
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
            KISA/FSS 보이스피싱 사례 DB 23,847건과 비교 분석 결과
          </p>
        </div>

        {/* 현재 상황 vs 실제 사례 비교 */}
        <div className="comparison-section">
          <h3 className="comparison-title">현재 상황 vs 2026.01.04 강남역 사건</h3>
          <div className="comparison-grid">
            {/* 현재 상황 */}
            <div className="comparison-card current">
              <div className="card-label">현재 상황</div>
              <div className="signals-list">
                {detectedSignals.length > 0 ? (
                  detectedSignals.slice(0, 4).map((signal, index) => (
                    <div key={index} className="signal-item">
                      <span className="signal-icon">{signal.icon}</span>
                      <span className="signal-name">{signal.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="signal-item">
                    <span className="signal-icon">⚠️</span>
                    <span className="signal-name">복합 위험 신호 감지됨</span>
                  </div>
                )}
              </div>
            </div>

            {/* 실제 사례 */}
            <div className="comparison-card past">
              <div className="card-label">
                <span className="calendar-icon">📅</span>
                2026.01.04 사건
              </div>
              <div className="signals-list">
                <div className="signal-item">
                  <span className="signal-icon">📞</span>
                  <span className="signal-name">검찰 사칭 전화</span>
                </div>
                <div className="signal-item">
                  <span className="signal-icon">📍</span>
                  <span className="signal-name">강남역 인근 ATM</span>
                </div>
                <div className="signal-item">
                  <span className="signal-icon">⚡</span>
                  <span className="signal-name">급박한 송금 시도</span>
                </div>
                <div className="signal-item">
                  <span className="signal-icon">⏰</span>
                  <span className="signal-name">즉시 이체 압박</span>
                </div>
              </div>
            </div>
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

        {/* 실제 피해 사례 */}
        <div className="real-case-section">
          <div className="case-header">
            <div className="case-info">
              <p className="case-id">유사 피해 사례 #2026-0104-GN</p>
              <p className="case-victim">62세 남성, 8,200만원 피해</p>
            </div>
            <span className="case-arrow">›</span>
          </div>
          <p className="case-quote">
            "검찰에서 전화가 와서 제 계좌가 자금 세탁에 사용됐다고 했습니다.
            신분 증명을 위해 보안계좌로 이체하라고 해서... 강남역 근처 ATM에서 급하게..."
          </p>
          <div className="case-location">
            <span className="location-icon">📍</span>
            <span>서울 강남구 강남대로 지하396 (강남역 5번 출구)</span>
          </div>
        </div>

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
    </div>
  );
}
