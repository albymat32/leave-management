export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "secondary" | "ok" | "danger" }) {
  const tone = props.tone ?? "primary";
  const cls =
    tone === "secondary" ? "btn secondary" :
    tone === "ok" ? "btn ok" :
    tone === "danger" ? "btn danger" :
    "btn";
  return <button {...props} className={cls + (props.className ? ` ${props.className}` : "")} />;
}