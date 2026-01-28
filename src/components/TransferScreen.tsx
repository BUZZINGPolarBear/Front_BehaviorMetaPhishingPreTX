/**
 * 실제 뱅킹 앱 스타일 송금 화면
 * 메시지 붙여넣기 시 자동 파싱 및 위험도 분석
 */

import { useState, useRef } from 'react';
import { useBehaviorTracker } from '../utils/behaviorTracker';
import { analyzeText } from '../services/apiClient';
import { parseTransferMessage } from '../utils/messageParser';
import { SAMPLE_MESSAGES, type SampleMessage } from '../data/sampleMessages';
import type { AnalyzeResponse } from '../types/api';
import { RiskBanner } from './RiskBanner';
import './TransferScreen.css';

// 가명화된 자주 보낸 사람 데이터
const FREQUENT_CONTACTS = [
  { id: 1, name: '김민수', bank: '스타라이트', account: '96904420004025', date: '2026.01.22', favorite: true },
  { id: 2, name: '이지은', bank: '오션뱅크', account: '010-28-23037-2', date: '2025.12.20', favorite: true },
  { id: 3, name: '박서준', bank: '오션뱅크', account: '382-910536-99907', date: '2025.12.20', favorite: true },
  { id: 4, name: '최유진', bank: '그린필드', account: '35107498278', date: '2025.11.25', favorite: true },
  { id: 5, name: '정다은', bank: '오션증권', account: '40093804300', date: '2025.08.25', favorite: true },
];

type Step = 'select' | 'amount';

interface SelectedContact {
  name: string;
  bank: string;
  account: string;
}

