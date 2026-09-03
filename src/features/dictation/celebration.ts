import type { Options } from 'canvas-confetti';

export function getDictationCelebrationBursts(accuracy: number): Options[] {
  const roundedAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)));

  if (roundedAccuracy < 60) {
    return [];
  }

  const sharedColors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  const overlayZIndex = 80;

  if (roundedAccuracy >= 90) {
    return [
      {
        zIndex: overlayZIndex,
        particleCount: 90,
        spread: 72,
        startVelocity: 46,
        origin: { x: 0.18, y: 0.72 },
        colors: sharedColors,
        scalar: 0.92,
      },
      {
        zIndex: overlayZIndex,
        particleCount: 90,
        spread: 72,
        startVelocity: 46,
        origin: { x: 0.82, y: 0.72 },
        colors: sharedColors,
        scalar: 0.92,
      },
    ];
  }

  if (roundedAccuracy >= 80) {
    return [
      {
        zIndex: overlayZIndex,
        particleCount: 105,
        spread: 64,
        startVelocity: 36,
        origin: { y: 0.72 },
        colors: sharedColors,
        scalar: 0.82,
      },
    ];
  }

  return [
    {
      zIndex: overlayZIndex,
      particleCount: 58,
      spread: 50,
      startVelocity: 28,
      origin: { y: 0.75 },
      colors: sharedColors,
      scalar: 0.72,
    },
  ];
}
