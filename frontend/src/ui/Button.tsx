import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, children, ...rest }) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2';
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-soft-md',
    secondary: 'bg-[var(--color-surface)] border border-[var(--card-border)] text-[var(--text)]',
    ghost: 'bg-transparent text-[var(--text)]'
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };

  return (
    <motion.button whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }} className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </motion.button>
  );
};

export default Button;
