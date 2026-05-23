/**
 * FarmBalance Landing Page V2 — Interactions
 * - Header scroll effect
 * - Scroll-triggered show-up animations
 * - Counter animation for stats
 */
(function () {
  'use strict';

  // ── Header scroll ──
  const header = document.getElementById('header');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    if (y > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── IntersectionObserver: show-up animations ──
  const showUpEls = document.querySelectorAll('.show-up, .text-block, .features__card, .values__item, .introduction__title, .features__title, .values__title, .contact__title');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  showUpEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = `opacity 0.7s ease ${i * 0.06}s, transform 0.7s ease ${i * 0.06}s`;
    observer.observe(el);
  });

  // ── Counter animation ──
  const counters = document.querySelectorAll('.stats__number[data-count]');
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

  if (counters.length) {
    counterObserver.observe(counters[0].closest('.stats'));
  }

  function animateCounters() {
    counters.forEach((counter) => {
      const target = parseInt(counter.dataset.count, 10);
      const duration = 2000;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * ease).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // ── Smooth scroll for nav links ──
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── GSAP Scroll Physics Animation ──
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Floating animation (repeating)
    const floatLeft = gsap.to('.hero__ball--left', {
      y: 20,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    const floatRight = gsap.to('.hero__ball--right', {
      y: 30,
      duration: 2.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 0.5
    });

    // Scroll sequence
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          if (self.progress > 0) {
            floatLeft.pause();
            floatRight.pause();
          } else {
            floatLeft.play();
            floatRight.play();
          }
        }
      }
    });

    // 1. Drop the balls
    tl.to('.hero__ball--left', { top: "100%", yPercent: -80, duration: 1, ease: "power2.in" }, 0)
      .to('.hero__ball--right', { top: "100%", yPercent: -80, duration: 1, ease: "power2.in" }, 0)
    // (Pause for a moment: Next animation starts at 1.3)
    // 2. Tilt the top flow-card (angle reduced to 18) AND Roll balls at the exact same time
      .to('.flow-card--top', { rotation: 18, transformOrigin: "center top", duration: 1.5, ease: "power1.inOut" }, 1.3)
      .to('.hero__ball--left', { left: "150%", y: "+=300", rotation: 200, duration: 1.5, ease: "power1.in" }, 1.3)
      .to('.hero__ball--right', { right: "-100%", y: "+=300", rotation: 200, duration: 1.5, ease: "power1.in" }, 1.3)
    // 3. Return seesaw to its original position very quickly with a tight bounce
      .to('.flow-card--top', { rotation: 0, duration: 0.15, ease: "back.out(3)" }, 2.8);

    gsap.fromTo('.cta-circle--intro', 
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".cta-circles-container",
          start: "top 80%",
          end: "center center",
          scrub: 1.5
        }
      }
    );

    gsap.fromTo('.cta-circle--text', 
      { rotation: 25, opacity: 0, x: 150 },
      {
        rotation: 0,
        x: 0,
        opacity: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".cta-circles-container",
          start: "top 75%",
          end: "center center",
          scrub: 1.5
        }
      }
    );

    // Green circle animation
    gsap.fromTo('.dark-circle-badge', 
      { scale: 0.8 },
      {
        scale: 1.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".long-oval-wrapper",
          start: "top 90%",
          end: "top 20%",
          scrub: 1.5
        }
      }
    );

    // Partners large empty circle - Clean fade & parallax
    gsap.fromTo('.partners-circle-wrapper',
      { y: 150, scale: 0.95, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".partners-circle-wrapper",
          start: "top 85%",
          end: "center 60%",
          scrub: 1.5
        }
      }
    );
  }

})();
