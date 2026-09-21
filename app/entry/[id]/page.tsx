"use client";

import { DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDemo } from "@/components/demo-store";
import { BackLink, Button, DeleteDialog, PageFrame, PageLoading, PhotoPlaceholder, Toast, formatJournalDateTime, formatJournalHeaderDate, formatJournalTime } from "@/components/little-moment";

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { entries, deleteEntry, loadEntry } = useDemo();
  const entry = entries.find((item) => item.id === params.id);
  const apiMode = process.env.NEXT_PUBLIC_BACKEND_MODE === "api";
  const [entryLoading, setEntryLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!apiMode || !params.id || entry) return;
    setEntryLoading(true);
    void loadEntry(params.id).finally(() => setEntryLoading(false));
  }, [apiMode, params.id, entry]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  if (!entry) return <PageFrame className="detail-page"><BackLink />{entryLoading ? <PageLoading label="Membuka cerita..." /> : <div className="empty-state" style={{ marginTop: 30 }}><h2>Cerita tidak ditemukan</h2><p>Mungkin cerita ini sudah dihapus dari jurnal.</p><Button onClick={() => router.push("/timeline")}>Kembali ke timeline</Button></div>}</PageFrame>;
  const photos = [...entry.photos];
  const confirmDelete = async () => {
    setDeleting(false);
    try {
      await deleteEntry(entry.id);
      router.replace("/timeline");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Cerita belum bisa dihapus. Coba lagi.");
    }
  };
  return <PageFrame className="detail-page"><div className="detail-header"><BackLink /><div className="detail-header__date"><span>{formatJournalHeaderDate(entry.happenedAt)}</span><strong>{formatJournalTime(entry.updatedAt)}</strong></div><div className="detail-header__actions"><div className="detail-actions-menu-wrap" ref={menuRef}><button className={`icon-button${menuOpen ? " is-active" : ""}`} aria-label="Menu cerita" aria-expanded={menuOpen} aria-controls="entry-actions-menu" onClick={() => setMenuOpen((open) => !open)}><DotsThree size={22} /></button>{menuOpen && <div className="detail-actions-menu" id="entry-actions-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setMenuOpen(false); router.push(`/create-entry?edit=${entry.id}`); }}><PencilSimple size={17} /> Edit cerita</button><button type="button" role="menuitem" className="detail-actions-menu__danger" onClick={() => { setMenuOpen(false); setDeleting(true); }}><Trash size={17} /> Hapus cerita</button></div>}</div></div></div>{entry.photos.length > 0 && <div className={`detail-gallery detail-gallery--${Math.min(entry.photos.length, 3)}`}>{photos.slice(0, 3).map((photo, index) => <PhotoPlaceholder key={photo.id} photo={photo} index={index} fluid={entry.photos.length === 1} />)}</div>}<article className="detail-copy"><div><span className={`type-pill type-pill--${entry.type}`}>{entry.type === "milestone" ? "Milestone" : "Cerita harian"}</span><h1 style={{ marginTop: 13 }}>{entry.title || "Cerita hari ini"}</h1></div><p className="detail-copy__body">{entry.body}</p><div className="detail-meta"><span>Ditulis oleh {entry.author}</span><span>Terakhir diubah {formatJournalDateTime(entry.happenedAt, entry.updatedAt)}</span></div></article>{deleting && <DeleteDialog onCancel={() => setDeleting(false)} onConfirm={confirmDelete} />}{toast && <Toast>{toast}</Toast>}</PageFrame>;
}
