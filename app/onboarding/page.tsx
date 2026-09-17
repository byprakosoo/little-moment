"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarBlank } from "@phosphor-icons/react";
import { BackLink, Button, OnboardingCard, PageFrame, StepLabel, TextField, Avatar } from "@/components/little-moment";
import { useDemo } from "@/components/demo-store";

export default function OnboardingPage() {
  const router = useRouter();
  const { child, saveChild } = useDemo();
  const [nickname, setNickname] = useState(child?.nickname ?? "");
  const [birthDate, setBirthDate] = useState(child?.birthDate ?? "");
  const [errors, setErrors] = useState<{ nickname?: string; birthDate?: string }>({});
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!nickname.trim()) next.nickname = "Isi nama panggilan anak terlebih dahulu.";
    if (!birthDate) next.birthDate = "Pilih tanggal lahir anak terlebih dahulu.";
    if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) next.birthDate = "Tanggal lahir tidak boleh di masa depan.";
    setErrors(next);
    if (Object.keys(next).length === 0) { saveChild(nickname.trim(), birthDate); router.push("/invite-partner"); }
  };
  return <PageFrame className="form-page"><div className="form-page__top"><BackLink href="/signin" /><StepLabel current={1} /></div><OnboardingCard eyebrow="Profil anak" title="Siapa yang ingin kamu abadikan?"><form className="form-stack" onSubmit={submit} noValidate><TextField label="Nama panggilan" id="nickname" value={nickname} onChange={setNickname} placeholder="Contoh: Aksa" required maxLength={40} error={errors.nickname} /><div className="field"><label htmlFor="birthDate">Tanggal lahir</label><div className="date-input-wrap"><CalendarBlank size={19} /><input id="birthDate" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} aria-invalid={Boolean(errors.birthDate)} aria-describedby={errors.birthDate ? "birthDate-error" : undefined} /></div>{errors.birthDate && <span className="field__error" id="birthDate-error" role="alert">{errors.birthDate}</span>}</div>{nickname && <div className="child-preview"><Avatar name={nickname} size="lg" /><div className="child-preview__copy"><strong>{nickname}</strong><span>Profil anak siap disimpan</span></div></div>}<div className="form-actions"><Button type="submit">Lanjutkan <ArrowRight size={18} weight="bold" /></Button></div></form></OnboardingCard></PageFrame>;
}
