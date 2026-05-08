'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Badge, Card, Modal, Spinner } from '@/components';
import { useToast } from '@/components';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants';
import { useProductDetail } from './useProductDetail';
import { addToCart } from '../_lib/shop.api';
import styles from './page.module.css';

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

/** 상품 상세 페이지 */
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = use(params);
  const id = Number(productId);
  const router = useRouter();

  // 쿠키 기반 로그인 상태 확인 (fb-user는 httpOnly: false)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(document.cookie.includes('fb-user'));
  }, []);

  const {
    product,
    loading,
    quantity,
    totalPrice,
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
  } = useProductDetail(id);

  const { success: toastSuccess } = useToast();

  /** 로그인 필요 모달 상태 */
  const [showLoginModal, setShowLoginModal] = useState(false);
  /** 장바구니 담기 성공 모달 상태 */
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);

  /** 로그인 체크 후 구매 모달 열기 */
  const handlePurchaseAction = (action: 'cart' | 'buy', position: 'center' | 'bottom' = 'center') => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    openPurchaseModal(action, position);
  };

  /** 가격 포맷 */
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ko-KR').format(price);

  /** 장바구니 확정 → API 호출 → 성공 모달 표시 */
  const handleConfirmCart = async () => {
    const result = await addToCart(id, quantity);
    closePurchaseModal();
    if (result.success) {
      setShowCartSuccessModal(true);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  };

  /** 바로 구매 확정 → 결제 페이지로 이동 */
  const handleConfirmBuy = () => {
    closePurchaseModal();
    router.push(`/shop/checkout?productId=${id}&quantity=${quantity}`);
  };

  /** 라이트박스 키보드 이벤트 */
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, closeLightbox, prevImage, nextImage]);


  /* ── 로딩 처리 ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <Spinner message="상품 정보를 불러오는 중입니다..." fullHeight={true} />
      </div>
    );
  }

  /* ── 상품이 없는 경우 ── */
  if (!product) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>😥</div>
          <p className={styles.notFoundText}>상품을 찾을 수 없습니다</p>
          <p className={styles.notFoundSub}>
            삭제되었거나 존재하지 않는 상품입니다.
          </p>
          <Button href="/shop" variant="outline">
            ← 상점으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = product.imageUrls[selectedImageIndex] || product.imageUrls[0] || DEFAULT_PRODUCT_IMAGE;

  return (
    <div className={styles.page}>
      {/* ════════ 브레드크럼 ════════ */}
      <div className={styles.breadcrumb}>
        <Link href="/">홈</Link> › <Link href="/shop">상점</Link> ›{' '}
        <strong>{product.name}</strong>
      </div>

      {/* ════════ 상단 2컬럼 ════════ */}
      <div className={styles.detailGrid}>
        {/* ── 좌측: 이미지 갤러리 ── */}
        <div className={styles.galleryCard}>
          <div className={styles.mainImageWrapper} onClick={openLightbox}>
            {currentImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt={`${product.name} - 이미지 ${selectedImageIndex + 1}`}
                  className={styles.mainImage}
                />
                <span className={styles.zoomHint}>🔍 클릭하여 크게 보기</span>
              </>
            ) : (
              <div className={styles.imagePlaceholder}>🖼️</div>
            )}
          </div>

          {product.imageUrls.length > 1 && (
            <div className={styles.thumbnailList}>
              {product.imageUrls.map((url, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ''}`}
                  onClick={() => selectImage(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${product.name} - 썸네일 ${index + 1}`}
                    className={styles.thumbnailImg}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 우측: 상품 정보 ── */}
        <div className={styles.infoCard}>
          <h1 className={styles.productName}>{product.name}</h1>
          <div className={styles.sellerRow}>
            판매자: {product.sellerName}
            <Badge variant="green">인증 농가</Badge>
          </div>
          <div className={styles.price}>₩{formatPrice(product.price)}</div>

          <table className={styles.infoTable}>
            <tbody>
              <tr>
                <th>원산지</th>
                <td>경기도 양평군</td>
              </tr>
              <tr>
                <th>카테고리</th>
                <td>{product.categoryName}</td>
              </tr>
              <tr>
                <th>배송</th>
                <td>산지 직송 (2~3일)</td>
              </tr>
              <tr>
                <th>판매량</th>
                <td>{product.salesCount}건</td>
              </tr>
              <tr>
                <th>재고</th>
                <td>
                  {(product.status === 'SOLDOUT' || product.stock <= 0) ? (
                    <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>품절</span>
                  ) : (
                    <>{product.stock}개</>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 액션 버튼 (Intersection Observer 대상) */}
          <div ref={actionRef} className={styles.actionButtons}>
            {(product.status === 'SOLDOUT' || product.stock <= 0) ? (
              <Button variant="outline" disabled fullWidth>
                품절된 상품입니다
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handlePurchaseAction('cart', 'center')}>
                  🛒 장바구니
                </Button>
                <Button variant="primary" onClick={() => handlePurchaseAction('buy', 'center')}>
                  바로 구매
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ════════ 상품 설명 ════════ */}
      <Card className={styles.descCard}>
        <h2 className={styles.descTitle}>상품 설명</h2>
        <p className={styles.descContent}>{product.description}</p>
      </Card>

      {/* ════════ 목록 돌아가기 ════════ */}
      <div className={styles.backNav}>
        <Button href="/shop" variant="outline">
          ← 목록으로
        </Button>
      </div>

      {/* ════════ 라이트박스 모달 ════════ */}
      {lightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <button className={styles.lightboxClose} onClick={closeLightbox}>✕</button>

          {product.imageUrls.length > 1 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={`${product.name} - 확대 보기`}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />

          {product.imageUrls.length > 1 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              ›
            </button>
          )}

          <div className={styles.lightboxCounter}>
            {selectedImageIndex + 1} / {product.imageUrls.length}
          </div>
        </div>
      )}

      {/* ════════ 플로팅 구매 바 ════════ */}
      {showFloatingBar && !purchaseAction && (product.status !== 'SOLDOUT' && product.stock > 0) && (
        <div className={styles.floatingBar}>
          <div className={styles.floatingInfo}>
            <span className={styles.floatingName}>{product.name}</span>
            <span className={styles.floatingPrice}>₩{formatPrice(product.price)}</span>
          </div>
          <div className={styles.floatingButtons}>
            <Button variant="outline" size="sm" onClick={() => handlePurchaseAction('cart', 'bottom')}>
              🛒 장바구니
            </Button>
            <Button variant="primary" size="sm" onClick={() => handlePurchaseAction('buy', 'bottom')}>
              바로 구매
            </Button>
          </div>
        </div>
      )}

      {/* ════════ 구매 모달 (수량 선택 + 재고 확인) ════════ */}
      <Modal
        isOpen={!!purchaseAction}
        onClose={closePurchaseModal}
        title={purchaseAction === 'cart' ? '🛒 장바구니 담기' : '💳 바로 구매'}
        size="sm"
        position={modalPosition}
      >
        {/* 상품 정보 요약 */}
        <div className={styles.purchaseProductRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrls[0] || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            className={styles.purchaseProductImg}
          />
          <div className={styles.purchaseProductInfo}>
            <p className={styles.purchaseProductName}>{product.name}</p>
            <p className={styles.purchaseProductPrice}>₩{formatPrice(product.price)}</p>
          </div>
          <span className={styles.purchaseStockBadge}>재고 {product.stock}개</span>
        </div>

        {/* 수량 선택 */}
        <div className={styles.purchaseQuantityRow}>
          <span className={styles.purchaseQuantityLabel}>수량 선택</span>
          <div className={styles.quantityControl}>
            <button
              className={styles.quantityBtn}
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
            >
              −
            </button>
            <input
              className={styles.quantityInput}
              type="text"
              value={quantity}
              readOnly
            />
            <button
              className={styles.quantityBtn}
              onClick={increaseQuantity}
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>
        </div>

        {/* 총 금액 */}
        <div className={styles.purchaseTotalRow}>
          <span className={styles.purchaseTotalLabel}>총 상품 금액</span>
          <span className={styles.purchaseTotalPrice}>₩{formatPrice(totalPrice)}</span>
        </div>

        {/* 확인 버튼 */}
        <Button
          variant="primary"
          fullWidth
          onClick={purchaseAction === 'cart' ? handleConfirmCart : handleConfirmBuy}
        >
          {purchaseAction === 'cart'
            ? `장바구니에 담기 (${quantity}개)`
            : `${formatPrice(totalPrice)}원 결제하기`}
        </Button>
      </Modal>

      {/* ════════ 로그인 필요 모달 ════════ */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="🔒 로그인이 필요합니다"
        size="sm"
      >
        <div className={styles.loginModalContent}>
          <p className={styles.loginModalText}>
            장바구니 담기, 구매 등의 기능은<br />
            <strong>로그인 후 이용 가능합니다.</strong>
          </p>
          <div className={styles.loginModalButtons}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowLoginModal(false);
                router.push('/login');
              }}
            >
              로그인하기
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowLoginModal(false)}
            >
              계속 둘러보기
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════ 장바구니 담기 성공 모달 ════════ */}
      <Modal
        isOpen={showCartSuccessModal}
        onClose={() => setShowCartSuccessModal(false)}
        title="✅ 장바구니에 담았습니다"
        size="sm"
      >
        <div className={styles.cartSuccessContent}>
          <div className={styles.cartSuccessProduct}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrls[0] || DEFAULT_PRODUCT_IMAGE}
              alt={product.name}
              className={styles.cartSuccessImg}
            />
            <div>
              <p className={styles.cartSuccessName}>{product.name}</p>
              <p className={styles.cartSuccessQty}>{quantity}개 · ₩{formatPrice(totalPrice)}</p>
            </div>
          </div>
          <div className={styles.cartSuccessButtons}>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCartSuccessModal(false)}
            >
              계속 쇼핑하기
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowCartSuccessModal(false);
                router.push('/shop/cart');
              }}
            >
              🛒 장바구니로 이동
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
