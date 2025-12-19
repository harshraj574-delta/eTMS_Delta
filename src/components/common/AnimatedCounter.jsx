import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

const AnimatedCounter = ({ value, duration = 1 }) => {
  const spring = useSpring(0, { 
    duration: duration * 1000,
    bounce: 0
  });
  
  const display = useTransform(spring, (current) => {
    // Ensure we never show negative numbers and clamp to 0
    const rounded = Math.max(0, Math.round(current));
    return rounded.toLocaleString();
  });

  useEffect(() => {
    spring.set(value || 0);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

export default AnimatedCounter;
