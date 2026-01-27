# 🎨 디자인 가이드라인 (필독)

> **중요**: 이 문서는 프로젝트의 모든 UI/UX 작업 시 필수로 참고해야 합니다.
> 세션이 바뀌어도 반드시 이 가이드라인을 따라야 합니다.

## 📍 디자인 원칙

이 프로젝트는 **"Calm Security (침착한 보안)"** 철학을 따릅니다.

### 핵심 원칙

1. **즉시 이해 (Instant Clarity)**
   - 3초 안에 상황 파악 가능
   - 색상과 아이콘만으로 위험도 직관적 전달
   - 텍스트 없이도 의미 명확

2. **침착함, 불안 유발 금지 (Calm, Not Alarming)**
   - ❌ 금지: "지금 당장!", "즉시!", "심각한 위험!"
   - ✅ 권장: 객관적이고 담담한 표현
   - 과도한 경고음, 팝업 지양

3. **실행 가능한 정보 (Actionable Information)**
   - "위험합니다" ❌ → "전화로 확인하세요" ✅
   - 명확한 다음 행동 제시

4. **점진적 정보 제공 (Progressive Disclosure)**
   - 처음엔 핵심 정보만
   - 원하면 상세 정보 확인 가능

5. **일관성 (Consistency)**
   - 같은 상황에서 항상 같은 시각적 표현
   - 사용자가 패턴을 학습하고 신뢰

## 🎨 디자인 시스템

### 색상 사용

```css
/* 위험도 표시 */
--success: #10b981;  /* 낮음 (Low) */
--warning: #f59e0b;  /* 중간 (Medium) */
--error: #ef4444;    /* 높음 (High) */

/* 브랜드 */
--primary-indigo: #6366f1;
--primary-purple: #8b5cf6;

/* 그레이스케일 */
--gray-900: #111827;  /* 메인 텍스트 */
--gray-700: #374151;  /* 서브 텍스트 */
--gray-500: #6b7280;  /* 보조 텍스트 */
--gray-100: #f3f4f6;  /* 배경 */
```

### 타이포그래피

```css
/* 본문은 최소 16px */
--text-base: 16px;

/* 중요 정보는 크게 */
--text-2xl: 24px;  /* 헤딩 */
--text-3xl: 30px;  /* 금액, 숫자 */
```

### 간격 (8px Grid)

모든 간격은 8의 배수를 사용합니다:
- 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### 터치 영역

- 최소 **48x48px** (모바일 최적화)
- 터치 요소 간 최소 **8px** 간격

## 📋 컴포넌트 체크리스트

새로운 컴포넌트를 만들 때 다음을 확인하세요:

- [ ] 48px 이상의 터치 영역
- [ ] 16px 이상의 폰트 크기 (본문)
- [ ] 8px 그리드 시스템 준수
- [ ] border-radius: 12px 또는 16px
- [ ] 호버/포커스 상태 정의
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 디자인 변수 사용 (하드코딩 금지)

## 🚫 금지 사항

### 표현

- ❌ "지금 당장!", "즉시!", "심각한 위험!"
- ❌ 과도한 느낌표 (!!!)
- ❌ 경고음, 진동
- ❌ 갑작스러운 팝업

### 스타일

- ❌ 인라인 스타일에 하드코딩된 색상
  ```tsx
  // 나쁜 예
  <div style={{ color: '#ff0000' }}>위험</div>

  // 좋은 예
  <div style={{ color: 'var(--error)' }}>위험</div>
  ```

- ❌ 디자인 변수 없이 직접 값 사용
  ```css
  /* 나쁜 예 */
  padding: 15px;

  /* 좋은 예 */
  padding: var(--space-4);
  ```

## ✅ 권장 사항

### 위험도 표시

```tsx
// Low
<div style={{ color: 'var(--success)' }}>✓ 안전</div>

// Medium
<div style={{ color: 'var(--warning)' }}>⚠ 주의</div>

// High
<div style={{ color: 'var(--error)' }}>● 위험</div>
```

### 버튼

```tsx
// Primary 버튼
<button className="btn-primary">분석하기</button>

// Secondary 버튼
<button className="btn-secondary">취소</button>
```

### 카드

```tsx
// 기본 카드
<div className="card-base">...</div>

// 그라데이션 카드
<div className="card-gradient">...</div>
```

### 입력 필드

```tsx
<div>
  <label className="input-label">송금 메시지</label>
  <textarea className="input-field" />
</div>
```

## 📖 참고 문서

전체 디자인 가이드는 다음 파일을 참고하세요:
- `/Design/DesignGuide.md` - 전체 디자인 시스템
- `/src/styles/design-system.css` - CSS 변수 정의

## 🔄 세션 간 유지 사항

**이 문서의 원칙은 세션이 바뀌어도 반드시 준수해야 합니다:**

1. 모든 색상은 CSS 변수 사용
2. 8px 그리드 시스템
3. 최소 48px 터치 영역
4. Calm Security 원칙
5. 불안 유발 표현 금지

## 📝 업데이트 이력

- 2026-01-27: 초기 가이드라인 작성
- 로컬 분석 모드로 전환 (백엔드 불필요)
- Design/DesignGuide.md 기반 CSS 변수 시스템 구축
