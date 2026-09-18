"use client";

import { ArrowRight, Check, EnvelopeSimple, LockKey } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark, Button, OnboardingCard, PageFrame } from "@/components/little-moment";
import { authClient } from "@/lib/auth-client";

type InviteDetails = { email: string; familyName: string; expiresAt: string };

export default function InvitePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const { data: authSession, isPending: authSessionPending } = authClient.useSession();
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const nextToken = new URLSearchParams(window.location.search).get("token") || "";
    setToken(nextToken);
    if (!nextToken) setError("Tautan undangan tidak lengkap.");
  }, []);

  useEffect(() => {
    if (!token) return;
    setError("");
    fetch(`/api/invites/${encodeURIComponent(token)}`).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Undangan tidak valid.");
      setError("");
      setDetails(payload);
    }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Undangan tidak valid."));
  }, [token]);

  useEffect(() => {
    if (authSessionPending || !authSession?.user || !token || accepted || error || !details) return;
    setAccepting(true);
    fetch(`/api/invites/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" } }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Undangan belum bisa diterima.");
      setAccepted(true);
      // The provider may have bootstrapped before membership was created.
      // Reload so timeline starts with the newly accepted family membership.
      window.location.replace("/timeline");
    }).catch((acceptError) => setError(acceptError instanceof Error ? acceptError.message : "Undangan belum bisa diterima.")).finally(() => setAccepting(false));
  }, [accepted, authSession, authSessionPending, details, error, router, token]);

  const signInUrl = `/signin?invite=${encodeURIComponent(token)}`;
  return <PageFrame className="form-page"><div className="auth-content__top"><BrandMark href="/signin" /><span className="private-pill"><LockKey size={14} weight="bold" /> Privat</span></div><OnboardingCard eyebrow="Undangan keluarga" title={accepted ? "Kamu sudah bergabung" : "Jurnal ini lebih lengkap berdua"}><div className="invite-note"><EnvelopeSimple size={20} weight="duotone" /><span>{details ? <>Kamu diundang ke jurnal <strong>{details.familyName}</strong> dengan email <strong>{details.email}</strong>.</> : "Memeriksa tautan undangan..."}</span></div>{accepted ? <div className="success-panel"><strong><Check size={18} weight="bold" /> Undangan diterima</strong><span className="small">Membuka timeline keluarga...</span></div> : error ? <p className="field__error" role="alert">{error}</p> : authSessionPending || authSession?.user ? <Button loading={accepting || authSessionPending} disabled>{authSessionPending ? "Memeriksa akun..." : accepting ? "Menghubungkan keluarga..." : "Undangan diterima"}</Button> : <div className="form-actions"><Button onClick={() => router.push(signInUrl)} disabled={!details}>Masuk untuk menerima <ArrowRight size={18} weight="bold" /></Button></div>}</OnboardingCard></PageFrame>;
}
