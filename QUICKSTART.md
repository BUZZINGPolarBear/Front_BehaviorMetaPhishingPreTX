# 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1. 파일 복사 (프로젝트가 없는 경우)

```bash
# 템플릿 파일들을 실제 파일로 복사
cp package.json.template package.json
cp tsconfig.json.template tsconfig.json
```

### 2. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```env
REACT_APP_API_URL=http://localhost:3000
```

### 4. 개발 서버 실행

```bash
npm start
# 또는
yarn start
```

브라우저에서 `http://localhost:3000` 접속

---

## 📝 기본 사용법

### A. 송금 텍스트 분석

```tsx
import React, { useRef } from "react";
import { useBehaviorTracker } from "./utils/behaviorTracker";
import { analyzeText } from "./services/apiClient";

function MyAnalyzer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { getSignals } = useBehaviorTracker(inputRef);

  const handleSubmit = async () => {
    const text = inputRef.current?.value || "";
    const signals = getSignals();

    if (!signals) return;

    try {
      const result = await analyzeText({
        text,
        signals,
        client: {
          userAgent: navigator.userAgent,
          locale: navigator.language,
        },
      });

      console.log("위험도:", result.riskLevel);
      console.log("점수:", result.riskScore);
      console.log("권고사항:", result.recommendations);
    } catch (error) {
      console.error("분석 실패:", error);
    }
  };

  return (
    <div>
      <textarea ref={inputRef} placeholder="송금 정보 입력" />
      <button onClick={handleSubmit}>분석</button>
    </div>
  );
}
```

### B. 추가 검증

```tsx
import React, { useState } from "react";
import { useScreenshot } from "./hooks/useScreenshot";
import { verifyTransaction } from "./services/apiClient";

function MyVerifier() {
  const { screenshot, handleFileSelect } = useScreenshot();
  const [checklist, setChecklist] = useState({
    knowSender: false,
    verifiedViaPhone: false,
  });

  const handleSubmit = async () => {
    try {
      const result = await verifyTransaction({
        checklist,
        hasScreenshot: !!screenshot.file,
      });

      console.log("다음 행동:", result.nextAction);
      console.log("메시지:", result.message);
    } catch (error) {
      console.error("검증 실패:", error);
    }
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={checklist.knowSender}
          onChange={(e) =>
            setChecklist({ ...checklist, knowSender: e.target.checked })
          }
        />
        송금 요청자를 알고 있나요?
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
      />

      {screenshot.previewUrl && (
        <img src={screenshot.previewUrl} alt="미리보기" />
      )}

      <button onClick={handleSubmit}>검증</button>
    </div>
  );
}
```

---

## 🎨 예시 컴포넌트 사용

이미 만들어진 완전한 예시 컴포넌트를 바로 사용할 수 있습니다:

### 방법 1: 직접 임포트

```tsx
// App.tsx
import { AnalyzeExample } from "./examples/AnalyzeExample";
import { VerifyExample } from "./examples/VerifyExample";

function App() {
  const [step, setStep] = useState<"analyze" | "verify">("analyze");

  return (
    <div>
      {step === "analyze" ? (
        <AnalyzeExample onHighRisk={() => setStep("verify")} />
      ) : (
        <VerifyExample />
      )}
    </div>
  );
}
```

