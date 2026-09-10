declare module 'canvas-confetti' {
  export type ConfettiParticle = {
    x?: number;
    y?: number;
    startVelocity?: number;
    spread?: number;
    ticks?: number;
    gravity?: number;
    drift?: number;
    colors?: string[];
    scalar?: number;
    decay?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    disableForReducedMotion?: boolean;
    [key: string]: unknown;
  };

  export type ConfettiOptions = ConfettiParticle;

  export default function confetti(options?: ConfettiOptions): boolean;
}
