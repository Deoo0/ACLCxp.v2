import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

interface PageTransitionProps {
  children?: ReactNode;
}

/** Animates route content only; surrounding navigation stays fixed in place. */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const transition: Transition = reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] };
  const content = children ?? outlet;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${location.pathname}${location.search}`}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -3 }}
        transition={transition}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
