"use client";

import { ArrowRight, CalendarBlank, Check, DownloadSimple, LockKey, SignOut, UserPlus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@/components/demo-store";
import { Avatar, BackLink, Button, PageFrame, TextField, Toast, formatStorage } from "@/components/little-moment";
import { appCopy, DEFAULT_ROLE_LABELS } from "@/lib/app-config";

export default function FamilySettingsPage() {
  const router = useRouter();
  const { familyName, ownerLabel, memberLabel, child, ownerEmail, partnerEmail, partnerStatus, membershipRole, updateFamilyProfile, signOut, leaveFamily, startExport, exportStatus } = useDemo();
  const [draftFamilyName, setDraftFamilyName] = useState(familyName);
  const [draftOwnerLabel, setDraftOwnerLabel] = useState(ownerLabel || DEFAULT_ROLE_LABELS.owner);
  const [draftMemberLabel, setDraftMemberLabel] = useState(memberLabel || DEFAULT_ROLE_LABELS.member);
  const [draftChildNickname, setDraftChildNickname] = useState(child?.nickname ?? "");
  const [draftChildBirthDate, setDraftChildBirthDate] = useState(child?.birthDate ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState("");
  const storage = formatStorage();

  useEffect(() => {
    setDraftFamilyName(familyName);
    setDraftOwnerLabel(ownerLabel || DEFAULT_ROLE_LABELS.owner);
    setDraftMemberLabel(memberLabel || DEFAULT_ROLE_LABELS.member);
    setDraftChildNickname(child?.nickname ?? "");
    setDraftChildBirthDate(child?.birthDate ?? "");
  }, [familyName, ownerLabel, memberLabel, child?.nickname, child?.birthDate]);

  const saveFamilyProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draftFamilyName.trim();
    const nextOwnerLabel = draftOwnerLabel.trim();
    const nextMemberLabel = draftMemberLabel.trim();
    const nextChildNickname = draftChildNickname.trim();
    if (name.length < 2) { setToast("Nama keluarga minimal 2 karakter"); return; }
    if (!nextOwnerLabel || !nextMemberLabel) { setToast("Label orang tua wajib diisi"); return; }
    if (!nextChildNickname) { setToast("Nama panggilan bayi wajib diisi"); return; }
    if (!draftChildBirthDate) { setToast("Tanggal lahir bayi wajib diisi"); return; }
    if (draftChildBirthDate > new Date().toISOString().slice(0, 10)) { setToast("Tanggal lahir bayi tidak boleh di masa depan"); return; }
    setSavingProfile(true);
    try {
      await updateFamilyProfile({ name, ownerLabel: nextOwnerLabel, memberLabel: nextMemberLabel, childNickname: nextChildNickname, childBirthDate: draftChildBirthDate });
      setToast("Profil keluarga diperbarui");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Profil keluarga belum bisa disimpan");
    } finally {
      setSavingProfile(false);
    }
  };

  const exportPhotos = () => { startExport(); setToast("Menyiapkan export"); window.setTimeout(() => setToast("Export siap diunduh"), 1100); };
  const handleSignOut = async () => { try { await signOut(); router.replace("/signin"); } catch (error) { setToast(error instanceof Error ? error.message : "Belum bisa keluar"); } };
  const handleLeaveFamily = async () => {
    if (membershipRole === "owner") { setToast("Pemilik jurnal tidak bisa keluar dari membership ini"); return; }
    if (!window.confirm("Keluar dari jurnal keluarga ini? Kamu tidak akan bisa melihat atau menambahkan cerita lagi.")) return;
    try { await leaveFamily(); await signOut(); router.replace("/signin"); }
    catch (error) { setToast(error instanceof Error ? error.message : "Belum bisa keluar dari jurnal keluarga"); }
  };
  const partnerStatusLabel = partnerStatus === "accepted" ? "Aktif" : partnerStatus === "pending" ? "Menunggu" : "Belum diundang";

  return <PageFrame className="settings-page">
    <div className="settings-header"><div className="settings-header__intro"><BackLink href="/timeline" /><div className="settings-header__title"><span className="eyebrow">Pengaturan</span><h1>{familyName || "Jurnal keluarga"}</h1></div></div><span className="private-pill"><LockKey size={14} weight="bold" /> Jurnal privat</span></div>
    <section className="settings-section"><span className="settings-section__title">Profil keluarga</span><div className="settings-card"><form className="form-stack" onSubmit={saveFamilyProfile}><TextField label="Nama keluarga" id="familyName" value={draftFamilyName} onChange={setDraftFamilyName} placeholder={appCopy.familyNamePlaceholder} maxLength={160} /><TextField label="Nama panggilan bayi" id="childNickname" value={draftChildNickname} onChange={setDraftChildNickname} placeholder="Si Kecil" maxLength={40} /><div className="field"><label htmlFor="childBirthDate">Tanggal lahir bayi</label><div className="date-input-wrap"><CalendarBlank size={19} weight="duotone" /><input id="childBirthDate" name="childBirthDate" type="date" value={draftChildBirthDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDraftChildBirthDate(event.target.value)} required /></div><span className="field__hint">Usia di timeline dihitung dari tanggal ini.</span></div><TextField label="Panggilan pemilik jurnal" id="ownerLabel" value={draftOwnerLabel} onChange={setDraftOwnerLabel} placeholder={DEFAULT_ROLE_LABELS.owner} maxLength={40} /><TextField label="Panggilan pasangan" id="memberLabel" value={draftMemberLabel} onChange={setDraftMemberLabel} placeholder={DEFAULT_ROLE_LABELS.member} maxLength={40} /><p className="small">Gunakan panggilan yang terasa natural untuk keluarga kamu. Perubahan ini akan tampil di seluruh jurnal.</p><Button type="submit" loading={savingProfile}>Simpan perubahan</Button></form></div></section>
    <section className="settings-section"><span className="settings-section__title">Anggota keluarga</span><div className="settings-card"><div className="family-card__top"><Avatar name={familyName || "Keluarga"} size="lg" /><div className="family-card__copy"><strong>{familyName || "Jurnal keluarga"}</strong><span>Jurnal bersama untuk momen kecil</span></div></div><div className="member-list"><div className="member-row"><div className="member-row__identity"><Avatar name={ownerLabel || DEFAULT_ROLE_LABELS.owner} size="sm" /><div><strong>{ownerLabel || DEFAULT_ROLE_LABELS.owner}</strong><span>{ownerEmail || "Email pemilik belum tersedia"}</span></div></div><span className="member-status">Aktif</span></div><div className="member-row"><div className="member-row__identity"><Avatar name={memberLabel || DEFAULT_ROLE_LABELS.member} size="sm" /><div><strong>{memberLabel || DEFAULT_ROLE_LABELS.member}</strong><span>{partnerEmail || "Belum diundang"}</span></div></div><span className={`member-status ${partnerStatus === "pending" ? "member-status--pending" : ""}`}>{partnerStatusLabel}</span></div></div><button className="setting-action" onClick={() => router.push("/invite-partner")}><span><UserPlus size={17} /> Undang pasangan</span><ArrowRight size={17} /></button></div></section>
    <section className="settings-section"><span className="settings-section__title">Media</span><div className="settings-card storage-card"><div className="storage-card__top"><div><strong>{storage.used}</strong><span> dari {storage.quota}</span></div><span>{storage.percent}% terpakai</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={storage.percent} aria-label={`${storage.used} dari ${storage.quota} terpakai`}><span style={{ width: `${storage.percent}%` }} /></div><div className="storage-card__footer"><span>Foto disimpan privat di perangkat kamu</span><Button variant="secondary" onClick={exportPhotos}>{exportStatus === "queued" ? "Menyiapkan..." : exportStatus === "ready" ? "Export siap" : <><DownloadSimple size={16} /> Export foto</>}</Button></div></div></section>
    <section className="settings-section"><span className="settings-section__title">Akun</span><div className="settings-links"><a className="settings-link" href="#privacy"><LockKey size={18} /> Kebijakan privasi <ArrowRight size={16} /></a><button className="settings-link settings-link--danger" onClick={handleLeaveFamily}><SignOut size={18} /> Keluar dari jurnal keluarga <ArrowRight size={16} /></button><button className="settings-link" onClick={handleSignOut}><SignOut size={18} /> Keluar dari akun <ArrowRight size={16} /></button></div></section>
    {toast && <Toast><Check size={16} weight="bold" />{toast}</Toast>}
  </PageFrame>;
}
