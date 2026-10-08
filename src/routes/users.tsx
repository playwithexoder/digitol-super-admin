import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/users")({
  component: UsersRoute,
});

function UsersRoute() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_get_user_requests");
    if (data) setRequests(data);
    else console.error("Error fetching requests:", error);
    setLoading(false);
  }

  async function approveDeletion(id: string) {
    setConfirmModal({
      title: "Execute Secure Wipe",
      message:
        "CRITICAL WARNING: This will permanently delete the user's account from Supabase Auth and cascade delete all their data across the entire Digitol ecosystem. Proceed?",
      onConfirm: async () => {
        setConfirmModal(null);
        const { error } = await supabase.rpc("admin_complete_user_request", {
          p_request_id: id,
        });

        if (error) {
          alert("Failed to execute secure wipe: " + error.message);
        } else {
          alert(
            "Secure Wipe Completed. The user's account has been permanently destroyed.",
          );
          fetchRequests();
        }
      },
    });
  }

  return (
    <div className="glass-panel" style={{ padding: "32px" }}>
      <h2>Data Requests & Deletions</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Customers have the right to request their data or delete their accounts.
        Account deletions are held for 30 days before being fully wiped by the
        Super Admin.
      </p>

      {confirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: "32px",
              width: "100%",
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--danger)" }}>
              {confirmModal.title}
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {confirmModal.message}
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={() => setConfirmModal(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="btn-primary"
                style={{ flex: 1, background: "var(--danger)" }}
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No active requests.</p>
          )}
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--glass-border)",
                padding: "16px",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  {req.user_email}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  Requested: {new Date(req.created_at).toLocaleDateString()}
                </p>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "var(--glass-bg)",
                    textTransform: "uppercase",
                    marginTop: "8px",
                    display: "inline-block",
                  }}
                >
                  {req.request_type.replace("_", " ")}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background:
                      req.status === "pending" ? "#f59e0b33" : "#10b98133",
                    color: req.status === "pending" ? "#f59e0b" : "#10b981",
                    textTransform: "uppercase",
                    marginTop: "8px",
                    display: "inline-block",
                    marginLeft: "8px",
                  }}
                >
                  {req.status}
                </span>
              </div>

              {req.status === "pending" && (
                <div>
                  {req.request_type === "delete_account" ? (
                    <button
                      onClick={() => approveDeletion(req.id)}
                      className="btn-primary"
                      style={{
                        background: "var(--danger)",
                        fontSize: "12px",
                        padding: "6px 12px",
                      }}
                    >
                      Execute Secure Wipe
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Send Data Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