export function TransferScreen() {
  const [step, setStep] = useState<Step>('select');
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [amount, setAmount] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [originalMessage, setOriginalMessage] = useState(''); // 붙여넣은 원본 메시지
  const [riskAnalysis, setRiskAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSamples, setShowSamples] = useState(true); // 샘플 메시지 표시 여부

  const accountInputRef = useRef<HTMLInputElement>(null);
  const { getSignals } = useBehaviorTracker(accountInputRef);

  // 샘플 메시지 적용
  const handleSampleSelect = async (sample: SampleMessage) => {
    setShowSamples(false); // 샘플 선택 후 숨기기
    await processMessage(sample.message);
  };

  // 메시지 처리 (붙여넣기 또는 샘플)
  const processMessage = async (text: string) => {

    // 1. 원본 메시지 저장 (위에 표시용)
    setOriginalMessage(text);

    // 2. 메시지 파싱
    const parsed = parseTransferMessage(text);
    console.log('파싱 결과:', parsed);

    // 3. 계좌번호만 입력 필드에 표시
    if (parsed.account) {
      setAccountInput(parsed.account);
    } else {
      // 계좌번호를 못 찾으면 원본 텍스트 표시
      setAccountInput(text);
    }

    // 4. 위험도 분석
    setIsAnalyzing(true);
    const signals = getSignals();

    if (signals) {
      try {
        const result = await analyzeText({
          text,
          signals,
          client: {
            userAgent: navigator.userAgent,
            locale: navigator.language,
          },
        });
        setRiskAnalysis(result);

        // 5. 금액 자동 입력 (있으면)
        if (parsed.amount) {
          setAmount(parsed.amount);
        }

        // 6. 연락처 자동 선택 (있으면)
        if (parsed.recipientName || parsed.account) {
          const matchedContact = FREQUENT_CONTACTS.find(
            (contact) =>
              contact.name === parsed.recipientName ||
              contact.account.includes(parsed.account || '')
          );

          if (matchedContact) {
            setSelectedContact({
              name: matchedContact.name,
              bank: matchedContact.bank,
              account: matchedContact.account,
            });
            // 금액 입력 화면으로 자동 이동
            if (parsed.amount) {
              setStep('amount');
            }
          }
        }
      } catch (error) {
        console.error('분석 실패:', error);
      }
    }
    setIsAnalyzing(false);
  };

  // 계좌번호 필드에 붙여넣기 감지
  const handleAccountPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); // 기본 붙여넣기 동작 방지
    const text = e.clipboardData.getData('text');
    setShowSamples(false); // 붙여넣기 시 샘플 숨기기
    await processMessage(text);
  };

  // 연락처 선택
  const handleSelectContact = (contact: typeof FREQUENT_CONTACTS[0]) => {
    setSelectedContact({
      name: contact.name,
      bank: contact.bank,
      account: contact.account,
    });
    setStep('amount');
  };

  // 계좌번호 직접 입력 후 송금 버튼 클릭
  const handleTransferClick = async () => {
    if (!accountInput.trim()) {
      alert('계좌번호를 입력해주세요');
      return;
    }

    // 입력된 계좌번호로 연락처 확인
    const matchedContact = FREQUENT_CONTACTS.find(
      (contact) => contact.account.includes(accountInput)
    );

    if (matchedContact) {
      // 기존 연락처면 해당 정보 사용
      setSelectedContact({
        name: matchedContact.name,
        bank: matchedContact.bank,
        account: matchedContact.account,
      });
    } else {
      // 새 계좌번호면 임시 연락처 생성
      setSelectedContact({
        name: '새 연락처',
        bank: '확인 필요',
        account: accountInput,
      });
    }

    // 위험도 분석 수행 (아직 안 했으면)
    if (!riskAnalysis && !isAnalyzing) {
      setIsAnalyzing(true);
      const signals = getSignals();

      if (signals) {
        try {
          const result = await analyzeText({
            text: accountInput,
            signals,
            client: {
              userAgent: navigator.userAgent,
              locale: navigator.language,
            },
          });
          setRiskAnalysis(result);
        } catch (error) {
          console.error('분석 실패:', error);
        }
      }
      setIsAnalyzing(false);
    }

    setStep('amount');
  };

  // 빠른 금액 버튼
  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  // 숫자 키패드
  const handleNumberPad = (num: string) => {
    if (num === 'delete') {
      setAmount(prev => prev.slice(0, -1));
    } else if (num === 'clear') {
      setAmount('');
    } else {
      setAmount(prev => prev + num);
    }
  };

  // 금액 포맷팅
  const formatAmount = (value: string) => {
    if (!value) return '';
    return parseInt(value).toLocaleString('ko-KR');
  };

  return (
    <div className="transfer-screen">
      {/* 상단 헤더 */}
      <header className="transfer-header">
        {step === 'amount' && (
          <button className="back-button" onClick={() => setStep('select')}>
            ←
          </button>
        )}
        <h1 className="transfer-title">이체</h1>
        <button className="cancel-button">취소</button>
      </header>

      {/* 위험도 배너 (송금창 위에 표시) */}
      {riskAnalysis && <RiskBanner analysis={riskAnalysis} />}

      {/* 연락처 선택 화면 */}
      {step === 'select' && (
        <div className="contact-select-screen">
          <h2 className="screen-title">누구에게 보낼까요?</h2>

          {/* 테스트용 샘플 메시지 */}
          {showSamples && !originalMessage && (
            <div className="sample-messages-section">
              <div className="sample-header">
                <span className="sample-title">💡 테스트해보기</span>
                <button
                  className="sample-close"
                  onClick={() => setShowSamples(false)}
                >
                  ✕
                </button>
              </div>

              {/* 안전한 메시지 */}
              <div className="sample-category">
                <div className="sample-category-title">
                  <span className="category-icon safe">✓</span>
                  안전한 송금
                </div>
                <div className="sample-buttons">
                  {SAMPLE_MESSAGES.filter(s => s.category === 'safe').slice(0, 3).map(sample => (
                    <button
                      key={sample.id}
                      className="sample-button safe"
                      onClick={() => handleSampleSelect(sample)}
                    >
                      <div className="sample-button-title">{sample.title}</div>
                      <div className="sample-button-desc">{sample.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 의심스러운 메시지 */}
              <div className="sample-category">
                <div className="sample-category-title">
                  <span className="category-icon suspicious">⚠</span>
                  주의 필요
                </div>
                <div className="sample-buttons">
                  {SAMPLE_MESSAGES.filter(s => s.category === 'suspicious').slice(0, 3).map(sample => (
                    <button
                      key={sample.id}
                      className="sample-button suspicious"
                      onClick={() => handleSampleSelect(sample)}
                    >
                      <div className="sample-button-title">{sample.title}</div>
                      <div className="sample-button-desc">{sample.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 위험한 메시지 */}
              <div className="sample-category">
                <div className="sample-category-title">
                  <span className="category-icon dangerous">●</span>
                  보이스피싱 의심
                </div>
                <div className="sample-buttons">
                  {SAMPLE_MESSAGES.filter(s => s.category === 'dangerous').slice(0, 3).map(sample => (
                    <button
                      key={sample.id}
                      className="sample-button dangerous"
                      onClick={() => handleSampleSelect(sample)}
                    >
                      <div className="sample-button-title">{sample.title}</div>
                      <div className="sample-button-desc">{sample.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 붙여넣은 원본 메시지 표시 */}
          {originalMessage && (
            <div className="original-message-display">
              <div className="original-message-label">입력된 메시지</div>
              <div className="original-message-content">{originalMessage}</div>
              <button
                className="reset-button"
                onClick={() => {
                  setOriginalMessage('');
                  setAccountInput('');
                  setRiskAnalysis(null);
                  setShowSamples(true);
                }}
              >
                다시 선택하기
              </button>
            </div>
          )}

          {/* 계좌번호 입력 */}
          <div className="search-bar">
            <input
              ref={accountInputRef}
              type="text"
              placeholder="계좌번호 입력 (메시지 붙여넣기 가능)"
              className="search-input"
              value={accountInput}
              onChange={(e) => setAccountInput(e.target.value)}
              onPaste={handleAccountPaste}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTransferClick();
                }
              }}
            />
            <button
              className="search-button transfer-button"
              onClick={handleTransferClick}
              disabled={!accountInput.trim() || isAnalyzing}
            >
              {isAnalyzing ? '...' : '송금'}
            </button>
          </div>

          {/* 분석 중 표시 */}
          {isAnalyzing && (
            <div className="analyzing-indicator">
              <span className="spinner"></span>
              위험도 분석 중...
            </div>
          )}

          {/* 탭 */}
          <div className="tabs">
            <button className="tab active">최근</button>
            <button className="tab">내계좌</button>
            <button className="tab">자주</button>
            <button className="tab">연락처</button>
          </div>

          {/* 자주 보낸 사람 리스트 */}
          <div className="contact-list">
            {FREQUENT_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                className="contact-item"
                onClick={() => handleSelectContact(contact)}
              >
                <div className="contact-icon">
                  {contact.bank === '스타라이트' && '⭐'}
                  {contact.bank.includes('오션') && '🌊'}
                  {contact.bank === '그린필드' && '🌾'}
                </div>
                <div className="contact-info">
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-detail">
                    {contact.bank} {contact.account}
                  </div>
                </div>
                <div className="contact-meta">
                  <div className="contact-date">{contact.date}</div>
                  {contact.favorite && (
                    <div className="contact-favorite">⭐</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 금액 입력 화면 */}
      {step === 'amount' && selectedContact && (
        <div className="amount-input-screen">
          {/* 수신인 정보 */}
          <div className="recipient-info">
            <div className="recipient-name">{selectedContact.name}에게</div>
            <div className="recipient-account">
              {selectedContact.bank}은행 {selectedContact.account}
            </div>
          </div>

          {/* 금액 입력 */}
          <div className="amount-section">
            <h2 className="amount-title">얼마를 보낼까요?</h2>

            <div className="amount-display">
              <input
                type="text"
                className="amount-input"
                value={formatAmount(amount)}
                readOnly
                placeholder="0"
              />
              <span className="amount-unit">원</span>
            </div>

            {/* 빠른 금액 버튼 */}
            <div className="quick-amount-buttons">
              <button onClick={() => handleQuickAmount(10000)}>1만</button>
              <button onClick={() => handleQuickAmount(50000)}>5만</button>
              <button onClick={() => handleQuickAmount(100000)}>10만</button>
              <button onClick={() => handleQuickAmount(1000000)}>100만</button>
              <button onClick={() => setAmount('9999999')}>전액</button>
            </div>

            {/* 숫자 키패드 */}
            <div className="number-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="number-button"
                  onClick={() => handleNumberPad(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button
                className="number-button delete"
                onClick={() => handleNumberPad('delete')}
              >
                ×
              </button>
              <button
                className="number-button"
                onClick={() => handleNumberPad('0')}
              >
                0
              </button>
              <button
                className="number-button confirm"
                onClick={() => {
                  // 송금 확인
                  alert('송금 확인 화면으로 이동');
                }}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
