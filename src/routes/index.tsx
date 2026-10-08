import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [stats, setStats] = useState({
    businesses: 0,
    pcs: 0,
    printJobs: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.rpc("get_global_stats");

        if (!error && data) {
          setStats({
            businesses: data.businesses || 0,
            pcs: data.pcs || 0,
            printJobs: data.printJobs || 0,
            loading: false,
          });
        } else {
          console.error("RPC Error:", error);
          setStats((s) => ({ ...s, loading: false }));
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStats((s) => ({ ...s, loading: false }));
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: "32px" }}>
      <h2 style={{ marginBottom: "16px" }}>Super Admin Overview</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Welcome to the Digitol Super Admin panel. From here you can manage all
        linked businesses, monitor system health, and review audit logs across
        the entire Supabase database.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          marginTop: "32px",
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: "24px", border: "1px solid var(--primary)" }}
        >
          <h3
            style={{
              fontSize: "14px",
              color: "var(--primary)",
              marginBottom: "8px",
            }}
          >
            Total Businesses
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.loading ? "Loading..." : stats.businesses}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            Active PCs
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.loading ? "Loading..." : stats.pcs}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            Global Print Jobs
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.loading ? "Loading..." : stats.printJobs}
          </p>
        </div>
      </div>
    </div>
  );
}
