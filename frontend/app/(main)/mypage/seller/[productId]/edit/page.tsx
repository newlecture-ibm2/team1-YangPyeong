'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import { getProduct, updateProduct, getCategories } from '@/app/(main)/shop/_lib/shop.api';
import { uploadFile } from '@/lib/upload.api';
import { useFarmBotContext } from '@/components/common/FarmBot/FarmBotContext';
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
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiAutofilling, setIsAiAutofilling] = useState(false);
  const [priceRecommendationType, setPriceRecommendationType] = useState<'KAMIS' | 'AI' | null>(null);
  const { showQuickMessage } = useFarmBotContext();
  const { dialog, showAlert, showConfirm, handleConfirm, handleClose } = useModalDialog();

  // ── 이미지 상태 ──
  // 기존 서버 이미지 URL 목록
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // 새로 추가한 이미지 파일
  const [newImages, setNewImages] = useState<File[]>([]);
  // 새 이미지 미리보기 URL
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // 전체 이미지 수 (기존 + 새로)
  const totalImageCount = existingImages.length + newImages.length;

  // DB에서 카테고리 목록 로드
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    getCategories().then((res) => {
      if (res.success && res.data) {
        setCategoryOptions(res.data.map((cat) => ({ value: cat.name, label: cat.name })));
      }
    });
  }, []);

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

  /** 숫자 입력 핸들러 */
  const handleNumberInput = useCallback((field: string, value: string) => {
    const onlyNums = value.replace(/[^0-9]/g, '');
    updateField(field, onlyNums);
    if (field === 'price') {
      setPriceRecommendationType(null); // 사용자가 직접 수정하면 안내문구 제거
    }
  }, [updateField]);

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

  /** AI 상품 설명 자동 생성 */
  const handleAiDescription = useCallback(async () => {
    if (!form.name.trim()) {
      showAlert('상품명을 먼저 입력해주세요.');
      return;
    }
    if (!form.categoryName) {
      showAlert('카테고리를 먼저 선택해주세요.');
      return;
    }
    if (form.description.trim().length > 0) {
      const confirmed = await showConfirm(
        '기존에 작성된 설명이 있습니다. AI가 새로 생성한 설명으로 덮어쓸까요?',
      );
      if (!confirmed) return;
    }

    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/product-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name.trim(),
          categoryName: form.categoryName,
        }),
      });
      const data = await res.json();

      if (!data.success || !data.data?.description) {
        throw new Error(data.error?.message || 'AI 설명 생성에 실패했습니다.');
      }

      updateField('description', data.data.description);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 설명 생성에 실패했습니다.';
      showAlert(message, 'AI 오류');
    } finally {
      setIsAiGenerating(false);
    }
  }, [form.name, form.categoryName, form.description, updateField]);

  /** AI로 전체 채우기 (카테고리, 가격, 재고, 설명) */
  const handleAiAutofill = useCallback(async () => {
    if (!form.name.trim()) {
      showAlert('상품명을 먼저 입력해주세요.');
      return;
    }

    const hasExisting = form.price || form.stock || form.categoryName || form.description.trim();
    if (hasExisting) {
      const confirmed = await showConfirm(
        '기존에 입력된 정보가 있습니다. AI가 새로 채운 내용으로 덮어쓸까요?',
      );
      if (!confirmed) return;
    }

    setIsAiAutofilling(true);
    try {
      const res = await fetch('/api/ai/product-assist/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: form.name.trim() }),
      });
      const data = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'AI 자동 채우기에 실패했습니다.');
      }

      // AI가 반환한 카테고리가 Dropdown 옵션에 있는지 확인 후 매칭
      let aiCategory = data.data.categoryName;
      let matchedCategory = '';

      if (categoryOptions.length > 0) {
        const exactMatch = categoryOptions.find((opt) => opt.value === aiCategory);
        if (exactMatch) {
          matchedCategory = exactMatch.value;
        } else {
          // 비슷한 이름 찾기 (예: "채소류" -> "채소")
          const partialMatch = categoryOptions.find(opt => opt.value.includes(aiCategory) || aiCategory.includes(opt.value));
          if (partialMatch) {
            matchedCategory = partialMatch.value;
          } else {
            // 매칭 실패시 기타 카테고리 또는 첫번째 옵션 사용
            const etcMatch = categoryOptions.find(opt => opt.value === '기타');
            matchedCategory = etcMatch ? etcMatch.value : categoryOptions[0].value;
          }
        }
      }

      setForm((prev) => ({
        ...prev,
        categoryName: matchedCategory || aiCategory,
        price: String(data.data.price),
        stock: String(data.data.stock),
        description: data.data.description,
      }));

      setPriceRecommendationType(data.data.isKamisApplied ? 'KAMIS' : 'AI');

      showQuickMessage(
        'AI가 상품 정보를 채워넣었어요! 🌱\n가격이나 재고는 원하시는 대로\n수정하실 수 있습니다 😊',
        5000,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 자동 채우기에 실패했습니다.';
      showAlert(message, 'AI 오류');
    } finally {
      setIsAiAutofilling(false);
    }
  }, [form.name, categoryOptions, showQuickMessage]);

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
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>기본 정보 수정</h3>
            <button
              type="button"
              className={styles.aiAutofillButton}
              onClick={handleAiAutofill}
              disabled={isAiAutofilling}
            >
              {isAiAutofilling ? (
                <>
                  <span className={styles.aiSpinner} />
                  AI가 채우는 중...
                </>
              ) : (
                '✨ AI로 전체 채우기'
              )}
            </button>
          </div>

          <Input
            label="상품명"
            placeholder="예: 유기농 상추 (500g)"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />

          <div className={styles.formRow}>
            <div>
              <Input
                label="가격 (원)"
                placeholder="예: 8000"
                value={form.price}
                onChange={(e) => handleNumberInput('price', e.target.value)}
                required
              />
              {priceRecommendationType && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', marginTop: '-12px', marginBottom: '20px', marginLeft: '4px' }}>
                  {priceRecommendationType === 'KAMIS'
                    ? '💡 KAMIS 최신 농산물 도매 시세를 반영한 AI 추천 가격입니다. (수정 가능)'
                    : '💡 AI 추천 시세가 적용되었습니다. (수정 가능)'}
                </div>
              )}
            </div>
            <div>
              <Input
                label="재고 (개)"
                placeholder="예: 50"
                value={form.stock}
                onChange={(e) => handleNumberInput('stock', e.target.value)}
                required
              />
              {form.stock === '0' && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-orange)', marginTop: '-12px', marginBottom: '20px', marginLeft: '4px' }}>
                  ⚠️ 재고 0개: 품절 상태로 수정됩니다.
                </div>
              )}
            </div>
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
            <div className={styles.descHeader}>
              <label className={styles.label}>
                상품 설명 <span className={styles.required}>*</span>
              </label>
              <button
                type="button"
                className={styles.aiButton}
                onClick={handleAiDescription}
                disabled={isAiGenerating}
              >
                {isAiGenerating ? (
                  <>
                    <span className={styles.aiSpinner} />
                    AI가 설명을 작성하고 있어요...
                  </>
                ) : (
                  '✨ AI 설명 생성'
                )}
              </button>
            </div>
            <Input
              as="textarea"
              rows={5}
              placeholder="상품에 대한 상세 설명을 작성해주세요. (최소 10자)"
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESC) updateField('description', e.target.value);
              }}
              required
            />
          </div>
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

      {/* 공통 모달 다이얼로그 (alert/confirm 대체) */}
      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
