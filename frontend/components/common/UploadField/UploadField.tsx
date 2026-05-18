'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { prepareImagesForUpload } from '@/lib/image-compression';
import styles from './UploadField.module.css';

export interface UploadFieldProps {
  /** 다중 업로드 허용 */
  multiple?: boolean;
  /** 최대 파일 개수 (multiple=true일 때) */
  maxFiles?: number;
  /** 현재 선택된 파일들 */
  files?: File[];
  /** 파일 변경 핸들러. 부모가 상태 관리. 압축/HEIC 변환 후의 File들을 받음. */
  onChange: (files: File[]) => void;
  /** 기존 이미지 URL (편집 모드에서 표시) */
  existingUrls?: string[];
  /** 기존 이미지 제거 핸들러 */
  onRemoveExisting?: (url: string, index: number) => void;
  /** 이미지 최대 크기 (MB) */
  maxSizeMB?: number;
  /** 픽셀 기준 최대 변 길이 */
  maxWidthOrHeight?: number;
  /** accept 속성 */
  accept?: string;
  /** disabled */
  disabled?: boolean;
  /** label */
  label?: string;
  /** 도움말 */
  hint?: string;
}

/**
 * 모바일 친화 이미지 업로드 필드.
 * - 카메라 직접 촬영 / 갤러리 선택 둘 다 지원 (모바일)
 * - HEIC → JPEG 자동 변환
 * - 클라이언트 측 자동 리사이즈/압축 (기본 1.5MB, 2048px)
 * - 미리보기 그리드
 */
export default function UploadField({
  multiple = false,
  maxFiles = 5,
  files = [],
  onChange,
  existingUrls = [],
  onRemoveExisting,
  maxSizeMB = 1.5,
  maxWidthOrHeight = 2048,
  accept = 'image/*',
  disabled = false,
  label,
  hint,
}: UploadFieldProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = ''; // 같은 파일 재선택 가능하도록
    if (incoming.length === 0) return;

    const totalAfter = existingUrls.length + files.length + incoming.length;
    if (multiple && totalAfter > maxFiles) {
      setError(`이미지는 최대 ${maxFiles}개까지 업로드할 수 있습니다.`);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      const prepared = await prepareImagesForUpload(incoming, {
        maxSizeMB,
        maxWidthOrHeight,
      });
      onChange(multiple ? [...files, ...prepared] : prepared.slice(0, 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const canAdd =
    multiple
      ? existingUrls.length + files.length < maxFiles
      : existingUrls.length + files.length === 0;

  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}

      {/* 미리보기 그리드 */}
      <div className={styles.preview}>
        {/* 기존 이미지 (편집 모드) */}
        {existingUrls.map((url, i) => (
          <div key={`existing-${i}`} className={styles.thumb}>
            <Image
              src={url}
              alt={`기존 이미지 ${i + 1}`}
              fill
              sizes="(max-width: 768px) 33vw, 120px"
              className={styles.thumbImg}
            />
            {onRemoveExisting && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => onRemoveExisting(url, i)}
                aria-label="이미지 제거"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {/* 새로 추가한 파일 */}
        {files.map((file, i) => (
          <div key={`new-${i}`} className={styles.thumb}>
            <NewFilePreview file={file} />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeFile(i)}
              aria-label="이미지 제거"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAdd && !disabled && (
          <div className={styles.addGroup}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => galleryInputRef.current?.click()}
              disabled={processing}
            >
              {processing ? (
                <Loader2 size={20} className={styles.spinner} />
              ) : (
                <ImagePlus size={20} />
              )}
              <span>{processing ? '처리 중...' : '갤러리'}</span>
            </button>
            <button
              type="button"
              className={`${styles.addBtn} ${styles.cameraBtn}`}
              onClick={() => cameraInputRef.current?.click()}
              disabled={processing}
            >
              <Camera size={20} />
              <span>카메라</span>
            </button>
          </div>
        )}
      </div>

      {/* 숨겨진 인풋 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={styles.hiddenInput}
        onChange={handleFilesSelected}
        disabled={disabled || processing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        className={styles.hiddenInput}
        onChange={handleFilesSelected}
        disabled={disabled || processing}
      />

      {hint && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

/** 새 파일 미리보기 (object URL 사용 + cleanup) */
function NewFilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  if (!url) return null;
  return (
    <Image
      src={url}
      alt={file.name}
      fill
      sizes="(max-width: 768px) 33vw, 120px"
      className={styles.thumbImg}
      unoptimized
    />
  );
}
