import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useEffect } from "react";
import type { Leave } from "../app/types";
import { useMemo, useState } from "react";
import { Api } from "../app/api";
import { calcTotalDays,expandDates } from "../app/utils";
import { Button } from "../ui/components/Button";
import { Card } from "../ui/components/Card";
import { Loader } from "../ui/components/Loader";

export function EmployeeApply() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [excludeDraft, setExcludeDraft] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 🔹 NEW
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  // 🔹 Load existing leaves
  useEffect(() => {
    (async () => {
      try {
        const x = await Api.myLeaves();
        setLeaves(x as any);
      } finally {
        setLoadingCalendar(false);
      }
    })();
  }, []);

  const total = useMemo(
    () => calcTotalDays(startDate, endDate, excluded),
    [startDate, endDate, excluded]
  );

  // 🔹 Calendar modifiers
  const modifiers = useMemo(() => {
    const m: Record<string, Date[]> = {
      approved: [],
      pending: [],
      rejected: [],
    };

    leaves.forEach((l) => {
      expandDates(l.startDate, l.endDate).forEach((d) => {
        m[l.status].push(d);
      });
    });

    return m;
  }, [leaves]);

  const isBlocked = (date: Date) =>
    [...modifiers.approved, ...modifiers.pending, ...modifiers.rejected].some(
      (d) => d.toDateString() === date.toDateString()
    );

  return (
    <Card>
      <h2>Apply Leave</h2>

      {/* 🗓 CALENDAR */}
      {loadingCalendar ? (
        <Loader label="Loading calendar…" />
      ) : (
        <DayPicker
          mode="range"
          selected={{
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined,
          }}
          onSelect={(r) => {
            setStartDate(r?.from ? r.from.toISOString().slice(0, 10) : "");
            setEndDate(r?.to ? r.to.toISOString().slice(0, 10) : "");
          }}
          disabled={isBlocked}
          modifiers={modifiers}
          modifiersStyles={{
            approved: { backgroundColor: "#22c55e", color: "white" },
            pending: { backgroundColor: "#f59e0b", color: "white" },
            rejected: { backgroundColor: "#ef4444", color: "white" },
          }}
        />
      )}

      {/* DATE INPUTS (still kept for precision) */}
      <div className="row">
        <div className="col">
          <label>Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate && e.target.value > endDate) setEndDate("");
            }}
          />
        </div>

        <div className="col">
          <label>End</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* EXCLUDE */}
      <label>Exclude dates (optional)</label>
      <div className="row">
        <div className="col">
          <input
            type="date"
            value={excludeDraft}
            min={startDate || undefined}
            max={endDate || undefined}
            disabled={!startDate || !endDate}
            onChange={(e) => setExcludeDraft(e.target.value)}
          />
        </div>

        <div style={{ width: 120 }}>
          <Button
            tone="secondary"
            disabled={!excludeDraft}
            onClick={() => {
              if (
                !excludeDraft ||
                excludeDraft < startDate ||
                excludeDraft > endDate
              )
                return;

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
            <div key={d} className="listItem" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{d}</span>
              <button
                className="btn secondary"
                style={{ width: "auto", minHeight: 36 }}
                onClick={() =>
                  setExcluded((xs) => xs.filter((x) => x !== d))
                }
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
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} />

      {msg && <div className="small" style={{ marginTop: 8 }}>{msg}</div>}

      <div className="stickyBar">
        <Button
          disabled={submitting || !startDate || !endDate}
          onClick={async () => {
            setSubmitting(true);
            setMsg(null);
            try {
              await Api.applyLeave({
                startDate,
                endDate,
                excludedDates: excluded,
                reason,
              });
              setMsg("Submitted. Status: Pending");
            } catch (e: any) {
              setMsg(e?.message || "Leave overlaps with existing leave");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </Card>
  );
}

// import { useMemo, useState } from "react";
// import { Api } from "../app/api";
// import { calcTotalDays,expandDates } from "../app/utils";
// import { Button } from "../ui/components/Button";
// import { Card } from "../ui/components/Card";
// import { Loader } from "../ui/components/Loader";

// export function EmployeeApply() {
//   const [startDate, setStartDate] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [endDate, setEndDate] = useState("");
//   const [excluded, setExcluded] = useState<string[]>([]);
//   const [excludeDraft, setExcludeDraft] = useState("");
//   const [reason, setReason] = useState("");
//   const [msg, setMsg] = useState<string | null>(null);

//   const total = useMemo(() => calcTotalDays(startDate, endDate, excluded), [startDate, endDate, excluded]);

//   return (
//     <Card>
//       <h2>Apply Leave</h2>

//       <div className="row">
//         <div className="col">
//           <label>Start</label>
//           <input
//   type="date"
//   value={startDate}
//   onChange={(e) => {
//     setStartDate(e.target.value);
//     if (endDate && e.target.value > endDate) {
//       setEndDate("");
//     }
//   }}
// />

// <input
//   type="date"
//   value={endDate}
//   min={startDate}
//   onChange={(e) => setEndDate(e.target.value)}
// /></div>
//       </div>

//      <label>Exclude dates (optional)</label>
// <div className="row">
//   <div className="col">
//     <input
//       type="date"
//       value={excludeDraft}
//       min={startDate || undefined}
//       max={endDate || undefined}
//       onChange={(e) => setExcludeDraft(e.target.value)}
//       disabled={!startDate || !endDate}
//     />
//   </div>
//         <div style={{ width: 120 }}>
//            <Button
//       tone="secondary"
//       disabled={!excludeDraft}
//       onClick={() => {
//         if (!excludeDraft) return;
//         if (!startDate || !endDate) return;
//         if (excludeDraft < startDate || excludeDraft > endDate) return;

//         setExcluded((xs) =>
//           Array.from(new Set([...xs, excludeDraft])).sort()
//         );
//         setExcludeDraft("");
//       }}
//     >
//       + Add
//     </Button>
//         </div>
//       </div>

//       {excluded.length ? (
//         <div className="small" style={{ marginTop: 8 }}>
//           {excluded.map((d) => (
//             <div key={d} className="listItem" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <span>{d}</span>
//               <button
//                 className="btn secondary"
//                 style={{ width: "auto", minHeight: 36 }}
//                 onClick={() => setExcluded((xs) => xs.filter((x) => x !== d))}
//               >
//                 Remove
//               </button>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="small">No excluded dates.</div>
//       )}

//       <div style={{ marginTop: 10 }}>
//         <span className="badge approved">TOTAL: {total} day(s)</span>
//       </div>

//       <label>Reason</label>
//       <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short reason" />

//       {msg ? <div className="small" style={{ marginTop: 8 }}>{msg}</div> : null}

//       <div className="stickyBar">
//        <Button
//   disabled={submitting}
//   onClick={async () => {
//     setSubmitting(true);
//     setMsg(null);
//     await Api.applyLeave({ startDate, endDate, excludedDates: excluded, reason });
//     setSubmitting(false);
//     setMsg("Submitted. Status: Pending");
//   }}
// >
//   {submitting ? "Submitting…" : "Submit"}
// </Button>
//       </div>
//     </Card>
//   );
// }