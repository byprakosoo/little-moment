"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CaretDown,
  CaretUp,
  ChartDonut,
  CircleNotch,
  Copy,
  DotsThree,
  DownloadSimple,
  EnvelopeSimple,
  Gear,
  ImageSquare,
  LockKey,
  Minus,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
  UserPlus,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { Entry, EntryType, Photo, useDemo } from "./demo-store";

export function BrandMark({ compact = false, href = "/timeline" }: { compact?: boolean; href?: string }) {
  return (
    <Link className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} href={href} aria-label={`Little Moment, ${href === "/timeline" ? "ke timeline" : "kembali ke masuk"}`}>
      <img className="brand-mark__image" src="/little-moment.svg" alt="" />
      <span>Little Moment</span>
    </Link>
  );
}

export function LogoLockup() {
  return <div className="logo-lockup" role="img" aria-label="Little Moment, private family journal">
    <img className="logo-lockup-image" src="/little-moment.svg" alt="" />
    <span className="logo-lockup__wordmark">Little Moment</span>
    <span className="logo-lockup__tagline">PRIVATE FAMILY JOURNAL</span>
  </div>;
}

export function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  disabled,
  loading,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return <button type={type} className={`button button--${variant} ${className}`} disabled={disabled || loading} onClick={onClick}>
    {loading ? <CircleNotch className="spin" size={18} /> : children}
  </button>;
}

export function SkipLink() {
  return <a className="skip-link" href="#main-content">Lewati ke konten utama</a>;
}

export function AppHeader({ showSettings = true }: { showSettings?: boolean }) {
  const path = usePathname();
  const { child } = useDemo();
  return <header className="app-header">
    <BrandMark compact />
    <div className="app-header__right">
      {child && <span className="private-pill"><LockKey size={14} weight="bold" /> Privat</span>}
      {showSettings && <Link className={`icon-button ${path === "/family-settings" ? "is-active" : ""}`} href="/family-settings" aria-label="Buka pengaturan keluarga" title="Pengaturan keluarga"><Gear size={21} weight="duotone" /></Link>}
    </div>
  </header>;
}

export function PageFrame({ children, header = false, className = "" }: { children: React.ReactNode; header?: boolean; className?: string }) {
  return <><SkipLink />{header && <AppHeader />}<main id="main-content" className={`page-frame ${className}`}>{children}</main></>;
}

export function PageLoading({ label = "Memuat jurnal..." }: { label?: string }) {
  return <div className="page-loading" role="status" aria-live="polite"><CircleNotch className="spin" size={22} /><span>{label}</span></div>;
}

export function StepLabel({ current, total = 3 }: { current: number; total?: number }) {
  return <div className="step-label"><span>Langkah {current} dari {total}</span><span className="step-label__line"><span style={{ width: `${(current / total) * 100}%` }} /></span></div>;
}

export function PhotoPlaceholder({ photo, index = 0, className = "", fluid = false }: { photo: Photo; index?: number; className?: string; fluid?: boolean }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const style = fluid && ratio ? { aspectRatio: `${ratio}` } : undefined;
  return <div className={`photo-placeholder photo-placeholder--${index % 4} ${fluid ? "photo-placeholder--fluid" : ""} ${className}`} style={style} role="img" aria-label={photo.label}>
    {photo.previewUrl && <img className="photo-placeholder__image" src={photo.previewUrl} alt={photo.label} loading="lazy" decoding="async" onLoad={(event) => { if (fluid && event.currentTarget.naturalWidth && event.currentTarget.naturalHeight) setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight); }} />}
    <span className="photo-placeholder__sun" />
    <span className="photo-placeholder__silhouette">{index % 2 === 0 ? "A" : "•"}</span>
    {photo.status === "error" && <span className="photo-placeholder__error"><X size={14} /></span>}
  </div>;
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return <div className="empty-state">
    <div className="empty-state__illustration"><ImageSquare size={34} weight="duotone" /></div>
    <h2>Belum ada cerita</h2>
    <p>Satu kalimat kecil hari ini sudah cukup untuk memulai jurnal.</p>
    <Button onClick={onCreate}>Tulis cerita pertama <ArrowRight size={18} weight="bold" /></Button>
  </div>;
}

