'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import { useToast } from '@/components/common/Toast/ToastContext';
import { uploadFile } from '@/lib/upload.api';
import { registerProduct, getCategories } from '@/app/(main)/shop/_lib/shop.api';
import { useFarmBotContext } from '@/components/common/FarmBot/FarmBotContext';
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
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiAutofilling, setIsAiAutofilling] = useState(false);
  const [priceRecommendationType, setPriceRecommendationType] = useState<'KAMIS' | 'AI' | null>(null);
  const [kamisUnit, setKamisUnit] = useState<string | null>(null);
  /** 유효성 경고를 사용자가 한번 건드린 필드에만 표시하기 위한 touched 상태 */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { showQuickMessage } = useFarmBotContext();
  const { dialog, showAlert, showConfirm, handleConfirm, handleClose } = useModalDialog();
  const { success: showSuccess } = useToast();

  // DB에서 카테고리 목록 로드
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    getCategories().then((res) => {
      if (res.success && res.data) {
        setCategoryOptions(res.data.map((cat) => ({ value: cat.name, label: cat.name })));
      }
    });
  }, []);

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
      
      if (field === 'price') {
        setPriceRecommendationType(null); // 사용자가 직접 수정하면 안내문구 제거
        setKamisUnit(null);
      }
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
    form.name.trim().length >= 1 &&
    form.name.length <= MAX_NAME &&
    Number(form.price) > 0 &&
    form.stock !== '' &&
    Number(form.stock) >= 0 &&
    form.categoryName !== '' &&
    form.description.trim().length >= 10 &&
    form.description.length <= MAX_DESC;

  /** 필드별 유효성 메시지 */
  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;
    switch (field) {
      case 'name':
        if (form.name.trim().length < 1) return '상품명을 입력해주세요.';
        return null;
      case 'price':
        if (form.price === '' || Number(form.price) <= 0) return '가격은 1원 이상 입력해주세요.';
        return null;
      case 'stock':
        if (form.stock === '') return '재고 수량을 입력해주세요.';
        return null;
      case 'categoryName':
        if (form.categoryName === '') return '카테고리를 선택해주세요.';
        return null;
      case 'description':
        if (form.description.trim().length < 10) return '상품 설명을 최소 10자 이상 작성해주세요.';
        return null;
      default:
        return null;
    }
  };

  /** 필드 blur 시 touched 상태 업데이트 */
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

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

      // 검수 요청 완료 토스트 알림 (TODO: 추후 알림 시스템 연동 시 관리자에게 알림 발송 추가)
      showSuccess('상품 등록이 완료되었습니다. 관리자 검수 후 장터에 노출됩니다.');
      router.push('/mypage/seller');
    } catch (err) {
      const message = err instanceof Error ? err.message : '상품 등록에 실패했습니다.';
      showAlert(message, '등록 오류');
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, form, images, router, showSuccess]);

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
    // 기존 설명이 있으면 덮어쓰기 확인
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

    // 기존 데이터가 있으면 확인
    const hasExisting = form.price || form.stock || form.categoryName || form.description.trim();
    if (hasExisting) {
      const confirmed = await showConfirm(
        '기존에 입력된 정보가 있습니다. AI가 새로 채운 내용으로 덮어쓸까요?',
      );
      if (!confirmed) return;
    }

    setIsAiAutofilling(true);
    try {
      // Phase 7: 내 농장 재배 이력 조회 → farmContext 구성
      let farmContext: Record<string, unknown> | null = null;
      let usedFarmData = false;

      try {
        // 1) 내 농장 목록 조회
        const farmsRes = await fetch('/api/farm');
        const farmsData = await farmsRes.json();

        if (farmsData.success && farmsData.data?.length > 0) {
          const farmSummary = farmsData.data[0]; // 첫 번째 농장 사용

          // 2) 농장 상세 정보 조회 (토양 정보 포함)
          const detailRes = await fetch(`/api/farm/${farmSummary.id}`);
          const detailData = await detailRes.json();

          // 3) 재배 등록 목록 조회
          const cultivationsRes = await fetch(`/api/farm/${farmSummary.id}/cultivations`);
          const cultivationsData = await cultivationsRes.json();

          if (cultivationsData.success && cultivationsData.data?.length > 0) {
            // 상품명과 가장 관련 있는 재배 이력 찾기
            const productKeyword = form.name.trim().split(' ')[0]; // 첫 단어로 매칭
            const matched = cultivationsData.data.find(
              (c: { cropName: string }) =>
                form.name.includes(c.cropName) || c.cropName.includes(productKeyword),
            );

            if (matched) {
              const farmDetail = detailData.success ? detailData.data : {};
              farmContext = {
                farmName: farmSummary.name,
                address: farmDetail.address || '',
                soilType: farmDetail.soilType || null,
                organicMatter: farmDetail.organicMatter || null,
                cropName: matched.cropName,
                cultivationArea: matched.cultivationArea || null,
                harvestRecords: [], // 수확 이력은 추후 확장
              };
              usedFarmData = true;
            }
          }
        }
      } catch {
        // 농장 조회 실패 시 무시하고 기존 추론 모드로 진행
      }

      // AI 자동 채우기 호출 (farmContext 포함)
      const res = await fetch('/api/ai/product-assist/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name.trim(),
          farmContext,
        }),
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
      setKamisUnit(data.data.kamisUnit || null);

      // 가이드봇 안내 메시지 — 재배 이력 사용 여부에 따라 분기
      showQuickMessage(
        usedFarmData
          ? '🌱 내 농장의 재배 이력을 바탕으로\nAI가 상품 정보를 채워넣었어요!\n가격이나 재고는 수정 가능합니다 😊'
          : 'AI가 상품 정보를 채워넣었어요! 🌱\n가격이나 재고는 원하시는 대로\n수정하실 수 있습니다 😊',
        5000,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 자동 채우기에 실패했습니다.';
      showAlert(message, 'AI 오류');
    } finally {
      setIsAiAutofilling(false);
    }
  }, [form.name, categoryOptions, showQuickMessage]);



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
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>기본 정보</h3>
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

          <div>
            <Input
              label="상품명"
              placeholder="예: 유기농 상추 (500g)"
              value={form.name}
              onChange={(e) => {
                if (e.target.value.length <= MAX_NAME) updateField('name', e.target.value);
              }}
              onBlur={() => handleBlur('name')}
              required
            />
            {getFieldError('name') && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-8px', marginBottom: '8px', marginLeft: '4px' }}>
                ⚠️ {getFieldError('name')}
              </div>
            )}
            <span className={styles.charCount}>
              {form.name.length}/{MAX_NAME}
            </span>
          </div>

          <div className={styles.formRow}>
            <div>
              <Input
                label="가격 (원)"
                placeholder="예: 8000"
                value={form.price}
                onChange={(e) => handleNumberInput('price', e.target.value)}
                onBlur={() => handleBlur('price')}
                required
              />
              {getFieldError('price') && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-8px', marginBottom: '8px', marginLeft: '4px' }}>
                  ⚠️ {getFieldError('price')}
                </div>
              )}
              {priceRecommendationType && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', marginTop: '-12px', marginBottom: '20px', marginLeft: '4px', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  {priceRecommendationType === 'KAMIS'
                    ? `💡 KAMIS 도매 시세 기반 추천가입니다. ${kamisUnit ? `(${kamisUnit} 기준, 수정 가능)` : '(수정 가능)'}`
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
                onBlur={() => handleBlur('stock')}
                required
              />
              {getFieldError('stock') && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-8px', marginBottom: '8px', marginLeft: '4px' }}>
                  ⚠️ {getFieldError('stock')}
                </div>
              )}
              {form.stock === '0' && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-orange)', marginTop: '-12px', marginBottom: '20px', marginLeft: '4px' }}>
                  ⚠️ 재고 0개: 품절 상태로 등록됩니다.
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
              onChange={(val) => { updateField('categoryName', val); setTouched((prev) => ({ ...prev, categoryName: true })); }}
              placeholder="카테고리를 선택하세요"
              fullWidth
            />
            {getFieldError('categoryName') && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '4px', marginLeft: '4px' }}>
                ⚠️ {getFieldError('categoryName')}
              </div>
            )}
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
              onBlur={() => handleBlur('description')}
              required
            />
            {getFieldError('description') && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '-8px', marginBottom: '8px', marginLeft: '4px' }}>
                ⚠️ {getFieldError('description')}
              </div>
            )}
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

      {/* 공통 모달 다이얼로그 (alert/confirm 대체) */}
      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
