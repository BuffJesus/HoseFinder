import React from "react";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Badge({ className = "", ...props }) {
  return (
    <span
      className={join("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
      {...props}
    />
  );
}
