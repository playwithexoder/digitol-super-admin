import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FileText, RefreshCw, Clock } from "lucide-react";

export const Route = createFileRoute("/audit")({
  component: Audit,
});

function Audit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data } = await supabase
      .from("dp_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setLogs(data);
    setLoading(false);
  }

  function getActionColor(action: string) {
    if (action.includes("GENERATE")) return "var(--success)";
    if (action.includes("REVOKE") || action.includes("DELETE"))
      return "var(--danger)";
    if (action.includes("GIFT") || action.includes("UPGRADE"))
      return "var(--primary)";
    return "var(--amber)";
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Audit Logs</h2>
          <p
            style={{
              color: "var(--text-muted)",
              margin: "4px 0 0 0",
              fontSize: "14px",
            }}
          >
            A complete timeline of sensitive actions taken by Super Admins.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        {loading ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <FileText
              size={48}
              style={{ opacity: 0.2, marginBottom: "16px" }}
            />
            <div>No audit logs found.</div>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--glass-border)",
                }}
              >
                <th
                  style={{
                    padding: "16px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  Timestamp
                </th>
                <th
                  style={{
                    padding: "16px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  Admin
                </th>
                <th
                  style={{
                    padding: "16px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  Action
                </th>
                <th
                  style={{
                    padding: "16px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  style={{ borderBottom: "1px solid var(--glass-border)" }}
                >
                  <td
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Clock size={14} />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {log.admin_email || log.admin_id}
                  </td>
                  <td style={{ padding: "16px", fontSize: "13px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: "var(--glass-bg)",
                        border: `1px solid ${getActionColor(log.action)}`,
                        color: getActionColor(log.action),
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: "monospace",
                        fontSize: "11px",
                        background: "rgba(0,0,0,0.2)",
                        padding: "8px",
                        borderRadius: "4px",
                        overflowX: "auto",
                      }}
                    >
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
