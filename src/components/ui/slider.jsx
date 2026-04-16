import React from "react";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Slider({
  className = "",
  min = 0,
  max = 100,
  step = 1,
  value = [0],
  onValueChange,
}) {
  const current = value[0] ?? min;
  const span = max - min || 1;
  const pct = Math.min(100, Math.max(0, ((current - min) / span) * 100));
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      style={{ "--range-progress": `${pct}%` }}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={join("w-full", className)}
    />
  );
}
