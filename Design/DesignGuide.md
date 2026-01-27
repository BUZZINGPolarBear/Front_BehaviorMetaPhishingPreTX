# 행위 메타데이터 기반 피싱 선제 탐지 - 디자인 가이드

## 🛡️ 보안 UX 철학: "주의 보안 (Calm Security)"

> 설명하지 않아도 '지금 위험한가?'를 즉시 이해할 수 있어야 한다.
> 사용자를 불안하게 만들지 않으면서도, 위험은 명확히 전달한다.

### 핵심 원칙 (Core Principles)

1. **Instant Clarity (즉시 이해)**
   - 3초 안에 상황을 파악할 수 있어야 함
   - 색상과 아이콘만으로 위험도를 직관적으로 전달
   - 텍스트가 없어도 의미가 명확해야 함

2. **Calm, Not Alarming (침착함, 불안 유발 금지)**
   - 과도한 경고음, 팝업, 강조 지양
   - 불안을 조장하는 표현 사용 금지 (예: "지금 당장!", "즉시!", "심각한 위험!")
   - 상황을 객관적이고 담담하게 전달

3. **Actionable Information (실행 가능한 정보)**
   - 단순히 "위험합니다"가 아닌, "어떻게 해야 하는지" 제시
   - 사용자가 다음 행동을 바로 선택할 수 있도록 명확한 선택지 제공

4. **Progressive Disclosure (점진적 정보 제공)**
   - 처음엔 핵심 정보만, 원하면 상세 정보 확인 가능
   - 전문가가 아니어도 이해할 수 있는 1단계 정보 우선

5. **Consistency & Predictability (일관성과 예측 가능성)**
   - 같은 상황에서 항상 같은 시각적 표현
   - 사용자가 패턴을 학습하고 신뢰할 수 있도록

## 🎨 Color System

### Primary Colors

```css
--primary-indigo: #6366f1; /* 메인 브랜드 컬러 */
--primary-purple: #8b5cf6; /* 보조 브랜드 컬러 */
--primary-pink: #ec4899; /* 강조 컬러 */
```

### Semantic Colors

```css
--success: #10b981; /* 성공, 완료 */
--warning: #f59e0b; /* 경고, 주의 */
--error: #ef4444; /* 에러, 위험 */
--info: #3b82f6; /* 정보, 안내 */
```

### Neutral Colors

```css
--gray-900: #111827; /* 메인 텍스트 */
--gray-700: #374151; /* 서브 텍스트 */
--gray-500: #6b7280; /* 보조 텍스트 */
--gray-300: #d1d5db; /* 테두리, 구분선 */
--gray-100: #f3f4f6; /* 배경 */
--gray-50: #f9fafb; /* 연한 배경 */
```

### Background Gradients

```css
--gradient-main: linear-gradient(to right, #6366f1, #8b5cf6);
--gradient-card: linear-gradient(to bottom right, #f0f2ff, #f5f3ff);
--gradient-warm: linear-gradient(to bottom right, #fef3c7, #fde68a);
```

## 📏 Typography System

### Font Sizes (Mobile First)

```css
--text-xs: 12px; /* 캡션, 보조 정보 */
--text-sm: 14px; /* 본문, 일반 텍스트 */
--text-base: 16px; /* 중요 본문 */
--text-lg: 18px; /* 서브 헤딩 */
--text-xl: 20px; /* 헤딩 */
--text-2xl: 24px; /* 메인 헤딩 */
--text-3xl: 30px; /* 금액, 숫자 */
```

### Font Weights

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## 📐 Spacing System (8px Grid)

```css
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

## 🎯 Component Patterns

### 1. Cards

```jsx
/* 기본 카드 */
.card-base {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 그라데이션 카드 */
.card-gradient {
  background: linear-gradient(135deg, #F0F2FF, #F5F3FF);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

/* 클릭 가능한 카드 */
.card-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}
.card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

### 2. Buttons

```jsx
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  font-size: 16px;
  min-height: 48px; /* 터치 영역 최소 크기 */
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #6366F1;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
}

/* Text Button */
.btn-text {
  color: #6366F1;
  font-weight: 600;
  padding: 8px;
  min-height: 44px;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
```

### 3. Lists

```jsx
/* 리스트 아이템 */
.list-item {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px; /* 터치 영역 확보 */
}

/* 구분선 없는 리스트 */
.list-item-borderless {
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
  background: #F9FAFB;
}
```

### 4. Navigation

```jsx
/* Bottom Navigation (토스 스타일) */
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 64px;
  background: white;
  border-top: 1px solid #F3F4F6;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  min-width: 64px;
}

.nav-item-active {
  color: #6366F1;
}
```

### 5. Input Fields

```jsx
/* 기본 입력 필드 */
.input-field {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  min-height: 48px;
}

.input-field:focus {
  border-color: #6366F1;
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 라벨 */
.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}
```

## 📱 Mobile Optimization Rules

### Touch Targets

- 최소 터치 영역: **44x44px** (iOS) / **48x48px** (Android)
- 터치 요소 간 최소 간격: **8px**
- 중요 버튼은 화면 하단 Thumb Zone에 배치

### Thumb Zone Map

```
┌─────────────────┐
│   Hard Zone     │ 20%
├─────────────────┤
│   OK Zone       │ 40%
├─────────────────┤
│   Easy Zone     │ 40%
└─────────────────┘
```

### Safe Areas

- Top Safe Area: 상태바 + 20px
- Bottom Safe Area: 홈 인디케이터 + 20px
- Side Margins: 16px (기본) / 20px (카드)

## 🎭 Animation & Transitions

### Timing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Duration

```css
--duration-fast: 150ms; /* 호버, 포커스 */
--duration-base: 200ms; /* 일반 전환 */
--duration-slow: 300ms; /* 페이지 전환 */
```

### Common Animations

```css
/* 페이드 인 */
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 슬라이드 업 */
@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

/* 스케일 */
@keyframes scaleIn {
	from {
		transform: scale(0.95);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}
```

## 🔍 Accessibility Guidelines

### Color Contrast

- 일반 텍스트: 최소 **4.5:1**
- 큰 텍스트 (18px+): 최소 **3:1**
- 터치 요소: 최소 **3:1**

### Focus States

- 모든 인터랙티브 요소에 명확한 포커스 표시
- 포커스 링: `box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2)`

### Screen Reader Support

- 의미 있는 alt 텍스트
- ARIA 라벨 적절히 사용
- 시맨틱 HTML 태그 사용

## 📋 Component Checklist

### 모든 컴포넌트가 따라야 할 규칙:

- [ ] 44x44px 이상의 터치 영역
- [ ] 16px 이상의 폰트 크기 (본문)
- [ ] 8px 그리드 시스템 준수
- [ ] 일관된 border-radius (12px 또는 16px)
- [ ] 호버/포커스 상태 정의
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 빈 상태 처리
- [ ] 다크모드 지원 (선택)

## 🚀 Implementation Priority

### Phase 1 (즉시 적용)

1. 색상 시스템 통일
2. 타이포그래피 정리
3. 버튼 스타일 통일
4. 카드 컴포넌트 표준화

### Phase 2 (단계적 적용)

1. 스페이싱 시스템 적용
2. 애니메이션 추가
3. 터치 영역 최적화
4. 접근성 개선

### Phase 3 (향후 개선)

1. 다크모드 지원
2. 마이크로 인터랙션
3. 성능 최적화
4. A/B 테스트 시스템
