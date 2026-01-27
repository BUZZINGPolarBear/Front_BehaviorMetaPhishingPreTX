# 설치 및 실행 가이드

## ✅ 문제 해결 완료

모든 설정이 완료되었습니다! 이제 바로 사용할 수 있습니다.

## 📦 이미 설치된 항목

- ✅ package.json 생성 (Vite 기반)
- ✅ tsconfig.json 생성
- ✅ vite.config.ts 생성
- ✅ 환경 변수 파일 (.env)
- ✅ 의존성 설치 완료 (node_modules)
- ✅ 메인 진입점 (src/main.tsx, src/App.tsx)

## 🚀 바로 실행하기

### 1. 개발 서버 실행

```bash
cd Front_BehaviorMetaPhishingPreTX
npm run dev
```

브라우저가 자동으로 열리고 `http://localhost:3000`에서 앱이 실행됩니다.

### 2. 화면 확인

실행하면 다음 두 화면을 확인할 수 있습니다:

- **송금 분석**: 텍스트 입력 시 행위 메타데이터를 자동 수집하고 위험도 분석
- **추가 검증**: 체크리스트와 스크린샷 업로드로 추가 검증

## 🛠️ 사용 가능한 명령어

```bash
# 개발 서버 실행 (Hot Reload)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 파일 미리보기
npm run preview

# TypeScript 타입 체크만 수행
npm run type-check
```

## 📁 프로젝트 구조

```
Front_BehaviorMetaPhishingPreTX/
├── index.html              # HTML 진입점
├── vite.config.ts          # Vite 설정
├── tsconfig.json           # TypeScript 설정
├── package.json            # 프로젝트 설정 및 의존성
├── .env                    # 환경 변수
│
├── src/
│   ├── main.tsx           # React 진입점
│   ├── App.tsx            # 메인 앱 컴포넌트
│   ├── index.css          # 전역 스타일
│   ├── vite-env.d.ts      # Vite 타입 정의
│   │
│   ├── types/
│   │   └── api.ts         # API 타입 정의
│   │
│   ├── hooks/
│   │   └── useScreenshot.ts
│   │
│   ├── services/
│   │   └── apiClient.ts
│   │
│   ├── utils/
│   │   └── behaviorTracker.ts
│   │
│   └── examples/
│       ├── AnalyzeExample.tsx
│       └── VerifyExample.tsx
│
└── node_modules/          # 설치된 의존성
```

## 🌐 환경 변수 설정

`.env` 파일에서 API URL을 변경할 수 있습니다:

```env
# 백엔드 API 서버 URL
VITE_API_URL=http://localhost:3000

# Mock 데이터 사용 여부 (개발용)
VITE_USE_MOCK=false
```

**주의**: 환경 변수를 변경하면 개발 서버를 재시작해야 합니다.

## 🧪 백엔드 없이 테스트하기

백엔드 API가 아직 없다면 Mock 데이터로 테스트할 수 있습니다:

### 방법 1: Mock API 서버 사용

```bash
# JSON Server 설치 (전역)
npm install -g json-server

# Mock 데이터 파일 생성
echo '{
  "analyze": {
    "riskScore": 75,
    "riskLevel": "medium",
    "reasons": [
      {
        "code": "PASTED_TEXT",
        "message": "텍스트가 붙여넣기되었습니다",
        "weight": 0.3
      }
    ],
    "extracted": {
      "amount": "100000",
      "accountMasked": "110-***-****89"
    },
    "recommendations": [
      "전화로 재확인하세요"
    ]
  },
  "verify": {
    "nextAction": "warn",
    "message": "일부 항목이 확인되지 않았습니다."
  }
}' > db.json

# Mock 서버 실행
json-server --watch db.json --port 3000
```

### 방법 2: 코드에서 Mock 응답 사용

`src/services/apiClient.ts`를 수정:

```typescript
// 파일 상단에 추가
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_ANALYZE: AnalyzeResponse = {
  riskScore: 75,
  riskLevel: "medium",
  reasons: [
    { code: "PASTED_TEXT", message: "텍스트가 붙여넣기됨", weight: 0.3 }
  ],
  extracted: { amount: "100000" },
  recommendations: ["전화로 재확인하세요"]
};

export async function analyzeText(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 딜레이
    return MOCK_ANALYZE;
  }
  return fetchApi<AnalyzeResponse>("/api/analyze", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

그리고 `.env` 파일에서:
```env
VITE_USE_MOCK=true
```

## 🔍 타입 체크

TypeScript 오류를 확인하려면:

```bash
npm run type-check
```

## 🐛 문제 해결

### Q: "Cannot find module" 에러

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### Q: "Port 3000 is already in use"

```bash
# 다른 포트 사용
npm run dev -- --port 3001
```

또는 `vite.config.ts`에서 포트 변경:
```typescript
server: {
  port: 3001,
}
```

### Q: 환경 변수가 적용 안 됨

- 개발 서버 재시작 필요 (Ctrl+C 후 `npm run dev`)
- 환경 변수 이름이 `VITE_`로 시작하는지 확인
- `.env` 파일이 프로젝트 루트에 있는지 확인

### Q: TypeScript 에러

```bash
# TypeScript 설정 확인
cat tsconfig.json

# 특정 파일의 타입 에러만 무시하려면 (비권장)
// @ts-ignore
```

## 📚 다음 단계

1. **백엔드 API 연동**
   - POST /api/analyze 구현
   - POST /api/verify 구현

2. **커스터마이징**
   - `src/examples/` 컴포넌트 수정
   - 디자인 가이드에 맞춰 스타일 조정

3. **배포 준비**
   - `npm run build` 실행
   - `dist/` 폴더를 웹 서버에 배포

## 💡 유용한 팁

### 자동 새로고침

Vite는 파일 변경 시 자동으로 새로고침됩니다 (Hot Module Replacement).

### VS Code 확장 프로그램 추천

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

### Chrome DevTools

- React Developer Tools 확장 설치
- F12 누르고 "Components" 탭에서 React 상태 확인

---

**모든 준비가 완료되었습니다! 🎉**

이제 `npm run dev`만 실행하면 바로 개발을 시작할 수 있습니다.
