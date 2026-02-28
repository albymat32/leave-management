import { useState } from "react";
import { Api } from "../app/api";
import { Button } from "../ui/components/Button";
import { Card } from "../ui/components/Card";

export function RegisterAdmin({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [setupCode, setSetupCode] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card>
      <h2>Create Admin</h2>
      <div className="small">Owner-only. Needs setup code.</div>

      <label>Setup Code</label>
      <input value={setupCode} onChange={(e) => setSetupCode(e.target.value)} placeholder="Setup code" />

      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>DOB</label>
      <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" />

      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />

      {err ? <div className="small" style={{ color: "var(--bad)" }}>{err}</div> : null}

      <div className="stickyBar">
        <Button
          onClick={async () => {
            try {
              setErr(null);
              await Api.registerAdmin({ setupCode, name, dob, email });
              onDone();
            } catch {
              setErr("Setup code invalid or admin already exists.");
            }
          }}
        >
          Create Admin
        </Button>
        <div style={{ height: 10 }} />
        <Button tone="secondary" onClick={onBack}>Back</Button>
      </div>
    </Card>
  );
}