import React from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { DigitolLogo } from "./components/DigitolLogo";
import {
  Database,
  Settings,
  Users,
  LogOut,
  FileText,
  Server,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export function SuperAdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          background: "var(--nav-bg)",
          borderRight: "1px solid var(--glass-border)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <DigitolLogo label="Digitol" sub="Admin" />
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flex: 1,
          }}
        >
          <SidebarLink to="/" icon={<Database size={18} />} label="Overview" />
          <SidebarLink
            to="/businesses"
            icon={<Server size={18} />}
            label="Businesses & PCs"
          />
          <SidebarLink
            to="/users"
            icon={<Users size={18} />}
            label="All Users"
          />
          <SidebarLink
            to="/audit"
            icon={<FileText size={18} />}
            label="Audit Logs"
          />
          <SidebarLink
            to="/settings"
            icon={<Settings size={18} />}
            label="System Config"
          />
        </nav>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: "transparent",
            border: "1px solid var(--glass-border)",
            color: "var(--text)",
            padding: "12px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            marginTop: "auto",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      style={{ textDecoration: "none" }}
      activeProps={{
        style: { background: "var(--glass-bg)", color: "var(--primary)" },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "12px",
          color: "var(--text)",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        {icon}
        <span style={{ fontSize: "14px", fontWeight: 500 }}>{label}</span>
      </div>
    </Link>
  );
}
