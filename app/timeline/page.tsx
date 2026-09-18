"use client";

import { Plus, Sparkle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EntryType, useDemo } from "@/components/demo-store";
import { Button, EmptyState, EntryCard, FilterTabs, PageFrame, StorageBanner, Toast, Avatar } from "@/components/little-moment";

function ChildSummary({ nickname, birthDate }: { nickname: string; birthDate: string }) {
  const months = Math.max(0, Math.floor((Date.now() - new Date(`${birthDate}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  return <div className="child-summary"><Avatar name={nickname} size="md" /><div className="child-summary__copy"><strong>{nickname}, {months} bulan</strong><span>Jurnal keluarga kamu</span></div></div>;
}

export default function TimelinePage() {
  const router = useRouter();
  const { familyName, child, entries, forcedState, setForcedState, startExport, exportStatus } = useDemo();
  const [filter, setFilter] = useState<"all" | EntryType>("all");
  const [toast, setToast] = useState("");
  const effectiveEntries = forcedState === "empty" ? [] : entries;
  const visibleEntries = useMemo(() => filter === "all" ? effectiveEntries : effectiveEntries.filter((entry) => entry.type === filter), [effectiveEntries, filter]);
  const isFull = forcedState === "storage-full";
  const showWarning = forcedState === "storage-full";
  const create = () => router.push("/create-entry");
  const handleExport = () => { startExport(); setToast("Menyiapkan export"); window.setTimeout(() => setToast("Export siap diunduh"), 1100); };
  return <PageFrame className="timeline-page"><div className="timeline-top"><div><span className="eyebrow">{familyName || "Jurnal keluarga"}</span><h1>Halo, Baba dan Bubu</h1><p className="timeline-top__copy">Simpan satu momen kecil hari ini.</p></div><Button onClick={create}><Plus size={18} weight="bold" /> Tulis cerita</Button></div>{child && <ChildSummary nickname={child.nickname} birthDate={child.birthDate} />}{showWarning && <StorageBanner full onExport={handleExport} />}{exportStatus === "ready" && <div className="success-panel" style={{ marginTop: 16 }}><strong>Export siap diunduh</strong><span className="small">File mock sudah siap untuk direview.</span></div>}<div className="composer"><div className="composer__prompt"><Sparkle size={20} weight="duotone" />Ada momen kecil hari ini?</div><Button variant="secondary" onClick={create}>Tulis cerita</Button></div><FilterTabs value={filter} onChange={setFilter} />{visibleEntries.length === 0 ? <div className="timeline-list"><EmptyState onCreate={create} /></div> : <div className="timeline-list">{visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}</div>}<div className="demo-controls"><span className="demo-controls__title">Preview state</span><div className="demo-controls__buttons"><Button variant={forcedState === null ? "primary" : "secondary"} onClick={() => setForcedState(null)}>Default</Button><Button variant={forcedState === "empty" ? "primary" : "secondary"} onClick={() => setForcedState("empty")}>Empty</Button><Button variant={forcedState === "storage-full" ? "primary" : "secondary"} onClick={() => setForcedState("storage-full")}>Storage full</Button></div></div>{toast && <Toast>{toast}</Toast>}</PageFrame>;
}
