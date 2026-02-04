/**
 * 스트레스 터치 분석 컴포넌트
 * 직접 입력 시 행위 기반 스트레스 점수를 실시간으로 표시
 *
 * 분석 요소 (4가지):
 * - 화면 벗어남 (visibilityChangeCount) - 탭/앱 전환
 * - 썼다 지움 (backspaceCount)
 * - 포커스 벗어남 (focusBlurCount) - 입력 필드에서 포커스 이탈
 * - 지움 비율 높음 (eraseInputRatio)
 *
 * 80점 이상: 보이스피싱 의심 거래
 */

import { useEffect, useState } from 'react';
import type { BehaviorSignals } from '../utils/behaviorTracker';
import './StressScoreDisplay.css';

interface StressScoreDisplayProps {
  signals: BehaviorSignals | null;
  isTyping: boolean;
  onPhishingSuspected?: (score: number) => void;
}

interface StressFactor {
  name: string;
  active: boolean;
  score: number;
}

export function StressScoreDisplay({ signals, isTyping, onPhishingSuspected }: StressScoreDisplayProps) {
  const [score, setScore] = useState(0);
  const [factors, setFactors] = useState<StressFactor[]>([]);

  useEffect(() => {
    if (!signals || !isTyping) {
      setScore(0);
      setFactors([]);
      return;
    }

    // 스트레스 점수 계산 (4가지 요소)
    let totalScore = 0;
    const activeFactors: StressFactor[] = [];

    // 1. 화면 벗어남 (탭/앱 전환) - 매우 높은 비중
    // 입력 중 다른 앱/탭을 보면 강한 스트레스 신호 (전화 지시 의심)
    const visibilityCount = signals.visibilityChangeCount || 0;
    if (visibilityCount >= 1) {
      const visibilityScore = Math.min(40, visibilityCount * 25);
      totalScore += visibilityScore;
      activeFactors.push({
        name: '화면 벗어남',
        active: true,
        score: visibilityScore
      });
    }

    // 2. 썼다 지움 - 백스페이스 사용 (높은 비중)
    // 수정이 많으면 확신이 없는 상태 (지시받으며 입력)
    if (signals.backspaceCount >= 1) {
      const backspaceScore = Math.min(35, signals.backspaceCount * 12);
      totalScore += backspaceScore;
      activeFactors.push({
        name: '썼다 지움',
        active: true,
        score: backspaceScore
      });
    }

    // 3. 포커스 벗어남 (입력 필드에서 포커스 이탈) - 높은 비중
    // 입력 중 다른 곳 클릭하면 주의 분산 상태
    if (signals.focusBlurCount >= 2) { // 최초 focus 1회 제외
      const focusScore = Math.min(35, (signals.focusBlurCount - 1) * 15);
      totalScore += focusScore;
      activeFactors.push({
        name: '포커스 벗어남',
        active: true,
        score: focusScore
      });
    }

    // 4. 지움 비율 높음 (높은 비중)
    // 입력 대비 삭제가 많으면 불안한 상태
    if (signals.eraseInputRatio > 0.1) {
      const eraseScore = Math.min(40, Math.floor(signals.eraseInputRatio * 100));
      totalScore += eraseScore;
      activeFactors.push({
        name: '지움 비율 ' + Math.round(signals.eraseInputRatio * 100) + '%',
        active: true,
        score: eraseScore
      });
    }

    // 점수 제한 (0-100)
    totalScore = Math.min(100, Math.max(0, totalScore));

    setScore(totalScore);
    setFactors(activeFactors);

    // 80점 이상이면 보이스피싱 의심 콜백 호출
    if (totalScore >= 80 && onPhishingSuspected) {
      onPhishingSuspected(totalScore);
    }
  }, [signals, isTyping, onPhishingSuspected]);

  // 타이핑 중이 아니거나 신호가 없으면 표시하지 않음
  if (!isTyping || !signals || signals.durationMs < 300) {
    return null;
  }

  const getScoreLevel = (score: number): 'safe' | 'warning' | 'danger' | 'phishing' => {
    if (score < 30) return 'safe';
    if (score < 60) return 'warning';
    if (score < 80) return 'danger';
    return 'phishing'; // 80점 이상: 보이스피싱 의심
  };

  const scoreLevel = getScoreLevel(score);

  return (
    <div className={`stress-score-display ${scoreLevel === 'phishing' ? 'phishing-suspected' : ''}`}>
      <div className="stress-score-header">
        <span className="stress-score-title">
          <span className="stress-pulse"></span>
          {scoreLevel === 'phishing' ? '보이스피싱 의심' : '스트레스 터치 분석'}
        </span>
        <span className={`stress-score-value ${scoreLevel}`}>
          {score}
          <span className="stress-score-unit">/100</span>
        </span>
      </div>

      <div className="stress-progress-bar">
        <div
          className={`stress-progress-fill ${scoreLevel}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {factors.length > 0 && (
        <div className="stress-factors">
          {factors.map((factor, index) => (
            <span key={index} className={`stress-factor ${factor.active ? 'active' : ''}`}>
              {factor.name}
              <span className="factor-badge">+{factor.score}</span>
            </span>
          ))}
        </div>
      )}

      <div className="stress-hint">
        {scoreLevel === 'safe' && '정상적인 입력 패턴입니다'}
        {scoreLevel === 'warning' && '약간의 불안 신호가 감지됩니다'}
        {scoreLevel === 'danger' && '강한 스트레스 신호가 감지됩니다'}
        {scoreLevel === 'phishing' && '전화 지시에 따른 입력이 의심됩니다!'}
      </div>
    </div>
  );
}
