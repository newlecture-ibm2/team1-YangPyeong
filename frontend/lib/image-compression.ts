/**
 * 이미지 파일 클라이언트 전처리 유틸
 * - HEIC → JPEG 변환 (iOS 사진 대응)
 * - 큰 이미지 자동 리사이즈 (모바일 데이터 절약)
 */

import imageCompression from 'browser-image-compression';

const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

const DEFAULT_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

/**
 * HEIC/HEIF 파일 여부 판별
 */
export function isHeicFile(file: File): boolean {
  return HEIC_MIME_TYPES.includes(file.type) || HEIC_EXTENSIONS.test(file.name);
}

/**
 * HEIC 파일을 JPEG Blob으로 변환 후 File로 재구성
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  });
  const jpegBlob = Array.isArray(result) ? result[0] : result;
  const newName = file.name.replace(HEIC_EXTENSIONS, '.jpg');
  return new File([jpegBlob], newName, { type: 'image/jpeg' });
}

export interface PrepareImageOptions {
  /** 최대 파일 크기 (MB). 기본 1.5 */
  maxSizeMB?: number;
  /** 가로/세로 중 큰 쪽 최대 픽셀. 기본 2048 */
  maxWidthOrHeight?: number;
}

/**
 * 업로드 직전 이미지 준비:
 * 1) HEIC면 JPEG로 변환
 * 2) 크기가 크면 압축/리사이즈
 *
 * @returns 압축된 File. 압축 불필요(이미 작음)하면 원본을 반환할 수 있음.
 */
export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {},
): Promise<File> {
  let working = file;

  if (isHeicFile(working)) {
    try {
      working = await convertHeicToJpeg(working);
    } catch (e) {
      console.warn('[image-compression] HEIC 변환 실패, 원본 사용:', e);
    }
  }

  if (!working.type.startsWith('image/')) {
    return working;
  }

  try {
    const compressed = await imageCompression(working, {
      ...DEFAULT_OPTIONS,
      ...options,
    });
    return compressed instanceof File
      ? compressed
      : new File([compressed], working.name, { type: working.type });
  } catch (e) {
    console.warn('[image-compression] 압축 실패, 원본 사용:', e);
    return working;
  }
}

/**
 * 여러 파일을 병렬 준비
 */
export async function prepareImagesForUpload(
  files: File[],
  options?: PrepareImageOptions,
): Promise<File[]> {
  return Promise.all(files.map((f) => prepareImageForUpload(f, options)));
}
