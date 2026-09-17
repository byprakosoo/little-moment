"use client";

import { ArrowLeft, DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/components/demo-store";
import { BackLink, Button, DeleteDialog, PageFrame, PhotoPlaceholder, Toast } from "@/components/little-moment";

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { entries, deleteEntry } = useDemo();
  const entry = entries.find((item) => item.id === params.id);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  if (!entry) return <PageFrame className="detail-page"><BackLink /><div className="empty-state" style={{ marginTop: 30 }}><h2>Cerita tidak ditemukan</h2><p>Mungkin cerita ini sudah dihapus dari jurnal.</p><Button onClick={() => router.push("/timeline")}>Kembali ke timeline</Button></div></PageFrame>;
  const date = new Date(`${entry.happenedAt}T12:00:00`);
  const photos = [...entry.photos];
  const confirmDelete = () => { deleteEntry(entry.id); setDeleting(false); setToast("Cerita dihapus"); window.setTimeout(() => router.push("/timeline"), 500); };
  return <PageFrame className="detail-page"><div className="detail-header"><BackLink /><div className="detail-header__date"><span>{date.toLocaleDateString("id-ID", { weekday: "long" })}</span><strong>{date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></div><div className="detail-header__actions"><Button variant="ghost" onClick={() => router.push(`/create-entry?edit=${entry.id}`)}><PencilSimple size={17} /> Edit cerita</Button><button className="icon-button" aria-label="Menu cerita" onClick={() => setDeleting(true)}><DotsThree size={22} /></button></div></div>{entry.photos.length > 0 && <div className="detail-gallery">{photos.slice(0, 3).map((photo, index) => <PhotoPlaceholder key={photo.id} photo={photo} index={index} />)}</div>}<article className="detail-copy"><div><span className={`type-pill type-pill--${entry.type}`}>{entry.type === "milestone" ? "Milestone" : "Cerita harian"}</span><h1 style={{ marginTop: 13 }}>{entry.title || "Cerita hari ini"}</h1></div><p className="detail-copy__body">{entry.body}</p><div className="detail-meta"><span>Ditulis oleh {entry.author}</span><span>Terakhir diubah {entry.updatedAt}</span></div><div className="detail-divider" /><div className="detail-danger"><Button variant="ghost" onClick={() => setDeleting(true)}><Trash size={17} /> Hapus cerita</Button></div></article>{deleting && <DeleteDialog onCancel={() => setDeleting(false)} onConfirm={confirmDelete} />}{toast && <Toast>{toast}</Toast>}</PageFrame>;
}
