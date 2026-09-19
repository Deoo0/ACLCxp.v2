import React from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

type AnimatedNumberProps = { value: number; duration?: number; className?: string };

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1.2, className }) => {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = React.useState<number>(Math.round(value));

  React.useEffect(() => {
    // reset to 0 first for effect
    motionVal.set(0);
    const controls = animate(motionVal, value, {
      duration,
      onUpdate: (v: number) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <motion.span className={className}>{display.toLocaleString()}</motion.span>;
};

export default AnimatedNumber;
