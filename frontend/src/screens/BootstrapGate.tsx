export function BootstrapGate({ boot }: { boot: { has_admin: boolean } | null }) {
  return (
    <div className="container">
      <div className="card">
        <h2>Loading…</h2>
        <div className="small">
          {boot ? (boot.has_admin ? "Admin exists." : "No admin yet. Owner can create admin with setup code.") : "Starting…"}
        </div>
      </div>
    </div>
  );
}