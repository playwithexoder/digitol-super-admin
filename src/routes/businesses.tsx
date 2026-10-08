import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";
import { Monitor, Key, Trash2, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/businesses")({
  component: Businesses,
});

function Businesses() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [upgradeCodes, setUpgradeCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    tier: string;
  } | null>(null);
  const [giftModal, setGiftModal] = useState<{
    bizId: string;
    bizName: string;
  } | null>(null);
  const [giftTierSelect, setGiftTierSelect] = useState<"pro" | "max">("pro");
  const [giftDays, setGiftDays] = useState<number>(30);
  const [giftPassword, setGiftPassword] = useState("");
  const [giftError, setGiftError] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch businesses, PCs, and linked customers in a single joined-ish approach or Promise.all
    const [bizRes, pcRes, custRes, codesRes] = await Promise.all([
      supabase.rpc("get_all_businesses_with_emails"),
      supabase.rpc("get_all_business_devices"),
      supabase.rpc("get_all_business_customers"),
      supabase.rpc("admin_get_upgrade_codes"),
    ]);

    if (bizRes.data) {
      const formatted = bizRes.data.map((b: any) => {
        return {
          ...b,
          pcs: pcRes.data?.filter((pc: any) => pc.business_id === b.id) || [],
          customers:
            custRes.data
              ?.filter((c: any) => c.business_id === b.id)
              .map((c: any) => ({
                id: c.user_id,
                name: c.customer_name,
                email: c.customer_email,
              })) || [],
        };
      });
      setBusinesses(formatted);
    }
    if (codesRes.data) {
      setUpgradeCodes(codesRes.data);
    }
    setLoading(false);
  }

  const [generateModal, setGenerateModal] = useState<{
    isOpen: boolean;
    tier: "pro" | "max";
  } | null>(null);
  const [genDays, setGenDays] = useState<number>(30);
  const [genCodeType, setGenCodeType] = useState<"paid" | "gift">("paid");
  const [genPassword, setGenPassword] = useState("");
  const [genError, setGenError] = useState("");

  async function generateUpgradeCode() {
    if (!generateModal) return;
    if (genPassword !== "@##@@#Digitol@Admin#@@##@432") {
      setGenError("Invalid admin password.");
      return;
    }

    const code = `${generateModal.tier.toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const { error } = await supabase.rpc("admin_generate_code", {
      p_code: code,
      p_tier: generateModal.tier,
      p_days: genDays,
      p_code_type: genCodeType,
    });

    if (!error) {
      setGeneratedCode({ code, tier: generateModal.tier });
      setGenerateModal(null);
      setGenPassword("");
      fetchData();
    } else {
      setGenError("Failed: " + error.message);
    }
  }

  async function revokeCode(id: string) {
    setConfirmModal({
      title: "Revoke Upgrade Code",
      message:
        "Are you sure you want to revoke this code? It will no longer be redeemable.",
      onConfirm: async () => {
        setConfirmModal(null);
        await supabase.rpc("admin_revoke_code", { p_code_id: id });
        fetchData();
      },
    });
  }

  async function removePc(pcId: string) {
    setConfirmModal({
      title: "Forcibly Disconnect PC",
      message:
        "Are you sure you want to forcibly disconnect this PC? It will be logged out instantly.",
      onConfirm: async () => {
        setConfirmModal(null);
        await supabase.from("dp_business_devices").delete().eq("id", pcId);
        fetchData();
      },
    });
  }

  async function deleteCode(codeId: string) {
    setConfirmModal({
      title: "Delete Code Permanently",
      message:
        "Are you sure you want to permanently delete this code from the inventory?",
      onConfirm: async () => {
        setConfirmModal(null);
        const { error } = await supabase.rpc("admin_delete_upgrade_code", {
          p_code_id: codeId,
        });
        if (error) alert("Failed to delete code: " + error.message);
        else fetchData();
      },
    });
  }

  async function executeGift() {
    setGiftError("");
    if (!giftPassword) {
      setGiftError("Password is required.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    // Verify password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: giftPassword,
    });

    if (authError) {
      setGiftError("Invalid admin password.");
      return;
    }

    // Secure RPC for gifting (bypasses RLS only if caller is Super Admin)
    const { error } = await supabase.rpc("admin_gift_tier", {
      target_biz_id: giftModal?.bizId,
      new_tier: giftTierSelect,
      days: giftDays,
    });

    if (error) {
      setGiftError("Failed to apply gift: " + error.message);
      return;
    }

    setGiftModal(null);
    setGiftPassword("");
    fetchData();
  }

  async function revokeTier(bizId: string) {
    setConfirmModal({
      title: "Revoke Premium Tier",
      message:
        "Are you sure you want to completely revoke their premium tier and revert them to Free? This will instantly downgrade their account.",
      onConfirm: async () => {
        setConfirmModal(null);
        const { error } = await supabase.rpc("admin_revoke_tier", {
          target_biz_id: bizId,
        });
        if (error) {
          alert("Failed to revoke tier: " + error.message);
        } else {
          fetchData();
        }
      },
    });
  }

  return (
    <div className="glass-panel" style={{ padding: "32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2>Businesses & PCs</h2>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => setGenerateModal({ isOpen: true, tier: "pro" })}
            className="btn-primary"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Key size={16} /> Generate PRO
          </button>
          <button
            onClick={() => setGenerateModal({ isOpen: true, tier: "max" })}
            className="btn-primary"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #4f46e5)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Key size={16} /> Generate MAX
          </button>
        </div>
      </div>

      {giftModal &&
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
              zIndex: 9999,
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
              <h3 style={{ margin: 0 }}>Gift Tier to {giftModal.bizName}</h3>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Select Tier
                </label>
                <select
                  className="input-field"
                  value={giftTierSelect}
                  onChange={(e) =>
                    setGiftTierSelect(e.target.value as "pro" | "max")
                  }
                >
                  <option value="pro">PRO Tier</option>
                  <option value="max">MAX Tier</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Duration
                </label>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
                >
                  <button
                    onClick={() => setGiftDays(30)}
                    className={
                      giftDays === 30 ? "btn-primary" : "btn-secondary"
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setGiftDays(365)}
                    className={
                      giftDays === 365 ? "btn-primary" : "btn-secondary"
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  >
                    1 Year
                  </button>
                  <button
                    onClick={() => setGiftDays(36500)}
                    className={
                      giftDays === 36500 ? "btn-primary" : "btn-secondary"
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  >
                    Lifetime
                  </button>
                </div>
                <input
                  type="number"
                  className="input-field"
                  value={giftDays}
                  onChange={(e) => setGiftDays(parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Or enter custom days..."
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Admin Password (Required)
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={giftPassword}
                  onChange={(e) => setGiftPassword(e.target.value)}
                  placeholder="Verify your admin password..."
                />
              </div>

              {giftError && (
                <p
                  style={{
                    color: "var(--danger)",
                    margin: 0,
                    fontSize: "13px",
                  }}
                >
                  {giftError}
                </p>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  onClick={() => setGiftModal(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "12px", color: "white" }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeGift}
                  className="btn-primary"
                  style={{ flex: 1, padding: "12px", color: "white" }}
                >
                  Confirm Gift
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {confirmModal &&
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
              zIndex: 9999,
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
                  Confirm Action
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

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
              zIndex: 9999,
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
              <h3
                style={{
                  margin: 0,
                  color: generateModal.tier === "pro" ? "#f59e0b" : "#8b5cf6",
                }}
              >
                Generate {generateModal.tier.toUpperCase()} Code
              </h3>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Duration
                </label>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
                >
                  <button
                    onClick={() => setGenDays(30)}
                    className={genDays === 30 ? "btn-primary" : "btn-secondary"}
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setGenDays(365)}
                    className={
                      genDays === 365 ? "btn-primary" : "btn-secondary"
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  >
                    1 Year
                  </button>
                  <button
                    onClick={() => setGenDays(36500)}
                    className={
                      genDays === 36500 ? "btn-primary" : "btn-secondary"
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "12px",
                      color: "white",
                    }}
                  >
                    Lifetime
                  </button>
                </div>
                <input
                  type="number"
                  className="input-field"
                  value={genDays}
                  onChange={(e) => setGenDays(parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Or enter custom days..."
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Code Type
                </label>
                <select
                  value={genCodeType}
                  onChange={(e) =>
                    setGenCodeType(e.target.value as "paid" | "gift")
                  }
                  className="input-field"
                  style={{ width: "100%" }}
                >
                  <option value="paid">💰 Paid (Sold for Cash)</option>
                  <option value="gift">🎁 Gift (Free Promo)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Admin Password
                </label>
                <input
                  type="password"
                  value={genPassword}
                  onChange={(e) => setGenPassword(e.target.value)}
                  className="input-field"
                  placeholder="Verify your password"
                />
              </div>

              {genError && (
                <p
                  style={{
                    color: "var(--danger)",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  {genError}
                </p>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  onClick={() => {
                    setGenerateModal(null);
                    setGenPassword("");
                    setGenError("");
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "12px", color: "white" }}
                >
                  Cancel
                </button>
                <button
                  onClick={generateUpgradeCode}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: "12px",
                    color: "white",
                    background:
                      generateModal.tier === "pro"
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "linear-gradient(135deg, #8b5cf6, #4f46e5)",
                  }}
                >
                  Generate Code
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {generatedCode && (
        <div
          style={{
            background: "var(--success-bg)",
            border: "1px solid var(--success)",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{ color: "var(--success)", fontWeight: "bold", margin: 0 }}
            >
              New {generatedCode.tier.toUpperCase()} Code Generated!
            </p>
            <p style={{ fontSize: "13px", margin: 0, marginTop: "4px" }}>
              Give this code to the business owner so they can enter it in their
              dashboard.
            </p>
          </div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              letterSpacing: "2px",
              fontFamily: "monospace",
            }}
          >
            {generatedCode.code}
          </span>
        </div>
      )}

      {loading ? (
        <p>Loading businesses...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {businesses.map((biz) => (
              <div
                key={biz.id}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--glass-border)",
                  padding: "24px",
                  borderRadius: "16px",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "1px solid var(--glass-border)",
                    paddingBottom: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {biz.name || "Unnamed Business"}
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background:
                            biz.tier === "free"
                              ? "var(--glass-bg)"
                              : biz.tier === "pro"
                                ? "#f59e0b33"
                                : "#8b5cf633",
                          color:
                            biz.tier === "free"
                              ? "var(--text-muted)"
                              : biz.tier === "pro"
                                ? "#f59e0b"
                                : "#8b5cf6",
                          textTransform: "uppercase",
                        }}
                      >
                        {biz.tier}
                      </span>
                      {biz.tier_source === "gifted" && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "var(--success-bg)",
                            color: "var(--success)",
                            textTransform: "uppercase",
                          }}
                        >
                          🎁 Gifted by Admin
                        </span>
                      )}
                    </h3>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        <strong>Owner Email:</strong>{" "}
                        {biz.owner_email || "No email attached"}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Description:</strong>{" "}
                        {biz.description || "No description provided"}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Created:</strong>{" "}
                        {new Date(biz.created_at).toLocaleDateString()}
                      </p>
                      {biz.tier_expires_at && (
                        <p style={{ margin: 0, color: "var(--danger)" }}>
                          <strong>Tier Expires:</strong>{" "}
                          {new Date(biz.tier_expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      Connection Code:{" "}
                      <strong
                        style={{
                          color: "white",
                          fontSize: "16px",
                          letterSpacing: "1px",
                        }}
                      >
                        {biz.connection_code}
                      </strong>
                    </p>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {biz.tier !== "free" && (
                        <button
                          onClick={() => revokeTier(biz.id)}
                          style={{
                            fontSize: "12px",
                            padding: "6px 12px",
                            background: "var(--danger)",
                            border: "none",
                            color: "white",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          Revoke Tier
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setGiftModal({
                            bizId: biz.id,
                            bizName: biz.name || "Unnamed Business",
                          })
                        }
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          background:
                            "linear-gradient(135deg, #f59e0b, #d97706)",
                          border: "none",
                          color: "white",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        🎁 Gift Upgrade
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                  }}
                >
                  {/* PCs */}
                  <div>
                    <h4
                      style={{
                        fontSize: "13px",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Monitor size={14} /> Connected PCs ({biz.pcs.length})
                    </h4>
                    {biz.pcs.length === 0 ? (
                      <p
                        style={{ fontSize: "13px", color: "var(--text-muted)" }}
                      >
                        No PCs connected.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {biz.pcs.map((pc: any) => (
                          <div
                            key={pc.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "rgba(255,255,255,0.03)",
                              padding: "8px 12px",
                              borderRadius: "8px",
                            }}
                          >
                            <span style={{ fontSize: "13px" }}>
                              {pc.device_name || "Unknown PC"}
                            </span>
                            <button
                              onClick={() => removePc(pc.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--danger)",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customers */}
                  <div>
                    <h4
                      style={{
                        fontSize: "13px",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UsersIcon size={14} /> Linked Customers (
                      {biz.customers.length})
                    </h4>
                    {biz.customers.length === 0 ? (
                      <p
                        style={{ fontSize: "13px", color: "var(--text-muted)" }}
                      >
                        No customers linked.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {biz.customers.map((c: any) => (
                          <div
                            key={c?.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              background: "rgba(255,255,255,0.03)",
                              padding: "8px 12px",
                              borderRadius: "8px",
                            }}
                          >
                            <span style={{ fontSize: "13px" }}>
                              {c?.name} ({c?.email})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ marginBottom: "16px" }}>Upgrade Codes Inventory</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {upgradeCodes.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  No upgrade codes generated yet.
                </p>
              ) : (
                upgradeCodes.map((code) => (
                  <div
                    key={code.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--glass-border)",
                      padding: "12px 16px",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "16px",
                          fontWeight: "bold",
                          textDecoration: code.is_revoked
                            ? "line-through"
                            : "none",
                          color: code.is_revoked
                            ? "var(--text-muted)"
                            : "inherit",
                        }}
                      >
                        {code.code}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background:
                            code.tier === "pro" ? "#f59e0b33" : "#8b5cf633",
                          color: code.tier === "pro" ? "#f59e0b" : "#8b5cf6",
                          textTransform: "uppercase",
                        }}
                      >
                        {code.tier}
                      </span>
                      {code.code_type === "gift" ? (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "#22c55e",
                            textTransform: "uppercase",
                          }}
                        >
                          🎁 Gift
                        </span>
                      ) : code.code_type === "paid" ? (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#3b82f6",
                            textTransform: "uppercase",
                          }}
                        >
                          💰 Paid
                        </span>
                      ) : null}
                      <span
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {code.duration_days === 9999
                          ? "Lifetime"
                          : `${code.duration_days} Days`}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {code.is_used ? (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Claimed by:{" "}
                          <strong style={{ color: "white" }}>
                            {code.shop_name || "Unknown"}
                          </strong>
                        </span>
                      ) : code.is_revoked ? (
                        <>
                          <span
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: "var(--danger-bg)",
                              color: "var(--danger)",
                            }}
                          >
                            Revoked
                          </span>
                          <button
                            onClick={() => deleteCode(code.id)}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--glass-border)",
                              color: "var(--text-muted)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: "var(--success-bg)",
                              color: "var(--success)",
                            }}
                          >
                            Available
                          </span>
                          <button
                            onClick={() => revokeCode(code.id)}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--danger)",
                              color: "var(--danger)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Revoke
                          </button>
                          <button
                            onClick={() => deleteCode(code.id)}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--glass-border)",
                              color: "var(--text-muted)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
