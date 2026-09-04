import { useEffect, type RefObject } from 'react';
import { animate, createScope, stagger } from 'animejs';

const REVEAL_SELECTOR = '[data-homepage-reveal], [data-homepage-float]';
const STAGGER_SELECTOR = '[data-homepage-stagger]';

export function useHomepageAnimations(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      showImmediately(root);
      return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const liftDistance = isMobile ? 12 : 20;

    let observer: IntersectionObserver | null = null;

    const scope = createScope({ root }).add(() => {
      animateHero(root, liftDistance);
      prepareRevealElements(root, liftDistance);
      observer = revealOnEntry(root, isMobile, liftDistance);
    });

    return () => {
      observer?.disconnect();
      scope.revert();
    };
  }, [rootRef]);
}

function showImmediately(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-homepage-animate]').forEach((element) => {
    element.style.opacity = '1';
    element.style.transform = 'none';
  });
}

function animateHero(root: HTMLElement, liftDistance: number) {
  const heroCopy = root.querySelector<HTMLElement>('[data-homepage-hero-copy]');
  const heroActions = root.querySelector<HTMLElement>('[data-homepage-hero-actions]');
  const heroVisual = root.querySelector<HTMLElement>('[data-homepage-hero-visual]');
  const heroMetrics = root.querySelector<HTMLElement>('[data-homepage-hero-metrics]');

  if (heroCopy) {
    animate(heroCopy, {
      opacity: [0, 1],
      y: [liftDistance, 0],
      duration: 420,
      ease: 'outCubic',
    });
  }

  if (heroActions) {
    animate(heroActions.children, {
      opacity: [0, 1],
      y: [10, 0],
      scale: [0.98, 1],
      delay: stagger(35),
      duration: 360,
      ease: 'outCubic',
    });
  }

  if (heroVisual) {
    animate(heroVisual, {
      opacity: [0, 1],
      y: [liftDistance, 0],
      scale: [0.985, 1],
      duration: 440,
      delay: 70,
      ease: 'outCubic',
    });

    animate(heroVisual, {
      y: [0, -6, 0],
      duration: 4600,
      delay: 560,
      loop: true,
      alternate: true,
      ease: 'inOutSine',
    });
  }

  if (heroMetrics) {
    animate(heroMetrics.children, {
      opacity: [0, 1],
      y: [liftDistance, 0],
      scale: [0.98, 1],
      delay: stagger(45),
      duration: 380,
      ease: 'outCubic',
    });
  }
}

function prepareRevealElements(root: HTMLElement, liftDistance: number) {
  root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = `translate3d(0, ${liftDistance}px, 0)`;
  });

  root.querySelectorAll<HTMLElement>(STAGGER_SELECTOR).forEach((group) => {
    getStaggerItems(group).forEach((element) => {
      element.style.opacity = '0';
      element.style.transform = `translate3d(0, ${Math.max(8, liftDistance - 4)}px, 0) scale(0.99)`;
    });
  });
}

function revealOnEntry(root: HTMLElement, isMobile: boolean, liftDistance: number) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target as HTMLElement;
        observer.unobserve(element);

        if (element.matches(REVEAL_SELECTOR)) {
          animate(element, {
            opacity: [0, 1],
            y: [liftDistance, 0],
            duration: 330,
            ease: 'outCubic',
          });
        }

        if (element.matches(STAGGER_SELECTOR)) {
          const items = getStaggerItems(element);
          if (items.length > 0) {
            animate(items, {
              opacity: [0, 1],
              y: [isMobile ? 8 : 14, 0],
              scale: [0.99, 1],
              delay: stagger(isMobile ? 16 : 26),
              duration: 310,
              ease: 'outCubic',
            });
          }
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px',
    },
  );

  root.querySelectorAll<HTMLElement>(`${REVEAL_SELECTOR}, ${STAGGER_SELECTOR}`).forEach((element) => {
    observer.observe(element);
  });

  return observer;
}

function getStaggerItems(group: HTMLElement) {
  return Array.from(group.children).filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute('data-homepage-stagger'));
}
