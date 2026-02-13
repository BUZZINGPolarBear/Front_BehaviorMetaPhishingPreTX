# 행위 메타데이터 기반 피싱 선제 탐지 시스템

## 🚀 빠른 시작

```bash
# 1. 의존성 설치 (이미 완료됨)
npm install

# 2. 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 자동 실행
```

## 📌 프로젝트 특징

### ✅ 완전한 로컬 처리
- **백엔드 불필요**: 모든 위험도 분석을 프론트엔드에서 수행
- **즉시 사용 가능**: API 서버 없이 바로 실행
- **향후 확장**: Claude API 연동 준비 완료 (CORS 방지)

### 🎨 디자인 시스템
- **Calm Security 철학**: 불안 유발하지 않는 보안 UX
- **모바일 최적화**: 48px 터치 영역, 8px 그리드
- **일관된 디자인**: CSS 변수 기반 디자인 시스템

### 🔍 위험도 분석 엔진
프론트엔드에서 다음을 분석합니다:
- ✅ 붙여넣기 감지 (30점)
- ✅ 타이핑 속도 분석 (20점)
- ✅ URL 감지 (25점)
- ✅ 고액 거래 감지 (20점)
- ✅ 행위 패턴 분석 (15점)

## 📁 핵심 파일

```
├── src/
│   ├── utils/
│   │   ├── riskAnalyzer.ts      # 🔥 로컬 위험도 분석 엔진
│   │   └── behaviorTracker.ts   # 행위 메타데이터 수집
│   ├── services/
│   │   └── apiClient.ts         # 로컬 분석 래퍼
│   ├── styles/
│   │   └── design-system.css    # 디자인 변수
│   └── examples/
│       ├── AnalyzeExample.tsx   # 송금 분석 화면
│       └── VerifyExample.tsx    # 추가 검증 화면
│
├── DESIGN_GUIDELINES.md         # ⭐ 필수 읽기
└── Design/
    └── DesignGuide.md           # 상세 디자인 가이드
```

## 🎯 주요 기능

### 1. 송금 분석
- 사용자가 입력하는 순간 행위 메타데이터 자동 수집
- 실시간 위험도 계산 (0~100점)
- 위험 수준: Low / Medium / High
- 구체적인 권고사항 제공

### 2. 추가 검증
- 체크리스트 기반 검증
- 스크린샷 로컬 미리보기
- 최종 판단: Allow / Warn / Block

## 📖 문서

- **DESIGN_GUIDELINES.md** - 디자인 원칙 (세션 간 유지)
- **INSTALL.md** - 설치 및 실행 가이드
- **QUICKSTART.md** - 5분 안에 시작하기
- **ARCHITECTURE.md** - 시스템 아키텍처
- **Design/DesignGuide.md** - 상세 디자인 가이드

## 🛡️ 보안 원칙

이 프로젝트는 **"Calm Security"** 철학을 따릅니다:

- ❌ "지금 당장!", "심각한 위험!" 같은 불안 유발 표현 금지
- ✅ 객관적이고 담담한 정보 전달
- ✅ 실행 가능한 권고사항 제공
- ✅ 3초 안에 상황 파악 가능한 UI

## 🎨 디자인 시스템

모든 컴포넌트는 다음을 준수합니다:

- **색상**: CSS 변수 사용 (하드코딩 금지)
- **간격**: 8px 그리드 시스템
- **터치**: 최소 48x48px
- **폰트**: 본문 최소 16px
- **둥근 모서리**: 12px 또는 16px

## 🔧 개발 가이드

### 새 컴포넌트 작성 시

1. `DESIGN_GUIDELINES.md` 읽기
2. CSS 변수 사용
3. 디자인 체크리스트 확인
4. 48px 터치 영역 확보

### 위험도 분석 로직 수정

`src/utils/riskAnalyzer.ts` 파일 수정:

```typescript
export function calculateRiskScore(request: AnalyzeRequest): number {
  // 위험도 계산 로직
}
```

## 🚀 배포

```bash
# 프로덕션 빌드
npm run build

# dist/ 폴더를 웹 서버에 배포
```

정적 파일만 있으면 되므로 Vercel, Netlify, GitHub Pages 등 어디서나 배포 가능합니다.

## 📊 향후 계획

- [ ] Claude API 연동 (LLM 기반 고급 분석)
- [ ] 분석 결과 히스토리
- [ ] 다크모드 지원
- [ ] 오프라인 모드

## 🤝 기여

프로젝트 개선 제안은 언제나 환영합니다!

---

**2026 경찰청 공모전 출품작**