### 방법 2: 라우팅 설정

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalyzeExample } from "./examples/AnalyzeExample";
import { VerifyExample } from "./examples/VerifyExample";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnalyzeExample />} />
        <Route path="/verify" element={<VerifyExample />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔧 타입 활용

### 타입 임포트

```typescript
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  VerifyRequest,
  VerifyResponse,
  RiskLevel,
  NextAction,
  InputSignals,
} from "./types/api";
```

### 타입 사용 예시

```typescript
// 상태 관리
const [result, setResult] = useState<AnalyzeResponse | null>(null);

// 함수 타입 지정
async function handleAnalyze(): Promise<void> {
  const request: AnalyzeRequest = {
    text: "...",
    signals: { /* ... */ },
    client: { /* ... */ },
  };

  const response: AnalyzeResponse = await analyzeText(request);
  setResult(response);
}

// 조건부 렌더링
if (result?.riskLevel === "high") {
  // 고위험 UI
}
```

---

## 📊 행위 메타데이터 수집

### 자동 수집 (권장)

```tsx
import { useBehaviorTracker } from "./utils/behaviorTracker";

function MyInput() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { getSignals, reset } = useBehaviorTracker(inputRef);

  // 제출 시
  const handleSubmit = () => {
    const signals = getSignals();
    console.log(signals);
    // {
    //   wasPasted: true,
    //   typingSpeedCps: 5.2,
    //   backspaceCount: 3,
    //   focusBlurCount: 2,
    //   fieldHops: 1,
    //   durationMs: 15000
    // }
  };

  // 초기화 시
  const handleReset = () => {
    reset();
  };

  return <textarea ref={inputRef} />;
}
```

### 수동 수집

```tsx
import { BehaviorTracker } from "./utils/behaviorTracker";

// 클래스 직접 사용
const tracker = new BehaviorTracker({
  inputElement: document.getElementById("myInput"),
  onUpdate: (signals) => console.log(signals),
});

// 나중에
const signals = tracker.getSignals();
tracker.reset();
tracker.destroy(); // 정리
```

---

## 🖼️ 스크린샷 처리

### 기본 사용

```tsx
import { useScreenshot } from "./hooks/useScreenshot";

function MyUploader() {
  const { screenshot, handleFileSelect, clearScreenshot, validateFile } =
    useScreenshot();

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            // 선택 사항: 수동 검증
            const error = validateFile(file);
            if (error) {
              alert(error);
              return;
            }
            handleFileSelect(file);
          }
        }}
      />

      {screenshot.error && <p style={{ color: "red" }}>{screenshot.error}</p>}

      {screenshot.isLoading && <p>로딩 중...</p>}

      {screenshot.previewUrl && (
        <div>
          <img
            src={screenshot.previewUrl}
            alt="미리보기"
            style={{ maxWidth: "300px" }}
          />
          <button onClick={clearScreenshot}>제거</button>
        </div>
      )}
    </div>
  );
}
```

---

## 🌐 API 호출

### 분석 API

```typescript
import { analyzeText } from "./services/apiClient";

const result = await analyzeText({
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

// 결과 활용
if (result.riskLevel === "high") {
  alert("고위험 거래입니다!");
}
```

### 검증 API

```typescript
import { verifyTransaction } from "./services/apiClient";

const result = await verifyTransaction({
  checklist: {
    knowSender: true,
    verifiedViaPhone: false,
    accountMatches: false,
    amountIsNormal: true,
  },
  hasScreenshot: true,
});

// 결과에 따른 처리
switch (result.nextAction) {
  case "allow":
    console.log("✅ 송금 허용");
    break;
  case "warn":
    console.log("⚠️ 주의 필요");
    break;
  case "block":
    console.log("🚫 송금 차단 권고");
    break;
}
```

### 에러 처리

```typescript
import { ApiException } from "./services/apiClient";

try {
  const result = await analyzeText(request);
} catch (error) {
  if (error instanceof ApiException) {
    console.error("API 에러:", error.message);
    console.error("상태 코드:", error.status);
    console.error("에러 코드:", error.code);
  } else {
    console.error("알 수 없는 에러:", error);
  }
}
```

---

## 🎯 체크리스트

프로젝트를 시작하기 전에 확인하세요:

- [ ] `package.json` 생성 완료
- [ ] `tsconfig.json` 생성 완료
- [ ] `.env` 파일 생성 및 API URL 설정
- [ ] 의존성 설치 완료 (`npm install`)
- [ ] 백엔드 API 서버 실행 중 (또는 Mock 서버)
- [ ] 타입 정의 파일 확인 (`src/types/api.ts`)
- [ ] 예시 컴포넌트 실행 테스트

---

## 🐛 문제 해결

### Q: "Cannot find module" 에러
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### Q: API 호출이 실패함
```typescript
// .env 파일에 올바른 URL 설정했는지 확인
REACT_APP_API_URL=http://localhost:3000

// CORS 에러인 경우 백엔드 설정 확인
// Access-Control-Allow-Origin 헤더 필요
```

### Q: TypeScript 컴파일 에러
```bash
# tsconfig.json 확인
# "strict": true 옵션이 문제라면 일시적으로 false로 변경 가능
```

### Q: React Hook 에러
```typescript
// Hook은 함수 컴포넌트 최상위에서만 호출 가능
function MyComponent() {
  const { getSignals } = useBehaviorTracker(ref); // ✅

  if (condition) {
    const { getSignals } = useBehaviorTracker(ref); // ❌
  }
}
```

---

## 📚 다음 단계

1. **예시 컴포넌트 실행**
   - `src/examples/AnalyzeExample.tsx` 실행
   - `src/examples/VerifyExample.tsx` 실행

2. **커스터마이징**
   - 디자인 가이드에 맞춰 스타일 수정
   - 필요한 필드 추가/제거

3. **백엔드 연동**
   - API 엔드포인트 구현
   - 실제 데이터로 테스트

4. **배포**
   - 프로덕션 빌드: `npm run build`
   - 환경 변수 설정 (프로덕션 API URL)

---

## 💡 유용한 팁

### 1. 개발 시 Mock 데이터 사용

```typescript
// src/services/apiClient.ts 수정
const USE_MOCK = process.env.REACT_APP_USE_MOCK === "true";

export async function analyzeText(request: AnalyzeRequest) {
  if (USE_MOCK) {
    // Mock 응답 반환
    return {
      riskScore: 75,
      riskLevel: "medium",
      reasons: [],
      extracted: {},
      recommendations: [],
    };
  }
  // 실제 API 호출
  return fetchApi("/api/analyze", { ... });
}
```

### 2. 디버깅 모드

```typescript
// 행위 데이터 실시간 확인
const { getSignals } = useBehaviorTracker(inputRef);

useEffect(() => {
  const interval = setInterval(() => {
    console.log("현재 행위 데이터:", getSignals());
  }, 1000);
  return () => clearInterval(interval);
}, [getSignals]);
```

### 3. 로딩 상태 개선

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAnalyze = async () => {
  setIsLoading(true);
  try {
    await analyzeText(request);
  } finally {
    setIsLoading(false); // 에러가 나도 로딩 종료
  }
};
```

---

## 📖 추가 문서

- [상세 가이드](src/README.md)
- [아키텍처 문서](ARCHITECTURE.md)
- [구현 완료 요약](구현_완료_요약.md)
- [디자인 가이드](DesignGuide.md)

---

**즐거운 개발 되세요! 🚀**
