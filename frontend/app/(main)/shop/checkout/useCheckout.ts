'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as PortOne from '@portone/browser-sdk/v2';
import type { CartItem, Product } from '../_lib/shop.types';
import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_DELIVERY_FEE,
  DELIVERY_MEMO_OPTIONS,
} from '@/lib/constants';

// TODO: 백엔드 연동 후 API 호출로 교체
const DUMMY_PRODUCTS: Record<number, Product> = {
  1: {
    id: 1, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 1,
    categoryName: '채소류', name: '유기농 배추 1포기', price: 3500, stock: 50,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 45, createdAt: '2026-04-20',
  },
  2: {
    id: 2, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
    categoryName: '채소류', name: '청양고추 500g', price: 4800, stock: 30,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 32, createdAt: '2026-04-19',
  },
  3: {
    id: 3, sellerId: 3, sellerName: '양평 초록 농원', categoryId: 2,
    categoryName: '과일류', name: '방울토마토 1kg', price: 6200, stock: 20,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 78, createdAt: '2026-04-18',
  },
  4: {
    id: 4, sellerId: 4, sellerName: '양평 들녘 농장', categoryId: 3,
    categoryName: '곡물·잡곡', name: '햅쌀 5kg', price: 15000, stock: 100,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1508313880080-c8bef1a3ed96?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 120, createdAt: '2026-04-17',
  },
  5: {
    id: 5, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 2,
    categoryName: '과일류', name: '유기농 딸기 500g', price: 8900, stock: 15,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 95, createdAt: '2026-04-16',
  },
  6: {
    id: 6, sellerId: 5, sellerName: '양평 꿀 공방', categoryId: 4,
    categoryName: '가공식품', name: '천연 아카시아 꿀 500g', price: 22000, stock: 25,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 18, createdAt: '2026-04-15',
  },
  7: {
    id: 7, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
    categoryName: '채소류', name: '유기농 상추 300g', price: 2800, stock: 40,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 55, createdAt: '2026-04-14',
  },
  8: {
    id: 8, sellerId: 3, sellerName: '양평 초록 농원', categoryId: 2,
    categoryName: '과일류', name: '사과 3kg (부사)', price: 12000, stock: 60,
    description: '', imageUrls: ['https://images.unsplash.com/photo-1568702846914-96b305d2uj38?w=800&h=600&fit=crop'],
    status: 'ACTIVE', salesCount: 63, createdAt: '2026-04-13',
  },
};

/** 배송 정보 폼 */
interface ShippingForm {
  receiverName: string;
  receiverPhone: string;
  postcode: string;
  address: string;
  addressDetail: string;
  deliveryMemo: string;
  customMemo: string;
}

/** 폼 필드별 유효성 에러 메시지 */
interface ValidationErrors {
  receiverName?: string;
  receiverPhone?: string;
  address?: string;
}

/** 필드별 터치 상태 (사용자가 입력한 적 있는지) */
interface TouchedFields {
  receiverName: boolean;
  receiverPhone: boolean;
  address: boolean;
}

/** 다음(카카오) 우편번호 검색 타입 */
interface DaumPostcodeData {
  zonecode: string;
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
  jibunAddress: string;
  roadAddress: string;
}

/** 전화번호 유효성 검사 (한국 형식) */
function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return '연락처를 입력해주세요.';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10 || cleaned.length > 11 || !/^01[0-9]/.test(cleaned)) {
    return '올바른 휴대폰 번호를 입력해주세요.';
  }
  return undefined;
}

/** 전화번호 자동 하이픈 포매팅 (010-1234-5678) */
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 이름 유효성 검사 */
function validateName(name: string): string | undefined {
  if (!name.trim()) return '받는 분 이름을 입력해주세요.';
  if (name.trim().length < 2) return '이름은 2자 이상 입력해주세요.';
  return undefined;
}

/** 결제 수단 → 포트원 payMethod 매핑 */
type PaymentMethod = 'card' | 'bank';

const PAY_METHOD_MAP = {
  card: 'CARD',
  bank: 'VIRTUAL_ACCOUNT',
} as const;

