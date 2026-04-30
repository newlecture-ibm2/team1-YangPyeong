'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import { uploadFile } from '@/lib/upload.api';
import { registerProduct } from '@/app/(main)/shop/_lib/shop.api';
import { PRODUCT_CATEGORIES } from '../../_lib/mypage.types';
import styles from './page.module.css';

/** S-35b. 상품 등록 페이지 */
export default function SellerRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    categoryName: '',
    description: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 폼 필드 업데이트 */
  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  /** 숫자 전용 입력 — 문자·음수 완전 차단, 빈 문자열 허용 (삭제 가능하도록) */
  const handleNumberInput = useCallback(
    (field: string, value: string) => {
      // 빈 값 허용 (입력 중 삭제)
      if (value === '') {
        updateField(field, '');
        return;
      }
      // 숫자만 허용 (0 이상 정수)
      const numericOnly = value.replace(/[^0-9]/g, '');
      if (numericOnly === '') return;
      // 앞자리 0 제거 (예: "007" → "7")
      const cleaned = String(Number(numericOnly));
      updateField(field, cleaned);
    },
    [updateField],
  );

  /** 이미지 추가 (최대 5장) */
  const handleImageAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length;
    const newFiles = files.slice(0, remaining);

    setImages((prev) => [...prev, ...newFiles]);

    // 미리보기 생성
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // input 초기화
    e.target.value = '';
  }, [images.length]);

  /** 이미지 삭제 */
  const handleImageRemove = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 글자수 제한 상수 */
  const MAX_NAME = 200;
  const MAX_DESC = 5000;

  /** 폼 유효성 검사 */
  const isValid =
    form.name.trim().length >= 2 &&
    form.name.length <= MAX_NAME &&
    Number(form.price) > 0 &&
    form.stock !== '' &&
    Number(form.stock) >= 0 &&
    form.categoryName !== '' &&
    form.description.trim().length >= 10 &&
    form.description.length <= MAX_DESC;

  /** 상품 등록 */
  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 이미지 업로드 — 각 파일을 서버에 전송하고 URL 수집
      const imageUrls: string[] = [];
      for (const img of images) {
        const url = await uploadFile(img);
        imageUrls.push(url);
      }

      // 상품 등록 API 호출
      const result = await registerProduct({
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
        categoryName: form.categoryName,
        imageUrls,
      });

      if (!result.success) {
        throw new Error(result.error?.message || '상품 등록에 실패했습니다.');
      }

      router.push('/mypage/seller');
    } catch {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, form, images, router]);

  const categoryOptions = PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat }));

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* 이미지 업로드 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>상품 이미지</h3>
          <p className={styles.sectionDesc}>최대 5장까지 등록 가능합니다. 첫 번째 이미지가 대표 이미지입니다.</p>

          <div className={styles.imageGrid}>
            {previews.map((src, idx) => (
              <div key={idx} className={styles.imageItem}>
                <img src={src} alt={`상품 이미지 ${idx + 1}`} className={styles.imagePreview} />
                <button
                  className={styles.imageRemoveBtn}
                  onClick={() => handleImageRemove(idx)}
                  type="button"
                >
                  ✕
                </button>
                {idx === 0 && <span className={styles.mainBadge}>대표</span>}
              </div>
            ))}

            {images.length < 5 && (
              <label className={styles.imageAddBtn}>
                <span className={styles.imageAddIcon}>📷</span>
                <span className={styles.imageAddText}>{images.length}/5</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </section>

        {/* 기본 정보 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>기본 정보</h3>

          <div>
            <Input
              label="상품명"
              placeholder="예: 유기농 상추 (500g)"
              value={form.name}
              onChange={(e) => {
                if (e.target.value.length <= MAX_NAME) updateField('name', e.target.value);
              }}
              required
            />
            <span className={styles.charCount}>
              {form.name.length}/{MAX_NAME}
            </span>
          </div>

          <div className={styles.formRow}>
            <Input
              label="가격 (원)"
              placeholder="예: 8000"
              value={form.price}
              onChange={(e) => handleNumberInput('price', e.target.value)}
              required
            />
            <Input
              label="재고 (개)"
              placeholder="예: 50"
              value={form.stock}
              onChange={(e) => handleNumberInput('stock', e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              카테고리 <span className={styles.required}>*</span>
            </label>
            <Dropdown
              options={categoryOptions}
              value={form.categoryName}
              onChange={(val) => updateField('categoryName', val)}
              placeholder="카테고리를 선택하세요"
              fullWidth
            />
          </div>

          <div>
            <Input
              label="상품 설명"
              as="textarea"
              rows={5}
              placeholder="상품에 대한 상세 설명을 작성해주세요. (최소 10자)"
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESC) updateField('description', e.target.value);
              }}
              required
            />
            <span className={`${styles.charCount} ${form.description.length >= MAX_DESC ? styles.charCountOver : ''}`}>
              {form.description.length}/{MAX_DESC}
            </span>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className={styles.submitRow}>
          <Button variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '상품 등록'}
          </Button>
        </div>
      </div>
    </div>
  );
}
