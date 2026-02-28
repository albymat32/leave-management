import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "#ffffff",
        color: "#111827",          // 👈 force dark text
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      }}
    >
      {children}
    </div>
  );
}