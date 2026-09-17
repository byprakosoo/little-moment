"use client";

import { CalendarBlank, Check, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EntryType, Photo, useDemo } from "@/components/demo-store";
import { BackLink, Button, PageFrame, PhotoPicker, TextAreaField, TextField, TypeSegment, Toast } from "@/components/little-moment";

export default function CreateEntryPage() {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const { entries, saveEntry, forcedState } = useDemo();
  const existing = useMemo(() => editId ? entries.find((entry) => entry.id === editId) : undefined, [editId, entries]);
  const [date, setDate] = useState(existing?.happenedAt ?? new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<EntryType>(existing?.type ?? "story");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [photos, setPhotos] = useState<Photo[]>(existing?.photos ?? []);
  const [bodyError, setBodyError] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setEditId(new URLSearchParams(window.location.search).get("edit")); }, []);
  useEffect(() => { if (existing) { setDate(existing.happenedAt); setType(existing.type); setTitle(existing.title); setBody(existing.body); setPhotos(existing.photos); } }, [existing]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() && photos.length === 0) { setBodyError("Tambahkan cerita atau setidaknya satu foto sebelum disimpan."); return; }
    setBodyError(""); setSaving(true);
    const normalizedPhotos = forcedState === "storage-full" ? [] : forcedState === "upload-error" ? photos.map((photo, index) => index === photos.length - 1 ? { ...photo, status: "error" as const } : photo) : photos;
    window.setTimeout(async () => {
      try {
        const entry = await saveEntry({ id: editId ?? undefined, type, title: title.trim(), body: body.trim(), happenedAt: date, author: "Bapak", photos: normalizedPhotos });
        setSaving(false);
        setToast("Cerita tersimpan");
        window.setTimeout(() => router.push(`/entry/${entry.id}`), 500);
      } catch (error) {
        setSaving(false);
        setBodyError(error instanceof Error ? error.message : "Cerita belum bisa disimpan. Coba lagi.");
      }
    }, 350);
  };
  const todayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  return <PageFrame className="entry-form-page"><div className="entry-form-header"><BackLink href="/timeline">Kembali</BackLink><div className="entry-form-header__meta"><span>{existing ? "Edit cerita" : "Cerita baru"}</span><strong>{todayLabel}</strong></div></div><form className="form-card form-stack" onSubmit={submit} noValidate><div className="field"><label htmlFor="happenedAt">Tanggal</label><div className="date-input-wrap"><CalendarBlank size={19} /><input id="happenedAt" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div></div><div className="field"><label>Jenis cerita</label><TypeSegment value={type} onChange={setType} /></div><TextField label="Judul (opsional)" id="title" value={title} onChange={setTitle} placeholder="Contoh: Langkah pertamanya" maxLength={80} /><TextAreaField label="Cerita" id="body" value={body} onChange={setBody} placeholder="Apa yang terjadi hari ini?" error={bodyError} /><PhotoPicker photos={photos} onChange={setPhotos} disabled={forcedState === "storage-full"} />{forcedState === "storage-full" && <div className="storage-banner storage-banner--full"><WarningCircle size={20} /><div className="storage-banner__copy"><strong>Penyimpanan foto penuh</strong><span>Jurnal teks tetap tersedia.</span></div></div>}{forcedState === "upload-error" && photos.length > 0 && <div className="storage-banner storage-banner--full"><WarningCircle size={20} /><div className="storage-banner__copy"><strong>1 foto gagal diunggah</strong><span>Teks tetap bisa disimpan. Coba lagi dari detail cerita.</span></div></div>}<div className="sticky-actions"><Button variant="ghost" onClick={() => router.push("/timeline")}>Batal</Button><Button type="submit" loading={saving}>{forcedState === "storage-full" ? "Simpan tanpa foto" : existing ? "Simpan perubahan" : "Simpan cerita"}</Button></div></form>{toast && <Toast><Check size={16} weight="bold" />{toast}</Toast>}</PageFrame>;
}
