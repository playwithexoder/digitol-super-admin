import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Save, AlertCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase
      .from("dp_system_settings")
      .select("*")
      .order("key");

    if (data) setSettings(data);
    setLoading(false);
  }

  async function handleSave(setting: any, newValueStr: string) {
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const parsedValue = JSON.parse(newValueStr);
      const { error } = await supabase
        .from("dp_system_settings")
        .update({ value: parsedValue, updated_at: new Date().toISOString() })
        .eq("id", setting.id);

      if (error) throw error;

      setMessage({ text: "Setting saved successfully!", type: "success" });
      fetchSettings();
    } catch (err: any) {
      setMessage({
        text: err.message || "Invalid JSON or save failed",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "32px", color: "var(--text-muted)" }}>
        Loading system configuration...
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>System Config</h2>
          <p
            style={{
              color: "var(--text-muted)",
              margin: "4px 0 0 0",
              fontSize: "14px",
            }}
          >
            Global ecosystem variables and tier pricing configuration.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "24px",
            background:
              message.type === "error"
                ? "var(--danger-bg)"
                : "var(--success-bg)",
            color:
              message.type === "error" ? "var(--danger)" : "var(--success)",
            border: `1px solid ${message.type === "error" ? "var(--danger)" : "var(--success)"}`,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} /> {message.text}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {settings.map((s) => (
          <SettingCard
            key={s.id}
            setting={s}
            onSave={handleSave}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}

function SettingCard({
  setting,
  onSave,
  saving,
}: {
  setting: any;
  onSave: any;
  saving: boolean;
}) {
  const [val, setVal] = useState(JSON.stringify(setting.value, null, 2));
  const [editing, setEditing] = useState(false);

  const isChanged = val !== JSON.stringify(setting.value, null, 2);

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", color: "var(--primary)" }}>
            {setting.key}
          </h3>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            {setting.description}
          </p>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Last updated: {new Date(setting.updated_at).toLocaleString()}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <textarea
          className="input-field"
          style={{
            width: "100%",
            minHeight: "120px",
            fontFamily: "monospace",
            fontSize: "13px",
            lineHeight: "1.5",
            resize: "vertical",
            padding: "16px",
            background: "rgba(0,0,0,0.4)",
            border: isChanged
              ? "1px solid var(--amber)"
              : "1px solid var(--glass-border)",
          }}
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setEditing(true);
          }}
          spellCheck={false}
        />
      </div>

      {editing && isChanged && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <button
            className="btn-secondary"
            onClick={() => {
              setVal(JSON.stringify(setting.value, null, 2));
              setEditing(false);
            }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(setting, val);
              setEditing(false);
            }}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
