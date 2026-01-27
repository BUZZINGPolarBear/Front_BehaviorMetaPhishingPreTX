/**
 * 메시지 자동 파싱 유틸리티
 * 붙여넣기된 메시지에서 송금 정보 자동 추출
 */

export interface ParsedTransferInfo {
  recipientName?: string;
  bank?: string;
  account?: string;
  amount?: string;
  rawAmount?: number;
  message?: string;
}

/**
 * 송금 메시지 파싱
 */
export function parseTransferMessage(text: string): ParsedTransferInfo {
  const result: ParsedTransferInfo = {};

  // 1. 금액 추출
  const amountPatterns = [
    /(\d+(?:,\d{3})*)\s*원/,           // "100,000원"
    /(\d+)\s*만\s*원?/,                 // "10만원", "10만"
    /금액[:\s]*(\d+(?:,\d{3})*)/,      // "금액: 100,000"
    /(\d+)(?=원)/,                      // 숫자 뒤에 "원"
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = match[1].replace(/,/g, '');

      // "만원" 단위 처리
      if (pattern.source.includes('만')) {
        result.rawAmount = parseInt(amount) * 10000;
      } else {
        result.rawAmount = parseInt(amount);
      }

      result.amount = result.rawAmount.toString();
      break;
    }
  }

  // 2. 계좌번호 추출
  const accountPatterns = [
    /(\d{2,4}[-\s]\d{2,6}[-\s]\d{2,8})/,  // "110-123-456789"
    /계좌[:\s]*(\d{2,}[-\s]?\d+[-\s]?\d+)/, // "계좌: 110-123-456"
    /(\d{10,14})/,                          // "1101234567" (연속 숫자)
  ];

  for (const pattern of accountPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.account = match[1];
      break;
    }
  }

  // 3. 은행명 추출
  const banks = [
    '국민', 'KB국민', '신한', '우리', '하나', '기업', 'IBK기업',
    '농협', 'NH농협', '카카오뱅크', '토스뱅크', '케이뱅크',
    '부산', '경남', '광주', '전북', '제주',
    '대구', '수협', '우체국', 'SC제일', '씨티',
  ];

  for (const bank of banks) {
    if (text.includes(bank)) {
      result.bank = bank;
      break;
    }
  }

  // 4. 수신인 이름 추출
  const namePatterns = [
    /([가-힣]{2,4})(?:님|씨|에게|한테)/,  // "홍길동님", "김철수에게"
    /받는\s*사람[:\s]*([가-힣]{2,4})/,    // "받는 사람: 홍길동"
    /이름[:\s]*([가-힣]{2,4})/,          // "이름: 홍길동"
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.recipientName = match[1];
      break;
    }
  }

  // 5. 메시지 내용 추출 (선택)
  const messagePatterns = [
    /메시지[:\s]*(.+)/,
    /메모[:\s]*(.+)/,
    /내용[:\s]*(.+)/,
  ];

  for (const pattern of messagePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.message = match[1].trim();
      break;
    }
  }

  return result;
}

/**
 * 카카오톡/문자 메시지 형식 감지
 */
export function detectMessageFormat(text: string): 'kakaotalk' | 'sms' | 'unknown' {
  // 카카오톡 특징
  if (text.includes('[카카오톡]') || text.includes('카카오페이')) {
    return 'kakaotalk';
  }

  // 문자 메시지 특징
  if (text.includes('[Web발신]') || text.match(/\d{3}-\d{4}-\d{4}/)) {
    return 'sms';
  }

  return 'unknown';
}

/**
 * 파싱 결과를 사용자에게 보여주기 좋은 형태로 변환
 */
export function formatParsedInfo(info: ParsedTransferInfo): string {
  const parts: string[] = [];

  if (info.recipientName) {
    parts.push(`받는 사람: ${info.recipientName}`);
  }

  if (info.bank && info.account) {
    parts.push(`계좌: ${info.bank} ${info.account}`);
  } else if (info.account) {
    parts.push(`계좌: ${info.account}`);
  }

  if (info.amount && info.rawAmount) {
    const formatted = info.rawAmount.toLocaleString('ko-KR');
    parts.push(`금액: ${formatted}원`);
  }

  if (info.message) {
    parts.push(`메시지: ${info.message}`);
  }

  return parts.join('\n');
}

/**
 * 파싱 결과가 유효한지 확인
 */
export function isValidParsedInfo(info: ParsedTransferInfo): boolean {
  // 최소한 계좌번호나 금액 중 하나는 있어야 함
  return !!(info.account || info.amount);
}
