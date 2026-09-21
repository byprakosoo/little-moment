"use client";

import { Funnel, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EntryType, useDemo } from "@/components/demo-store";
import { Button, EmptyState, EntryCard, PageFrame, PageLoading, StorageBanner, Toast, Avatar, TimelineSkeleton } from "@/components/little-moment";
import { appCopy } from "@/lib/app-config";
import { formatChildAge } from "@/lib/child-age";

function ChildSummary({ nickname, birthDate }: { nickname: string; birthDate: string }) {
  return <div className="child-summary"><Avatar name={nickname} size="md" /><div className="child-summary__copy"><strong>{nickname}</strong><span>Usia {formatChildAge(birthDate)} · Jurnal keluarga kamu</span></div></div>;
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return <div className="empty-state filter-empty-state"><div className="empty-state__illustration"><MagnifyingGlass size={34} weight="duotone" /></div><h2>Jurnal tidak ditemukan</h2><p>Coba ubah kata kunci atau rentang filter untuk menemukan cerita lain.</p><Button variant="secondary" onClick={onClear}><X size={17} /> Hapus filter</Button></div>;
}

export default function TimelinePage() {
  const router = useRouter();
  const { familyName, ownerLabel, memberLabel, child, entries, entriesTotal, forcedState, startExport, exportStatus, hydrated, session, contextStatus, entriesHasMore, entriesLoading, entriesRefreshing, entriesError, authorOptions, refreshEntries, loadMoreEntries } = useDemo();
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
  const authors = useMemo(() => apiMode ? authorOptions : Array.from(new Set(effectiveEntries.map((entry) => ({ id: entry.author, label: entry.author })))).sort((a, b) => a.label.localeCompare(b.label, "id")), [apiMode, authorOptions, effectiveEntries]);
  const visibleEntries = useMemo(() => {
    if (apiMode) return effectiveEntries;
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");
    return effectiveEntries.filter((entry) => {
      const matchesType = filter === "all" || entry.type === filter;
      const matchesQuery = !query || `${entry.title} ${entry.body}`.toLocaleLowerCase("id-ID").includes(query);
      const matchesFrom = !dateFrom || entry.happenedAt >= dateFrom;
      const matchesTo = !dateTo || entry.happenedAt <= dateTo;
      const matchesAuthor = !authorFilter || entry.author === authorFilter;
      return matchesType && matchesQuery && matchesFrom && matchesTo && matchesAuthor;
    });
  }, [apiMode, effectiveEntries, filter, searchQuery, dateFrom, dateTo, authorFilter]);
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
    if (contextStatus === "unauthorized") router.replace("/signin");
    else if (contextStatus === "ready" && session && !child) router.replace("/onboarding");
  }, [apiMode, hydrated, session, child, contextStatus, router]);
  const initialFilterSyncSkipped = useRef(false);
  useEffect(() => {
    if (!apiMode || !hydrated || contextStatus !== "ready" || !session || !child) return;
    const isDefault = !searchQuery.trim() && !dateFrom && !dateTo && !authorFilter && filter === "all";
    if (isDefault && !initialFilterSyncSkipped.current) {
      initialFilterSyncSkipped.current = true;
      return;
    }
    initialFilterSyncSkipped.current = true;
    const timer = window.setTimeout(() => { void refreshEntries({ query: searchQuery, from: dateFrom, to: dateTo, type: filter, authorId: authorFilter, reset: true }); }, searchQuery.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [apiMode, hydrated, contextStatus, session, child, searchQuery, dateFrom, dateTo, filter, authorFilter]);
  useEffect(() => {
    if (!apiMode || contextStatus !== "ready" || !session || !child) return;
    const sync = () => { void refreshEntries({ query: searchQuery, from: dateFrom, to: dateTo, type: filter, authorId: authorFilter, reset: true }); };
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("focus", sync); };
  }, [apiMode, contextStatus, session, child, searchQuery, dateFrom, dateTo, filter, authorFilter]);
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
  if (apiMode && (!hydrated || contextStatus === "loading")) {
    return <PageFrame header className="timeline-page"><PageLoading label="Memeriksa jurnal keluarga..." /></PageFrame>;
  }
  if (apiMode && contextStatus === "error") {
    return <PageFrame header className="timeline-page"><div className="empty-state" style={{ marginTop: 30 }}><h2>Timeline belum bisa dimuat</h2><p>Periksa koneksi internet lalu coba buka kembali halaman ini.</p><Button variant="secondary" onClick={() => window.location.reload()}>Coba lagi</Button></div></PageFrame>;
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
        <span className="timeline-toolbar__label">{hasActiveFilters ? visibleEntries.length : entriesTotal} momen{entriesRefreshing ? " · menyegarkan" : ""}</span>
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
        <div className="spotlight-footer"><span>{hasActiveFilters ? visibleEntries.length : entriesTotal} momen ditemukan</span><span><kbd>esc</kbd> untuk menutup</span></div>
      </div>
    </div>}
    {filterOpen && <div className="timeline-overlay timeline-overlay--filter" onMouseDown={(event) => { if (event.currentTarget === event.target) setFilterOpen(false); }}>
      <div className="timeline-filter-drawer" id="timeline-filter-drawer" role="dialog" aria-modal="true" aria-label="Filter jurnal">
        <div className="timeline-panel-header"><div><strong>Filter jurnal</strong><span>Temukan momen berdasarkan konteksnya.</span></div><button className="timeline-panel-close" type="button" onClick={() => setFilterOpen(false)} aria-label="Tutup filter"><X size={17} /></button></div>
        <div className="timeline-filter-row"><label><span>Dari</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} onInput={(event) => setDateFrom(event.currentTarget.value)} aria-label="Tanggal mulai" /></label><label><span>Sampai</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} onInput={(event) => setDateTo(event.currentTarget.value)} aria-label="Tanggal akhir" /></label><label className="timeline-filter-row__author"><span>Penulis</span><select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)} aria-label="Filter penulis"><option value="">Semua penulis</option>{authors.map((author) => <option key={author.id} value={author.id}>{author.label}</option>)}</select></label><label className="timeline-filter-row__type"><span>Jenis</span><select value={filter} onChange={(event) => setFilter(event.target.value as "all" | EntryType)} aria-label="Filter jenis"><option value="all">Semua jenis</option><option value="story">Cerita</option><option value="milestone">Milestone</option></select></label></div>
        <div className="timeline-panel-footer"><span>{hasActiveFilters ? visibleEntries.length : entriesTotal} momen cocok</span><button className="timeline-filter-reset" type="button" onClick={clearFilters} disabled={!hasActiveFilters}>Reset semua</button></div>
      </div>
    </div>}
    {entriesError && visibleEntries.length > 0 && <div className="timeline-sync-warning" role="status"><span>Data terakhir masih ditampilkan. Pembaruan gagal.</span><button type="button" onClick={() => void refreshEntries({ query: searchQuery, from: dateFrom, to: dateTo, type: filter, authorId: authorFilter, reset: true })}>Coba lagi</button></div>}
    {entriesLoading && visibleEntries.length === 0 ? <div className="timeline-list"><TimelineSkeleton /></div> : entriesError && visibleEntries.length === 0 ? <div className="timeline-list"><div className="empty-state"><h2>Jurnal belum bisa dimuat</h2><p>Data terakhir belum tersedia. Periksa koneksi lalu coba lagi.</p><Button variant="secondary" onClick={() => void refreshEntries({ query: searchQuery, from: dateFrom, to: dateTo, type: filter, authorId: authorFilter, reset: true })}>Coba lagi</Button></div></div> : visibleEntries.length === 0 ? <div className="timeline-list">{hasActiveFilters ? <FilteredEmptyState onClear={clearFilters} /> : <EmptyState onCreate={create} />}</div> : <><div className="timeline-list timeline-list--thread">{visibleEntries.map((entry) => <EntryCard key={entry.id} entry={entry} childBirthDate={child?.birthDate} />)}</div>{apiMode && entriesHasMore && <div className="timeline-load-more"><Button variant="secondary" loading={entriesRefreshing} onClick={() => void loadMoreEntries()}>Muat lebih banyak</Button></div>}</>}
    {toast && <Toast>{toast}</Toast>}
  </PageFrame>;
}
