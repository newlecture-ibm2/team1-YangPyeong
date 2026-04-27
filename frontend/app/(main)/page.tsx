import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <>
      {/* ════════ HERO ════════ */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            땅에 뿌리를 내리고,<br />
            <em>데이터로 혁신하다</em>
          </h1>
          <p>
            양평군의 작물 수급 균형과 농가 소득 안정을 위한 AI 기반 스마트 농업 플랫폼.
            데이터가 만드는 농업의 새로운 미래를 경험하세요.
          </p>
          <div className={styles.heroBtns}>
            <Link href="/signup" className={`${styles.btnHero} ${styles.btnHeroPrimary}`}>
              무료로 시작하기
            </Link>
            <Link href="/balance" className={`${styles.btnHero} ${styles.btnHeroGhost}`}>
              수급 현황 보기
            </Link>
          </div>
        </div>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeNum}>342</span>
          <span className={styles.heroBadgeLabel}>등록 농가 수</span>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className={styles.sectionCream}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Core Features</p>
          <h2 className={styles.sectionTitle}>
            스마트한 농업을 위한<br />핵심 기능
          </h2>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featCard}>
            <div className={styles.featIcon}>📊</div>
            <h3>실시간 수급 밸런스</h3>
            <p>지역별·작물별 수급 현황을 실시간으로 확인하고 최적의 재배 결정을 내리세요.</p>
          </div>
          <div className={styles.featCard}>
            <div className={styles.featIcon}>🤖</div>
            <h3>AI 작물 추천</h3>
            <p>토양, 기후, 수급 데이터를 분석하여 나에게 맞는 최적의 작물을 추천합니다.</p>
          </div>
          <div className={styles.featCard}>
            <div className={styles.featIcon}>🛒</div>
            <h3>농산물 직거래</h3>
            <p>산지에서 소비자까지, 신선한 농산물을 합리적인 가격에 직거래하세요.</p>
          </div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className={styles.sectionDark}>
        <div className={styles.statsContent}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statNum}>342</div>
              <div className={styles.statLabel}>등록 농가 수</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>98%</div>
              <div className={styles.statLabel}>AI 추천 정확도</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>15종</div>
              <div className={styles.statLabel}>모니터링 작물</div>
            </div>
          </div>
          <div className={styles.ctaBlock}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80"
              alt="농업 현장"
              className={styles.ctaImg}
            />
            <div className={styles.ctaText}>
              <h2>수급 체인을 단축했습니다.<br />이제 무엇을 기를지<br />당신이 결정하세요.</h2>
              <p>FarmBalance가 양평군의 수급 데이터를 분석하여 과잉과 부족을 사전에 감지하고, AI가 농장에 최적화된 작물을 추천합니다.</p>
              <Link href="/signup" className={styles.btnCta}>
                지금 시작하기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
