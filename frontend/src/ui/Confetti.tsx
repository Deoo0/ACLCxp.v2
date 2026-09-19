import confetti from 'canvas-confetti';

export function burstConfetti() {
  confetti({
    particleCount: 120,
    spread: 160,
    origin: { y: 0.6 }
  });
}

export default burstConfetti;
