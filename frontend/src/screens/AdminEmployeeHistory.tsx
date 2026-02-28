import { useEffect, useState } from "react";
import { Api } from "../app/api";
import type { Leave } from "../app/types";
import { yyyyMmToday } from "../app/utils";
import { Card } from "../ui/components/Card";
import { Badge } from "../ui/components/Badge";
import { Loader } from "../ui/components/Loader";

export function AdminEmployeeHistory() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(yyyyMmToday());
  const [items, setItems] = useState<Leave[]>([]);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Load employees
useEffect(() => {
  (async () => {
    setLoadingEmployees(true);
    try {
      type EmployeeLite = {
  id: string;
  name: string;
};
      const emps: EmployeeLite[] = await Api.adminEmployees();
      setEmployees(emps);

      if (emps.length > 0) {
        setEmployeeId(emps[0].id);
      }
    } finally {
      setLoadingEmployees(false);
    }
  })();
}, []);

  // Load leaves for selected employee/month
  useEffect(() => {
    if (!employeeId) return;

    (async () => {
      setLoadingLeaves(true);
      try {
        const leaves = await Api.adminEmployeeLeaves(employeeId, month);
        setItems(leaves as any);
      } finally {
        setLoadingLeaves(false);
      }
    })();
  }, [employeeId, month]);

  return (
    <Card>
      <h2>Employees</h2>

      <label>Employee</label>
      {loadingEmployees ? (
        <Loader label="Loading employees…" />
      ) : (
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      )}

      <label>Month</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        disabled={loadingLeaves}
      />

      {loadingLeaves ? (
        <div style={{ marginTop: 12 }}>
          <Loader label="Loading leave history…" />
        </div>
      ) : items.length ? (
        items.map((x) => (
          <div key={x.id} className="listItem">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {new Date(x.startDate).toLocaleDateString()} →{" "}
                  {new Date(x.endDate).toLocaleDateString()}
                </div>
                <div className="small">
                  Total: <b>{x.totalDays}</b> day(s)
                </div>
              </div>

              <Badge
  tone={
    x.status === "approved"
      ? "success"
      : x.status === "rejected"
      ? "danger"
      : "warning"
  }
>
  {x.status.toUpperCase()}
</Badge>
            </div>

            {x.adminComment ? (
              <div className="small" style={{ marginTop: 6 }}>
                Admin: {x.adminComment}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <div className="small" style={{ marginTop: 10 }}>
          No leaves for this employee.
        </div>
      )}
    </Card>
  );
}