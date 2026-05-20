'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import { useToast } from '@/components/common/Toast/ToastContext';
import { uploadFile } from '@/lib/upload.api';
import { registerProduct, getCategories } from '@/app/(main)/shop/_lib/shop.api';
import { useFarmBotContext } from '@/components/common/FarmBot/FarmBotContext';
import { consumeChatFillPayload, CHAT_EVENTS, type ChatFillEventDetail } from '@/components/common/FarmBot/useChatActions';
import styles from './page.module.css';

/** 챗봇 autofill_product_info 도구가 보낸 FILL_FORM 페이로드 형태 */
interface ChatRegisterPayload {
  name?: string;
  price?: number | string;
  stock?: number | string;
  unitKg?: number | string;
  categoryName?: string;
  description?: string;
  isKamisApplied?: boolean;
  kamisUnit?: string | null;
}

/** S-35b. 상품 등록 페이지 */
export default function SellerRegisterPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <p style={{ padding: '2rem', textAlign: 'center' }}>상품 등록 양식을 준비 중입니다...</p>
      </div>
    }>
      <SellerRegisterForm />
    </Suspense>
  );
}

function SellerRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    unitKg: '1',
    categoryName: '',
    description: '',
  });

  // 수확량 기반 자동 재계산을 위한 기준값
  //   totalKg: 사용자가 등록한 전체 수확량(kg) — 단위 변경 시 stock 재계산용
  //   pricePer1kg: 1kg당 가격 — 단위 변경 시 price 재계산용 (KAMIS/AI 추정가 기준)
  const [totalKg, setTotalKg] = useState<number | null>(null);
  const [pricePer1kg, setPricePer1kg] = useState<number | null>(null);

  // 수확 완료 등록 후 쿼리 파라미터가 유입될 시 자동 바인딩
  // + KAMIS 1kg 단가 조회하여 가격 자동 채움 (LLM 호출 없음)
  useEffect(() => {
    const cropName = searchParams.get('cropName');
    const yieldAmount = searchParams.get('yieldAmount');
    const grade = searchParams.get('grade') || '특';
    const farmName = searchParams.get('farmName');

    if (!cropName) return;

    const yieldNum = Number(yieldAmount || 0);
    setTotalKg(yieldNum > 0 ? yieldNum : null);
    setForm(prev => ({
      ...prev,
      name: `[양평] ${farmName ? farmName + ' ' : ''}무농약 ${cropName} (1kg)`,
      stock: yieldNum > 0 ? String(yieldNum) : '',
      unitKg: '1',
      description: `${farmName ? farmName + '에서 ' : ''}정성껏 재배 및 수확한 소중한 양평산 ${cropName} (${grade}급, ${yieldAmount}kg)입니다. 1kg 단위로 정성껏 포장하여 신선하게 직송해 드립니다.`
    }));

    // 1차: KAMIS 1kg 단가 + 카테고리 자동 조회 (LLM 호출 없음, DB 캐시 직조회)
    // 2차: KAMIS 가격 매칭 실패 시 → AI Autofill 으로 fallback (시장가 추정)
    (async () => {
      let priceFilled = false;
      let categoryFilled = false;
      try {
        const res = await fetch(`/api/ai/product-assist/kamis-price?cropName=${encodeURIComponent(cropName)}`);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.price) {
            const kamis1kgPrice: number = json.data.price;
            setPricePer1kg(kamis1kgPrice);
            const computed = Math.round((kamis1kgPrice * 1) / 100) * 100;
            setForm(prev => { priceFilled = !!prev.price; return prev.price ? prev : { ...prev, price: String(computed) }; });
            if (!priceFilled) priceFilled = true;
            setPriceRecommendationType('KAMIS');
            setKamisUnit(json.data.unit || '1kg');
          }
          if (json.data.categoryName) {
            setForm(prev => { categoryFilled = !!prev.categoryName; return prev.categoryName ? prev : { ...prev, categoryName: json.data.categoryName }; });
            if (!categoryFilled) categoryFilled = true;
          }
        }
      } catch {
        // 무시 — 다음 단계에서 AI fallback
      }

      // 가격이 채워지지 않았으면 AI Autofill 으로 시장가 추정
      if (!priceFilled) {
        try {
          const aiRes = await fetch('/api/ai/product-assist/autofill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName: cropName,
              existingValues: {
                stock: yieldNum > 0 ? yieldNum : undefined,
                unitKg: 1,
                ...(categoryFilled ? {} : {}),
              },
            }),
          });
          const aiJson = await aiRes.json();
          if (aiJson.success && aiJson.data) {
            setForm(prev => ({
              ...prev,
              price: prev.price || (aiJson.data.price ? String(aiJson.data.price) : ''),
              categoryName: prev.categoryName || aiJson.data.categoryName || '',
            }));
            if (aiJson.data.price) {
              setPricePer1kg(aiJson.data.price);
              setPriceRecommendationType('AI');
            }
          }
        } catch {
          // AI 호출 실패는 조용히 무시 — 사용자가 수동으로 채우면 됨
        }
      }
    })();
  }, [searchParams]);
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

  /** 챗봇 FILL_FORM 페이로드를 폼에 적용 (카테고리는 옵션 매칭 후 결정) */
  const applyChatPayload = useCallback(
    (payload: ChatRegisterPayload) => {
      // 카테고리 매칭: AI가 보낸 카테고리명이 옵션에 있는지 확인 (없으면 부분 매칭 → '기타')
      let matchedCategory = '';
      if (payload.categoryName && categoryOptions.length > 0) {
        const exact = categoryOptions.find((opt) => opt.value === payload.categoryName);
        if (exact) {
          matchedCategory = exact.value;
        } else {
          const partial = categoryOptions.find(
            (opt) =>
              opt.value.includes(payload.categoryName!) ||
              payload.categoryName!.includes(opt.value),
          );
          matchedCategory = partial?.value
            ?? categoryOptions.find((opt) => opt.value === '기타')?.value
            ?? categoryOptions[0]?.value
            ?? '';
        }
      }

      setForm((prev) => ({
        name: payload.name ?? prev.name,
        price: payload.price !== undefined && payload.price !== null ? String(payload.price) : prev.price,
        stock: payload.stock !== undefined && payload.stock !== null ? String(payload.stock) : prev.stock,
        unitKg: payload.unitKg !== undefined && payload.unitKg !== null ? String(payload.unitKg) : prev.unitKg,
        categoryName: matchedCategory || prev.categoryName,
        description: payload.description ?? prev.description,
      }));

      if (payload.isKamisApplied) {
        setPriceRecommendationType('KAMIS');
        if (payload.kamisUnit) setKamisUnit(payload.kamisUnit);
        // KAMIS는 1kg 단가 기준 → pricePer1kg 추정
        const unit = Math.max(1, Number(payload.unitKg ?? 1));
        if (payload.price !== undefined && payload.price !== null) {
          setPricePer1kg(Number(payload.price) / unit);
        }
      } else if (payload.price !== undefined && payload.price !== null) {
        setPriceRecommendationType('AI');
        const unit = Math.max(1, Number(payload.unitKg ?? 1));
        setPricePer1kg(Number(payload.price) / unit);
      }

      showSuccess('챗봇이 상품 정보를 채워두었어요. 확인 후 등록해 주세요.');
    },
    [categoryOptions, showSuccess],
  );

  /** 카테고리 로드 완료 후 — 진입 시점에 sessionStorage 에 쌓인 페이로드를 1회 소비 */
  useEffect(() => {
    if (categoryOptions.length === 0) return;
    const payload = consumeChatFillPayload<ChatRegisterPayload>('seller_register');
    if (payload) applyChatPayload(payload);
  }, [categoryOptions, applyChatPayload]);

  /** 페이지에 머무는 동안 새 FILL_FORM 이벤트 — 사용자가 챗봇 창에서 추가 요청한 경우 */
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ChatFillEventDetail>).detail;
      if (detail?.target !== 'seller_register') return;
      const payload = consumeChatFillPayload<ChatRegisterPayload>('seller_register');
      if (payload) applyChatPayload(payload);
    };
    window.addEventListener(CHAT_EVENTS.fillForm, handler);
    return () => window.removeEventListener(CHAT_EVENTS.fillForm, handler);
  }, [applyChatPayload]);

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
        // 사용자가 직접 가격을 바꾸면 1kg 단가 기준점도 함께 갱신
        const unit = Math.max(1, Number(form.unitKg) || 1);
        const next = Number(cleaned);
        if (next > 0 && unit > 0) setPricePer1kg(next / unit);
      }
      if (field === 'stock') {
        // 사용자가 직접 재고를 바꾸면 totalKg 기준점 갱신
        const unit = Math.max(1, Number(form.unitKg) || 1);
        const next = Number(cleaned);
        if (next >= 0) setTotalKg(next * unit);
      }
    },
    [updateField, form.unitKg],
  );

  /** 단위(unit) 변경 — 가격·재고 자동 재계산 */
  const handleUnitChange = useCallback(
    (value: string) => {
      // 빈 값은 임시 허용 (사용자가 지우는 중)
      if (value === '') {
        updateField('unitKg', '');
        return;
      }
      const numericOnly = value.replace(/[^0-9]/g, '');
      if (numericOnly === '') return;
      const cleaned = String(Number(numericOnly));
      const newUnit = Math.max(1, Number(cleaned));

      // 가격 재계산: pricePer1kg × newUnit
      if (pricePer1kg !== null && pricePer1kg > 0) {
        const newPrice = Math.round(pricePer1kg * newUnit);
        updateField('price', String(newPrice));
      }
      // 재고 재계산: floor(totalKg / newUnit)
      if (totalKg !== null && totalKg > 0) {
        const newStock = Math.floor(totalKg / newUnit);
        updateField('stock', String(newStock));
      }
      updateField('unitKg', cleaned);
    },
    [updateField, pricePer1kg, totalKg],
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
    form.unitKg !== '' && Number(form.unitKg) >= 1 &&
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
        unitKg: Math.max(1, Number(form.unitKg) || 1),
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

  /** AI로 전체 채우기 (카테고리, 가격, 재고, 설명).
   *  Hybrid: 기존에 채워진 값은 그대로 두고 빈 값만 AI가 채움.
   */
  const handleAiAutofill = useCallback(async () => {
    if (!form.name.trim()) {
      showAlert('상품명을 먼저 입력해주세요.');
      return;
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

      // 이미 채워진 값(빈 칸만 AI가 채우도록 백엔드에 알려줌)
      const existingValues: Record<string, unknown> = {};
      if (form.price && Number(form.price) > 0) existingValues.price = Number(form.price);
      if (form.stock !== '' && Number(form.stock) >= 0) existingValues.stock = Number(form.stock);
      if (form.unitKg && Number(form.unitKg) >= 1) existingValues.unitKg = Number(form.unitKg);
      if (form.categoryName) existingValues.categoryName = form.categoryName;
      if (form.description.trim()) existingValues.description = form.description.trim();

      // AI 자동 채우기 호출 (farmContext + existingValues 포함)
      const res = await fetch('/api/ai/product-assist/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name.trim(),
          farmContext,
          existingValues,
        }),
      });
      const data = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'AI 자동 채우기에 실패했습니다.');
      }

      // AI가 반환한 카테고리가 Dropdown 옵션에 있는지 확인 후 매칭
      const aiCategory: string = data.data.categoryName ?? '';
      let matchedCategory = '';
      if (aiCategory && categoryOptions.length > 0) {
        const exactMatch = categoryOptions.find((opt) => opt.value === aiCategory);
        if (exactMatch) {
          matchedCategory = exactMatch.value;
        } else {
          const partialMatch = categoryOptions.find(opt => opt.value.includes(aiCategory) || aiCategory.includes(opt.value));
          if (partialMatch) {
            matchedCategory = partialMatch.value;
          } else {
            const etcMatch = categoryOptions.find(opt => opt.value === '기타');
            matchedCategory = etcMatch ? etcMatch.value : categoryOptions[0].value;
          }
        }
      }

      // Hybrid: 이미 채워진 값은 유지, 빈 값만 AI가 채운 값으로 보강
      setForm((prev) => ({
        ...prev,
        categoryName: prev.categoryName || matchedCategory || aiCategory,
        price: prev.price || (data.data.price ? String(data.data.price) : ''),
        stock: prev.stock || (data.data.stock !== undefined ? String(data.data.stock) : ''),
        unitKg: prev.unitKg || (data.data.unitKg ? String(data.data.unitKg) : '1'),
        description: prev.description.trim() ? prev.description : (data.data.description ?? ''),
      }));

      // 가격이 새로 채워진 경우 단가 기준 갱신
      if (!form.price && data.data.price) {
        const unit = Math.max(1, Number(form.unitKg || data.data.unitKg || 1));
        setPricePer1kg(data.data.price / unit);
      }

      if (data.data.isKamisApplied && !form.price) {
        setPriceRecommendationType('KAMIS');
        setKamisUnit(data.data.kamisUnit || null);
      } else if (data.data.price && !form.price) {
        setPriceRecommendationType('AI');
      }

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
              data-guide="register-autofill"
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

          <div data-guide="register-name">
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

          <div className={styles.formGroup}>
            <Input
              label="판매 단위 (kg)"
              placeholder="1"
              value={form.unitKg}
              onChange={(e) => handleUnitChange(e.target.value)}
              required
            />
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '-12px', marginBottom: '16px', marginLeft: '4px' }}>
              💡 1개당 판매할 단위(kg)를 입력하세요. 기본 1kg. 단위를 바꾸면 가격·재고가 자동으로 재계산됩니다.
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <Input
                label={`가격 (원${Number(form.unitKg) > 1 ? ` / ${form.unitKg}kg` : ''})`}
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
            data-guide="register-submit"
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
