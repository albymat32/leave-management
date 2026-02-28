import { useMemo, useState } from "react";
import { Api } from "../app/api";
import { calcTotalDays } from "../app/utils";
import { Button } from "../ui/components/Button";
import { Card } from "../ui/components/Card";
import { Loader } from "../ui/components/Loader";

export function EmployeeApply() {
  const [startDate, setStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [excludeDraft, setExcludeDraft] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const total = useMemo(() => calcTotalDays(startDate, endDate, excluded), [startDate, endDate, excluded]);

  return (
    <Card>
      <h2>Apply Leave</h2>

      <div className="row">
        <div className="col">
          <label>Start</label>
          <input
  type="date"
  value={startDate}
  onChange={(e) => {
    setStartDate(e.target.value);
    if (endDate && e.target.value > endDate) {
      setEndDate("");
    }
  }}
/>

<input
  type="date"
  value={endDate}
  min={startDate}
  onChange={(e) => setEndDate(e.target.value)}
/></div>
      </div>

     <label>Exclude dates (optional)</label>
<div className="row">
  <div className="col">
    <input
      type="date"
      value={excludeDraft}
      min={startDate || undefined}
      max={endDate || undefined}
      onChange={(e) => setExcludeDraft(e.target.value)}
      disabled={!startDate || !endDate}
    />
  </div>
        <div style={{ width: 120 }}>
           <Button
      tone="secondary"
      disabled={!excludeDraft}
      onClick={() => {
        if (!excludeDraft) return;
        if (!startDate || !endDate) return;
        if (excludeDraft < startDate || excludeDraft > endDate) return;

        setExcluded((xs) =>
          Array.from(new Set([...xs, excludeDraft])).sort()
        );
        setExcludeDraft("");
      }}
    >
      + Add
    </Button>
        </div>
      </div>

      {excluded.length ? (
        <div className="small" style={{ marginTop: 8 }}>
          {excluded.map((d) => (
            <div key={d} className="listItem" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{d}</span>
              <button
                className="btn secondary"
                style={{ width: "auto", minHeight: 36 }}
                onClick={() => setExcluded((xs) => xs.filter((x) => x !== d))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="small">No excluded dates.</div>
      )}

      <div style={{ marginTop: 10 }}>
        <span className="badge approved">TOTAL: {total} day(s)</span>
      </div>

      <label>Reason</label>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short reason" />

      {msg ? <div className="small" style={{ marginTop: 8 }}>{msg}</div> : null}

      <div className="stickyBar">
       <Button
  disabled={submitting}
  onClick={async () => {
    setSubmitting(true);
    setMsg(null);
    await Api.applyLeave({ startDate, endDate, excludedDates: excluded, reason });
    setSubmitting(false);
    setMsg("Submitted. Status: Pending");
  }}
>
  {submitting ? "Submitting…" : "Submit"}
</Button>
      </div>
    </Card>
  );
}