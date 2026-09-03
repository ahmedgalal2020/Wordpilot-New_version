import { useEffect, type RefObject } from 'react';
import { animate, createScope, onScroll, stagger } from 'animejs';

export function useHomepageAnimations(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      root.querySelectorAll<HTMLElement>('[data-homepage-animate]').forEach((element) => {
        element.style.opacity = '1';
        element.style.transform = 'none';
      });
      return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const revealY = isMobile ? 10 : 18;
    const visualY = isMobile ? -8 : -18;

    const scope = createScope({ root }).add(() => {
      const heroCopy = root.querySelector<HTMLElement>('[data-homepage-hero-copy]');
      const heroActions = root.querySelector<HTMLElement>('[data-homepage-hero-actions]');
      const heroVisual = root.querySelector<HTMLElement>('[data-homepage-hero-visual]');
      const heroMetrics = root.querySelector<HTMLElement>('[data-homepage-hero-metrics]');

      if (heroCopy) {
        animate(heroCopy, {
          opacity: [0, 1],
          y: [revealY, 0],
          duration: 520,
          ease: 'outCubic',
        });
      }

      if (heroActions) {
        animate(heroActions.children, {
          opacity: [0, 1],
          y: [12, 0],
          scale: [0.98, 1],
          delay: stagger(45),
          duration: 420,
          ease: 'outCubic',
        });
      }

      if (heroMetrics) {
        animate(heroMetrics.children, {
          opacity: [0, 1],
          y: [revealY, 0],
          scale: [0.985, 1],
          delay: stagger(55),
          duration: 460,
          ease: 'outCubic',
        });
      }

      if (heroVisual) {
        animate(heroVisual, {
          opacity: [0, 1],
          y: [revealY, 0],
          scale: [0.985, 1],
          duration: 520,
          delay: 80,
          ease: 'outCubic',
        });

        animate(heroVisual, {
          y: [0, visualY],
          scale: [1, isMobile ? 0.995 : 0.985],
          ease: 'linear',
          autoplay: onScroll({
            target: heroVisual,
            enter: 'top 88%',
            leave: 'bottom top',
            sync: 0.18,
          }),
        });
      }

      root.querySelectorAll<HTMLElement>('[data-homepage-reveal]').forEach((element) => {
        animate(element, {
          opacity: [0, 1],
          y: [revealY, 0],
          duration: 430,
          ease: 'outCubic',
          autoplay: onScroll({
            target: element,
            enter: 'bottom 98%',
            leave: 'top 12%',
            sync: 0.08,
          }),
        });
      });

      root.querySelectorAll<HTMLElement>('[data-homepage-stagger]').forEach((group) => {
        const staggerItems = Array.from(group.children) as HTMLElement[];
        const visibleStaggerItems = staggerItems.filter((child) => !child.hasAttribute('data-homepage-stagger'));
        if (visibleStaggerItems.length === 0) return;

        animate(visibleStaggerItems, {
          opacity: [0, 1],
          y: [isMobile ? 8 : 16, 0],
          scale: [0.99, 1],
          delay: stagger(isMobile ? 20 : 35),
          duration: 390,
          ease: 'outCubic',
          autoplay: onScroll({
            target: group,
            enter: 'bottom 98%',
            leave: 'top 10%',
            sync: 0.06,
          }),
        });
      });

      root.querySelectorAll<HTMLElement>('[data-homepage-float]').forEach((element) => {
        animate(element, {
          y: [isMobile ? 8 : 18, isMobile ? -8 : -18],
          scale: [0.995, 1],
          ease: 'linear',
          autoplay: onScroll({
            target: element,
            enter: 'bottom bottom',
            leave: 'top top',
            sync: 0.16,
          }),
        });
      });
    });

    return () => scope.revert();
  }, [rootRef]);
}
