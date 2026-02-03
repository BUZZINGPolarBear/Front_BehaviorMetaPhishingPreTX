/**
 * 스트레스 터치 분석 컴포넌트
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

    // 스트레스 점수 계산 (더 민감하게 조정)
    let totalScore = 0;
    const activeFactors: StressFactor[] = [];

    // 기본 점수 - 입력 시작 시 약간의 기본 점수
    if (signals.durationMs > 500) {
      totalScore += 5;
    }

    // 1. 타이핑 속도 분석 (더 민감하게)
    if (signals.typingSpeedCps > 0) {
      if (signals.typingSpeedCps < 3) {
        // 느린 타이핑 - 망설임 (기준 완화: 3cps 이하)
        const hesitationScore = Math.min(25, Math.floor((3 - signals.typingSpeedCps) * 12));
        totalScore += hesitationScore;
        if (hesitationScore > 3) {
          activeFactors.push({ name: '입력 망설임', active: true, score: hesitationScore });
        }
      } else if (signals.typingSpeedCps > 6) {
        // 빠른 타이핑 - 급함 (기준 완화: 6cps 이상)
        const rushScore = Math.min(20, Math.floor((signals.typingSpeedCps - 6) * 8));
        totalScore += rushScore;
        if (rushScore > 3) {
          activeFactors.push({ name: '급한 입력', active: true, score: rushScore });
        }
      }
    }

    // 2. 백스페이스 사용 분석 (더 민감하게)
    if (signals.backspaceCount >= 1) {
      const correctionScore = Math.min(30, signals.backspaceCount * 8);
      totalScore += correctionScore;
      activeFactors.push({ name: '수정 반복', active: true, score: correctionScore });
    }

    // 3. 입력 시간 분석 (더 민감하게)
    if (signals.durationMs > 3000) {
      // 3초 이상 - 망설임 (기준 완화)
      const durationScore = Math.min(25, Math.floor((signals.durationMs - 3000) / 1000) * 6);
      totalScore += durationScore;
      if (durationScore > 3) {
        activeFactors.push({ name: '오래 망설임', active: true, score: durationScore });
      }
    }

    // 4. 포커스 전환 분석 (더 민감하게)
    if (signals.focusBlurCount >= 1) {
      const focusScore = Math.min(20, signals.focusBlurCount * 10);
      totalScore += focusScore;
      activeFactors.push({ name: '화면 전환', active: true, score: focusScore });
    }

    // 5. 최대 타이핑 간격 분석 (더 민감하게)
    if (signals.maxTypingInterval > 1500) {
      // 1.5초 이상 멈춤 (기준 완화)
      const pauseScore = Math.min(25, Math.floor((signals.maxTypingInterval - 1500) / 500) * 8);
      totalScore += pauseScore;
      if (pauseScore > 3) {
        activeFactors.push({ name: '긴 멈춤', active: true, score: pauseScore });
      }
    }

    // 6. 입력 삭제 비율 분석 (더 민감하게)
    if (signals.eraseInputRatio > 0.15) {
      // 15% 이상 삭제 (기준 완화)
      const eraseScore = Math.min(25, Math.floor(signals.eraseInputRatio * 60));
      totalScore += eraseScore;
      activeFactors.push({ name: '삭제 반복', active: true, score: eraseScore });
    }

    // 7. 머뭇거림 횟수 분석 (새로 추가)
    if (signals.hesitationCount > 0) {
      const hesitScore = Math.min(20, signals.hesitationCount * 12);
      totalScore += hesitScore;
      activeFactors.push({ name: '머뭇거림', active: true, score: hesitScore });
    }

    // 8. 평균 타이핑 간격 분석 (새로 추가)
    if (signals.avgTypingInterval > 500) {
      // 500ms 이상 평균 간격
      const avgScore = Math.min(15, Math.floor((signals.avgTypingInterval - 500) / 200) * 5);
      totalScore += avgScore;
      if (avgScore > 3) {
        activeFactors.push({ name: '느린 반응', active: true, score: avgScore });
      }
    }

    // 점수 제한 (0-100)
    totalScore = Math.min(100, Math.max(0, totalScore));

    setScore(totalScore);
    setFactors(activeFactors);
  }, [signals, isTyping]);

  // 타이핑 중이 아니면 표시하지 않음
  if (!isTyping || !signals || signals.durationMs < 300) {
    return null;
  }

  const getScoreLevel = (score: number): 'safe' | 'warning' | 'danger' => {
    if (score < 25) return 'safe';
    if (score < 50) return 'warning';
    return 'danger';
  };

  const scoreLevel = getScoreLevel(score);

  return (
    <div className="stress-score-display">
      <div className="stress-score-header">
        <span className="stress-score-title">
          <span className="stress-pulse"></span>
          스트레스 터치 분석
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
        {scoreLevel === 'warning' && '약간의 망설임이 감지되고 있습니다'}
        {scoreLevel === 'danger' && '강한 스트레스 신호가 감지되고 있습니다'}
      </div>
    </div>
  );
}
