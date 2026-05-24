'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const MOBILE_BREAKPOINT = 1024;

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    const prevBodyBg = document.body.style.background;
    const prevBodyOverflowX = document.body.style.overflowX;
    document.body.style.background = '#F5F0E8';
    document.body.style.overflowX = 'hidden';

    // ── IntersectionObserver: show-up animations ──
    const showUpEls = root.querySelectorAll(`.${styles['show-up']}`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    showUpEls.forEach((el, i) => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(40px)';
      (el as HTMLElement).style.transition = `opacity 0.7s ease ${i * 0.06}s, transform 0.7s ease ${i * 0.06}s`;
      observer.observe(el);
    });

    // ── Counter animation ──
    const counters = root.querySelectorAll<HTMLElement>(`.${styles['stats__number']}[data-count]`);
    let counterDone = false;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !counterDone) {
            counterDone = true;
            animateCounters();
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = counters[0]?.closest(`.${styles.stats}`);
    if (statsSection) {
      counterObserver.observe(statsSection);
    }

    function animateCounters() {
      counters.forEach((counter) => {
        const target = parseInt(counter.dataset.count || '0', 10);
        const duration = 2000;
        const start = performance.now();

        function step(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          counter.textContent = Math.round(target * ease).toLocaleString();
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    // ── GSAP (client-only dynamic import) ──
    async function initGsap() {
      try {
        const gsap = (await import('gsap')).default;
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        if (cancelled) return;

        gsap.registerPlugin(ScrollTrigger);

        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        if (isMobile) return;

        ctx = gsap.context(() => {
          const floatLeft = gsap.to(`.${styles['hero__ball--left']}`, {
            y: 20,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          });

          const floatRight = gsap.to(`.${styles['hero__ball--right']}`, {
            y: 30,
            duration: 2.5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            delay: 0.5,
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: `.${styles.hero}`,
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
              onUpdate: (self) => {
                if (self.progress > 0) {
                  floatLeft.pause();
                  floatRight.pause();
                } else {
                  floatLeft.play();
                  floatRight.play();
                }
              },
            },
          });

          tl.to(`.${styles['hero__ball--left']}`, { top: '100%', yPercent: -80, duration: 1, ease: 'power2.in' }, 0)
            .to(`.${styles['hero__ball--right']}`, { top: '100%', yPercent: -80, duration: 1, ease: 'power2.in' }, 0)
            .to(`.${styles['flow-card--top']}`, { rotation: 18, transformOrigin: 'center top', duration: 1.5, ease: 'power1.inOut' }, 1.3)
            .to(`.${styles['hero__ball--left']}`, { left: '150%', y: '+=300', rotation: 200, duration: 1.5, ease: 'power1.in' }, 1.3)
            .to(`.${styles['hero__ball--right']}`, { right: '-100%', y: '+=300', rotation: 200, duration: 1.5, ease: 'power1.in' }, 1.3)
            .to(`.${styles['flow-card--top']}`, { rotation: 0, duration: 0.15, ease: 'back.out(3)' }, 2.8);

          gsap.fromTo(
            `.${styles['cta-circle--intro']}`,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: `.${styles['cta-circles-container']}`,
                start: 'top 80%',
                end: 'center center',
                scrub: 1.5,
              },
            }
          );

          gsap.fromTo(
            `.${styles['cta-circle--text']}`,
            { rotation: 25, opacity: 0, x: 150 },
            {
              rotation: 0,
              x: 0,
              opacity: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: `.${styles['cta-circles-container']}`,
                start: 'top 75%',
                end: 'center center',
                scrub: 1.5,
              },
            }
          );

          gsap.fromTo(
            `.${styles['dark-circle-badge']}`,
            { scale: 0.8 },
            {
              scale: 1.3,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: `.${styles['long-oval-wrapper']}`,
                start: 'top 90%',
                end: 'top 20%',
                scrub: 1.5,
              },
            }
          );

          gsap.fromTo(
            `.${styles['partners-circle-wrapper']}`,
            { y: 150, scale: 0.95, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: `.${styles['partners-circle-wrapper']}`,
                start: 'top 85%',
                end: 'center 60%',
                scrub: 1.5,
              },
            }
          );
        }, root as HTMLDivElement);

        ScrollTrigger.refresh();
      } catch (err) {
        console.error('[Landing] GSAP init failed:', err);
      }
    }

    void initGsap();

    return () => {
      cancelled = true;
      ctx?.revert();
      observer.disconnect();
      counterObserver.disconnect();
      document.body.style.background = prevBodyBg;
      document.body.style.overflowX = prevBodyOverflowX;
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.landingRoot}>
      <div className={styles['bg-dashes']} aria-hidden="true" />

      {/* HERO */}
      <section className={styles.hero} id="hero">
        <div className={styles['hero__wrapper']}>
          <div className={styles['hero__ball-container']}>
            <img className={`${styles['hero__ball']} ${styles['hero__ball--left']}`} src="/images/landing/cabbage.png" alt="배추" />
            <img className={`${styles['hero__ball']} ${styles['hero__ball--right']}`} src="/images/landing/onion.png" alt="양파" />
          </div>
          <div className={styles['hero__title']}>
            <div className={styles['hero__name']}>Farm</div>
            <div className={styles['hero__surname']}>Balance</div>
          </div>
          <img
            className={styles['hero__mobile-ball']}
            src="/images/landing/hero-ball.png"
            alt=""
            aria-hidden="true"
          />
          <p className={styles['hero__subtitle']}>
            <span className={styles.italic}>농업</span>의 중심에는 <span className={styles.italic}>균형</span>이 있습니다.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className={styles['content-flow']} id="about">
        <div className={styles['flow-card-wrapper']} style={{ position: 'relative', width: '88%', margin: '0 auto', zIndex: 2 }}>
          <div className={`${styles['flow-card']} ${styles['flow-card--top']}`} style={{ width: '100%', margin: 0 }}>
            <h2 className={styles['flow-card__title']}>데이터로 잇는 스마트 양평</h2>
            <div className={styles['flow-card__desc']}>
              <p>FarmBalance는 양평군 농업의 수급 불균형을</p>
              <p>데이터 기반으로 해결하는 스마트 플랫폼입니다</p>
              <p>농민과 소비자를 직접 연결하고</p>
              <p>안정적인 농업 생태계를 구축합니다</p>
            </div>
          </div>
          <div className={styles['flow-card__photo']}>
            <img src="/images/landing/farm-concept.png" alt="양평 농업 풍경" />
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 5 }}>
          <div className={styles['dark-circle-badge']}>
            <svg viewBox="0 0 300 300" className={styles['badge-text-svg']}>
              <path id="badgePath" fill="none" d="M 150, 150 m -120, 0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0" />
              <text>
                <textPath href="#badgePath" startOffset="25%" textAnchor="middle">
                  Let&apos;s see how I may help you
                </textPath>
              </text>
            </svg>
          </div>
        </div>

        <div className={styles['long-oval-wrapper']}>
          <div className={styles['flow-items']} id="features">
            <div className={`${styles['flow-item']} ${styles['show-up']}`}>
              <Link href="/balance" className={styles['flow-item__title']}>
                AI 수급 밸런스 <span className={styles.arrow}>→</span>
              </Link>
              <p className={styles['flow-item__sub']}>실시간 수급 예측과 AI 추천 점수로 양평군 농업의 불균형을 해결합니다</p>
            </div>
            <div className={`${styles['flow-item']} ${styles['show-up']}`}>
              <Link href="/farm" className={styles['flow-item__title']}>
                스마트 농장 관리 <span className={styles.arrow}>→</span>
              </Link>
              <p className={styles['flow-item__sub']}>간편한 농장 등록과 음성(STT) 기록으로 나만의 영농 일지를 관리하세요</p>
            </div>
            <div className={`${styles['flow-item']} ${styles['show-up']}`}>
              <Link href="/shop" className={styles['flow-item__title']}>
                양평 장터 <span className={styles.arrow}>→</span>
              </Link>
              <p className={styles['flow-item__sub']}>중간 유통 과정 없이 신선한 양평 농산물을 소비자와 직접 거래합니다</p>
            </div>
            <div className={`${styles['flow-item']} ${styles['show-up']}`}>
              <Link href="/community" className={styles['flow-item__title']}>
                AI 정책 &amp; 커뮤니티 <span className={styles.arrow}>→</span>
              </Link>
              <p className={styles['flow-item__sub']}>AI가 맞춤형 지원 정책을 찾아주고, 농민들 간의 생생한 노하우를 나눕니다</p>
            </div>
          </div>

          <div className={`${styles['flow-photo']} ${styles['flow-photo--right']} ${styles['show-up']}`}>
            <img src="/images/landing/farm-data.png" alt="스마트 농업 데이터" />
          </div>

          <section className={styles.stats}>
            <div className={styles['stats__inner']}>
              <div className={styles['stats__item']}>
                <div className={styles['stats__number']} data-count="324">0</div>
                <div className={styles['stats__label']}>양평군 등록 농가</div>
              </div>
              <div className={styles['stats__item']}>
                <div className={styles['stats__number']} data-count="28">0</div>
                <div className={styles['stats__label']}>수급 관리 작물 종</div>
              </div>
              <div className={styles['stats__item']}>
                <div className={styles['stats__number']} data-count="1250">0</div>
                <div className={styles['stats__label']}>맞춤 정책 매칭 건수</div>
              </div>
              <div className={styles['stats__item']}>
                <div className={styles['stats__number']} data-count="95">0</div>
                <div className={styles['stats__label']}>AI 추천 만족도 (%)</div>
              </div>
            </div>
          </section>

          <div className={styles['cta-circles-container']} id="contact">
            <div className={`${styles['cta-circle']} ${styles['cta-circle--intro']}`}>
              <svg viewBox="0 0 500 500" className={styles['circular-text-svg']}>
                <path id="circlePath" fill="none" d="M 250, 250 m -220, 0 a 220,220 0 1,1 440,0 a 220,220 0 1,1 -440,0" />
                <text>
                  <textPath href="#circlePath" startOffset="0%">
                    FarmBalance • Data-driven Agriculture Ecosystem • Yangpyeong • FarmBalance • Data-driven Agriculture Ecosystem • Yangpyeong •
                  </textPath>
                </text>
              </svg>
              <div className={styles['intro-content']}>
                <h3 className={styles['intro-content__ko']}>
                  <span className={styles['font-italic']}>데이터</span>가 이끄는<br />양평 농업의 내일
                </h3>
                <p className={styles['intro-content__desc']}>
                  생산과 소비의 완벽한 균형을 찾아<br />모두가 미소 짓는 풍요로운 생태계를 만듭니다.
                </p>
              </div>
            </div>

            <div className={`${styles['cta-circle']} ${styles['cta-circle--text']}`}>
              <h2 className={styles['cta-circle__title']}>
                <span className={styles['font-italic']}>시작</span>할<br />준비 되셨나요?
              </h2>
              <p className={styles['cta-circle__desc']}>
                지금 팜밸런스에 농장을 등록하고<br />스마트한 수급 관리를 경험해 보세요.
              </p>
              <div className={styles['cta-circle__buttons']}>
                <Link href="/farm/register" className={`${styles['flow-btn']} ${styles['flow-btn--primary']}`}>
                  농장 등록하기
                </Link>
                <Link href="/balance" className={`${styles['flow-btn']} ${styles['flow-btn--secondary']}`}>
                  둘러보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LINKS */}
      <section className={styles['partners-circle-wrapper']}>
        <section className={styles.links} id="links">
          <div className={`${styles['links__header']} ${styles['show-up']}`}>
            <span className={styles['links__tag']}>Partners &amp; Channels</span>
            <h2 className={styles['links__title']}>
              함께하는 <span className={styles['font-italic']}>파트너</span>
            </h2>
            <p className={styles['links__desc']}>농업과 지역을 잇는 유용한 채널들을 만나보세요.</p>
          </div>
          <div className={styles['links__grid']}>
            <a className={`${styles['links__card']} ${styles['show-up']}`} href="https://www.nongsaro.go.kr" target="_blank" rel="noopener noreferrer">
              <span className={styles['links__card-num']}>01</span>
              <span className={styles['links__card-icon']}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22V12" />
                  <path d="M12 12C12 12 8 8 8 5a4 4 0 0 1 8 0c0 3-4 7-4 7z" />
                  <path d="M7 22h10" />
                  <path d="M17 14c1.5 1 3 3 3 5" />
                  <path d="M7 14c-1.5 1-3 3-3 5" />
                </svg>
              </span>
              <div className={styles['links__card-body']}>
                <span className={styles['links__card-name']}>농사로</span>
                <span className={styles['links__card-desc']}>농촌진흥청 공식 영농 정보 포털</span>
              </div>
              <svg className={styles['links__card-arrow']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a className={`${styles['links__card']} ${styles['show-up']}`} href="https://www.yp21.go.kr" target="_blank" rel="noopener noreferrer">
              <span className={styles['links__card-num']}>02</span>
              <span className={styles['links__card-icon']}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-4h6v4" />
                  <path d="M9 10h1" />
                  <path d="M14 10h1" />
                  <path d="M9 14h1" />
                  <path d="M14 14h1" />
                </svg>
              </span>
              <div className={styles['links__card-body']}>
                <span className={styles['links__card-name']}>양평군청</span>
                <span className={styles['links__card-desc']}>양평군 공식 행정 홈페이지</span>
              </div>
              <svg className={styles['links__card-arrow']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a className={`${styles['links__card']} ${styles['show-up']}`} href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              <span className={styles['links__card-num']}>03</span>
              <span className={styles['links__card-icon']}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div className={styles['links__card-body']}>
                <span className={styles['links__card-name']}>Instagram</span>
                <span className={styles['links__card-desc']}>FarmBalance 최신 소식 팔로우</span>
              </div>
              <svg className={styles['links__card-arrow']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a className={`${styles['links__card']} ${styles['show-up']}`} href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
              <span className={styles['links__card-num']}>04</span>
              <span className={styles['links__card-icon']}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17V7a2.5 2.5 0 0 1 2.5-2.5h14A2.5 2.5 0 0 1 21.5 7v10a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 17z" />
                  <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div className={styles['links__card-body']}>
                <span className={styles['links__card-name']}>YouTube</span>
                <span className={styles['links__card-desc']}>농업 가이드 영상 채널</span>
              </div>
              <svg className={styles['links__card-arrow']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a className={`${styles['links__card']} ${styles['show-up']}`} href="https://www.kamis.or.kr" target="_blank" rel="noopener noreferrer">
              <span className={styles['links__card-num']}>05</span>
              <span className={styles['links__card-icon']}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-6 4 4 5-8" />
                  <circle cx="20" cy="6" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div className={styles['links__card-body']}>
                <span className={styles['links__card-name']}>KAMIS</span>
                <span className={styles['links__card-desc']}>농산물 유통 정보 시스템</span>
              </div>
              <svg className={styles['links__card-arrow']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a className={`${styles['links__card']} ${styles['show-up']}`} href="https://blog.naver.com" target="_blank" rel="noopener noreferrer">
              <span className={styles['links__card-num']}>06</span>
              <span className={styles['links__card-icon']}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  <path d="M15 5l4 4" />
                </svg>
              </span>
              <div className={styles['links__card-body']}>
                <span className={styles['links__card-name']}>Blog</span>
                <span className={styles['links__card-desc']}>양평 농업 이야기 블로그</span>
              </div>
              <svg className={styles['links__card-arrow']} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>
      </section>
    </div>
  );
}
