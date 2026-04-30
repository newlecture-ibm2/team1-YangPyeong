'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import { PRODUCT_CATEGORIES } from '../../../_lib/mypage.types';
import { getProduct, updateProduct } from '@/app/(main)/shop/_lib/shop.api';
import { uploadFile } from '@/lib/upload.api';
import styles from './page.module.css';

interface EditPageProps {
  params: Promise<{ productId: string }>;
}

/** S-35c. 상품 수정 페이지 */
export default function SellerEditPage({ params }: EditPageProps) {
  const { productId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    categoryName: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 이미지 상태 ──
  // 기존 서버 이미지 URL 목록
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // 새로 추가한 이미지 파일
  const [newImages, setNewImages] = useState<File[]>([]);
  // 새 이미지 미리보기 URL
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // 전체 이미지 수 (기존 + 새로)
  const totalImageCount = existingImages.length + newImages.length;

  // 기존 상품 데이터 로드
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const result = await getProduct(Number(productId));
      if (result.success && result.data) {
        setForm({
          name: result.data.name,
          price: String(result.data.price),
          stock: String(result.data.stock),
          categoryName: result.data.categoryName || '',
          description: result.data.description || '',
        });
        // 기존 이미지 URL 로드
        setExistingImages(result.data.imageUrls || []);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  /** 폼 필드 업데이트 */
  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  /** 기존 이미지 삭제 */
  const handleRemoveExisting = useCallback((index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 새 이미지 추가 (최대 5장 - 기존 이미지 포함) */
  const handleImageAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - totalImageCount;
    const newFiles = files.slice(0, remaining);

    setNewImages((prev) => [...prev, ...newFiles]);

    // 미리보기 생성
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // input 초기화
    e.target.value = '';
  }, [totalImageCount]);

  /** 새 이미지 삭제 */
  const handleRemoveNew = useCallback((index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 글자수 제한 상수 */
  const MAX_NAME = 200;
  const MAX_DESC = 5000;

  /** 폼 유효성 검사 */
  const isValid =
    form.name.trim().length >= 2 &&
    form.name.length <= MAX_NAME &&
    Number(form.price) > 0 &&
    Number(form.stock) >= 0 &&
    form.categoryName !== '' &&
    form.description.trim().length >= 10 &&
    form.description.length <= MAX_DESC;

  /** 상품 수정 */
  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 새 이미지 업로드
      const newImageUrls: string[] = [];
      for (const img of newImages) {
        const url = await uploadFile(img);
        newImageUrls.push(url);
      }

      // 기존 이미지 + 새 이미지 합치기
      const allImageUrls = [...existingImages, ...newImageUrls];

      await updateProduct(Number(productId), {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
        categoryName: form.categoryName,
        imageUrls: allImageUrls,
      });
      router.push('/mypage/seller');
    } catch {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, productId, form, existingImages, newImages, router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              상품 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              상품을 찾을 수 없습니다.
            </p>
            <Button variant="outline" onClick={() => router.push('/mypage/seller')} style={{ marginTop: '24px' }}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const categoryOptions = PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat }));

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* 이미지 수정 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>상품 이미지</h3>
          <p className={styles.sectionDesc}>최대 5장까지 등록 가능합니다. 첫 번째 이미지가 대표 이미지입니다.</p>

          <div className={styles.imageGrid}>
            {/* 기존 이미지 */}
            {existingImages.map((url, idx) => (
              <div key={`existing-${idx}`} className={styles.imageItem}>
                <img src={url} alt={`기존 이미지 ${idx + 1}`} className={styles.imagePreview} />
                <button
                  className={styles.imageRemoveBtn}
                  onClick={() => handleRemoveExisting(idx)}
                  type="button"
                >
                  ✕
                </button>
                {idx === 0 && newPreviews.length === 0 && <span className={styles.mainBadge}>대표</span>}
              </div>
            ))}

            {/* 새로 추가한 이미지 */}
            {newPreviews.map((src, idx) => (
              <div key={`new-${idx}`} className={styles.imageItem}>
                <img src={src} alt={`새 이미지 ${idx + 1}`} className={styles.imagePreview} />
                <button
                  className={styles.imageRemoveBtn}
                  onClick={() => handleRemoveNew(idx)}
                  type="button"
                >
                  ✕
                </button>
                {existingImages.length === 0 && idx === 0 && <span className={styles.mainBadge}>대표</span>}
              </div>
            ))}

            {/* 추가 버튼 */}
            {totalImageCount < 5 && (
              <label className={styles.imageAddBtn}>
                <span className={styles.imageAddIcon}>📷</span>
                <span className={styles.imageAddText}>{totalImageCount}/5</span>
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
          <h3 className={styles.sectionTitle}>기본 정보 수정</h3>

          <Input
            label="상품명"
            placeholder="예: 유기농 상추 (500g)"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />

          <div className={styles.formRow}>
            <Input
              label="가격 (원)"
              type="number"
              placeholder="예: 8000"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              required
            />
            <Input
              label="재고 (개)"
              type="number"
              placeholder="예: 50"
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value)}
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
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}
