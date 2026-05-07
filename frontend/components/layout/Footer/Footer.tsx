import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

const FOOTER_LINKS = [
  { href: '/farm', label: '내 농장' },
  { href: '/balance', label: '밸런스' },
  { href: '/recommend', label: 'AI 추천' },
  { href: '/community', label: '커뮤니티' },
  { href: '/shop', label: '상점' },
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <Image src="/logo.png" alt="FarmBalance 로고" width={64} height={64} />
        <span>FarmBalance</span>
      </div>

      <div className={styles.links}>
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className={styles.copy}>
        © 2026 FarmBalance. All rights reserved.
      </div>
    </footer>
  );
}
