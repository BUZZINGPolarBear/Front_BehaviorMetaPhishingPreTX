/**
 * 스크린샷 처리 Hook
 * MVP: 로컬 미리보기만 제공
 * 향후: 백엔드 업로드 기능 추가 가능
 */

import { useState, useCallback } from "react";

export interface ScreenshotState {
  /** 선택된 파일 객체 */
  file: File | null;
  /** 미리보기 URL (blob URL) */
  previewUrl: string | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

export interface UseScreenshotReturn {
  /** 현재 스크린샷 상태 */
  screenshot: ScreenshotState;
  /** 파일 선택 핸들러 */
  handleFileSelect: (file: File | null) => void;
  /** 스크린샷 제거 */
  clearScreenshot: () => void;
  /** 파일 유효성 검사 */
  validateFile: (file: File) => string | null;
}

/**
 * 스크린샷 업로드 및 미리보기 관리 Hook
 *
 * @example
 * ```tsx
 * const { screenshot, handleFileSelect, clearScreenshot } = useScreenshot();
 *
 * <input
 *   type="file"
 *   accept="image/*"
 *   onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
 * />
 * {screenshot.previewUrl && (
 *   <img src={screenshot.previewUrl} alt="스크린샷 미리보기" />
 * )}
 * ```
 */
export function useScreenshot(): UseScreenshotReturn {
  const [screenshot, setScreenshot] = useState<ScreenshotState>({
    file: null,
    previewUrl: null,
    isLoading: false,
    error: null,
  });

  /**
   * 파일 유효성 검사
   * @param file 검사할 파일
   * @returns 에러 메시지 (유효하면 null)
   */
  const validateFile = useCallback((file: File): string | null => {
    // 파일 타입 검사
    if (!file.type.startsWith("image/")) {
      return "이미지 파일만 업로드 가능합니다.";
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return "파일 크기는 10MB 이하여야 합니다.";
    }

    return null;
  }, []);

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = useCallback(
    (file: File | null) => {
      // 파일이 없으면 초기화
      if (!file) {
        clearScreenshot();
        return;
      }

      // 유효성 검사
      const error = validateFile(file);
      if (error) {
        setScreenshot((prev) => ({
          ...prev,
          error,
          file: null,
          previewUrl: null,
        }));
        return;
      }

      setScreenshot((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // 이전 미리보기 URL 정리
      if (screenshot.previewUrl) {
        URL.revokeObjectURL(screenshot.previewUrl);
      }

      // 새 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);

      setScreenshot({
        file,
        previewUrl,
        isLoading: false,
        error: null,
      });
    },
    [screenshot.previewUrl, validateFile]
  );

  /**
   * 스크린샷 제거
   */
  const clearScreenshot = useCallback(() => {
    // 메모리 누수 방지: blob URL 해제
    if (screenshot.previewUrl) {
      URL.revokeObjectURL(screenshot.previewUrl);
    }

    setScreenshot({
      file: null,
      previewUrl: null,
      isLoading: false,
      error: null,
    });
  }, [screenshot.previewUrl]);

  return {
    screenshot,
    handleFileSelect,
    clearScreenshot,
    validateFile,
  };
}

/**
 * [향후 확장] 백엔드 업로드 함수
 * MVP에서는 구현하지 않으나, 추후 필요 시 활성화
 *
 * @example
 * ```ts
 * async function uploadScreenshot(file: File): Promise<string> {
 *   const formData = new FormData();
 *   formData.append('screenshot', file);
 *
 *   const response = await fetch('/api/upload-screenshot', {
 *     method: 'POST',
 *     body: formData,
 *   });
 *
 *   const { url } = await response.json();
 *   return url; // 업로드된 이미지 URL 반환
 * }
 * ```
 */
export async function uploadScreenshotToBackend(_file: File): Promise<string> {
  // TODO: 백엔드 업로드 API 구현 시 활성화
  throw new Error("백엔드 업로드 기능은 아직 구현되지 않았습니다.");

  // 향후 구현 예시:
  // const formData = new FormData();
  // formData.append('screenshot', file);
  // const response = await fetch('/api/upload-screenshot', {
  //   method: 'POST',
  //   body: formData,
  // });
  // const { url } = await response.json();
  // return url;
}
