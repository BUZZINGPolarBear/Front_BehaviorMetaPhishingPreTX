/**
 * 행위 메타데이터 수집 유틸리티
 * 입력 필드에서 사용자의 타이핑 행위를 추적
 */

import { useRef, useEffect, useCallback, type RefObject } from "react";
import type { InputSignals } from "../types/api";

export interface BehaviorTrackerOptions {
  /** 추적할 입력 필드 */
  inputElement: HTMLInputElement | HTMLTextAreaElement;
  /** 이벤트 콜백 (선택) */
  onUpdate?: (signals: InputSignals) => void;
}

/**
 * 사용자 입력 행위 추적 클래스
 *
 * @example
 * ```tsx
 * const tracker = new BehaviorTracker({
 *   inputElement: inputRef.current,
 *   onUpdate: (signals) => console.log(signals),
 * });
 *
 * // 컴포넌트 언마운트 시
 * tracker.destroy();
 *
 * // 분석 전 최종 데이터 가져오기
 * const signals = tracker.getSignals();
 * ```
 */
export class BehaviorTracker {
  private element: HTMLInputElement | HTMLTextAreaElement;
  private onUpdate?: (signals: InputSignals) => void;

  // 추적 데이터
  private startTime: number;
  private lastTypingTime: number = 0;
  private typingIntervals: number[] = [];
  private backspaceCount: number = 0;
  private focusBlurCount: number = 0;
  private fieldHops: number = 0;
  private wasPasted: boolean = false;
  private previousLength: number = 0;

  constructor(options: BehaviorTrackerOptions) {
    this.element = options.inputElement;
    this.onUpdate = options.onUpdate;
    this.startTime = Date.now();

    this.attachListeners();
  }

  /**
   * 이벤트 리스너 등록
   */
  private attachListeners(): void {
    this.element.addEventListener("keydown", this.handleKeydown);
    this.element.addEventListener("paste", this.handlePaste);
    this.element.addEventListener("focus", this.handleFocus);
    this.element.addEventListener("blur", this.handleBlur);
    this.element.addEventListener("input", this.handleInput);
  }

  /**
   * 이벤트 리스너 제거
   */
  private detachListeners(): void {
    this.element.removeEventListener("keydown", this.handleKeydown);
    this.element.removeEventListener("paste", this.handlePaste);
    this.element.removeEventListener("focus", this.handleFocus);
    this.element.removeEventListener("blur", this.handleBlur);
    this.element.removeEventListener("input", this.handleInput);
  }

  /**
   * 키 입력 이벤트 핸들러
   */
  private handleKeydown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    const now = Date.now();

    // 백스페이스/Delete 감지
    if (keyboardEvent.key === "Backspace" || keyboardEvent.key === "Delete") {
      this.backspaceCount++;
    }

    // 타이핑 간격 기록 (특수키 제외)
    if (keyboardEvent.key.length === 1) {
      if (this.lastTypingTime > 0) {
        const interval = now - this.lastTypingTime;
        this.typingIntervals.push(interval);
      }
      this.lastTypingTime = now;
    }

    // Tab 키로 필드 이동 감지
    if (keyboardEvent.key === "Tab") {
      this.fieldHops++;
    }

    this.notifyUpdate();
  };

  /**
   * 붙여넣기 이벤트 핸들러
   */
  private handlePaste = (): void => {
    this.wasPasted = true;
    this.notifyUpdate();
  };

  /**
   * 포커스 이벤트 핸들러
   */
  private handleFocus = (): void => {
    this.focusBlurCount++;
    this.notifyUpdate();
  };

  /**
   * 블러 이벤트 핸들러
   */
  private handleBlur = (): void => {
    this.focusBlurCount++;
    this.notifyUpdate();
  };

  /**
   * 입력 이벤트 핸들러 (필드 간 이동 감지)
   */
  private handleInput = (): void => {
    const currentLength = this.element.value.length;

    // 큰 변화 감지 (복사/붙여넣기 또는 자동완성)
    const lengthDiff = Math.abs(currentLength - this.previousLength);
    if (lengthDiff > 5) {
      this.wasPasted = true;
    }

    this.previousLength = currentLength;
    this.notifyUpdate();
  };

  /**
   * 업데이트 콜백 호출
   */
  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate(this.getSignals());
    }
  }

  /**
   * 타이핑 속도 계산 (문자/초)
   */
  private calculateTypingSpeed(): number {
    const durationSeconds = (Date.now() - this.startTime) / 1000;
    const textLength = this.element.value.length;

    if (durationSeconds === 0 || textLength === 0) {
      return 0;
    }

    return parseFloat((textLength / durationSeconds).toFixed(2));
  }

  /**
   * 현재 수집된 행위 시그널 반환
   */
  public getSignals(): InputSignals {
    return {
      wasPasted: this.wasPasted,
      typingSpeedCps: this.calculateTypingSpeed(),
      backspaceCount: this.backspaceCount,
      focusBlurCount: this.focusBlurCount,
      fieldHops: this.fieldHops,
      durationMs: Date.now() - this.startTime,
    };
  }

  /**
   * 추적 데이터 초기화
   */
  public reset(): void {
    this.startTime = Date.now();
    this.lastTypingTime = 0;
    this.typingIntervals = [];
    this.backspaceCount = 0;
    this.focusBlurCount = 0;
    this.fieldHops = 0;
    this.wasPasted = false;
    this.previousLength = 0;
  }

  /**
   * 리소스 정리
   */
  public destroy(): void {
    this.detachListeners();
  }
}

/**
 * React Hook 형태로 사용하기 위한 래퍼
 */
export function useBehaviorTracker(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>
) {
  const trackerRef = useRef<BehaviorTracker | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Tracker 초기화
    trackerRef.current = new BehaviorTracker({
      inputElement: inputRef.current,
    });

    // 클린업
    return () => {
      trackerRef.current?.destroy();
    };
  }, [inputRef]);

  const getSignals = useCallback((): InputSignals | null => {
    return trackerRef.current?.getSignals() || null;
  }, []);

  const reset = useCallback((): void => {
    trackerRef.current?.reset();
  }, []);

  return { getSignals, reset };
}
