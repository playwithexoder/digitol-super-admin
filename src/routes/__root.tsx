import { createRootRoute } from "@tanstack/react-router";
import { SuperAdminLayout } from "../Layout";
import { useEffect, useState } from "react";
import { supabase, checkIsSuperAdmin } from "../lib/supabase";
import { DigitolLogo } from "../components/DigitolLogo";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [session, setSession] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdmin(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdmin(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin(currentSession: any) {
    if (!currentSession) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    const isAdmin = await checkIsSuperAdmin(currentSession.user?.email);
    if (!isAdmin) {
      setAuthError("Unauthorized: You do not have super admin privileges.");
      await supabase.auth.signOut();
    }
    setIsSuperAdmin(isAdmin);
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setLoading(false);
    }
    // Auth state listener handles the rest
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Verifying admin credentials...</p>
      </div>
    );
  }

  if (!session || !isSuperAdmin) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: "40px", width: "100%", maxWidth: "400px" }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <DigitolLogo label="Digitol" sub="Admin" />
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "8px",
                  color: "var(--text-muted)",
                }}
              >
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "8px",
                  color: "var(--text-muted)",
                }}
              >
                Password
              </label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <div
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: "8px" }}
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <SuperAdminLayout />
    </>
  );
}
