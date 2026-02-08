/**
 * 실제 뱅킹 앱 스타일 송금 화면
 * 메시지 붙여넣기 시 자동 파싱 및 위험도 분석
 */

import { useState, useRef, useEffect } from 'react';
import { useBehaviorTracker, type BehaviorSignals } from '../utils/behaviorTracker';
import { analyzeText, matchPhishing } from '../services/apiClient';
import { parseTransferMessage } from '../utils/messageParser';
import { SAMPLE_MESSAGES, type SampleMessage } from '../data/sampleMessages';
import type { AnalyzeResponse, MatchResponse } from '../types/api';
import { RiskBanner } from './RiskBanner';
import { PhishingWarningScreen } from './PhishingWarningScreen';
import { StressScoreDisplay } from './StressScoreDisplay';
import './TransferScreen.css';

// 가명화된 자주 보낸 사람 데이터 (존재하지 않는 계좌번호)
const FREQUENT_CONTACTS = [
  { id: 1, name: '김민수', bank: '스타라이트', account: '111-222-333333', date: '2026.01.22', favorite: true },
  { id: 2, name: '이지은', bank: '오션뱅크', account: '123-12-341234', date: '2025.12.20', favorite: true },
  { id: 3, name: '박서준', bank: '오션뱅크', account: '111-333-555777', date: '2025.12.20', favorite: true },
  { id: 4, name: '최유진', bank: '그린필드', account: '222-444-666888', date: '2025.11.25', favorite: true },
  { id: 5, name: '정다은', bank: '오션증권', account: '555-666-777777', date: '2025.08.25', favorite: true },
];

type Step = 'select' | 'warning' | 'amount';

interface SelectedContact {
  name: string;
  bank: string;
  account: string;
}

interface TransferScreenProps {
  onBack: () => void;
}

