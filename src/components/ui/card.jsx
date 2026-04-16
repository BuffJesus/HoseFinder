import React from "react";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className = "", ...props }) {
  return <div className={join("rounded-lg", className)} {...props} />;
}

export function CardHeader({ className = "", ...props }) {
  return <div className={join("p-6 pb-0", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={join("text-lg font-semibold", className)} {...props} />;
}

export function CardDescription({ className = "", ...props }) {
  return <p className={join("text-sm text-zinc-400", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={join("p-6", className)} {...props} />;
}
