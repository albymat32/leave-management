import { useState } from "react";
import { Api } from "../app/api";
import { Button } from "../ui/components/Button";
import { Card } from "../ui/components/Card";

export function RegisterEmployee({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card>
      <h2>Register</h2>

      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>DOB</label>
      <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" />

      <label>Employee ID</label>
      <input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="E.g. 1023" />

      <label>Email (optional)</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />

      {err ? <div className="small" style={{ color: "var(--bad)" }}>{err}</div> : null}

      <div className="stickyBar">
        <Button
          onClick={async () => {
            try {
              setErr(null);
              await Api.registerEmployee({ name, dob, employeeCode, email: email || undefined });
              onDone();
            } catch {
              setErr("Employee ID already exists (or invalid input).");
            }
          }}
        >
          Create Account
        </Button>
        <div style={{ height: 10 }} />
        <Button tone="secondary" onClick={onBack}>Back</Button>
      </div>
    </Card>
  );
}