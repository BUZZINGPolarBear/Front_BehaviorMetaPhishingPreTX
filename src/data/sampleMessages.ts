/**
 * 테스트용 샘플 메시지
 * Backend cases.json 기반 실제 보이스피싱 사례 반영
 */

export interface SampleMessage {
  id: string;
  category: 'safe' | 'suspicious' | 'dangerous';
  title: string;
  message: string;
  expectedRisk: 'low' | 'medium' | 'high';
  description: string;
  /** 매칭되는 사기 유형 (P01~P10) */
  scamType?: string;
}

export const SAMPLE_MESSAGES: SampleMessage[] = [
  // ============================================
  // 안전한 메시지 (Low Risk)
  // ============================================
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
이번 달 동창회 회비입니다`,
  },
  {
    id: 'safe-3',
    category: 'safe',
    title: '가족 용돈',
    expectedRisk: 'low',
    description: '부모님 용돈 드리기',
    message: `엄마한테
농협 40093804300
20만원 보내드려요
다음주에 뵐게요`,
  },

  // ============================================
  // 의심스러운 메시지 (Medium Risk)
  // ============================================
  {
    id: 'suspicious-1',
    category: 'suspicious',
    title: '급한 송금 요청',
    expectedRisk: 'medium',
    description: '긴급성 강조 + 고액',
    message: `박서준
하나 382-910536-99907
150만원 급해요
오늘 안에 꼭 부탁드립니다
다음주에 바로 갚을게`,
  },
  {
    id: 'suspicious-2',
    category: 'suspicious',
    title: '처음 보는 계좌',
    expectedRisk: 'medium',
    description: '낯선 계좌 + 고액',
    message: `최유진
지역농협 351074982783
200만원
새 계좌번호야 확인 부탁해`,
  },
  {
    id: 'suspicious-3',
    category: 'suspicious',
    title: '메신저 대화 송금',
    expectedRisk: 'medium',
    description: '카카오톡으로 받은 송금 요청',
    scamType: 'P03',
    message: `카카오톡으로 받은 메시지:
"여보 나야, 회사에서 급하게 돈 필요해
신한 110-456-789123
100만원만 보내줘
저녁에 설명할게"`,
  },

  // ============================================
  // 위험한 메시지 - 기관사칭형 (P01)
  // ============================================
  {
    id: 'dangerous-p01-1',
    category: 'dangerous',
    title: '검찰청 사칭',
    expectedRisk: 'high',
    description: 'P01: 검찰 사칭 + 대포통장 언급',
    scamType: 'P01',
    message: `[서울중앙지검 수사관]
귀하 명의의 대포통장이 개설되어 범죄에 연루되었습니다.
금융감독원 안전계좌로 자산 보호 조치가 필요합니다.
신한은행 140-789-456123
3000만원을 즉시 이체해주세요.
이 사실은 수사 보안을 위해 가족에게도 말씀하시면 안됩니다.`,
  },
  {
    id: 'dangerous-p01-2',
    category: 'dangerous',
    title: '금감원 사칭',
    expectedRisk: 'high',
    description: 'P01: 금융감독원 사칭 + 악성앱',
    scamType: 'P01',
    message: `[금융감독원 긴급연락]
고객님 명의로 카드가 불법 발급되었습니다.
피해 방지를 위해 아래 앱을 설치해주세요.
http://fss-protect.com/app
설치 후 안내에 따라 자산을 안전계좌로 이체하세요.
국민 245-678-901234
즉시 조치하지 않으면 법적 책임이 발생합니다.`,
  },

  // ============================================
  // 위험한 메시지 - 대출빙자형 (P02)
  // ============================================
  {
    id: 'dangerous-p02-1',
    category: 'dangerous',
    title: '저금리 대출 빙자',
    expectedRisk: 'high',
    description: 'P02: 서민금융 사칭 + 선수수료',
    scamType: 'P02',
    message: `[서민금융진흥원 대출상담]
정부지원 저금리 대출 승인되었습니다.
대출금: 5000만원 / 금리: 연 2.9%
기존 대출 정리 후 신규대출 실행됩니다.
정리비용 700만원을 아래 계좌로 송금해주세요.
우리 1002-567-891234
입금 확인 후 1시간 내 대출금 지급됩니다.`,
  },
  {
    id: 'dangerous-p02-2',
    category: 'dangerous',
    title: '대환대출 사기',
    expectedRisk: 'high',
    description: 'P02: 대환대출 + 보증금 요구',
    scamType: 'P02',
    message: `[KB저축은행 대출팀]
고금리 대출을 저금리로 대환해드립니다.
보증금 500만원 입금시 5천만원 대출 가능
가상계좌: 케이뱅크 123-456-789012
입금 후 카카오톡으로 연락주세요.
오늘 중 입금해야 금리 혜택 적용됩니다.`,
  },

  // ============================================
  // 위험한 메시지 - 로맨스스캠형 (P03)
  // ============================================
  {
    id: 'dangerous-p03-1',
    category: 'dangerous',
    title: '온라인 연인 송금',
    expectedRisk: 'high',
    description: 'P03: 로맨스스캠 + 해외송금',
    scamType: 'P03',
    message: `[LINE 메시지]
My love, I'm stuck at the airport.
My card is blocked and I need money for hotel.
Please send $2,000 to this account urgently.
Western Union: 456-789-0123
I will pay you back when I arrive next week.
I love you so much, please help me.`,
  },
  {
    id: 'dangerous-p03-2',
    category: 'dangerous',
    title: '틱톡 만남 사기',
    expectedRisk: 'high',
    description: 'P03: SNS 로맨스 + AI사진',
    scamType: 'P03',
    message: `[텔레그램 메시지]
자기야 나 미국에서 10만달러 보내줄게
근데 세금 내야해서 선송금 필요해
신한 110-456-789123
100만원만 보내줘
내일 바로 송금할게 사랑해`,
  },

  // ============================================
  // 위험한 메시지 - 투자사기형 (P04)
  // ============================================
  {
    id: 'dangerous-p04-1',
    category: 'dangerous',
    title: '고수익 투자 유혹',
    expectedRisk: 'high',
    description: 'P04: 투자사기 + 고수익 약속',
    scamType: 'P04',
    message: `[카카오톡 투자 그룹]
코인 투자로 2배 수익 보장!
지금 가입하면 원금 2배 수익 확정
가입비 2000만원 입금 계좌:
농협 301-1234-5678-91
오늘까지만 모집합니다.
벌써 50명 이상 수익 실현했어요!`,
  },

  // ============================================
  // 위험한 메시지 - 취업빙자형 (P05)
  // ============================================
  {
    id: 'dangerous-p05-1',
    category: 'dangerous',
    title: '취업 테스트 빙자',
    expectedRisk: 'high',
    description: 'P05: 취업사기 + 현금화 요구',
    scamType: 'P05',
    message: `[수협 채용담당자]
최종 면접 합격을 축하드립니다.
입사 전 업무적합성 테스트가 있습니다.
본인 명의로 약관대출 2000만원을 받아
자기앞수표로 발행 후 본사로 제출해주세요.
테스트 후 전액 반환됩니다.
하나 382-910536-99907`,
  },

  // ============================================
  // 위험한 메시지 - 가족사칭형 (P06)
  // ============================================
  {
    id: 'dangerous-p06-1',
    category: 'dangerous',
    title: '자녀 사칭',
    expectedRisk: 'high',
    description: 'P06: 자녀 사칭 + 긴급 송금',
    scamType: 'P06',
    message: `엄마 나야 준호
핸드폰 액정 깨져서 친구 폰으로 연락해
학교에서 급하게 등록금 내야하는데
300만원만 빨리 보내줘
우리 355-123-789456
지금 당장 보내야해 제발`,
  },

  // ============================================
  // 위험한 메시지 - 해외송금형 (P08)
  // ============================================
  {
    id: 'dangerous-p08-1',
    category: 'dangerous',
    title: 'UN 의료봉사 빙자',
    expectedRisk: 'high',
    description: 'P08: 해외봉사 빙자 + 로맨스',
    scamType: 'P08',
    message: `[이메일 번역]
저는 우크라이나에서 UN 의료봉사 중입니다.
귀국 비용이 필요한데 계좌가 막혔어요.
600만원을 Western Union으로 보내주세요.
돌아가면 바로 결혼하고 싶어요.
수신인: John Smith
우크라이나 키예프`,
  },

  // ============================================
  // 위험한 메시지 - 금구입형 (P09)
  // ============================================
  {
    id: 'dangerous-p09-1',
    category: 'dangerous',
    title: '골드바 구입 명목',
    expectedRisk: 'high',
    description: 'P09: 금 구입 + 고액 현금출금',
    scamType: 'P09',
    message: `[전화 내용 메모]
검찰에서 연락왔음
내 계좌가 범죄에 연루되어 동결 예정
자산 보호를 위해 골드바로 교환 필요
5000만원 현금 출금해서
강남 금거래소에서 골드바 구입하라고 함
보험 해약해서 현금화 해야함`,
  },

  // ============================================
  // 위험한 메시지 - 선수수료형 (P10)
  // ============================================
  {
    id: 'dangerous-p10-1',
    category: 'dangerous',
    title: '대출 수수료 선입금',
    expectedRisk: 'high',
    description: 'P10: 선수수료 요구',
    scamType: 'P10',
    message: `[대출상담사]
5천만원 대출 승인 완료!
실행을 위해 수수료 500만원 선입금 필요
입금 확인 즉시 대출금 지급됩니다.
신한 140-789-456123
오늘 입금하시면 내일 대출금 입금됩니다.
기회를 놓치지 마세요!`,
  },
];

/**
 * 카테고리별 메시지 필터
 */
export function getMessagesByCategory(category: SampleMessage['category']): SampleMessage[] {
  return SAMPLE_MESSAGES.filter(msg => msg.category === category);
}

/**
 * 사기유형별 메시지 필터
 */
export function getMessagesByScamType(scamType: string): SampleMessage[] {
  return SAMPLE_MESSAGES.filter(msg => msg.scamType === scamType);
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
