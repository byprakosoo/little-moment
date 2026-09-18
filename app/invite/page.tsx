"use client";

import Link from "next/link";
import { ArrowRight, Check, EnvelopeSimple, LockKey } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, OnboardingCard, PageFrame } from "@/components/little-moment";
import { useDemo } from "@/components/demo-store";

type InviteDetails = { email: string; familyName: string; expiresAt: string };

export default function InvitePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const { session } = useDemo();
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  useEffect(() => {
    if (!token) { setError("Tautan undangan tidak lengkap."); return; }
    fetch(`/api/invites/${encodeURIComponent(token)}`).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Undangan tidak valid.");
      setDetails(payload);
    }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Undangan tidak valid."));
  }, [token]);

  useEffect(() => {
    if (!session || !token || accepted || error || !details) return;
    setAccepting(true);
    fetch(`/api/invites/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" } }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Undangan belum bisa diterima.");
      setAccepted(true);
      window.setTimeout(() => router.replace("/timeline"), 700);
    }).catch((acceptError) => setError(acceptError instanceof Error ? acceptError.message : "Undangan belum bisa diterima.")).finally(() => setAccepting(false));
  }, [accepted, details, error, router, session, token]);

  const signInUrl = `/signin?invite=${encodeURIComponent(token)}`;
  return <PageFrame className="form-page"><div className="auth-content__top"><Link href="/signin" aria-label="Kembali ke masuk"><span className="brand-mark"><span className="brand-leaf">LM</span><span>Little Moment</span></span></Link><span className="private-pill"><LockKey size={14} weight="bold" /> Privat</span></div><OnboardingCard eyebrow="Undangan keluarga" title={accepted ? "Kamu sudah bergabung" : "Jurnal ini lebih lengkap berdua"}><div className="invite-note"><EnvelopeSimple size={20} weight="duotone" /><span>{details ? <>Kamu diundang ke jurnal <strong>{details.familyName}</strong> dengan email <strong>{details.email}</strong>.</> : "Memeriksa tautan undangan..."}</span></div>{accepted ? <div className="success-panel"><strong><Check size={18} weight="bold" /> Undangan diterima</strong><span className="small">Membuka timeline keluarga...</span></div> : error ? <p className="field__error" role="alert">{error}</p> : session ? <Button loading={accepting} disabled>{accepting ? "Menghubungkan keluarga..." : "Undangan diterima"}</Button> : <div className="form-actions"><Button onClick={() => router.push(signInUrl)} disabled={!details}>Masuk untuk menerima <ArrowRight size={18} weight="bold" /></Button></div>}</OnboardingCard></PageFrame>;
}
