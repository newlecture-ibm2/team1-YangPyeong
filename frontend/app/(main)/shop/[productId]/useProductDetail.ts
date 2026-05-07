'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Product } from '../_lib/shop.types';
import { getProduct } from '../_lib/shop.api';

/** 구매 모달 타입 */
export type PurchaseAction = 'cart' | 'buy' | null;

/** 모달 표시 위치 */
export type ModalPosition = 'center' | 'bottom';

/** 상품 상세 페이지 전용 훅 */
export function useProductDetail(productId: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [purchaseAction, setPurchaseAction] = useState<PurchaseAction>(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition>('center');
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  /** 액션 버튼 영역 관찰용 ref */
  const actionRef = useRef<HTMLDivElement>(null);

  // 백엔드 API 호출
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const result = await getProduct(productId);
      if (result.success && result.data) {
        setProduct(result.data);
      } else {
        setProduct(null);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  /* ── Intersection Observer: 원래 버튼이 화면에서 사라지면 플로팅 바 표시 ── */
  useEffect(() => {
    const el = actionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingBar(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  /** 수량 증가 */
  const increaseQuantity = useCallback(() => {
    if (product && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  }, [product, quantity]);

  /** 수량 감소 */
  const decreaseQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }, [quantity]);

  /** 총 금액 */
  const totalPrice = product ? product.price * quantity : 0;

  /** 썸네일 선택 */
  const selectImage = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  /** 라이트박스 */
  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prevImage = useCallback(() => {
    if (!product) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? product.imageUrls.length - 1 : prev - 1,
    );
  }, [product]);

  const nextImage = useCallback(() => {
    if (!product) return;
    setSelectedImageIndex((prev) =>
      prev === product.imageUrls.length - 1 ? 0 : prev + 1,
    );
  }, [product]);

  /** 구매 모달 열기 (장바구니 또는 바로구매, 위치 지정) */
  const openPurchaseModal = useCallback((action: 'cart' | 'buy', position: ModalPosition = 'center') => {
    setPurchaseAction(action);
    setModalPosition(position);
  }, []);

  /** 구매 모달 닫기 */
  const closePurchaseModal = useCallback(() => {
    setPurchaseAction(null);
  }, []);

  return {
    product,
    loading,
    quantity,
    totalPrice,
    setQuantity,
    increaseQuantity,
    decreaseQuantity,
    // 이미지 갤러리
    selectedImageIndex,
    selectImage,
    // 라이트박스
    lightboxOpen,
    openLightbox,
    closeLightbox,
    prevImage,
    nextImage,
    // 플로팅 바
    showFloatingBar,
    actionRef,
    // 구매 모달
    purchaseAction,
    modalPosition,
    openPurchaseModal,
    closePurchaseModal,
  };
}
