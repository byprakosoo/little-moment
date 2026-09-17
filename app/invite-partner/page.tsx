"use client";

import { ArrowRight, Check, EnvelopeSimple, Info } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink, Button, OnboardingCard, PageFrame, StepLabel, TextField, Avatar } from "@/components/little-moment";
import { useDemo } from "@/components/demo-store";

export default function InvitePartnerPage() {
  const router = useRouter();
  const { child, partnerEmail, invitePartner } = useDemo();
  const [email, setEmail] = useState(partnerEmail === "mama@example.com" ? "" : partnerEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!email.includes("@")) { setError("Masukkan email pasangan yang valid."); return; } setError(""); setLoading(true); window.setTimeout(() => { invitePartner(email); setLoading(false); setSent(true); }, 650); };
  return <PageFrame className="form-page"><div className="form-page__top"><BackLink href="/onboarding" /><StepLabel current={2} /></div><OnboardingCard eyebrow="Ajak pasangan" title="Jurnal ini lebih lengkap berdua"><p>Undang pasangan supaya kalian bisa menyimpan cerita dari sudut pandang masing-masing.</p>{child && <div className="child-preview"><Avatar name={child.nickname} size="md" /><div className="child-preview__copy"><strong>{child.nickname}</strong><span>Profil anak kamu</span></div></div>}{sent ? <><div className="success-panel"><strong><Check size={18} weight="bold" /> Undangan sudah disiapkan</strong><span className="small">Kami menyiapkan undangan untuk {email}.</span></div><div className="form-actions"><Button onClick={() => router.push("/timeline")}>Buka timeline <ArrowRight size={18} weight="bold" /></Button></div></> : <form className="form-stack" onSubmit={submit} noValidate><TextField label="Email pasangan" id="partnerEmail" value={email} onChange={setEmail} placeholder="pasangan@example.com" type="email" required error={error} /><div className="invite-note"><Info size={18} weight="duotone" /><span>Pasangan bisa menerima undangan nanti. Kamu tetap bisa mulai menulis sekarang.</span></div><div className="form-actions"><Button variant="ghost" onClick={() => router.push("/timeline")}>Lewati dulu</Button><Button type="submit" loading={loading}>Kirim undangan <EnvelopeSimple size={17} weight="bold" /></Button></div></form>}</OnboardingCard></PageFrame>;
}
