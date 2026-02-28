export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="btn secondary"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
    >
      <span>{value ? "ON" : "OFF"}</span>
      <span className="small">{value ? "Enabled" : "Disabled"}</span>
    </button>
  );
}