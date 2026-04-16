import React from "react";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

const sizeMap = {
  default: "h-10 px-4 py-2",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef(
  /** @param {React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string }} props */
  function Button({ className = "", size = "default", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={join(
        "inline-flex items-center justify-center rounded-md transition disabled:pointer-events-none disabled:opacity-50",
        sizeMap[size] || sizeMap.default,
        className,
      )}
      {...props}
    />
  );
});
