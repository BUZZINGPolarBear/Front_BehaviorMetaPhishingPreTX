/**
 * 테스트용 샘플 메시지
 * 보이스피싱류와 일반 송금 메시지 구분
 */

export interface SampleMessage {
  id: string;
  category: 'safe' | 'suspicious' | 'dangerous';
  title: string;
  message: string;
  expectedRisk: 'low' | 'medium' | 'high';
  description: string;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  // 안전한 메시지 (Low Risk)
  {
    id: 'safe-1',
    category: 'safe',
    title: '친구 송금',
    expectedRisk: 'low',
    description: '지인에게 소액 송금',
    message: `김민수님에게
기업은행 96904420004025
5만원 보내주세요
저번에 빌린 돈 갚을게요`,
  },
  {
    id: 'safe-2',
    category: 'safe',
    title: '회비 납부',
    expectedRisk: 'low',
    description: '모임 회비 입금',
    message: `이지은
하나은행 010-28-23037-2
3만원
이번 달 회비입니다`,
  },
  {
    id: 'safe-3',
    category: 'safe',
    title: '가족 용돈',
    expectedRisk: 'low',
    description: '부모님 용돈 드리기',
    message: `엄마한테
농협 40093804300
20만원 보내드려요`,
  },

  // 의심스러운 메시지 (Medium Risk)
  {
    id: 'suspicious-1',
    category: 'suspicious',
    title: '급한 송금 요청',
    expectedRisk: 'medium',
    description: '긴급성 강조',
    message: `박서준
하나 382-910536-99907
50만원 급해요
오늘 안에 꼭 부탁드립니다`,
  },
  {
    id: 'suspicious-2',
    category: 'suspicious',
    title: '처음 보는 계좌',
    expectedRisk: 'medium',
    description: '낯선 계좌번호',
    message: `최유진
지역농협 351074982783
70만원
계좌번호 확인 부탁드려요`,
  },
  {
    id: 'suspicious-3',
    category: 'suspicious',
    title: '고액 거래',
    expectedRisk: 'medium',
    description: '평소보다 큰 금액',
    message: `정다은씨
하나증권 40093804300
150만원 보내주세요
다음주에 갚을게요`,
  },

  // 위험한 메시지 (High Risk)
  {
    id: 'dangerous-1',
    category: 'dangerous',
    title: '피싱 - URL 포함',
    expectedRisk: 'high',
    description: 'URL + 긴급성 + 고액',
    message: `http://phishing-bank.com
계좌: 110-923-567234
200만원
지금 당장 보내주세요!
긴급합니다!!!`,
  },
  {
    id: 'dangerous-2',
    category: 'dangerous',
    title: '피싱 - 검찰 사칭',
    expectedRisk: 'high',
    description: '기관 사칭 + 협박',
    message: `[검찰청]
귀하의 계좌가 범죄에 연루되었습니다
안전계좌로 이체 필요
신한 140-789-456123
500만원
즉시 이체하지 않으면 조치하겠습니다`,
  },
  {
    id: 'dangerous-3',
    category: 'dangerous',
    title: '피싱 - 택배 사칭',
    expectedRisk: 'high',
    description: 'URL + 소액',
    message: `[CJ대한통운]
택배 수령 실패
https://cj-delivery.net/pay
수수료 결제 필요
국민 245-678-901234
3,500원`,
  },
  {
    id: 'dangerous-4',
    category: 'dangerous',
    title: '피싱 - 자녀 사칭',
    expectedRisk: 'high',
    description: '긴급 + 고액 + 감정호소',
    message: `엄마 나야
핸드폰 고장나서 친구 폰으로 연락해
급하게 돈 필요해
우리 355-123-789456
300만원
빨리 보내줘 정말 급해`,
  },
  {
    id: 'dangerous-5',
    category: 'dangerous',
    title: '피싱 - 카드사 사칭',
    expectedRisk: 'high',
    description: 'URL + 개인정보 요구',
    message: `[신한카드]
비정상 결제 감지
https://shinhan-card-verify.com
본인 확인 필요
계좌번호: 110-456-789123
인증료: 1,000원
24시간 내 미처리시 카드 정지`,
  },

  // 복잡한 케이스
  {
    id: 'complex-1',
    category: 'suspicious',
    title: '지인인데 의심스러움',
    expectedRisk: 'medium',
    description: '알려진 이름 + 고액',
    message: `김민수
기업 96904420004025
250만원
지금 급하게 필요해
바로 보내줄 수 있어?`,
  },
  {
    id: 'complex-2',
    category: 'dangerous',
    title: '복합 피싱',
    expectedRisk: 'high',
    description: 'URL + 고액 + 지인 사칭',
    message: `이지은이야
카톡 해킹당해서 링크로 보냄
http://secure-transfer.net
하나 010-28-23037-2
100만원 급해
꼭 지금 보내줘`,
  },
];

/**
 * 카테고리별 메시지 필터
 */
export function getMessagesByCategory(category: SampleMessage['category']): SampleMessage[] {
  return SAMPLE_MESSAGES.filter(msg => msg.category === category);
}

/**
 * 랜덤 메시지 가져오기
 */
export function getRandomMessage(category?: SampleMessage['category']): SampleMessage {
  const messages = category
    ? getMessagesByCategory(category)
    : SAMPLE_MESSAGES;

  return messages[Math.floor(Math.random() * messages.length)];
}
