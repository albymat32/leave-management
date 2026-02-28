import { useEffect, useState } from "react";
import { Api } from "./api";
import type { Me } from "./types";

import { BootstrapGate } from "../screens/BootstrapGate";
import { Login } from "../screens/Login";
import { Loader } from "../ui/components/Loader";
import { RegisterAdmin } from "../screens/RegisterAdmin";
import { RegisterEmployee } from "../screens/RegisterEmployee";
import { EmployeeApply } from "../screens/EmployeeApply";
import { EmployeeHistory } from "../screens/EmployeeHistory";
import { AdminPending } from "../screens/AdminPending";
import { AdminEmployeeHistory } from "../screens/AdminEmployeeHistory";
import { AdminEmailSettings } from "../screens/AdminEmailSettings";

type Screen =
  | { name: "bootstrap" }
  | { name: "login" }
  | { name: "registerAdmin" }
  | { name: "registerEmployee" }
  | { name: "employeeApply" }
  | { name: "employeeHistory" }
  | { name: "adminPending" }
  | { name: "adminEmployees" }
  | { name: "adminEmail" };

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "bootstrap" });
  const [boot, setBoot] = useState<{ has_admin: boolean } | null>(null);
const [loggingOut, setLoggingOut] = useState(false);

  async function refreshMe() {
    try {
      const x = await Api.me();
      setMe(x as any);
      if ((x as any).role === "employee") setScreen({ name: "employeeApply" });
      else setScreen({ name: "adminPending" });
    } catch {
      setMe(null);
      setScreen({ name: "login" });
    }
  }

  useEffect(() => {
    (async () => {
      const b = await Api.bootstrap();
      setBoot(b);
      await refreshMe();
    })();
  }, []);

  async function onLogout() {
    await Api.logout();
    setMe(null);
    setScreen({ name: "login" });
  }

  if (!boot || screen.name === "bootstrap") {
    return <BootstrapGate boot={boot} />;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Quick Agencies Leave Portal</h1>
       {me ? (
  <button
    className="btn secondary"
    style={{ width: "auto", minHeight: 40 }}
    onClick={onLogout}
    disabled={loggingOut}
  >
    {loggingOut ? <Loader label="Logging out…" /> : "Logout"}
  </button>
) : null}
      </div>

      {!me ? (
        <>
          {screen.name === "login" && (
            <Login
              onLoggedIn={async () => refreshMe()}
              onGoRegisterEmployee={() => setScreen({ name: "registerEmployee" })}
              onGoRegisterAdmin={() => {
                if (boot.has_admin) return;
                setScreen({ name: "registerAdmin" });
              }}
              canRegisterAdmin={!boot.has_admin}
            />
          )}

          {screen.name === "registerAdmin" && (
            <RegisterAdmin
              onDone={async () => {
                await Api.bootstrap().then(setBoot);
                await refreshMe();
              }}
              onBack={() => setScreen({ name: "login" })}
            />
          )}

          {screen.name === "registerEmployee" && (
            <RegisterEmployee
              onDone={async () => refreshMe()}
              onBack={() => setScreen({ name: "login" })}
            />
          )}
        </>
      ) : me.role === "employee" ? (
        <>
          <div className="nav">
            <button onClick={() => setScreen({ name: "employeeApply" })}>Apply</button>
            <button onClick={() => setScreen({ name: "employeeHistory" })}>History</button>
          </div>

          {screen.name === "employeeApply" && <EmployeeApply />}
          {screen.name === "employeeHistory" && <EmployeeHistory />}
        </>
      ) : (
        <>
          <div className="nav">
            <button onClick={() => setScreen({ name: "adminPending" })}>Pending</button>
            <button onClick={() => setScreen({ name: "adminEmployees" })}>Employees</button>
            <button onClick={() => setScreen({ name: "adminEmail" })}>Settings</button>
          </div>

          {screen.name === "adminPending" && <AdminPending />}
          {screen.name === "adminEmployees" && <AdminEmployeeHistory />}
          {screen.name === "adminEmail" && <AdminEmailSettings />}
        </>
      )}
    </div>
  );
}