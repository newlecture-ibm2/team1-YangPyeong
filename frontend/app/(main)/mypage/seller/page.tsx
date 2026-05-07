'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Badge from '@/components/common/Badge/Badge';
import Modal from '@/components/common/Modal/Modal';
import Spinner from '@/components/common/Spinner/Spinner';
import { PRODUCT_STATUS_MAP } from '../_lib/mypage.types';
import useSellerProducts from './useSellerProducts';
import useSellerInsight from './useSellerInsight';
import styles from './page.module.css';

/** S-35a. 판매 상품 관리 페이지 */
export default function SellerProductsPage() {
  const router = useRouter();
  const {
    products,
    stats,
    deleteTarget,
    handleDelete,
    confirmDelete,
    cancelDelete,
    loading: productsLoading,
  } = useSellerProducts();

  const { insight, loading: insightLoading, refreshInsight } = useSellerInsight(products);

  /** 가격 포맷 */
  const formatPrice = (price: number) =>
    `₩${price.toLocaleString('ko-KR')}`;

  return (
    <>
      {/* 상단 요약 + 등록 버튼 */}
      <div className={styles.topBar}>
        <div className={styles.statsRow}>
          <span className={styles.statItem}>
            전체 <strong>{stats.total}</strong>
          </span>
          <span className={styles.statDivider}>|</span>
          <span className={styles.statItem}>
            판매중 <strong className={styles.statActive}>{stats.active}</strong>
          </span>
          <span className={styles.statDivider}>|</span>
          <span className={styles.statItem}>
            품절 <strong className={styles.statSoldout}>{stats.soldout}</strong>
          </span>
          <span className={styles.statDivider}>|</span>
          <span className={styles.statItem}>
            숨김 <strong>{stats.inactive}</strong>
          </span>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/mypage/seller/register')}
        >
          ＋ 새 상품 등록
        </Button>
      </div>

      {/* AI 인사이트 카드 */}
      {!productsLoading && products.length > 0 && (
        <div className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              <span className={styles.insightIcon}>🤖</span>
              오늘의 AI 판매 인사이트
            </h3>
            <button 
              className={styles.refreshBtn} 
              onClick={refreshInsight}
              disabled={insightLoading}
              title="인사이트 새로고침"
            >
              {insightLoading ? '분석 중...' : '↻ 새로고침'}
            </button>
          </div>
          {insightLoading && !insight ? (
            <p className={styles.insightContent} style={{ color: 'var(--color-text-secondary)' }}>
              판매자님의 데이터를 분석하고 있습니다...
            </p>
          ) : insight ? (
            <p className={styles.insightContent}>
              {insight.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
          ) : null}
        </div>
      )}

      {/* 상품 테이블 */}
      {productsLoading ? (
        <Spinner message="판매 상품 목록을 불러오는 중입니다..." fullHeight={true} />
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>🏷️</p>
          <p className={styles.emptyText}>등록된 상품이 없습니다.</p>
          <Button
            variant="primary"
            onClick={() => router.push('/mypage/seller/register')}
          >
            첫 상품 등록하기
          </Button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thLeft}>상품명</th>
                <th>가격</th>
                <th>재고</th>
                <th>판매량</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const statusInfo = PRODUCT_STATUS_MAP[product.status];
                return (
                  <tr key={product.id}>
                    <td className={styles.tdProduct}>
                      <span className={styles.productName}>{product.name}</span>
                      <span className={styles.productCategory}>{product.categoryName}</span>
                    </td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <span className={product.stock === 0 ? styles.stockZero : ''}>
                        {product.stock}개
                      </span>
                    </td>
                    <td>{product.salesCount}개</td>
                    <td>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/mypage/seller/${product.id}/edit`)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product)}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={cancelDelete}
        title="상품 삭제"
        size="sm"
      >
        <div className={styles.deleteModal}>
          <p>
            <strong>{deleteTarget?.name}</strong> 상품을 삭제하시겠습니까?
          </p>
          <p className={styles.deleteWarning}>
            삭제된 상품은 복구할 수 없습니다.
          </p>
          <div className={styles.deleteActions}>
            <Button variant="outline" onClick={cancelDelete}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              style={{ background: 'var(--color-danger)' }}
            >
              삭제하기
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
