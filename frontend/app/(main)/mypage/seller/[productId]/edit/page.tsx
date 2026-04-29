'use client';

import { useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import { PRODUCT_CATEGORIES } from '../../../_lib/mypage.types';
import styles from './page.module.css';

/** 더미 상품 데이터 (백엔드 연동 전 프리필용) */
const DUMMY_PRODUCT_MAP: Record<string, {
  name: string; price: number; stock: number;
  categoryName: string; description: string; imageUrls: string[];
}> = {
  '1': {
    name: '유기농 상추 (500g)',
    price: 8000,
    stock: 45,
    categoryName: '채소류',
    description: '양평에서 자란 신선한 유기농 상추입니다. 아침에 수확하여 당일 발송합니다.',
    imageUrls: [],
  },
  '2': {
    name: '무농약 배추 (1포기)',
    price: 5000,
    stock: 20,
    categoryName: '채소류',
    description: '겨울철 최고의 무농약 배추입니다. 김장용으로 추천합니다.',
    imageUrls: [],
  },
  '3': {
    name: 'GAP 토마토 (1kg)',
    price: 12000,
    stock: 0,
    categoryName: '과일류',
    description: 'GAP 인증 받은 양평 토마토. 당도가 높고 식감이 좋습니다.',
    imageUrls: [],
  },
};

interface EditPageProps {
  params: Promise<{ productId: string }>;
}

/** S-35c. 상품 수정 페이지 */
export default function SellerEditPage({ params }: EditPageProps) {
  const { productId } = use(params);
  const router = useRouter();

  // 기존 데이터 프리필
  const existingProduct = DUMMY_PRODUCT_MAP[productId];

  const [form, setForm] = useState({
    name: existingProduct?.name ?? '',
    price: existingProduct ? String(existingProduct.price) : '',
    stock: existingProduct ? String(existingProduct.stock) : '',
    categoryName: existingProduct?.categoryName ?? '',
    description: existingProduct?.description ?? '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 폼 필드 업데이트 */
  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  /** 폼 유효성 검사 */
  const isValid =
    form.name.trim().length >= 2 &&
    Number(form.price) > 0 &&
    Number(form.stock) >= 0 &&
    form.categoryName !== '' &&
    form.description.trim().length >= 10;

  /** 상품 수정 */
  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // TODO: API 호출 (PATCH /api/shop/seller/{id})
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/mypage/seller');
    } catch {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, router]);

  if (!existingProduct) {
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
            onChange={(e) => updateField('description', e.target.value)}
            required
          />
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
