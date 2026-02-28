import { useEffect, useState } from "react";
import { Api } from "../app/api";
import type { Leave } from "../app/types";
import { yyyyMmToday } from "../app/utils";
import { Card } from "../ui/components/Card";
import { Badge } from "../ui/components/Badge";
import { Button } from "../ui/components/Button";

export function AdminPending() {
  const [month, setMonth] = useState(yyyyMmToday());
  const [employeeId, setEmployeeId] = useState<string>("");
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState<Leave[]>([]);
  const [comment, setComment] = useState<Record<string, string>>({});

  async function load() {
    const emps = await Api.adminEmployees();
    setEmployees(emps as any);
    const leaves = await Api.adminPending({ employeeId: employeeId || undefined, month });
    setItems(leaves as any);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => { load(); }, [month, employeeId]);

  return (
    <Card>
      <h2>Pending</h2>

      <label>Month</label>
      <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="YYYY-MM" />

      <label>Employee (optional)</label>
      <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
        <option value="">All</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {items.map((x) => (
        <div key={x.id} className="listItem">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div><b>{x.startDate}</b> → <b>{x.endDate}</b></div>
              <div className="small">{x.totalDays} day(s) • excluded: {x.excludedDates?.length || 0}</div>
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

          <label style={{ marginTop: 6 }}>Comment (optional)</label>
          <input
            value={comment[x.id] || ""}
            onChange={(e) => setComment((m) => ({ ...m, [x.id]: e.target.value }))}
            placeholder="Short comment"
          />

          <div className="row" style={{ marginTop: 10 }}>
            <div className="col">
              <Button
                tone="ok"
                onClick={async () => {
                  await Api.decideLeave(x.id, { decision: "approved", comment: comment[x.id] || undefined });
                  await load();
                }}
              >
                Approve
              </Button>
            </div>
            <div className="col">
              <Button
                tone="danger"
                onClick={async () => {
                  await Api.decideLeave(x.id, { decision: "rejected", comment: comment[x.id] || undefined });
                  await load();
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}

      {!items.length ? <div className="small" style={{ marginTop: 10 }}>No pending requests.</div> : null}
    </Card>
  );
}