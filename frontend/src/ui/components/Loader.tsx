export function Loader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loaderWrap">
      <div className="spinner" />
      <div className="loaderText">{label}</div>
    </div>
  );
}