# 프론트엔드 TypeScript 구조

행위 메타데이터 기반 피싱 선제 탐지 시스템의 프론트엔드 타입 정의 및 유틸리티입니다.

## 📁 파일 구조

```
src/
├── types/
│   └── api.ts                  # API 요청/응답 타입 정의
├── hooks/
│   └── useScreenshot.ts        # 스크린샷 처리 Hook
├── services/
│   └── apiClient.ts            # API 통신 클라이언트
└── utils/
    └── behaviorTracker.ts      # 행위 메타데이터 수집
```

## 🔌 API 엔드포인트

### 1. POST /api/analyze

송금 텍스트를 분석하고 위험도를 평가합니다.

**요청 타입**: `AnalyzeRequest`
- `text`: 분석할 텍스트
- `signals`: 입력 행위 시그널
- `client`: 클라이언트 정보

**응답 타입**: `AnalyzeResponse`
- `riskScore`: 위험 점수 (0-100)
- `riskLevel`: 위험 수준 ("low" | "medium" | "high")
- `reasons`: 위험 판단 근거
- `extracted`: 추출된 정보 (금액, 계좌, URL 등)
- `recommendations`: 권고사항

### 2. POST /api/verify

고위험 시 추가 검증을 수행합니다.

**요청 타입**: `VerifyRequest`
- `checklist`: 사용자 체크리스트 응답
- `hasScreenshot`: 스크린샷 첨부 여부

**응답 타입**: `VerifyResponse`
- `nextAction`: 다음 행동 ("block" | "warn" | "allow")
- `message`: 사용자 메시지

## 🚀 사용 예시

### 1. 행위 메타데이터 수집

```tsx
import { useRef } from "react";
import { useBehaviorTracker } from "./utils/behaviorTracker";

function TransferInput() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { getSignals, reset } = useBehaviorTracker(inputRef);

  const handleAnalyze = async () => {
    const signals = getSignals();
    if (!signals) return;

    // API 호출
    const result = await analyzeText({
      text: inputRef.current?.value || "",
      signals,
      client: {
        userAgent: navigator.userAgent,
        locale: navigator.language,
      },
    });

    console.log(result.riskLevel); // "low", "medium", "high"
  };

  return (
    <>
      <textarea ref={inputRef} placeholder="송금 정보를 입력하세요" />
      <button onClick={handleAnalyze}>분석</button>
    </>
  );
}
```

### 2. API 호출

```tsx
import { analyzeText, verifyTransaction } from "./services/apiClient";

// 텍스트 분석
const analyzeResult = await analyzeText({
  text: "계좌번호 110-123-456789로 100만원 보내주세요",
  signals: {
    wasPasted: true,
    typingSpeedCps: 0,
    backspaceCount: 0,
    focusBlurCount: 2,
    fieldHops: 1,
    durationMs: 1500,
  },
  client: {
    userAgent: navigator.userAgent,
    locale: "ko-KR",
  },
});

console.log(analyzeResult.riskScore); // 85
console.log(analyzeResult.riskLevel); // "high"

// 고위험 시 추가 검증
if (analyzeResult.riskLevel === "high") {
  const verifyResult = await verifyTransaction({
    checklist: {
      knowSender: true,
      verifiedViaPhone: false,
      accountMatches: false,
      amountIsNormal: true,
    },
    hasScreenshot: true,
  });

  console.log(verifyResult.nextAction); // "warn"
}
```

### 3. 스크린샷 처리

```tsx
import { useScreenshot } from "./hooks/useScreenshot";

function ScreenshotUpload() {
  const { screenshot, handleFileSelect, clearScreenshot } = useScreenshot();

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
      />

      {screenshot.error && <p style={{ color: "red" }}>{screenshot.error}</p>}

      {screenshot.previewUrl && (
        <div>
          <img
            src={screenshot.previewUrl}
            alt="스크린샷 미리보기"
            style={{ maxWidth: "100%", maxHeight: "300px" }}
          />
          <button onClick={clearScreenshot}>제거</button>
        </div>
      )}
    </div>
  );
}
```

## 📝 MVP vs 향후 확장

### MVP (현재)
- ✅ API 타입 정의 완료
- ✅ 행위 메타데이터 수집 (로컬)
- ✅ 스크린샷 로컬 미리보기
- ✅ API 통신 클라이언트

### 향후 확장
- ⏳ 스크린샷 백엔드 업로드
- ⏳ 실시간 위험도 모니터링
- ⏳ 오프라인 모드 지원
- ⏳ 분석 결과 히스토리

## 🔧 환경 변수

`.env` 파일에 다음 변수를 설정하세요:

```env
REACT_APP_API_URL=http://localhost:3000
```

## 🛡️ 보안 고려사항

1. **민감 정보 처리**
   - 계좌번호는 마스킹 처리 (`accountMasked`)
   - 금액은 추출 후 서버에서만 저장

2. **HTTPS 필수**
   - 프로덕션 환경에서는 반드시 HTTPS 사용

3. **입력 검증**
   - 클라이언트와 서버 양쪽에서 검증 수행

4. **스크린샷 보안**
   - MVP에서는 로컬 처리만
   - 향후 업로드 시 암호화 필수

## 📚 타입 참조

모든 타입은 `src/types/api.ts`에 정의되어 있습니다:

- `AnalyzeRequest` / `AnalyzeResponse`
- `VerifyRequest` / `VerifyResponse`
- `InputSignals` - 행위 시그널
- `RiskLevel` - 위험 수준
- `NextAction` - 다음 행동
- `ApiError` - 에러 응답

## 🎨 디자인 가이드

UI/UX 디자인은 `DesignGuide.md`를 참고하세요.

## 🤝 기여

프로젝트 개선을 위한 제안이나 버그 리포트는 언제나 환영합니다.