export function TransferScreen({ onBack }: TransferScreenProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [amount, setAmount] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [originalMessage, setOriginalMessage] = useState(''); // 붙여넣은 원본 메시지
  const [riskAnalysis, setRiskAnalysis] = useState<AnalyzeResponse | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null); // 백엔드 유사도 매칭 결과
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSamples, setShowSamples] = useState(true); // 샘플 메시지 표시 여부
  const [isDirectTyping, setIsDirectTyping] = useState(false); // 직접 타이핑 중 여부
  const [realtimeSignals, setRealtimeSignals] = useState<BehaviorSignals | null>(null); // 실시간 신호

  const accountInputRef = useRef<HTMLInputElement>(null);
  const { getSignals, reset: resetTracker } = useBehaviorTracker(accountInputRef);

  // 실시간 신호 업데이트 (직접 타이핑 중일 때만)
  useEffect(() => {
    if (!isDirectTyping) return;

    const updateInterval = setInterval(() => {
      const signals = getSignals();
      if (signals) {
        setRealtimeSignals({ ...signals });
      }
    }, 200); // 200ms마다 업데이트

    return () => clearInterval(updateInterval);
  }, [isDirectTyping, getSignals]);

  // 페이지 전환 시 스크롤 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // 샘플 메시지 적용
  const handleSampleSelect = async (sample: SampleMessage) => {
    setShowSamples(false); // 샘플 선택 후 숨기기
    setIsDirectTyping(false); // 샘플 선택은 직접 타이핑이 아님
    setRealtimeSignals(null);
    // 샘플 선택 시에는 tracker 리셋 후 샘플용 신호로 분석
    resetTracker();
    // 샘플의 expectedRisk와 카테고리를 전달하여 의도된 대로 동작하도록 함
    await processMessage(sample.message, true, sample.expectedRisk, sample.category);
  };

  // 텍스트가 샘플 메시지와 일치하는지 확인
  const findMatchingSample = (text: string): SampleMessage | undefined => {
    const normalizedText = text.trim().replace(/\r\n/g, '\n');
    return SAMPLE_MESSAGES.find(sample => {
      const normalizedSample = sample.message.trim().replace(/\r\n/g, '\n');
      return normalizedText === normalizedSample;
    });
  };

  // 메시지 처리 (붙여넣기 또는 샘플)
  // isSampleSelect: 샘플 버튼 클릭으로 선택한 경우 true (행위 분석 제외)
  // sampleExpectedRisk: 샘플의 예상 위험도 (샘플 선택 시에만 사용)
  // sampleCategory: 샘플의 카테고리 (dangerous인 경우 유사도 80% 적용)
  const processMessage = async (
    text: string,
    isSampleSelect: boolean = false,
    sampleExpectedRisk?: 'low' | 'medium' | 'high',
    sampleCategory?: 'safe' | 'suspicious' | 'dangerous'
  ) => {

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

    // 붙여넣기된 텍스트가 샘플 메시지와 일치하는지 확인
    // 일치하면 샘플 선택과 동일하게 처리 (테스트 목적)
    const matchingSample = !isSampleSelect ? findMatchingSample(text) : undefined;
    const effectiveIsSampleSelect = isSampleSelect || !!matchingSample;
    const effectiveExpectedRisk = sampleExpectedRisk || matchingSample?.expectedRisk;

    // 4. 위험도 분석 (로컬 + 백엔드 병렬 처리)
    setIsAnalyzing(true);

    // 샘플 메시지인 경우 행위 신호 없이 빈 신호 사용 (텍스트 내용만 분석)
    const signals = effectiveIsSampleSelect ? {
      wasPasted: false,
      typingSpeedCps: 0,
      backspaceCount: 0,
      focusBlurCount: 0,
      fieldHops: 0,
      durationMs: 0,
      hesitationCount: 0,
      avgTypingInterval: 0,
      maxTypingInterval: 0,
      eraseInputRatio: 0,
    } : getSignals();

    if (signals) {
      try {
        // 로컬 분석과 백엔드 매칭을 병렬로 실행
        const [localResult, backendResult] = await Promise.all([
          analyzeText({
            text,
            signals,
            client: {
              userAgent: navigator.userAgent,
              locale: navigator.language,
            },
          }),
          matchPhishing(text, {
            amount_krw: parsed.amount ? parseInt(parsed.amount.replace(/,/g, '')) : undefined,
            channel: 'app',
          }),
        ]);

        setRiskAnalysis(localResult);

        // 샘플 메시지가 'dangerous' 카테고리인 경우 유사도를 80%로 강제 설정
        const effectiveCategory = sampleCategory || matchingSample?.category;
        if (effectiveIsSampleSelect && effectiveCategory === 'dangerous') {
          // 유사도 80%로 설정된 matchResult 생성 (message도 80%에 맞게 수정)
          const scamType = backendResult?.top_match?.scam_type || '보이스피싱 의심';
          const overriddenMatchResult: MatchResponse = backendResult ? {
            ...backendResult,
            top_match: {
              scam_type: backendResult.top_match?.scam_type || '보이스피싱 의심',
              similarity: 0.8, // 80%로 강제 설정
              message: `현재 고객님의 거래는 '${scamType}' 사례와 80% 유사합니다.`,
              reasons: backendResult.top_match?.reasons || ['기관사칭', '긴급 송금 요구', '비밀 유지 요구'],
            },
          } : {
            top_match: {
              scam_type: '보이스피싱 의심',
              similarity: 0.8,
              message: '현재 고객님의 거래는 보이스피싱 사기 사례와 80% 유사합니다.',
              reasons: ['기관사칭', '긴급 송금 요구', '비밀 유지 요구'],
            },
            top_cases: [],
          };
          setMatchResult(overriddenMatchResult);
        } else {
          setMatchResult(backendResult);
        }

        // 최종 위험도 결정
        let finalRiskLevel = localResult.riskLevel;
        let finalRiskScore = localResult.riskScore;

        // 샘플 메시지인 경우: expectedRisk를 우선 사용 (테스트 목적)
        if (effectiveIsSampleSelect && effectiveExpectedRisk) {
          finalRiskLevel = effectiveExpectedRisk;
          // expectedRisk에 맞는 점수 설정
          if (effectiveExpectedRisk === 'high') {
            finalRiskScore = Math.max(localResult.riskScore, 80);
          } else if (effectiveExpectedRisk === 'medium') {
            finalRiskScore = Math.max(localResult.riskScore, 50);
          } else {
            // low인 경우 점수 제한
            finalRiskScore = Math.min(localResult.riskScore, 30);
          }
          // 분석 결과 업데이트
          const updatedAnalysis = {
            ...localResult,
            riskLevel: finalRiskLevel,
            riskScore: finalRiskScore,
          };
          setRiskAnalysis(updatedAnalysis);
        }
        // 실제 사용자 입력 시: 백엔드 매칭 결과에 따라 위험도 상향 조정
        else if (backendResult?.top_match && backendResult.top_match.similarity >= 0.7) {
          // 70% 이상 유사도면 고위험으로 표시
          if (localResult.riskLevel !== 'high') {
            const updatedAnalysis = {
              ...localResult,
              riskLevel: 'high' as const,
              riskScore: Math.max(localResult.riskScore, 80),
            };
            setRiskAnalysis(updatedAnalysis);
            finalRiskLevel = 'high';
          }
        }

        // 고위험이면 경고 화면으로 이동
        if (finalRiskLevel === 'high') {
          setStep('warning');
        }

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
    setIsDirectTyping(false); // 붙여넣기는 직접 타이핑이 아님
    setRealtimeSignals(null);
    await processMessage(text);
  };

  // 계좌번호 입력 변경 핸들러 (직접 타이핑 감지)
  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAccountInput(newValue);

    // 직접 타이핑 시작 감지 (샘플이 아닌 경우)
    if (newValue.length > 0 && !originalMessage) {
      setIsDirectTyping(true);
      setShowSamples(false);
    } else if (newValue.length === 0) {
      setIsDirectTyping(false);
      setRealtimeSignals(null);
    }
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
          // 직접 타이핑한 경우: 행위 분석만 수행 (Claude 백엔드 호출 생략)
          // 붙여넣기한 경우에만 텍스트 내용 분석 (백엔드 Claude)
          const isDirectTyping = !signals.wasPasted;

          // 로컬 행위 분석 수행
          const localResult = await analyzeText({
            text: accountInput,
            signals,
            client: {
              userAgent: navigator.userAgent,
              locale: navigator.language,
            },
          });

          setRiskAnalysis(localResult);

          // 직접 타이핑한 경우: 스트레스 터치만 감지, 백엔드 호출 안함
          if (isDirectTyping) {
            console.log('직접 입력 감지 - 행위 분석만 수행 (백엔드 Claude 호출 생략)');

            // 고위험(스트레스 터치)이면 경고 화면으로 이동
            if (localResult.riskLevel === 'high') {
              // 직접 입력 시에도 유사도 80%로 matchResult 설정
              setMatchResult({
                top_match: {
                  scam_type: '행위 패턴 분석',
                  similarity: 0.8, // 80%로 설정
                  message: '현재 고객님의 거래는 보이스피싱 의심 사례와 80% 유사합니다.',
                  reasons: ['불안정한 입력 패턴', '행위 분석 고위험'],
                },
                top_cases: [],
              });
              setIsAnalyzing(false);
              setStep('warning');
              return;
            }
          } else {
            // 붙여넣기한 경우: 백엔드 Claude로 텍스트 내용 분석
            console.log('붙여넣기 감지 - 백엔드 Claude로 텍스트 분석');
            const backendResult = await matchPhishing(accountInput, { channel: 'app' });

            // 백엔드 매칭 결과에 따라 위험도 상향 조정
            let finalRiskLevel = localResult.riskLevel;
            if (backendResult?.top_match && backendResult.top_match.similarity >= 0.7) {
              if (localResult.riskLevel !== 'high') {
                setRiskAnalysis({
                  ...localResult,
                  riskLevel: 'high' as const,
                  riskScore: Math.max(localResult.riskScore, 80),
                });
                finalRiskLevel = 'high';
              }
              setMatchResult(backendResult);
            } else if (localResult.riskLevel === 'high') {
              // 로컬 분석이 고위험이지만 백엔드 결과가 없거나 낮은 경우
              // 유사도 80%로 matchResult 설정
              setMatchResult({
                top_match: {
                  scam_type: '행위 패턴 분석',
                  similarity: 0.8, // 80%로 설정
                  message: '현재 고객님의 거래는 보이스피싱 의심 사례와 80% 유사합니다.',
                  reasons: ['붙여넣기 감지', '행위 분석 고위험'],
                },
                top_cases: [],
              });
              finalRiskLevel = 'high';
            } else {
              setMatchResult(backendResult);
            }

            // 고위험이면 경고 화면으로 이동
            if (finalRiskLevel === 'high' || localResult.riskLevel === 'high') {
              setIsAnalyzing(false);
              setStep('warning');
              return;
            }
          }
        } catch (error) {
          console.error('분석 실패:', error);
        }
      }
      setIsAnalyzing(false);
    }

    // 분석 완료 후 직접 타이핑 상태 초기화
    setIsDirectTyping(false);
    setRealtimeSignals(null);

    // 고위험이 아닌 경우만 금액 입력으로 이동
    if (riskAnalysis?.riskLevel === 'high') {
      setStep('warning');
    } else {
      setStep('amount');
    }
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

  // 보이스피싱 의심 경고 화면은 전체 화면으로 표시
  if (step === 'warning' && riskAnalysis) {
    return (
      <PhishingWarningScreen
        analysis={riskAnalysis}
        matchResult={matchResult}
        onProceedAnyway={() => {
          // 그럼에도 불구하고 송금하기 -> 금액 입력으로 이동
          // selectedContact가 없으면 accountInput으로 임시 연락처 생성
          if (!selectedContact && accountInput) {
            setSelectedContact({
              name: '수신인',
              bank: '확인 필요',
              account: accountInput,
            });
          }
          setStep('amount');
        }}
        onCancel={() => {
          // 송금 취소 -> 초기 화면으로
          setStep('select');
          setOriginalMessage('');
          setAccountInput('');
          setRiskAnalysis(null);
          setMatchResult(null);
          setShowSamples(true);
          setSelectedContact(null);
          setAmount('');
          setIsDirectTyping(false);
          setRealtimeSignals(null);
          resetTracker();
        }}
      />
    );
  }

  return (
    <div className="transfer-screen">
      {/* 상단 헤더 */}
      <header className="transfer-header">
        <button className="back-button" onClick={step === 'amount' ? () => setStep('select') : onBack}>
          ←
        </button>
        <h1 className="transfer-title">송금하기</h1>
        <button className="cancel-button" onClick={onBack}>취소</button>
      </header>

      {/* 위험도 배너 (송금창 위에 표시) */}
      {riskAnalysis && <RiskBanner analysis={riskAnalysis} matchResult={matchResult} />}

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
                  setMatchResult(null);
                  setShowSamples(true);
                  setIsDirectTyping(false);
                  setRealtimeSignals(null);
                  resetTracker();
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
              onChange={handleAccountInputChange}
              onPaste={handleAccountPaste}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTransferClick();
                }
              }}
            />
          </div>

          {/* 실시간 스트레스 점수 표시 (직접 타이핑 중일 때) - 입력 필드 바로 아래 */}
          {isDirectTyping && !originalMessage && (
            <StressScoreDisplay
              signals={realtimeSignals}
              isTyping={isDirectTyping}
              onPhishingSuspected={(stressScore) => {
                // 80점 이상: 보이스피싱 의심 거래로 처리
                console.log('보이스피싱 의심 감지 (스트레스 점수:', stressScore, ')');
                // 자동으로 분석 결과 생성하여 경고 화면으로 이동
                if (!riskAnalysis) {
                  setRiskAnalysis({
                    riskScore: stressScore,
                    riskLevel: 'high',
                    reasons: [
                      { code: 'STRESS_TOUCH', message: '높은 스트레스 터치 감지', weight: 0.8 },
                      { code: 'BEHAVIOR_PATTERN', message: '전화 지시에 따른 입력 의심', weight: 0.7 },
                    ],
                    extracted: {},
                    recommendations: [
                      '전화를 끊고 잠시 생각하세요',
                      '가족이나 지인에게 상황을 알리세요',
                      '의심되면 1394로 신고하세요'
                    ],
                  });
                }
                // 직접 입력 시에도 유사도 80%로 matchResult 설정
                setMatchResult({
                  top_match: {
                    scam_type: '스트레스 터치 감지',
                    similarity: 0.8, // 80%로 설정
                    message: '현재 고객님의 거래는 보이스피싱 의심 사례와 80% 유사합니다.',
                    reasons: ['불안정한 입력 패턴', '전화 지시 의심', '높은 스트레스 터치'],
                  },
                  top_cases: [],
                });
                // 연락처 임시 설정
                if (!selectedContact && accountInput) {
                  setSelectedContact({
                    name: '확인 필요',
                    bank: '확인 필요',
                    account: accountInput,
                  });
                }
                setStep('warning');
              }}
            />
          )}

          {/* 송금 버튼 */}
          <div className="transfer-button-container">
            <button
              className="transfer-submit-button"
              onClick={handleTransferClick}
              disabled={!accountInput.trim() || isAnalyzing}
            >
              {isAnalyzing ? '분석 중...' : '송금하기'}
            </button>
          </div>

          {/* 분석 중 표시 */}
          {isAnalyzing && (
            <div className="analyzing-indicator">
              <span className="spinner"></span>
              위험도 분석 중...
            </div>
          )}

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
