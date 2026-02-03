/**
 * 뱅킹 홈 화면 - phishing-prevention-dashboard 디자인 기반
 */

import { useState, useEffect } from 'react';
import './BankingHome.css';

interface BankingHomeProps {
  onNavigateToTransfer: () => void;
  stressLevel: number;
}

export function BankingHome({ onNavigateToTransfer, stressLevel }: BankingHomeProps) {
  const [isEngineActive, setIsEngineActive] = useState(false);

  useEffect(() => {
    setIsEngineActive(stressLevel > 0);
  }, [stressLevel]);

  const quickActions = [
    { icon: '💸', label: '송금', action: onNavigateToTransfer, primary: true },
    { icon: '📋', label: '거래내역', action: () => {}, primary: false },
    { icon: '💳', label: '결제', action: () => {}, primary: false },
    { icon: '📱', label: 'QR', action: () => {}, primary: false },
  ];

  const recentTransactions = [
    { name: '스타벅스', amount: '-5,900', date: '오늘 14:32', emoji: '☕' },
    { name: '월급', amount: '+3,500,000', date: '1월 25일', emoji: '💰' },
    { name: '넷플릭스', amount: '-17,000', date: '1월 24일', emoji: '🎬' },
  ];

  return (
    <div className="banking-home">
      {/* Header */}
      <div className="banking-header">
        <div className="user-info">
          <div className="avatar">
            <span>김</span>
          </div>
          <div className="user-details">
            <p className="bank-name">DACON SMART BANKING</p>
            <p className="user-name">김민수님</p>
          </div>
        </div>
        <button className="notification-btn">
          <span className="notification-icon">🔔</span>
          <span className="notification-dot"></span>
        </button>
      </div>

      {/* AI Safeguard Badge */}
      <div className={`safeguard-badge ${isEngineActive ? 'monitoring' : 'active'}`}>
        <span className="shield-icon">🛡️</span>
        <span className="badge-text">
          {isEngineActive ? 'AI 세이프가드 모니터링 중' : 'AI 세이프가드 활성화'}
        </span>
        <span className="sparkle">✨</span>
      </div>

      {/* Account Card */}
      <div className="account-card">
        <div className="card-pattern"></div>
        <div className="card-content">
          <div className="card-header">
            <div className="card-title">
              <span className="wallet-icon">💼</span>
              <span>DACON 주거래통장</span>
            </div>
            <span className="chevron">›</span>
          </div>
          <p className="account-number">110-XXX-XXXXXX</p>
          <p className="balance">
            12,847,320<span className="currency">원</span>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className={`action-btn ${action.primary ? 'primary' : ''}`}
            onClick={action.action}
          >
            <div className={`action-icon ${action.primary ? 'primary' : ''}`}>
              <span>{action.icon}</span>
            </div>
            <span className={`action-label ${action.primary ? 'primary' : ''}`}>
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <div className="section-header">
          <h3>최근 거래</h3>
          <button className="more-btn">더보기</button>
        </div>
        <div className="transactions-list">
          {recentTransactions.map((tx, index) => (
            <div key={index} className="transaction-item">
              <div className="tx-info">
                <div className="tx-avatar">
                  <span>{tx.emoji}</span>
                </div>
                <div className="tx-details">
                  <p className="tx-name">{tx.name}</p>
                  <p className="tx-date">{tx.date}</p>
                </div>
              </div>
              <p className={`tx-amount ${tx.amount.startsWith('+') ? 'positive' : ''}`}>
                {tx.amount}원
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Section */}
      <div className="test-section">
        <div className="test-header">
          <span className="test-icon">💡</span>
          <span className="test-title">테스트해보기</span>
        </div>
        <p className="test-description">
          송금 버튼을 눌러 보이스피싱 탐지 시스템을 테스트해보세요.
          샘플 메시지를 붙여넣거나 직접 입력하여 시스템의 반응을 확인할 수 있습니다.
        </p>
        <button className="test-btn" onClick={onNavigateToTransfer}>
          송금 테스트 시작하기
        </button>
      </div>
    </div>
  );
}