/** useCheckout 반환 타입 */
interface UseCheckoutReturn {
  /** 주문 상품 목록 */
  orderItems: CartItem[];
  /** 배송 정보 폼 */
  shippingForm: ShippingForm;
  /** 배송 정보 업데이트 */
  updateShipping: (field: keyof ShippingForm, value: string) => void;
  /** 선택된 결제 수단 */
  paymentMethod: PaymentMethod;
  /** 결제 수단 변경 */
  setPaymentMethod: (method: PaymentMethod) => void;
  /** 상품 총액 */
  productTotal: number;
  /** 배송비 */
  deliveryFee: number;
  /** 최종 결제 금액 */
  finalTotal: number;
  /** 결제 처리 */
  handlePayment: () => Promise<void>;
  /** 폼 유효성 */
  isFormValid: boolean;
  /** 결제 진행 중 여부 */
  isProcessing: boolean;
  /** 에러 메시지 */
  paymentError: string | null;
  /** 필드별 유효성 에러 */
  errors: ValidationErrors;
  /** 필드별 터치 상태 */
  touched: TouchedFields;
  /** 필드 블러(포커스 해제) 핸들러 */
  handleBlur: (field: keyof TouchedFields) => void;
  /** 다음 주소 검색 팝업 열기 */
  openDaumPostcode: () => void;
}