export function StorageBanner({ full = false, onExport }: { full?: boolean; onExport?: () => void }) {
  return <div className={`storage-banner ${full ? "storage-banner--full" : ""}`} role="status">
    <div className="storage-banner__icon"><ChartDonut size={20} weight="duotone" /></div>
    <div className="storage-banner__copy"><strong>{full ? "Penyimpanan foto penuh" : "Penyimpanan foto hampir penuh"}</strong><span>{full ? "Jurnal teks tetap tersedia. Export atau hapus foto lama untuk menambah foto baru." : "Export foto lama kalau ingin menyimpan lebih banyak momen."}</span></div>
    {onExport && <Button variant="secondary" onClick={onExport}>Export foto</Button>}
  </div>;
}

export function EntryCard({ entry }: { entry: Entry }) {
  return <Link href={`/entry/${entry.id}`} className="entry-card">
    <div className="entry-card__meta"><span>{formatJournalDate(entry.happenedAt)}</span><span className={`type-pill type-pill--${entry.type}`}>{entry.type === "milestone" ? "Milestone" : "Cerita harian"}</span></div>
    <div className="entry-card__body">{entry.photos.length > 0 && <div className={`entry-card__gallery entry-card__gallery--${Math.min(entry.photos.length, 3)}`}>{entry.photos.slice(0, 3).map((photo, index) => <PhotoPlaceholder key={photo.id} photo={photo} index={index} fluid={entry.photos.length === 1} />)}{entry.photos.length > 3 && <span className="gallery-count">+{entry.photos.length - 3}</span>}</div>}<div className="entry-card__copy">{entry.title && <h3>{entry.title}</h3>}<p>{entry.body}</p></div><span className="entry-card__author">Ditulis oleh {entry.author}</span></div>
  </Link>;
}

export function FilterTabs({ value, onChange }: { value: "all" | EntryType; onChange: (value: "all" | EntryType) => void }) {
  return <div className="filter-tabs" role="tablist" aria-label="Filter cerita">
    {([["all", "Semua"], ["story", "Cerita"], ["milestone", "Milestone"]] as const).map(([key, label]) => <button type="button" key={key} className={value === key ? "is-active" : ""} role="tab" aria-selected={value === key} onClick={() => onChange(key)}>{label}</button>)}
  </div>;
}

export function TextField({ label, id, value, onChange, placeholder, type = "text", required, error, maxLength }: { label: string; id: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; error?: string; maxLength?: number }) {
  return <div className="field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label><input id={id} name={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <span className="field__error" id={`${id}-error`} role="alert">{error}</span>}</div>;
}

export function TextAreaField({ label, id, value, onChange, placeholder, error, maxLength = 2000 }: { label: string; id: string; value: string; onChange: (value: string) => void; placeholder?: string; error?: string; maxLength?: number }) {
  return <div className="field"><div className="field__label-row"><label htmlFor={id}>{label} <span className="optional">(opsional jika ada foto)</span></label><span className="character-count">{value.length}/{maxLength}</span></div><textarea id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <span className="field__error" id={`${id}-error`} role="alert">{error}</span>}</div>;
}

export function TypeSegment({ value, onChange }: { value: EntryType; onChange: (value: EntryType) => void }) {
  return <div className="segment-control" role="radiogroup" aria-label="Jenis cerita"><button type="button" className={value === "story" ? "is-active" : ""} onClick={() => onChange("story")} role="radio" aria-checked={value === "story"}>Cerita harian</button><button type="button" className={value === "milestone" ? "is-active" : ""} onClick={() => onChange("milestone")} role="radio" aria-checked={value === "milestone"}>Milestone</button></div>;
}

