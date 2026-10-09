import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";
import { Key } from "lucide-react";

export const Route = createFileRoute("/users")({
  component: UsersRoute,
});

function UsersRoute() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Customer PRO Key Generation State
  const [generateModal, setGenerateModal] = useState(false);
  const [genTier, setGenTier] = useState<string>("customer_pro_mobile");
  const [genDays, setGenDays] = useState<number>(30);
  const [genPassword, setGenPassword] = useState("");
  const [genError, setGenError] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

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

  async function generateCustomerKey() {
    if (genPassword !== "@##@@#Digitol@Admin#@@##@432") {
      setGenError("Invalid admin password.");
      return;
    }

    const code = `PRO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const { error } = await supabase.rpc("admin_generate_code", {
      p_code: code,
      p_tier: genTier,
      p_days: genDays,
      p_code_type: "paid",
    });

    if (!error) {
      setGeneratedCode(code);
      setGenPassword("");
    } else {
      setGenError("Failed: " + error.message);
    }
  }

  return (
    <div className="glass-panel" style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Data Requests & Consumers</h2>
          <p style={{ color: "var(--text-muted)", margin: "8px 0 0 0" }}>
            Manage privacy requests and generate Digitol PRO keys for customers.
          </p>
        </div>
        <button
          onClick={() => { setGenerateModal(true); setGeneratedCode(null); }}
          className="btn-primary"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Key size={16} /> Generate Customer PRO Key
        </button>
      </div>

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

      {/* Generate Customer PRO Key Modal */}
      {generateModal &&
        createPortal(
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
              <h3 style={{ margin: 0, color: "var(--accent)" }}>
                Generate Digitol PRO Key (Customer)
              </h3>

              {!generatedCode ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Plan Tier (Device Limit)
                    </label>
                    <select
                      className="input-field"
                      value={genTier}
                      onChange={(e) => setGenTier(e.target.value)}
                    >
                      <option value="customer_pro_mobile">PRO Mobile (1 Device)</option>
                      <option value="customer_pro_standard">PRO Standard (2 Devices)</option>
                      <option value="customer_pro_family">PRO Family (4 Devices)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Validity (Days)
                    </label>
                    <select
                      className="input-field"
                      value={genDays}
                      onChange={(e) => setGenDays(Number(e.target.value))}
                    >
                      <option value={30}>30 Days (Monthly)</option>
                      <option value={365}>365 Days (Yearly)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Admin Password
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Super Admin Password"
                      value={genPassword}
                      onChange={(e) => setGenPassword(e.target.value)}
                    />
                  </div>

                  {genError && (
                    <p style={{ color: "var(--danger)", fontSize: "14px", margin: 0 }}>
                      {genError}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button
                      onClick={() => setGenerateModal(false)}
                      className="btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateCustomerKey}
                      className="btn-primary"
                      style={{ flex: 1 }}
                    >
                      Generate Key
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
                    Key Generated Successfully!
                  </p>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid var(--accent)",
                      fontFamily: "monospace",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "var(--accent)",
                      marginBottom: "16px",
                      letterSpacing: "2px",
                    }}
                  >
                    {generatedCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setGenerateModal(false);
                    }}
                    className="btn-primary"
                    style={{ width: "100%" }}
                  >
                    Copy & Close
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
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
