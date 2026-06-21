import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, suffix = '', className }: AnimatedCounterProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsub = display.on('change', (v) => setCurrent(v));
    return unsub;
  }, [value, spring, display]);

  return (
    <motion.span className={className}>
      {current}
      {suffix}
    </motion.span>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({ value, size = 120, strokeWidth = 8, className }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-hover)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <AnimatedCounter value={value} suffix="%" className="text-2xl font-bold text-text-primary" />
      </div>
    </div>
  );
}

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition = { duration: 0.3, ease: 'easeOut' };

export const cardHover = {
  whileHover: { scale: 1.02, y: -4 },
  transition: { duration: 0.3 },
};
