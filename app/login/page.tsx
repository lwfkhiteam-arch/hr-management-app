"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr(error.message);
    r.replace("/dashboard");
  }

  async function forgot() {
    if (!email) return setErr("Enter your email first");
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` });
    setErr("Password reset link sent to your email.");
  }

  return (
    <main className="min-h-screen grid place-items-center bg-primary p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-primary-700">Sign in with your corporate email</p>
        </div>
        <input className="input" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-sm text-danger">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <button type="button" onClick={forgot} className="text-sm text-accent w-full">Forgot password?</button>
      </form>
    </main>
  );
}
