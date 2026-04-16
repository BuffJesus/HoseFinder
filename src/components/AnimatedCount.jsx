// Animated numeric count — slides in/out on every value change. Used for
// result totals, live match counts, etc. Key is the value itself so framer
// triggers enter/exit on each update.

import React from "react";
import { motion } from "framer-motion";

/** @param {{ value: number, className?: string }} props */
export function AnimatedCount({ value, className = "" }) {
  return (
    <span className={`inline-flex overflow-hidden tabular-nums ${className}`.trim()}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {value.toLocaleString()}
      </motion.span>
    </span>
  );
}
