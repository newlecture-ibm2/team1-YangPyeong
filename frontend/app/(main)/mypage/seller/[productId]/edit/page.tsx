'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import { getProduct, updateProduct, updateInventory, getCategories } from '@/app/(main)/shop/_lib/shop.api';
import type { ProductStatus } from '@/app/(main)/shop/_lib/shop.types';
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
  const [productStatus, setProductStatus] = useState<ProductStatus>('ACTIVE');

  // 검수중(PENDING)이면 가격·재고만 수정 가능
  const isPending = productStatus === 'PENDING';

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    unitKg: '1',
    categoryName: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiAutofilling, setIsAiAutofilling] = useState(false);
  const [priceRecommendationType, setPriceRecommendationType] = useState<'KAMIS' | 'AI' | null>(null);

  // 단위 변경 시 재계산 기준값 (drift 방지)
  // pricePer1kg: 1kg당 가격, totalKg: 전체 재고 총량(kg)
  const [pricePer1kg, setPricePer1kg] = useState<number | null>(null);
  const [totalKg, setTotalKg] = useState<number | null>(null);
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
        const loadedUnitKg = Math.max(1, result.data.unitKg ?? 1);
        setForm({
          name: result.data.name,
          price: String(result.data.price),
          stock: String(result.data.stock),
          unitKg: String(loadedUnitKg),
          categoryName: result.data.categoryName || '',
          description: result.data.description || '',
        });
        // 단위 변경 재계산 기준값 초기화
        setPricePer1kg(result.data.price / loadedUnitKg);
        setTotalKg(result.data.stock * loadedUnitKg);
        setProductStatus(result.data.status);
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
      setPriceRecommendationType(null);
      // 수동 가격 변경 시 1kg 단가 기준값 갱신
      const unit = Math.max(1, Number(form.unitKg) || 1);
      const next = Number(onlyNums);
      if (next > 0) setPricePer1kg(next / unit);
    }
    if (field === 'stock') {
      // 수동 재고 변경 시 총량(kg) 기준값 갱신
      const unit = Math.max(1, Number(form.unitKg) || 1);
      const next = Number(onlyNums);
      if (next >= 0) setTotalKg(next * unit);
    }
  }, [updateField, form.unitKg]);

  /** 단위(unitKg) 변경 — 가격·재고 자동 재계산
   *  pricePer1kg / totalKg 기준값을 항상 사용해 drift 방지.
   *  기준값 미설정 시 현재 폼에서 1회 역산 후 저장. */
  const handleUnitChange = useCallback(
    (value: string) => {
      if (value === '') {
        updateField('unitKg', '');
        return;
      }
      const numericOnly = value.replace(/[^0-9]/g, '');
      if (numericOnly === '') return;
      const cleaned = String(Number(numericOnly));
      const newUnit = Math.max(1, Number(cleaned));
      const oldUnit = Math.max(1, Number(form.unitKg) || 1);

      // 1kg 단가 기준값 — 없으면 현재 폼에서 역산 후 저장
      let base1kgPrice = pricePer1kg;
      if (base1kgPrice === null && Number(form.price) > 0) {
        base1kgPrice = Number(form.price) / oldUnit;
        setPricePer1kg(base1kgPrice);
      }

      // 총량(kg) 기준값 — 없으면 현재 폼에서 역산 후 저장
      let baseTotalKg = totalKg;
      if (baseTotalKg === null && form.stock !== '') {
        baseTotalKg = Number(form.stock) * oldUnit;
        setTotalKg(baseTotalKg);
      }

      if (base1kgPrice !== null && base1kgPrice > 0) {
        updateField('price', String(Math.round(base1kgPrice * newUnit)));
        setPriceRecommendationType(null);
      }

      if (baseTotalKg !== null && baseTotalKg >= 0) {
        updateField('stock', String(Math.floor(baseTotalKg / newUnit)));
      }

      updateField('unitKg', cleaned);
    },
    [updateField, pricePer1kg, totalKg, form.unitKg, form.price, form.stock],
  );

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

  /** 폼 유효성 — 검수중이면 가격·재고·판매단위만 검사 */
  const isInventoryValid = Number(form.price) > 0 && Number(form.stock) >= 0 && Number(form.unitKg) >= 1;

  /** 상품 수정 (검수중: 가격·재고만 / 일반: 전체) */
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isPending) {
        // 검수중: 가격·재고·판매단위 즉시 수정 (재검수 없음)
        await updateInventory(Number(productId), {
          price: Number(form.price),
          stock: Number(form.stock),
          unitKg: Math.max(1, Number(form.unitKg) || 1),
        });
      } else {
        if (!isValid) { setIsSubmitting(false); return; }
        // 일반: 전체 수정 (ACTIVE → PENDING 재검수 진입)
        const newImageUrls: string[] = [];
        for (const img of newImages) {
          const url = await uploadFile(img);
          newImageUrls.push(url);
        }
        await updateProduct(Number(productId), {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          unitKg: Math.max(1, Number(form.unitKg) || 1),
          description: form.description,
          categoryName: form.categoryName,
          imageUrls: [...existingImages, ...newImageUrls],
        });
      }
      router.push('/mypage/seller');
    } catch {
      setIsSubmitting(false);
    }
  }, [isPending, isValid, isInventoryValid, isSubmitting, productId, form, existingImages, newImages, router]);

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

        {/* 검수중 안내 배너 */}
        {isPending && (
          <div style={{
            background: '#fff8e1',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <div>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>검수 진행 중인 상품입니다</strong>
              <span style={{ fontSize: '0.875rem', color: '#78350f' }}>
                가격·재고·판매 단위는 지금 바로 수정할 수 있어요. 이름·설명·카테고리·이미지는 검수 완료 후에 변경 가능합니다.
              </span>
            </div>
          </div>
        )}

        {/* 이미지 수정 */}
        <section className={styles.section} style={isPending ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
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
            {!isPending && (
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
            )}
          </div>

          <div className={styles.formGroup} style={isPending ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
            <label className={styles.label}>
              상품명 <span className={styles.required}>*</span>
              {isPending && <span style={{ fontSize: '0.75rem', color: '#92400e', marginLeft: '8px' }}>🔒 검수 완료 후 변경 가능</span>}
            </label>
            <Input
              placeholder="예: 유기농 상추 (500g)"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label="판매 단위 (kg)"
              placeholder="1"
              value={form.unitKg}
              onChange={(e) => handleUnitChange(e.target.value)}
              required
            />
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '-12px', marginBottom: '16px', marginLeft: '4px' }}>
              💡 1개당 판매할 단위(kg)를 입력하세요. 기본 1kg.
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <Input
                label={`가격 (원${Number(form.unitKg) > 1 ? ` / ${form.unitKg}kg` : ''})`}
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

          <div className={styles.formGroup} style={isPending ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
            <label className={styles.label}>
              카테고리 <span className={styles.required}>*</span>
              {isPending && <span style={{ fontSize: '0.75rem', color: '#92400e', marginLeft: '8px' }}>🔒 검수 완료 후 변경 가능</span>}
            </label>
            <Dropdown
              options={categoryOptions}
              value={form.categoryName}
              onChange={(val) => !isPending && updateField('categoryName', val)}
              placeholder="카테고리를 선택하세요"
              fullWidth
            />
          </div>

          <div style={isPending ? { opacity: 0.5 } : {}}>
            <div className={styles.descHeader}>
              <label className={styles.label}>
                상품 설명 <span className={styles.required}>*</span>
                {isPending && <span style={{ fontSize: '0.75rem', color: '#92400e', marginLeft: '8px' }}>🔒 검수 완료 후 변경 가능</span>}
              </label>
              {!isPending && (
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
              )}
            </div>
            <Input
              as="textarea"
              rows={5}
              placeholder="상품에 대한 상세 설명을 작성해주세요. (최소 10자)"
              value={form.description}
              onChange={(e) => {
                if (!isPending && e.target.value.length <= MAX_DESC) updateField('description', e.target.value);
              }}
              required
              disabled={isPending}
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
            disabled={isPending ? (!isInventoryValid || isSubmitting) : (!isValid || isSubmitting)}
          >
            {isSubmitting
              ? '수정 중...'
              : isPending
                ? '가격·재고·단위 저장'
                : '수정 완료'}
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
