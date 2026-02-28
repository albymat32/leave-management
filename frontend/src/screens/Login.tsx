import { useState } from "react";
import { Api } from "../app/api";
import { Button } from "../ui/components/Button";
import { Card } from "../ui/components/Card";

export function Login({
  onLoggedIn,
  onGoRegisterEmployee,
  onGoRegisterAdmin,
  canRegisterAdmin
}: {
  onLoggedIn: () => void;
  onGoRegisterEmployee: () => void;
  onGoRegisterAdmin: () => void;
  canRegisterAdmin: boolean;
}) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card>
      <h2>Login</h2>

      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

      <label>DOB</label>
      <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" />

      {err ? <div className="small" style={{ color: "var(--bad)" }}>{err}</div> : null}

      <div className="stickyBar">
        <Button
          onClick={async () => {
            try {
              setErr(null);
              await Api.login({ name, dob });
              onLoggedIn();
            } catch (e: any) {
              setErr("Wrong name or DOB");
            }
          }}
        >
          Login
        </Button>

        <div style={{ height: 10 }} />

        <Button tone="secondary" onClick={onGoRegisterEmployee}>Register Employee</Button>

        {canRegisterAdmin ? (
          <>
            <div style={{ height: 10 }} />
            <Button tone="secondary" onClick={onGoRegisterAdmin}>Owner: Create Admin</Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}