/** 결제 페이지 전용 훅 */
export function useCheckout(): UseCheckoutReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── 주문 아이템 초기화 ──
  // URL에 productId가 있으면 바로 구매 모드, 없으면 장바구니 더미 데이터
  const [orderItems] = useState<CartItem[]>(() => {
    const directProductId = searchParams.get('productId');
    const directQuantity = searchParams.get('quantity');

    // 바로 구매 모드: 상품 상세에서 넘어온 경우
    if (directProductId) {
      const pid = Number(directProductId);
      const qty = Math.max(1, Number(directQuantity) || 1);
      const product = DUMMY_PRODUCTS[pid];

      if (product) {
        return [{
          id: Date.now(), // 임시 ID
          userId: 1,
          productId: pid,
          quantity: qty,
          product,
        }];
      }
    }

    // 장바구니 경유: 더미 데이터 (TODO: 실제로는 장바구니에서 선택된 상품 데이터를 전달받아야 함)
    return [
      {
        id: 1,
        userId: 1,
        productId: 2,
        quantity: 1,
        product: {
          id: 2,
          sellerId: 1,
          sellerName: '양평 해맑은 농장',
          categoryId: 2,
          categoryName: '과일류',
          name: '유기농 딸기 500g',
          price: 8900,
          stock: 50,
          description: '',
          imageUrls: ['/images/strawberry.jpg'],
          status: 'ACTIVE',
          salesCount: 85,
          createdAt: '2026-04-20',
        },
      },
      {
        id: 3,
        userId: 1,
        productId: 3,
        quantity: 2,
        product: {
          id: 3,
          sellerId: 2,
          sellerName: '양평 초록 농원',
          categoryId: 2,
          categoryName: '과일류',
          name: '방울토마토 1kg',
          price: 6200,
          stock: 80,
          description: '',
          imageUrls: ['/images/tomato.jpg'],
          status: 'ACTIVE',
          salesCount: 62,
          createdAt: '2026-04-18',
        },
      },
    ];
  });

  // ── 배송 정보 ──
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    receiverName: '',
    receiverPhone: '',
    postcode: '',
    address: '',
    addressDetail: '',
    deliveryMemo: DELIVERY_MEMO_OPTIONS[0],
    customMemo: '',
  });

  const updateShipping = (field: keyof ShippingForm, value: string) => {
    // 연락처 입력 시 자동 하이픈 포매팅
    const finalValue = field === 'receiverPhone' ? formatPhoneNumber(value) : value;
    setShippingForm((prev) => ({ ...prev, [field]: finalValue }));
    // 값이 입력되면 해당 필드를 touched 처리
    if (field in touched) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
  };

  // ── 유효성 검사 ──
  const [touched, setTouched] = useState<TouchedFields>({
    receiverName: false,
    receiverPhone: false,
    address: false,
  });

  /** 필드 블러 핸들러 (포커스 해제 시 touched 처리) */
  const handleBlur = useCallback((field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  /** 실시간 유효성 검사 */
  const errors = useMemo<ValidationErrors>(() => ({
    receiverName: validateName(shippingForm.receiverName),
    receiverPhone: validatePhone(shippingForm.receiverPhone),
    address: shippingForm.address.trim() ? undefined : '주소를 검색해주세요.',
  }), [shippingForm.receiverName, shippingForm.receiverPhone, shippingForm.address]);

  // ── 다음 우편번호 검색 ──
  const openDaumPostcode = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as typeof window & { daum?: { Postcode: new (config: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void } } };

    if (!w.daum?.Postcode) {
      console.error('다음 우편번호 스크립트가 로드되지 않았습니다.');
      return;
    }

    new w.daum.Postcode({
      oncomplete(data: DaumPostcodeData) {
        const fullAddress = data.addressType === 'R' ? data.roadAddress : data.jibunAddress;
        const extraAddr = [data.bname, data.buildingName].filter(Boolean).join(', ');
        const displayAddr = extraAddr ? `${fullAddress} (${extraAddr})` : fullAddress;

        setShippingForm((prev) => ({
          ...prev,
          postcode: data.zonecode,
          address: displayAddr,
        }));
        setTouched((prev) => ({ ...prev, address: true }));
      },
    }).open();
  }, []);

  // ── 결제 수단 ──
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // ── 결제 상태 ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ── 금액 계산 ──
  const productTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [orderItems]
  );

  /** 배송비 (3만원 이상 무료) */
  const deliveryFee = productTotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE;
  const finalTotal = productTotal + deliveryFee;

  /** 주문명 생성 */
  const orderName = useMemo(() => {
    if (orderItems.length === 0) return '';
    const firstName = orderItems[0].product.name;
    return orderItems.length > 1
      ? `${firstName} 외 ${orderItems.length - 1}건`
      : firstName;
  }, [orderItems]);

  // ── 폼 유효성 ──
  const isFormValid =
    !errors.receiverName &&
    !errors.receiverPhone &&
    !errors.address &&
    orderItems.length > 0;

  // ── 결제 ──
  const handlePayment = useCallback(async () => {
    if (!isFormValid || isProcessing) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const paymentId = `payment-${crypto.randomUUID()}`;

      // 1. 포트원 결제창 호출 — 결제 수단별 올바른 옵션만 전달
      const baseRequest = {
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName,
        totalAmount: finalTotal,
        currency: 'KRW' as const,
        payMethod: PAY_METHOD_MAP[paymentMethod],
        customer: {
          fullName: shippingForm.receiverName,
          phoneNumber: shippingForm.receiverPhone.replace(/-/g, ''),
        },
      };

      // 결제 수단별 추가 옵션
      let methodOptions: Record<string, unknown> = {};
      if (paymentMethod === 'card') {
        methodOptions = { card: {} };
      } else if (paymentMethod === 'bank') {
        methodOptions = {
          virtualAccount: {
            accountExpiry: {
              validHours: 24,
            },
          },
        };
      }

      const response = await PortOne.requestPayment({
        ...baseRequest,
        ...methodOptions,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // 2. 결제 오류 처리
      if (response?.code !== undefined) {
        // 사용자가 결제를 취소한 경우
        if (response.code === 'FAILURE_TYPE_PG') {
          setPaymentError('결제가 취소되었습니다.');
        } else {
          setPaymentError(response.message || '결제 처리 중 오류가 발생했습니다.');
        }
        return;
      }

      // 3. 서버에 결제 검증 요청 (BFF → 백엔드)
      try {
        const verifyRes = await fetch('/api/shop/payment/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            orderName,
            totalAmount: finalTotal,
            shipping: {
              receiverName: shippingForm.receiverName,
              receiverPhone: shippingForm.receiverPhone,
              address: `${shippingForm.address} ${shippingForm.addressDetail}`,
              deliveryMemo: shippingForm.deliveryMemo === '직접 입력'
                ? shippingForm.customMemo
                : shippingForm.deliveryMemo,
            },
            items: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
            })),
          }),
        });

        if (!verifyRes.ok) {
          console.warn('[결제 검증] 백엔드 검증 실패 — 백엔드 미연동 상태일 수 있습니다.');
        }
      } catch (verifyErr) {
        // 백엔드 미연동 상태에서도 결제 완료 페이지로 이동 가능
        console.warn('[결제 검증] 백엔드 연결 실패:', verifyErr);
      }

      // 4. 결제 완료 → 완료 페이지로 이동
      router.push(`/shop/checkout/complete?paymentId=${paymentId}`);

    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      console.error('[결제 오류]', err);
      setPaymentError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [isFormValid, isProcessing, orderItems, orderName, finalTotal, paymentMethod, shippingForm, router]);

  return {
    orderItems,
    shippingForm,
    updateShipping,
    paymentMethod,
    setPaymentMethod,
    productTotal,
    deliveryFee,
    finalTotal,
    handlePayment,
    isFormValid,
    isProcessing,
    paymentError,
    errors,
    touched,
    handleBlur,
    openDaumPostcode,
  };
}
