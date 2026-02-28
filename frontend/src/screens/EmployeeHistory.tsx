import { useEffect, useState } from "react";
import { Api } from "../app/api";
import type { Leave } from "../app/types";
import { yyyyMmToday, formatMonth } from "../app/utils";
import { Card } from "../ui/components/Card";
import { Badge } from "../ui/components/Badge";
import { Loader } from "../ui/components/Loader";

export function EmployeeHistory() {
  const [month, setMonth] = useState(yyyyMmToday());
  const [items, setItems] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const x = await Api.myLeaves(month);
        if (alive) setItems(x as any);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [month]);

  return (
    <Card>
      <h2>History</h2>

      <label>Month</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      />

      <div className="small" style={{ marginBottom: 10 }}>
        Showing leaves for <b>{formatMonth(month)}</b>
      </div>

      {/* 🔄 LOADING STATE */}
      {loading ? (
        <Loader label="Loading history…" />
      ) : items.length ? (
        items.map((x) => (
          <div key={x.id} className="listItem">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
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

                {x.excludedDates?.length ? (
                  <div className="small">
                    Excluded:{" "}
                    {x.excludedDates
                      .map((d) => new Date(d).toLocaleDateString())
                      .join(", ")}
                  </div>
                ) : null}

                {x.reason ? (
                  <div className="small" style={{ marginTop: 6 }}>
                    Reason: {x.reason}
                  </div>
                ) : null}

                {x.adminComment ? (
                  <div className="small" style={{ marginTop: 6 }}>
                    Admin: {x.adminComment}
                  </div>
                ) : null}

                <div className="small" style={{ marginTop: 4 }}>
                  Applied on{" "}
                  {new Date(x.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
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
          </div>
        ))
      ) : (
        <div className="small" style={{ marginTop: 10 }}>
          No leaves.
        </div>
      )}
    </Card>
  );
}