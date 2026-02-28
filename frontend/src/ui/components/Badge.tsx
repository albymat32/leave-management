import type { ReactNode } from "react";

type BadgeTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, { bg: string; color: string }> = {
  default: { bg: "#e5e7eb", color: "#374151" },
  success: { bg: "#dcfce7", color: "#166534" },
  warning: { bg: "#fef3c7", color: "#92400e" },
  danger:  { bg: "#fee2e2", color: "#991b1b" },
  info:    { bg: "#dbeafe", color: "#1e40af" },
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  const t = tones[tone];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}