export function PhotoPicker({ photos, onChange, disabled = false }: { photos: Photo[]; onChange: (photos: Photo[]) => void; disabled?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerError, setPickerError] = useState("");
  const addPhotos = () => { if (!disabled) fileInputRef.current?.click(); };
  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    const available = 6 - photos.length;
    const accepted: Photo[] = [];
    const errors: string[] = [];
    for (const file of files) {
      if (accepted.length >= available) { errors.push("Maksimal 6 foto per cerita."); break; }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { errors.push(`${file.name}: gunakan JPG, PNG, atau WebP.`); continue; }
      if (file.size > 10 * 1024 * 1024) { errors.push(`${file.name}: ukuran maksimal 10 MB.`); continue; }
      try {
        const dataUrl = await compressPhoto(file);
        accepted.push({ id: `photo-${Date.now()}-${accepted.length}`, label: file.name, status: "ready", previewUrl: dataUrl, dataUrl, mimeType: "image/jpeg", byteSize: dataUrlByteSize(dataUrl) });
      } catch {
        errors.push(`${file.name}: foto tidak bisa diproses.`);
      }
    }
    if (accepted.length > 0) onChange([...photos, ...accepted]);
    setPickerError(errors.join(" "));
  };
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= photos.length) return; const next = [...photos]; [next[index], next[target]] = [next[target], next[index]]; onChange(next); };
  const remove = (photo: Photo) => { if (photo.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(photo.previewUrl); onChange(photos.filter((item) => item.id !== photo.id)); };
  return <div className="photo-picker"><div className="photo-picker__head"><div><label>Foto <span className="optional">(opsional)</span></label><p>JPG, PNG, WebP · maksimal 10 MB per foto</p></div><><input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} disabled={disabled} /><Button variant="secondary" disabled={disabled || photos.length >= 6} onClick={addPhotos}><Plus size={17} weight="bold" /> Tambah foto</Button></></div>{photos.length > 0 && <div className="photo-picker__grid">{photos.map((photo, index) => <div className="photo-slot" key={photo.id}><PhotoPlaceholder photo={photo} index={index} /><div className="photo-slot__actions"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Pindahkan foto ke kiri"><CaretUp size={15} /></button><button type="button" onClick={() => move(index, 1)} disabled={index === photos.length - 1} aria-label="Pindahkan foto ke kanan"><CaretDown size={15} /></button><button type="button" onClick={() => remove(photo)} aria-label={`Hapus ${photo.label}`}><X size={15} /></button></div></div>)}</div>}{pickerError && <span className="field__error" role="alert">{pickerError}</span>}</div>;
}

const MAX_PHOTO_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function dataUrlByteSize(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

async function compressPhoto(file: File) {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function DeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="dialog-backdrop" role="presentation"><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><button className="dialog__close" onClick={onCancel} aria-label="Tutup dialog"><X size={20} /></button><div className="dialog__icon"><Trash size={22} weight="duotone" /></div><h2 id="delete-title">Hapus cerita ini?</h2><p>Cerita dan foto di dalamnya akan dihapus dari jurnal keluarga.</p><div className="dialog__actions"><Button variant="secondary" onClick={onCancel}>Batal</Button><Button variant="danger" onClick={onConfirm}>Hapus cerita</Button></div></div></div>;
}

export function Toast({ children }: { children: React.ReactNode }) { return <div className="toast" role="status"><Check size={16} weight="bold" />{children}</div>; }

export function formatStorage() { return { used: "1,38 GB", quota: "8 GB", percent: 16.1 }; }

const journalDateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const journalHeaderDateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const journalTimeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });

export function formatJournalDate(value: string) {
  const date = new Date(`${value}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : journalDateFormatter.format(date);
}

export function formatJournalHeaderDate(value: string) {
  const date = new Date(`${value}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : journalHeaderDateFormatter.format(date);
}

export function formatJournalTime(value: string) {
  if (/^\d{1,2}[:.]\d{2}$/.test(value)) return value.replace(":", ".");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : journalTimeFormatter.format(date);
}

export function formatJournalDateTime(happenedAt: string, updatedAt: string) {
  const updatedDate = new Date(updatedAt);
  const date = Number.isNaN(updatedDate.getTime()) ? formatJournalDate(happenedAt) : journalDateFormatter.format(updatedDate);
  return `${date}, ${formatJournalTime(updatedAt)}`;
}

export function useEntry(id: string) { const { entries } = useDemo(); return entries.find((entry) => entry.id === id); }

export function BackLink({ href = "/timeline", children = "Kembali" }: { href?: string; children?: React.ReactNode }) { return <Link className="back-link" href={href}><ArrowLeft size={18} />{children}</Link>; }

export function OnboardingCard({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) { return <div className="form-card"><div className="form-card__intro">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1></div>{children}</div>; }

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) { return <span className={`avatar avatar--${size}`} aria-label={name}>{name.slice(0, 1)}</span>; }

export function FamilyNav() { return <nav className="family-nav" aria-label="Navigasi keluarga"><Link href="/timeline">Timeline</Link><Link href="/family-settings">Keluarga</Link></nav>; }
