/**
 * 실시간 스트레스 점수 표시 컴포넌트
 * 직접 입력 시 행위 기반 스트레스 점수를 실시간으로 표시
 */

import { useEffect, useState } from 'react';
import type { BehaviorSignals } from '../utils/behaviorTracker';
import './StressScoreDisplay.css';

interface StressScoreDisplayProps {
  signals: BehaviorSignals | null;
  isTyping: boolean;
}

interface StressFactor {
  name: string;
  active: boolean;
  score: number;
}

export function StressScoreDisplay({ signals, isTyping }: StressScoreDisplayProps) {
  const [score, setScore] = useState(0);
  const [factors, setFactors] = useState<StressFactor[]>([]);

  useEffect(() => {
    if (!signals || !isTyping) {
      setScore(0);
      setFactors([]);
      return;
    }

    // 스트레스 점수 계산
    let totalScore = 0;
    const activeFactors: StressFactor[] = [];

    // 1. 타이핑 속도 분석 (너무 빠르거나 느리면 스트레스)
    if (signals.typingSpeedCps > 0) {
      if (signals.typingSpeedCps < 2) {
        // 너무 느림 - 망설임
        const hesitationScore = Math.min(15, Math.floor((2 - signals.typingSpeedCps) * 10));
        totalScore += hesitationScore;
        if (hesitationScore > 5) {
          activeFactors.push({ name: '입력 망설임', active: true, score: hesitationScore });
        }
      } else if (signals.typingSpeedCps > 8) {
        // 너무 빠름 - 급함
        const rushScore = Math.min(10, Math.floor((signals.typingSpeedCps - 8) * 5));
        totalScore += rushScore;
        if (rushScore > 3) {
          activeFactors.push({ name: '급한 입력', active: true, score: rushScore });
        }
      }
    }

    // 2. 백스페이스 사용 분석 (많으면 불안)
    if (signals.backspaceCount > 2) {
      const correctionScore = Math.min(20, signals.backspaceCount * 3);
      totalScore += correctionScore;
      activeFactors.push({ name: '수정 반복', active: true, score: correctionScore });
    }

    // 3. 입력 시간 분석
    if (signals.durationMs > 10000) {
      // 10초 이상 - 오래 망설임
      const durationScore = Math.min(15, Math.floor((signals.durationMs - 10000) / 2000) * 3);
      totalScore += durationScore;
      if (durationScore > 5) {
        activeFactors.push({ name: '오래 망설임', active: true, score: durationScore });
      }
    }

    // 4. 포커스 전환 분석
    if (signals.focusBlurCount > 1) {
      const focusScore = Math.min(10, signals.focusBlurCount * 4);
      totalScore += focusScore;
      activeFactors.push({ name: '화면 전환', active: true, score: focusScore });
    }

    // 5. 최대 타이핑 간격 분석 (긴 멈춤)
    if (signals.maxTypingInterval > 3000) {
      const pauseScore = Math.min(15, Math.floor((signals.maxTypingInterval - 3000) / 1000) * 5);
      totalScore += pauseScore;
      if (pauseScore > 5) {
        activeFactors.push({ name: '긴 멈춤', active: true, score: pauseScore });
      }
    }

    // 6. 입력 삭제 비율 분석
    if (signals.eraseInputRatio > 0.3) {
      const eraseScore = Math.min(15, Math.floor(signals.eraseInputRatio * 30));
      totalScore += eraseScore;
      activeFactors.push({ name: '삭제 반복', active: true, score: eraseScore });
    }

    // 점수 제한 (0-100)
    totalScore = Math.min(100, Math.max(0, totalScore));

    setScore(totalScore);
    setFactors(activeFactors);
  }, [signals, isTyping]);

  // 타이핑 중이 아니면 표시하지 않음
  if (!isTyping || !signals || signals.durationMs < 500) {
    return null;
  }

  const getScoreLevel = (score: number): 'safe' | 'warning' | 'danger' => {
    if (score < 30) return 'safe';
    if (score < 60) return 'warning';
    return 'danger';
  };

  const scoreLevel = getScoreLevel(score);

  return (
    <div className="stress-score-display">
      <div className="stress-score-header">
        <span className="stress-score-title">
          <span className="stress-pulse"></span>
          실시간 행위 분석
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
        {scoreLevel === 'warning' && '망설임이 감지되고 있습니다'}
        {scoreLevel === 'danger' && '강한 스트레스 신호가 감지되고 있습니다'}
      </div>
    </div>
  );
}
