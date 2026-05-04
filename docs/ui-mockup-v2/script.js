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
})();
