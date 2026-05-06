'use client';

import Link from 'next/link';
import { Badge, Button } from '@/components';
import type { Product } from './_lib/shop.types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
}

/** 상품 목록 페이지 전용 상품 카드 */
export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  /** 장바구니 버튼 — 부모 Link 이동 차단 후 콜백 실행 */
  const handleCartMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCartClick = () => {
    onAddToCart?.(product.id);
  };

  /** 가격 포맷 (원화) */
  const formattedPrice = new Intl.NumberFormat('ko-KR').format(product.price);

  return (
    <Link href={`/shop/${product.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        {/* 상품 이미지 */}
        <div className={styles.imageWrapper}>
          {product.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder}>🖼️</div>
          )}
          {product.stock <= 0 && (
            <div className={styles.soldOutOverlay}>
              <span className={styles.soldOutText}>품절</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className={styles.info}>
          <Badge variant="green" className={styles.category}>
            {product.categoryName}
          </Badge>
          <h4 className={styles.name}>{product.name}</h4>
          <p className={styles.seller}>{product.sellerName}</p>
          <div className={styles.bottom}>
            <strong className={styles.price}>
              {product.stock <= 0 ? (
                <span className={styles.soldOutPrice}>품절</span>
              ) : (
                <>₩{formattedPrice}</>
              )}
            </strong>
            {/* onMouseDown으로 Link 이벤트 차단, onClick으로 콜백 실행 */}
            <span onMouseDown={handleCartMouseDown} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <Button
                variant="primary"
                size="sm"
                className={styles.cartBtn}
                onClick={handleCartClick}
                disabled={product.stock <= 0}
              >
                🛒
              </Button>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
