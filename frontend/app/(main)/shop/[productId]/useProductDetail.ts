'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Product } from '../_lib/shop.types';

// TODO: 백엔드 연동 후 shop.api.ts의 getProduct()로 교체
const DUMMY_PRODUCTS: Record<number, Product> = {
  1: {
    id: 1, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 1,
    categoryName: '채소류', name: '유기농 배추 1포기', price: 3500, stock: 50,
    description: `양평 해맑은 농장에서 유기농으로 재배한 신선한 배추입니다.

🌱 재배 환경
양평군의 맑은 공기와 깨끗한 물로 키운 배추로, 해발 200m 이상의 고지대에서 일교차를 활용하여 당도 높은 배추를 생산합니다. 무농약, 무화학 비료로 재배하여 안심하고 드실 수 있습니다.

📦 배송 안내
주문 후 당일 수확하여 산지 직송해 드립니다. 신선도를 유지하기 위해 냉장 포장으로 발송되며, 수확 후 24시간 이내 배송을 원칙으로 합니다. 배송 중 품질 문제 발생 시 100% 교환 및 환불이 가능합니다.

🥬 활용법
김장용 배추로도 적합하며, 겉절이, 배추전, 배추된장국 등 다양한 요리에 활용 가능합니다. 신선한 배추잎을 그대로 쌈으로 드셔도 좋습니다.

⭐ 고객 후기
"매년 김장철에 주문하는데 항상 품질이 일정해요." - 김○○ 고객
"아이들도 잘 먹는 배추, 역시 유기농이 다르네요." - 이○○ 고객
"직거래라 중간 마진 없이 저렴하게 살 수 있어 좋아요." - 박○○ 고객

📋 상품 정보
- 중량: 1포기 (약 2~3kg)
- 원산지: 경기도 양평군
- 재배방식: 유기농 인증 (제2026-양평-0042호)
- 보관방법: 냉장 보관 (0~5°C)
- 유통기한: 수령 후 7일 이내 섭취 권장`,
    imageUrls: [
      'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 45, createdAt: '2026-04-20T10:00:00Z',
  },
  2: {
    id: 2, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
    categoryName: '채소류', name: '청양고추 500g', price: 4800, stock: 30,
    description: `양평 햇살 농장에서 재배한 매콤한 청양고추입니다.

🌶️ 특징
양평의 풍부한 일조량 덕분에 매운맛과 향이 진한 고추를 생산합니다. 청양고추 특유의 칼칼한 매운맛이 살아 있어 각종 요리의 양념으로 최적입니다.

📦 배송 안내
수확 직후 선별 과정을 거쳐 가장 신선한 상태로 포장합니다. 택배 발송 후 1~2일 이내 수령 가능하며, 냉장 택배로 발송됩니다.

🍳 활용법
김치, 고추장, 양념장의 기본 재료로 활용되며, 찌개류에 넣으면 시원한 매운맛을 낼 수 있습니다. 잘게 썰어 각종 반찬에 곁들여 드셔도 좋습니다. 건조하여 고춧가루로 만들어 사용하셔도 됩니다.

⭐ 고객 후기
"매운맛이 확실해서 좋아요, 양념용으로 최고입니다." - 정○○ 고객
"신선하고 껍질이 두꺼워 아삭해요." - 최○○ 고객

📋 상품 정보
- 중량: 500g
- 원산지: 경기도 양평군
- 재배방식: 친환경 재배
- 보관방법: 냉장 보관
- 유통기한: 수령 후 5일 이내 섭취 권장`,
    imageUrls: [
      'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 32, createdAt: '2026-04-19T10:00:00Z',
  },
  3: {
    id: 3, sellerId: 3, sellerName: '양평 초록 농원', categoryId: 2,
    categoryName: '과일류', name: '방울토마토 1kg', price: 6200, stock: 20,
    description: `달콤한 양평산 방울토마토를 산지 직송합니다.

🍅 재배 환경
양평 초록 농원의 스마트팜 하우스에서 재배되며, 온·습도를 정밀 관리하여 당도 10브릭스 이상의 고당도 토마토를 생산합니다. 비타민 C와 리코펜이 풍부하여 건강에 좋습니다.

📦 배송 안내
수확 당일 선별 포장하여 발송합니다. 과일 전용 박스에 완충재를 넣어 안전하게 배송되며, 파손 시 100% 보상해 드립니다.

🥗 활용법
간식으로 그대로 드시거나, 샐러드, 파스타, 브루스케타 등에 활용하시면 좋습니다. 건조하여 선드라이 토마토로 만들면 오래 보관할 수 있습니다. 주스나 스무디 재료로도 인기가 좋습니다.

⭐ 고객 후기
"아이들 간식으로 최고예요, 달달해서 잘 먹어요." - 한○○ 고객
"마트 토마토와는 차원이 다른 맛이에요." - 서○○ 고객
"매주 정기 주문하고 있어요!" - 윤○○ 고객

📋 상품 정보
- 중량: 1kg (약 50~60개)
- 원산지: 경기도 양평군
- 재배방식: 스마트팜 친환경 재배
- 보관방법: 실온 또는 냉장 보관
- 유통기한: 수령 후 5~7일`,
    imageUrls: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 78, createdAt: '2026-04-18T10:00:00Z',
  },
  4: {
    id: 4, sellerId: 4, sellerName: '양평 들녘 농장', categoryId: 3,
    categoryName: '곡물·잡곡', name: '햅쌀 5kg', price: 15000, stock: 100,
    description: `양평 들녘에서 수확한 햅쌀입니다.

🌾 재배 환경
양평군 청정 지역의 비옥한 토양과 깨끗한 물로 재배한 쌀입니다. 찰기가 있고 밥맛이 좋아 매일 먹어도 질리지 않습니다. 갓 도정하여 신선하게 보내드립니다.

📦 배송 안내
주문 후 당일 도정하여 발송합니다. 진공 포장으로 신선도를 유지합니다. 5kg 단위로 소분 포장되어 보관이 편리합니다.

🍚 활용법
일반 백미밥은 물론, 영양밥, 볶음밥, 죽, 떡 등 다양한 요리에 활용 가능합니다.

📋 상품 정보
- 중량: 5kg
- 원산지: 경기도 양평군
- 품종: 추청 (아키바레)
- 도정일: 주문 당일
- 보관방법: 서늘하고 건조한 곳`,
    imageUrls: [
      'https://images.unsplash.com/photo-1508313880080-c8bef1a3ed96?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 120, createdAt: '2026-04-17T10:00:00Z',
  },
  5: {
    id: 5, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 2,
    categoryName: '과일류', name: '유기농 딸기 500g', price: 8900, stock: 15,
    description: `양평에서 유기농으로 재배한 달콤한 딸기입니다.

🍓 특징
당도가 높고 과즙이 풍부합니다. 선물용으로도 인기 많은 프리미엄 딸기입니다. 화학 비료 없이 자연 퇴비만으로 재배하여 딸기 본연의 맛을 느낄 수 있습니다.

📋 상품 정보
- 중량: 500g (약 15~20개)
- 원산지: 경기도 양평군
- 재배방식: 유기농 인증
- 보관방법: 냉장 보관
- 유통기한: 수령 후 3일 이내`,
    imageUrls: [
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1495570689269-d883b1224443?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543528176-61b239494933?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 95, createdAt: '2026-04-16T10:00:00Z',
  },
  6: {
    id: 6, sellerId: 5, sellerName: '양평 꿀 공방', categoryId: 4,
    categoryName: '가공식품', name: '천연 아카시아 꿀 500g', price: 22000, stock: 25,
    description: `양평 산골에서 채취한 천연 아카시아 꿀입니다.

🍯 특징
인공 첨가물 없이 100% 자연 그대로의 꿀입니다. 양평군 용문산 자락의 아카시아 꽃에서 채취한 프리미엄 꿀로, 투명한 색상과 은은한 꽃향이 특징입니다.

📋 상품 정보
- 중량: 500g
- 원산지: 경기도 양평군
- 종류: 아카시아 꿀 (100% 천연)
- 보관방법: 직사광선을 피해 서늘한 곳
- 유통기한: 제조일로부터 2년`,
    imageUrls: [
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 18, createdAt: '2026-04-15T10:00:00Z',
  },
  7: {
    id: 7, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
    categoryName: '채소류', name: '유기농 상추 300g', price: 2800, stock: 40,
    description: `신선한 유기농 상추를 당일 수확합니다.

🥬 특징
아삭한 식감과 신선한 맛이 일품입니다. 쌈채소, 샐러드 등 다양하게 즐기세요.

📋 상품 정보
- 중량: 300g
- 원산지: 경기도 양평군
- 재배방식: 유기농
- 보관방법: 냉장 보관
- 유통기한: 수령 후 3일 이내`,
    imageUrls: [
      'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 55, createdAt: '2026-04-14T10:00:00Z',
  },
  8: {
    id: 8, sellerId: 3, sellerName: '양평 초록 농원', categoryId: 2,
    categoryName: '과일류', name: '사과 3kg (부사)', price: 12000, stock: 60,
    description: `달콤하고 아삭한 양평산 부사 사과입니다.

🍎 특징
과즙이 풍부하고 당도가 높습니다. 가정용, 선물용 모두 인기 있습니다.

📋 상품 정보
- 중량: 3kg (약 8~10개)
- 원산지: 경기도 양평군
- 품종: 부사
- 보관방법: 냉장 보관
- 유통기한: 수령 후 14일`,
    imageUrls: [
      'https://images.unsplash.com/photo-1568702846914-96b305d2uj38?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=800&h=600&fit=crop',
    ],
    status: 'ACTIVE', salesCount: 63, createdAt: '2026-04-13T10:00:00Z',
  },
};

/** 구매 모달 타입 */
export type PurchaseAction = 'cart' | 'buy' | null;

/** 모달 표시 위치 */
export type ModalPosition = 'center' | 'bottom';

/** 상품 상세 페이지 전용 훅 */
export function useProductDetail(productId: number) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [purchaseAction, setPurchaseAction] = useState<PurchaseAction>(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition>('center');
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  /** 액션 버튼 영역 관찰용 ref */
  const actionRef = useRef<HTMLDivElement>(null);

  // TODO: 백엔드 연동 시 useEffect + getProduct(productId) 호출로 교체
  const product = DUMMY_PRODUCTS[productId] || null;

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
