"use client";

import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { useState } from "react";
import { Button, LogoLockup } from "@/components/little-moment";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const apiMode = process.env.NEXT_PUBLIC_BACKEND_MODE === "api";
  const googleEnabled = apiMode && process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const inviteToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invite") : null;
  const postAuthPath = inviteToken ? `/invite?token=${encodeURIComponent(inviteToken)}` : "/onboarding";
  const handleSignIn = () => {
    setError("");
    if (!apiMode) {
      setError("Backend belum dikonfigurasi. Atur NEXT_PUBLIC_BACKEND_MODE=api dan koneksi database sebelum masuk.");
      return;
    }
    if (googleEnabled) {
      setLoading(true);
      void authClient.signIn.social({ provider: "google", callbackURL: postAuthPath }).then((result) => {
        if (result.error) { setError(result.error.message || "Kami belum bisa menyelesaikan proses masuk. Coba lagi."); setLoading(false); }
      }).catch(() => { setError("Kami belum bisa menyelesaikan proses masuk. Coba lagi."); setLoading(false); });
      return;
    }
    setError("Google belum diaktifkan. Masuk atau buat akun dengan email di bawah.");
  };
  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiMode) {
      setError("Backend belum dikonfigurasi. Form ini akan aktif setelah mode API dan database tersambung.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = isRegister
        ? await authClient.signUp.email({ name: name.trim() || "Orang tua", email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password, rememberMe: true });
      if (result.error) {
        setError(result.error.message || "Email atau password belum benar.");
        return;
      }
      // Remount the provider before rendering the next page so it fetches the
      // authenticated bootstrap payload exactly once instead of showing stale state.
      window.location.assign(postAuthPath);
    } catch {
      setError("Kami belum bisa menyelesaikan proses masuk. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };
  return <div className="auth-page">
    <section className="auth-visual" aria-label="Tentang Little Moment">
      <div className="auth-visual__card"><div className="visual-sky"><span className="visual-sun" /><span className="visual-sprout" /></div><p>Jurnal kecil untuk menyimpan cerita yang ingin kamu ingat lagi nanti.</p></div>
    </section>
    <main className="auth-content" id="main-content">
      <div className="auth-content__top"><LogoLockup /><span className="private-pill"><LockKey size={14} weight="bold" /> Privat</span></div>
      <div className="auth-content__hero"><span className="eyebrow">Jurnal keluarga</span><h1>Simpan cerita tumbuh kembangnya</h1><p>Satu jurnal privat untuk kamu dan pasangan, dari momen kecil sampai milestone besar.</p><div className="auth-content__actions"><Button onClick={handleSignIn} loading={loading} disabled={!googleEnabled}>{googleEnabled ? "Masuk dengan Google" : "Google belum diaktifkan"} <ArrowRight size={18} weight="bold" /></Button><div className="auth-divider"><span>masuk dengan email</span></div><form className="auth-email-form" onSubmit={handleEmailAuth}>{isRegister && <label className="field"><span>Nama</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama kamu" autoComplete="name" /></label>}<label className="field"><span>Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="kamu@email.com" autoComplete="email" /></label><label className="field"><span>Password</span><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" autoComplete={isRegister ? "new-password" : "current-password"} /></label><Button type="submit" variant="secondary" loading={loading}>{isRegister ? "Buat akun" : "Masuk dengan email"} <ArrowRight size={18} weight="bold" /></Button></form><button className="text-button" type="button" onClick={() => { setIsRegister((current) => !current); setError(""); }}>{isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Buat akun"}</button>{!apiMode && <p className="small auth-mode-note">Mode preview aktif. Data tidak disimpan ke server sampai backend API tersambung.</p>}{error && <p className="field__error" role="alert">{error}</p>}</div></div>
      <p className="privacy-note"><LockKey size={14} /> Data hanya bisa dilihat oleh kamu dan pasangan. <a href="#privacy">Baca kebijakan privasi</a></p>
    </main>
  </div>;
}
