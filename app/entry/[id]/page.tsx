"use client";

import { DotsThree, PencilSimple } from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/components/demo-store";
import { BackLink, Button, DeleteDialog, PageFrame, PhotoPlaceholder, Toast, formatJournalDateTime, formatJournalHeaderDate, formatJournalTime } from "@/components/little-moment";

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { entries, deleteEntry } = useDemo();
  const entry = entries.find((item) => item.id === params.id);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  if (!entry) return <PageFrame className="detail-page"><BackLink /><div className="empty-state" style={{ marginTop: 30 }}><h2>Cerita tidak ditemukan</h2><p>Mungkin cerita ini sudah dihapus dari jurnal.</p><Button onClick={() => router.push("/timeline")}>Kembali ke timeline</Button></div></PageFrame>;
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
  return <PageFrame className="detail-page"><div className="detail-header"><BackLink /><div className="detail-header__date"><span>{formatJournalHeaderDate(entry.happenedAt)}</span><strong>{formatJournalTime(entry.updatedAt)}</strong></div><div className="detail-header__actions"><Button variant="ghost" onClick={() => router.push(`/create-entry?edit=${entry.id}`)}><PencilSimple size={17} /> Edit cerita</Button><button className="icon-button" aria-label="Menu cerita" onClick={() => setDeleting(true)}><DotsThree size={22} /></button></div></div>{entry.photos.length > 0 && <div className={`detail-gallery detail-gallery--${Math.min(entry.photos.length, 3)}`}>{photos.slice(0, 3).map((photo, index) => <PhotoPlaceholder key={photo.id} photo={photo} index={index} />)}</div>}<article className="detail-copy"><div><span className={`type-pill type-pill--${entry.type}`}>{entry.type === "milestone" ? "Milestone" : "Cerita harian"}</span><h1 style={{ marginTop: 13 }}>{entry.title || "Cerita hari ini"}</h1></div><p className="detail-copy__body">{entry.body}</p><div className="detail-meta"><span>Ditulis oleh {entry.author}</span><span>Terakhir diubah {formatJournalDateTime(entry.happenedAt, entry.updatedAt)}</span></div></article>{deleting && <DeleteDialog onCancel={() => setDeleting(false)} onConfirm={confirmDelete} />}{toast && <Toast>{toast}</Toast>}</PageFrame>;
}
