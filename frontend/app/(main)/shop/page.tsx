'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown, SearchInput, Modal, Button, Spinner, FilterBar } from '@/components';
import { useToast } from '@/components';
import ProductCard from './ProductCard';
import { useProducts } from './useProducts';
import { addToCart } from './_lib/shop.api';
import styles from './page.module.css';

/** 상점 — 상품 목록 페이지 */
export default function ShopBrowsePage() {
  const {
    products,
    loading,
    category,
    sort,
    keyword,
    page,
    totalPages,
    setPage,
    setCategory,
    setSort,
    setKeyword,
    handleSearch,
    sortOptions,
    categoryTabs,
  } = useProducts();

  const { success: toastSuccess } = useToast();
  const router = useRouter();

  // 쿠키 기반 로그인 상태 확인 (fb-user는 httpOnly: false)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(document.cookie.includes('fb-user'));
  }, []);

  /** 로그인 필요 모달 */
  const [showLoginModal, setShowLoginModal] = useState(false);

  /** 장바구니 담기 핸들러 (로그인 체크 포함) */
  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const result = await addToCart(productId, 1);
    if (result.success) {
      const product = products.find((p) => p.id === productId);
      toastSuccess(`🛒 ${product?.name || '상품'}을(를) 장바구니에 담았습니다.`);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  };

  return (
    <div className={styles.page}>
      {/* ════════ 페이지 헤더 ════════ */}
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>홈 / 장터</p>
          <h1 className={styles.pageTitle}>
            상점 <em>둘러보기</em>
          </h1>
          <p className={styles.pageSub}>
            양평군 신선한 농산물을 직접 구매하세요.
          </p>
        </div>
      </div>

      {/* ════════ 카테고리 탭 ════════ */}
      <div className={styles.tabs} data-guide="shop-category">
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
      <div className={styles.filterSection} data-guide="shop-search">
        <FilterBar
          dropdowns={[
            <Dropdown
              key="sort"
              options={sortOptions}
              value={sort}
              onChange={(value) => setSort(value as typeof sort)}
              size="sm"
            />,
          ]}
          search={
            <SearchInput
              placeholder="상품 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
              size="sm"
            />
          }
        />
      </div>

      {/* ════════ 상품 그리드 ════════ */}
      <div className={styles.productGrid} data-guide="shop-products">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', minHeight: '300px' }}>
            <Spinner message="상품을 불러오는 중입니다..." fullHeight={false} />
          </div>
        ) : products.length > 0 ? (
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
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage(0)}
          >
            «
          </button>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(p)}
              >
                {p + 1}
              </button>
            ))}
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(totalPages - 1)}
          >
            »
          </button>
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
