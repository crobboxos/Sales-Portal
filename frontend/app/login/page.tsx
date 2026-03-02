export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="panel login-card">
        <h1>Portal Login</h1>
        <p>
          Microsoft Entra ID SSO must be wired in this environment. In development, backend auth bypass can be used.
        </p>
        <div className="actions login-badges">
          <span className="status-badge status-amber">SSO Required</span>
          <span className="status-badge status-cyan">Entra ID</span>
        </div>
      </section>
    </main>
  );
}
