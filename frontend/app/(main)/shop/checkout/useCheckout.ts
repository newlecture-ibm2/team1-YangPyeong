'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as PortOne from '@portone/browser-sdk/v2';
import type { CartItem } from '../_lib/shop.types';
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

/** 결제 수단 → 포트원 payMethod 매핑 */
type PaymentMethod = 'card' | 'bank' | 'kakaopay';

const PAY_METHOD_MAP = {
  card: 'CARD',
  bank: 'TRANSFER',
  kakaopay: 'EASY_PAY',
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
}

/** 결제 페이지 전용 훅 */
export function useCheckout(): UseCheckoutReturn {
  const router = useRouter();

  // ── 더미 장바구니 데이터 (장바구니 → 결제 전달용) ──
  const [orderItems] = useState<CartItem[]>(() => {
    // TODO: 실제로는 장바구니에서 선택된 상품 데이터를 전달받아야 함
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
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

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
    shippingForm.receiverName.trim() !== '' &&
    shippingForm.receiverPhone.trim() !== '' &&
    shippingForm.address.trim() !== '' &&
    orderItems.length > 0;

  // ── 결제 ──
  const handlePayment = useCallback(async () => {
    if (!isFormValid || isProcessing) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const paymentId = `payment-${crypto.randomUUID()}`;

      // 1. 포트원 결제창 호출
      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName,
        totalAmount: finalTotal,
        currency: 'CURRENCY_KRW',
        payMethod: PAY_METHOD_MAP[paymentMethod],
        customer: {
          fullName: shippingForm.receiverName,
          phoneNumber: shippingForm.receiverPhone,
        },
        alipayPlus: {},
      });

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
        const errData = await verifyRes.json().catch(() => null);
        throw new Error(errData?.message || '결제 검증에 실패했습니다.');
      }

      // 4. 결제 완료 → 완료 페이지로 이동
      router.push(`/shop/checkout/complete?paymentId=${paymentId}`);

    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
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
  };
}
