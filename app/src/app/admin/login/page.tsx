"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    if (res.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Giriş başarısız");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <form onSubmit={handleSubmit} className="card" style={{ padding: 40, width: 380, display: "grid", gap: 18 }}>
        <h1 className="font-display" style={{ textAlign: "center", color: "var(--gold-deep)", margin: 0 }}>
          MEF Admin
        </h1>
        <div>
          <label htmlFor="email">E-posta</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Şifre</label>
          <input id="password" name="password" type="password" required />
        </div>
        {error && <p style={{ color: "#a33", fontSize: 15 }}>{error}</p>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
