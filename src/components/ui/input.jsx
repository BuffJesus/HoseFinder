import React from "react";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export const Input = React.forwardRef(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={join(
        "h-11 w-full rounded-md border border-zinc-800 px-3.5 py-2 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-zinc-600 focus:border-violet-400/60 focus:bg-white/[0.04] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
      {...props}
    />
  );
});
