"use client";

import { Funnel, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EntryType, useDemo } from "@/components/demo-store";
import { Button, EmptyState, EntryCard, PageFrame, PageLoading, StorageBanner, Toast, Avatar } from "@/components/little-moment";
import { appCopy } from "@/lib/app-config";

function ChildSummary({ nickname, birthDate }: { nickname: string; birthDate: string }) {
  const months = Math.max(0, Math.floor((Date.now() - new Date(`${birthDate}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  return <div className="child-summary"><Avatar name={nickname} size="md" /><div className="child-summary__copy"><strong>{nickname}, {months} bulan</strong><span>Jurnal keluarga kamu</span></div></div>;
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return <div className="empty-state filter-empty-state"><div className="empty-state__illustration"><MagnifyingGlass size={34} weight="duotone" /></div><h2>Jurnal tidak ditemukan</h2><p>Coba ubah kata kunci atau rentang filter untuk menemukan cerita lain.</p><Button variant="secondary" onClick={onClear}><X size={17} /> Hapus filter</Button></div>;
}

export default function TimelinePage() {
  const router = useRouter();
  const { familyName, ownerLabel, memberLabel, child, entries, forcedState, startExport, exportStatus, hydrated, session } = useDemo();
  const apiMode = process.env.NEXT_PUBLIC_BACKEND_MODE === "api";
  const [filter, setFilter] = useState<"all" | EntryType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toast, setToast] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const effectiveEntries = forcedState === "empty" ? [] : entries;
  const authors = useMemo(() => Array.from(new Set(effectiveEntries.map((entry) => entry.author))).sort((a, b) => a.localeCompare(b, "id")), [effectiveEntries]);
  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");
    return effectiveEntries.filter((entry) => {
      const matchesType = filter === "all" || entry.type === filter;
      const matchesQuery = !query || `${entry.title} ${entry.body}`.toLocaleLowerCase("id-ID").includes(query);
      const matchesFrom = !dateFrom || entry.happenedAt >= dateFrom;
      const matchesTo = !dateTo || entry.happenedAt <= dateTo;
      const matchesAuthor = !authorFilter || entry.author === authorFilter;
      return matchesType && matchesQuery && matchesFrom && matchesTo && matchesAuthor;
    });
  }, [effectiveEntries, filter, searchQuery, dateFrom, dateTo, authorFilter]);
  const hasActiveFilters = Boolean(searchQuery.trim() || dateFrom || dateTo || authorFilter || filter !== "all");
  const activeFilterCount = [filter !== "all", dateFrom, dateTo, authorFilter].filter(Boolean).length;
  const clearFilters = () => { setSearchQuery(""); setDateFrom(""); setDateTo(""); setAuthorFilter(""); setFilter("all"); };
  const isFull = forcedState === "storage-full";
  const showWarning = forcedState === "storage-full";
  const create = () => router.push("/create-entry");
  const handleExport = () => { startExport(); setToast("Menyiapkan export"); window.setTimeout(() => setToast("Export siap diunduh"), 1100); };
  const toggleSearch = () => { setSearchOpen((open) => !open); setFilterOpen(false); };
  const toggleFilter = () => { setFilterOpen((open) => !open); setSearchOpen(false); };
  useEffect(() => {
    if (!apiMode || !hydrated) return;
    if (!session) router.replace("/signin");
    else if (!child) router.replace("/onboarding");
  }, [apiMode, hydrated, session, child, router]);
  useEffect(() => {
    if (!searchOpen && !filterOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [searchOpen, filterOpen]);
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);
  if (apiMode && (!hydrated || !session || !child)) {
    return <PageFrame header className="timeline-page"><PageLoading label={!hydrated ? "Memuat jurnal..." : "Menyiapkan profil keluarga..."} /></PageFrame>;
  }
  return <PageFrame header className="timeline-page">
    <div className="timeline-intro">
      <div className="timeline-top"><div><span className="eyebrow">{familyName || "Jurnal keluarga"}</span><h1>{appCopy.timelineGreeting(ownerLabel, memberLabel)}</h1><p className="timeline-top__copy">{appCopy.timelinePrompt}</p></div></div>
      {child && <ChildSummary nickname={child.nickname} birthDate={child.birthDate} />}
    </div>
    {showWarning && <StorageBanner full onExport={handleExport} />}
    {exportStatus === "ready" && <div className="success-panel" style={{ marginTop: 16 }}><strong>Export siap diunduh</strong><span className="small">File mock sudah siap untuk direview.</span></div>}
    <div className="timeline-controls">
      <div className="timeline-toolbar">
        <span className="timeline-toolbar__label">{visibleEntries.length} momen</span>
        <div className="timeline-toolbar__actions">
          <button className={`timeline-icon-button${searchOpen || searchQuery ? " is-active" : ""}`} type="button" onClick={toggleSearch} aria-expanded={searchOpen} aria-controls="timeline-search-panel" aria-label="Buka pencarian" title="Cari jurnal"><MagnifyingGlass size={18} weight="bold" /></button>
          <button className={`timeline-icon-button${filterOpen || activeFilterCount ? " is-active" : ""}`} type="button" onClick={toggleFilter} aria-expanded={filterOpen} aria-controls="timeline-filter-drawer" aria-label="Buka filter" title="Filter jurnal"><Funnel size={18} weight="bold" />{activeFilterCount > 0 && <span className="timeline-filter-badge">{activeFilterCount}</span>}</button>
          <Button variant="primary" onClick={create}><Plus size={16} weight="bold" /> Tulis cerita</Button>
        </div>
      </div>
    </div>
    {searchOpen && <div className="timeline-overlay timeline-overlay--search" onMouseDown={(event) => { if (event.currentTarget === event.target) setSearchOpen(false); }}>
      <div className="spotlight-panel" id="timeline-search-panel" role="dialog" aria-modal="true" aria-label="Cari jurnal">
        <label className="spotlight-input"><MagnifyingGlass size={22} weight="bold" /><input ref={searchInputRef} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari judul atau isi jurnal" aria-label="Cari judul atau isi jurnal" /><kbd>esc</kbd></label>
        <div className="spotlight-footer"><span>{visibleEntries.length} momen ditemukan</span><span><kbd>esc</kbd> untuk menutup</span></div>
      </div>
    </div>}
    {filterOpen && <div className="timeline-overlay timeline-overlay--filter" onMouseDown={(event) => { if (event.currentTarget === event.target) setFilterOpen(false); }}>
      <div className="timeline-filter-drawer" id="timeline-filter-drawer" role="dialog" aria-modal="true" aria-label="Filter jurnal">
        <div className="timeline-panel-header"><div><strong>Filter jurnal</strong><span>Temukan momen berdasarkan konteksnya.</span></div><button className="timeline-panel-close" type="button" onClick={() => setFilterOpen(false)} aria-label="Tutup filter"><X size={17} /></button></div>
        <div className="timeline-filter-row"><label><span>Dari</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} onInput={(event) => setDateFrom(event.currentTarget.value)} aria-label="Tanggal mulai" /></label><label><span>Sampai</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} onInput={(event) => setDateTo(event.currentTarget.value)} aria-label="Tanggal akhir" /></label><label className="timeline-filter-row__author"><span>Penulis</span><select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)} aria-label="Filter penulis"><option value="">Semua penulis</option>{authors.map((author) => <option key={author} value={author}>{author}</option>)}</select></label><label className="timeline-filter-row__type"><span>Jenis</span><select value={filter} onChange={(event) => setFilter(event.target.value as "all" | EntryType)} aria-label="Filter jenis"><option value="all">Semua jenis</option><option value="story">Cerita</option><option value="milestone">Milestone</option></select></label></div>
        <div className="timeline-panel-footer"><span>{visibleEntries.length} momen cocok</span><button className="timeline-filter-reset" type="button" onClick={clearFilters} disabled={!hasActiveFilters}>Reset semua</button></div>
      </div>
    </div>}
    {visibleEntries.length === 0 ? <div className="timeline-list">{hasActiveFilters ? <FilteredEmptyState onClear={clearFilters} /> : <EmptyState onCreate={create} />}</div> : <div className="timeline-list timeline-list--thread">{visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}</div>}
    {toast && <Toast>{toast}</Toast>}
  </PageFrame>;
}
