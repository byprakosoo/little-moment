"use client";

import { ArrowRight, Check, DownloadSimple, Gear, LockKey, SignOut, UserPlus, UsersThree } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@/components/demo-store";
import { Avatar, BackLink, Button, PageFrame, TextField, Toast, formatStorage } from "@/components/little-moment";

export default function FamilySettingsPage() {
  const router = useRouter();
  const { familyName, child, partnerEmail, partnerStatus, updateFamilyName, resetDemo, setForcedState, startExport, exportStatus } = useDemo();
  const [draftFamilyName, setDraftFamilyName] = useState(familyName);
  const [savingFamilyName, setSavingFamilyName] = useState(false);
  const [toast, setToast] = useState("");
  const storage = formatStorage();
  useEffect(() => setDraftFamilyName(familyName), [familyName]);
  const saveFamilyName = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draftFamilyName.trim();
    if (name.length < 2) { setToast("Nama keluarga minimal 2 karakter"); return; }
    setSavingFamilyName(true);
    try { await updateFamilyName(name); setToast("Nama keluarga diperbarui"); }
    catch (error) { setToast(error instanceof Error ? error.message : "Nama keluarga belum bisa disimpan"); }
    finally { setSavingFamilyName(false); }
  };
  const exportPhotos = () => { startExport(); setToast("Menyiapkan export"); window.setTimeout(() => setToast("Export siap diunduh"), 1100); };
  const partnerStatusLabel = partnerStatus === "accepted" ? "Aktif" : partnerStatus === "pending" ? "Menunggu" : "Belum diundang";
  return <PageFrame className="settings-page"><div className="settings-header"><div><BackLink href="/timeline" /><span className="eyebrow">Pengaturan</span><h1>{familyName || "Jurnal keluarga"}</h1></div><span className="private-pill"><LockKey size={14} weight="bold" /> Jurnal privat</span></div><section className="settings-section"><span className="settings-section__title">Profil keluarga</span><div className="settings-card"><form className="form-stack" onSubmit={saveFamilyName}><TextField label="Nama keluarga" id="familyName" value={draftFamilyName} onChange={setDraftFamilyName} placeholder="Contoh: Keluarga Prakoso" maxLength={160} /><Button type="submit" loading={savingFamilyName}>Simpan nama keluarga</Button></form></div></section><section className="settings-section"><span className="settings-section__title">Anggota keluarga</span><div className="settings-card"><div className="family-card__top"><Avatar name={familyName || "Keluarga"} size="lg" /><div className="family-card__copy"><strong>{familyName || "Jurnal keluarga"}</strong><span>Jurnal bersama untuk momen kecil</span></div></div><div className="member-list"><div className="member-row"><div className="member-row__identity"><Avatar name="Bapak" size="sm" /><div><strong>Bapak</strong><span>Pemilik jurnal</span></div></div><span className="member-status">Aktif</span></div><div className="member-row"><div className="member-row__identity"><Avatar name="Mama" size="sm" /><div><strong>Mama</strong><span>{partnerEmail || "Belum diundang"}</span></div></div><span className={`member-status ${partnerStatus === "pending" ? "member-status--pending" : ""}`}>{partnerStatusLabel}</span></div></div><button className="setting-action" onClick={() => router.push("/invite-partner")}><span><UserPlus size={17} /> Undang pasangan</span><ArrowRight size={17} /></button></div></section><section className="settings-section"><span className="settings-section__title">Media</span><div className="settings-card storage-card"><div className="storage-card__top"><div><strong>{storage.used}</strong><span> dari {storage.quota}</span></div><span>{storage.percent}% terpakai</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={storage.percent} aria-label={`${storage.used} dari ${storage.quota} terpakai`}><span style={{ width: `${storage.percent}%` }} /></div><div className="storage-card__footer"><span>Foto disimpan privat di perangkat kamu</span><Button variant="secondary" onClick={exportPhotos}>{exportStatus === "queued" ? "Menyiapkan..." : exportStatus === "ready" ? "Export siap" : <><DownloadSimple size={16} /> Export foto</>}</Button></div></div></section><section className="settings-section"><span className="settings-section__title">Akun</span><div className="settings-links"><a className="settings-link" href="#privacy"><LockKey size={18} /> Kebijakan privasi <ArrowRight size={16} /></a><button className="settings-link settings-link--danger" onClick={() => { resetDemo(); router.push("/signin"); }}><SignOut size={18} /> Keluar <ArrowRight size={16} /></button></div></section><div className="demo-controls"><span className="demo-controls__title">Preview state untuk review</span><div className="demo-controls__buttons"><Button variant="secondary" onClick={() => { setForcedState("empty"); router.push("/timeline"); }}>Empty timeline</Button><Button variant="secondary" onClick={() => { setForcedState("upload-error"); router.push("/create-entry"); }}>Upload error</Button><Button variant="secondary" onClick={() => { setForcedState("storage-full"); router.push("/timeline"); }}>Storage full</Button><Button variant="ghost" onClick={() => { resetDemo(); setToast("Demo direset"); }}>Reset demo</Button></div></div>{toast && <Toast><Check size={16} weight="bold" />{toast}</Toast>}</PageFrame>;
}
