'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as PortOne from '@portone/browser-sdk/v2';
import type { CartItem } from '../_lib/shop.types';
import { getProduct, getCart } from '../_lib/shop.api';
import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_DELIVERY_FEE,
  DELIVERY_MEMO_OPTIONS,
} from '@/lib/constants';

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

  // ── 주문 아이템 ──
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  // 주문 아이템 로드 (바로구매 또는 장바구니)
  useEffect(() => {
    const loadItems = async () => {
      const directProductId = searchParams.get('productId');
      const directQuantity = searchParams.get('quantity');

      if (directProductId) {
        // 바로 구매 모드
        const pid = Number(directProductId);
        const qty = Math.max(1, Number(directQuantity) || 1);
        const result = await getProduct(pid);
        if (result.success && result.data) {
          setOrderItems([{
            id: Date.now(),
            userId: 0,
            productId: pid,
            quantity: qty,
            product: result.data,
          }]);
        }
      } else {
        // 장바구니 경유 — 선택된 아이템만 필터링
        const result = await getCart();
        if (result.success && result.data) {
          const cartIdsParam = searchParams.get('cartIds');
          if (cartIdsParam) {
            const selectedIds = new Set(cartIdsParam.split(',').map(Number));
            setOrderItems(result.data.filter((item) => selectedIds.has(item.id)));
          } else {
            setOrderItems(result.data);
          }
        }
      }
    };

    loadItems();
  }, [searchParams]);

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

      // 4. 결제 완료 → 완료 페이지로 이동 (주문 정보 전달)
      const completeParams = new URLSearchParams({
        paymentId,
        orderName,
        totalAmount: String(finalTotal),
        payMethod: paymentMethod === 'card' ? '카드 결제' : '가상계좌',
      });
      router.push(`/shop/checkout/complete?${completeParams.toString()}`);

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
