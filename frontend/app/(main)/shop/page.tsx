'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown, SearchInput, Modal, Button } from '@/components';
import { useToast } from '@/components';
import ProductCard from './ProductCard';
import { useProducts } from './useProducts';
import styles from './page.module.css';

/** 상점 — 상품 목록 페이지 */
export default function ShopBrowsePage() {
  const {
    products,
    category,
    sort,
    keyword,
    setCategory,
    setSort,
    setKeyword,
    handleSearch,
    sortOptions,
    categoryTabs,
  } = useProducts();

  const { success: toastSuccess } = useToast();
  const router = useRouter();

  // TODO: 실제 인증 상태로 교체
  const isLoggedIn = false;

  /** 로그인 필요 모달 */
  const [showLoginModal, setShowLoginModal] = useState(false);

  /** 장바구니 담기 핸들러 (로그인 체크 포함) */
  const handleAddToCart = (productId: number) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    // TODO: 백엔드 연동 시 addToCart() API 호출로 교체
    const product = products.find((p) => p.id === productId);
    toastSuccess(`🛒 ${product?.name || '상품'}을(를) 장바구니에 담았습니다.`);
  };

  return (
    <div className={styles.page}>
      {/* ════════ 페이지 헤더 ════════ */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          상점 <em>둘러보기</em>
        </h1>
        <p className={styles.pageSub}>
          양평군 신선한 농산물을 직접 구매하세요.
        </p>
      </div>

      {/* ════════ 카테고리 탭 ════════ */}
      <div className={styles.tabs}>
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${category === tab.value ? styles.tabActive : ''}`}
            onClick={() => setCategory(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════ 필터 바 ════════ */}
      <div className={styles.filterBar}>
        <div className={styles.filterSort}>
          <Dropdown
            options={sortOptions}
            value={sort}
            onChange={(value) => setSort(value as typeof sort)}
            size="sm"
          />
        </div>
        <div className={styles.filterSearch}>
          <SearchInput
            placeholder="상품 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            size="sm"
            fullWidth
          />
        </div>
      </div>

      {/* ════════ 상품 그리드 ════════ */}
      <div className={styles.productGrid}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <p className={styles.emptyText}>검색 결과가 없습니다</p>
            <p className={styles.emptySub}>
              다른 검색어나 카테고리를 선택해보세요.
            </p>
          </div>
        )}
      </div>

      {/* ════════ 페이지네이션 ════════ */}
      {products.length > 0 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn}>«</button>
          <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
          <button className={styles.pageBtn}>2</button>
          <button className={styles.pageBtn}>3</button>
          <button className={styles.pageBtn}>»</button>
        </div>
      )}

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
    </div>
  );
}
