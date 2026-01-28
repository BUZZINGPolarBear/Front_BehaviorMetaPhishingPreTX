/**
 * 유사 사기 사례 데이터
 * 고위험 거래 발생 시 유사 사례를 보여주기 위한 데이터
 */

export interface FraudCase {
  id: string;
  title: string;
  description: string;
  warning: string;
  category: 'impersonation' | 'loan' | 'investment' | 'refund' | 'job' | 'other';
}

export const FRAUD_CASES: FraudCase[] = [
  // 검찰/경찰 사칭
  {
    id: 'fraud-1',
    title: '검찰 사칭 보이스피싱',
    description: '검찰을 사칭한 범죄자가 "귀하의 계좌가 범죄에 연루되었다"며 자금을 안전계좌로 이체하라고 요구했습니다.',
    warning: '검찰이나 경찰은 전화로 계좌이체를 요구하지 않습니다',
    category: 'impersonation',
  },
  {
    id: 'fraud-2',
    title: '금융감독원 사칭',
    description: '금융감독원 직원을 사칭하여 "대출 승인을 위해 보증금이 필요하다"며 송금을 요구했습니다.',
    warning: '금융기관은 대출 시 사전 보증금을 요구하지 않습니다',
    category: 'loan',
  },
  // 대출 사기
  {
    id: 'fraud-3',
    title: '저금리 대출 사기',
    description: '낮은 금리의 대출을 미끼로 "대출 실행 전 수수료"를 요구하는 사기입니다.',
    warning: '정상적인 대출은 승인 전 수수료를 요구하지 않습니다',
    category: 'loan',
  },
  {
    id: 'fraud-4',
    title: '신용점수 향상 사기',
    description: '"신용점수를 올려드립니다"라며 수수료를 요구하고 대출을 받게 한 뒤 자금을 이체하라고 합니다.',
    warning: '신용점수는 본인의 금융 이력으로만 관리됩니다',
    category: 'loan',
  },
  // 투자 사기
  {
    id: 'fraud-5',
    title: '고수익 투자 사기',
    description: '"단기간에 고수익 보장"을 약속하며 투자금을 요구하는 사기입니다.',
    warning: '원금 보장 + 고수익을 동시에 약속하는 투자는 사기입니다',
    category: 'investment',
  },
  {
    id: 'fraud-6',
    title: '코인 투자 사기',
    description: '가상화폐 투자를 빙자하여 "선입금" 또는 "추가 입금"을 계속 요구합니다.',
    warning: '출금이 불가능하거나 계속 추가 입금을 요구하면 사기입니다',
    category: 'investment',
  },
  // 환불 사기
  {
    id: 'fraud-7',
    title: '택배/쇼핑몰 환불 사기',
    description: '"잘못 배송되었으니 환불해드리겠다"며 개인정보와 계좌정보를 요구합니다.',
    warning: '정상적인 환불은 구매한 경로를 통해서만 진행됩니다',
    category: 'refund',
  },
  // 일자리 사기
  {
    id: 'fraud-8',
    title: '구직 보증금 사기',
    description: '"취업이 확정되었으니 보증금이나 교육비를 먼저 내라"고 요구합니다.',
    warning: '정상적인 회사는 입사 전 금전을 요구하지 않습니다',
    category: 'job',
  },
  // 지인 사칭
  {
    id: 'fraud-9',
    title: '메신저 해킹 사기',
    description: '지인의 메신저를 해킹하여 "급하게 돈이 필요하다"며 송금을 요구합니다.',
    warning: '메신저로 돈 요청이 오면 반드시 전화로 확인하세요',
    category: 'other',
  },
];

/**
 * 위험 요인 코드에 따라 관련된 사기 사례 필터링
 */
export function getRelatedFraudCases(reasonCodes: string[]): FraudCase[] {
  // 모든 코드가 행위 패턴과 관련된 경우
  const behaviorCodes = ['PASTED_TEXT', 'NO_TYPING', 'FAST_TYPING', 'NO_CORRECTION',
                         'FREQUENT_FOCUS_CHANGE', 'FREQUENT_HESITATION',
                         'SLOW_DELIBERATE_TYPING', 'REPEATED_CORRECTIONS'];

  const hasBehaviorPattern = reasonCodes.some(code => behaviorCodes.includes(code));

  // URL이 감지된 경우
  if (reasonCodes.includes('URL_DETECTED')) {
    return FRAUD_CASES.filter(c => ['investment', 'loan', 'refund'].includes(c.category)).slice(0, 2);
  }

  // 고액 거래인 경우
  if (reasonCodes.includes('HIGH_AMOUNT')) {
    return FRAUD_CASES.filter(c => ['impersonation', 'investment'].includes(c.category)).slice(0, 2);
  }

  // 행위 패턴이 의심스러운 경우 (전화 지시 의심)
  if (hasBehaviorPattern) {
    return [FRAUD_CASES[0], FRAUD_CASES[1]]; // 검찰/금융감독원 사칭
  }

  // 기본: 가장 흔한 사례 2개
  return FRAUD_CASES.slice(0, 2);
}
