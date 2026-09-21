"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_CHILD_NAME, DEFAULT_FAMILY_NAME, DEFAULT_ROLE_LABELS } from "@/lib/app-config";
import { dropTimelineCache, readTimelineCache, writeTimelineCache } from "@/lib/timeline-cache";

export type PhotoStatus = "uploaded" | "ready" | "error";
export type EntryType = "story" | "milestone";

export type Photo = {
  id: string;
  label: string;
  status: PhotoStatus;
  previewUrl?: string;
  dataUrl?: string;
  mimeType?: string;
  byteSize?: number;
};
export type Entry = {
  id: string;
  type: EntryType;
  title: string;
  body: string;
  happenedAt: string;
  author: string;
  authorId?: string;
  photos: Photo[];
  updatedAt: string;
};

type DemoState = {
  session: boolean;
  membershipRole: "owner" | "member" | null;
  familyName: string;
  ownerLabel: string;
  memberLabel: string;
  child: { id?: string; nickname: string; birthDate: string } | null;
  ownerEmail: string;
  partnerEmail: string;
  partnerStatus: "none" | "pending" | "accepted";
  entries: Entry[];
  entriesTotal: number;
  entriesNextCursor: string | null;
  entriesHasMore: boolean;
  entriesLoading: boolean;
  entriesRefreshing: boolean;
  entriesError: string;
  cacheKey: string;
  authorOptions: { id: string; label: string }[];
  contextStatus: "loading" | "ready" | "unauthorized" | "error";
  entriesQuery: EntryQueryOptions;
  forcedState: "empty" | "upload-error" | "storage-full" | null;
  exportStatus: "idle" | "queued" | "ready";
};

const today = new Date();
const isoDate = (value: Date) => value.toISOString().slice(0, 10);

const defaultState: DemoState = {
  session: false,
  membershipRole: "owner",
  familyName: DEFAULT_FAMILY_NAME,
  ownerLabel: DEFAULT_ROLE_LABELS.owner,
  memberLabel: DEFAULT_ROLE_LABELS.member,
  child: { id: "child-1", nickname: DEFAULT_CHILD_NAME, birthDate: "2025-01-12" },
  ownerEmail: "",
  partnerEmail: "pasangan@example.com",
  partnerStatus: "pending",
  entries: [
    {
      id: "entry-1",
      type: "milestone",
      title: "Langkah pertamanya",
      body: "Hari ini Si Kecil berdiri sendiri untuk pertama kali. Kita semua langsung bersorak.",
      happenedAt: isoDate(new Date(today.getTime() - 86400000)),
      author: DEFAULT_ROLE_LABELS.owner,
      photos: [
        { id: "photo-1", label: "Si Kecil berdiri", status: "uploaded" },
        { id: "photo-2", label: "Tangan kecil", status: "uploaded" },
      ],
      updatedAt: "09.12",
    },
    {
      id: "entry-2",
      type: "story",
      title: "",
      body: "Pagi ini Si Kecil tertawa waktu dengar suara air. Suaranya bikin dapur terasa ramai.",
      happenedAt: isoDate(today),
      author: DEFAULT_ROLE_LABELS.member,
      photos: [],
      updatedAt: "07.48",
    },
  ],
  entriesNextCursor: null,
  entriesTotal: 2,
  entriesHasMore: false,
  entriesLoading: false,
  entriesRefreshing: false,
  entriesError: "",
  cacheKey: "demo",
  authorOptions: [
    { id: "owner", label: DEFAULT_ROLE_LABELS.owner },
    { id: "member", label: DEFAULT_ROLE_LABELS.member },
  ],
  contextStatus: "ready",
  entriesQuery: {},
  forcedState: null,
  exportStatus: "idle",
};

type DemoContextValue = DemoState & {
  hydrated: boolean;
  signIn: () => void;
  saveChild: (nickname: string, birthDate: string) => void;
  invitePartner: (email: string) => Promise<void>;
  updateFamilyName: (name: string) => Promise<void>;
  updateFamilyProfile: (profile: { name: string; ownerLabel: string; memberLabel: string; childNickname?: string; childBirthDate?: string }) => Promise<void>;
  refreshEntries: (options?: EntryQueryOptions) => Promise<void>;
  loadMoreEntries: () => Promise<void>;
  loadEntry: (id: string) => Promise<Entry | null>;
  saveEntry: (entry: Omit<Entry, "id" | "updatedAt"> & { id?: string }) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  setForcedState: (state: DemoState["forcedState"]) => void;
  startExport: () => void;
  resetDemo: () => void;
  signOut: () => Promise<void>;
  leaveFamily: () => Promise<void>;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const STORAGE_KEY = "little-moment-prototype-v1";
const API_MODE = process.env.NEXT_PUBLIC_BACKEND_MODE === "api";
const initialState: DemoState = API_MODE
  ? { ...defaultState, familyName: "", ownerLabel: DEFAULT_ROLE_LABELS.owner, memberLabel: DEFAULT_ROLE_LABELS.member, child: null, ownerEmail: "", partnerEmail: "", entries: [], entriesTotal: 0, membershipRole: null, entriesNextCursor: null, entriesHasMore: false, entriesLoading: true, entriesRefreshing: false, entriesError: "", cacheKey: "", authorOptions: [], contextStatus: "loading", entriesQuery: {} }
  : defaultState;

export type EntryQueryOptions = { query?: string; from?: string; to?: string; type?: "all" | EntryType; authorId?: string; reset?: boolean };

const entryQueryString = (options: EntryQueryOptions = {}, cursor?: string) => {
  const params = new URLSearchParams();
  params.set("limit", "20");
  if (options.query?.trim()) params.set("q", options.query.trim());
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.type && options.type !== "all") params.set("type", options.type);
  if (options.authorId) params.set("authorId", options.authorId);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
};

type EntryFeedResponse = { entries: Entry[]; nextCursor: string | null; total: number; authors: { id: string; label: string }[] };

async function apiRequest(path: string, init?: RequestInit) {
  if (!API_MODE) return null;
  const response = await fetch(path, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || `Request failed: ${response.status}`);
  return response.json();
}

async function fetchEntryFeed(options: EntryQueryOptions = {}, cursor?: string): Promise<EntryFeedResponse> {
  const response = await apiRequest(`/api/entries?${entryQueryString(options, cursor)}`) as EntryFeedResponse;
  return { entries: response.entries || [], nextCursor: response.nextCursor || null, total: response.total || 0, authors: response.authors || [] };
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const entriesRequestRef = useRef(0);

  useEffect(() => {
    if (API_MODE) {
      let cancelled = false;
      const hydrateApi = async () => {
        try {
          const response = await fetch("/api/bootstrap?scope=context", { credentials: "include" });
          if (response.status === 401) {
            if (!cancelled) setState((current) => ({ ...current, session: false, contextStatus: "unauthorized", entriesLoading: false }));
            if (!cancelled) setHydrated(true);
            return;
          }
          if (!response.ok) throw new Error(`Bootstrap failed: ${response.status}`);
          const payload = await response.json();
          const currentMember = payload.members?.find((member: { userId: string; role: string }) => member.userId === payload.currentUserId);
          const owner = payload.members?.find((member: { role: string }) => member.role === "owner");
          const partner = payload.members?.find((member: { role: string }) => member.role === "member");
          const cacheKey = `${payload.currentUserId}:${payload.family?.id}`;
          const cached = await readTimelineCache(cacheKey);
          if (cancelled) return;
          setState((current) => ({ ...current, familyName: payload.family?.name || current.familyName, ownerLabel: payload.family?.ownerLabel || current.ownerLabel, memberLabel: payload.family?.memberLabel || current.memberLabel, child: payload.child ? { id: payload.child.id, nickname: payload.child.nickname, birthDate: payload.child.birthDate } : null, entries: cached?.entries || [], ownerEmail: owner?.email || "", partnerEmail: partner?.email || payload.pendingInviteEmail || "", partnerStatus: partner ? "accepted" : payload.pendingInviteEmail ? "pending" : "none", membershipRole: currentMember?.role === "owner" ? "owner" : "member", session: true, cacheKey, authorOptions: cached ? current.authorOptions : [], contextStatus: "ready", entriesLoading: true, entriesError: "", entriesQuery: {} }));
          setHydrated(true);
          const requestId = ++entriesRequestRef.current;
          const feed = await fetchEntryFeed();
          if (requestId !== entriesRequestRef.current) return;
          if (cancelled) return;
          setState((current) => ({ ...current, entries: feed.entries, entriesTotal: feed.total, entriesNextCursor: feed.nextCursor, entriesHasMore: Boolean(feed.nextCursor), entriesLoading: false, entriesRefreshing: false, entriesError: "", authorOptions: feed.authors, entriesQuery: {} }));
          await writeTimelineCache(cacheKey, { familyName: payload.family?.name || "", ownerLabel: payload.family?.ownerLabel || DEFAULT_ROLE_LABELS.owner, memberLabel: payload.family?.memberLabel || DEFAULT_ROLE_LABELS.member, child: payload.child ? { id: payload.child.id, nickname: payload.child.nickname, birthDate: payload.child.birthDate } : null, entries: feed.entries });
        } catch (error) {
          if (!cancelled) {
            setState((current) => ({ ...current, entriesLoading: false, entriesRefreshing: false, entriesError: error instanceof Error ? error.message : "Jurnal belum bisa disegarkan", contextStatus: current.contextStatus === "ready" ? "ready" : "error" }));
            setHydrated(true);
          }
        }
      };
      void hydrateApi();
      return () => { cancelled = true; };
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState({ ...defaultState, ...JSON.parse(saved) });
      } catch {
        setState(defaultState);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !API_MODE) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<DemoContextValue>(() => ({
    ...state,
    hydrated,
    signIn: () => setState((current) => ({ ...current, session: true })),
    saveChild: (nickname, birthDate) => {
      setState((current) => ({ ...current, child: { nickname, birthDate } }));
      void apiRequest("/api/families", { method: "POST", body: JSON.stringify({ nickname, birthDate }) })
        .then((result) => {
          if (result?.childId) setState((current) => current.child ? { ...current, child: { ...current.child, id: result.childId } } : current);
        })
        .catch(() => undefined);
    },
    invitePartner: async (partnerEmail) => {
      const previousEmail = state.partnerEmail;
      setState((current) => ({ ...current, partnerEmail }));
      if (!API_MODE) return;
      try {
        await apiRequest("/api/invites", { method: "POST", body: JSON.stringify({ email: partnerEmail }) });
      } catch (error) {
        setState((current) => ({ ...current, partnerEmail: previousEmail }));
        throw error;
      }
    },
    updateFamilyName: async (name) => {
      const previousName = state.familyName;
      setState((current) => ({ ...current, familyName: name }));
      if (!API_MODE) return;
      try {
        await apiRequest("/api/families", { method: "PATCH", body: JSON.stringify({ name }) });
      } catch (error) {
        setState((current) => ({ ...current, familyName: previousName }));
        throw error;
      }
    },
    updateFamilyProfile: async (profile) => {
      const previous = { familyName: state.familyName, ownerLabel: state.ownerLabel, memberLabel: state.memberLabel, child: state.child };
      setState((current) => ({
        ...current,
        familyName: profile.name,
        ownerLabel: profile.ownerLabel,
        memberLabel: profile.memberLabel,
        child: profile.childNickname !== undefined || profile.childBirthDate !== undefined
          ? current.child
            ? { ...current.child, nickname: profile.childNickname ?? current.child.nickname, birthDate: profile.childBirthDate ?? current.child.birthDate }
            : { nickname: profile.childNickname ?? DEFAULT_CHILD_NAME, birthDate: profile.childBirthDate ?? "" }
          : current.child,
      }));
      if (!API_MODE) return;
      try {
        const result = await apiRequest("/api/families", { method: "PATCH", body: JSON.stringify(profile) });
        if (result?.child) setState((current) => ({ ...current, child: result.child }));
      } catch (error) {
        setState((current) => ({ ...current, ...previous }));
        throw error;
      }
    },
    refreshEntries: async (options = {}) => {
      if (!API_MODE) return;
      const reset = options.reset !== false;
      const requestId = ++entriesRequestRef.current;
      setState((current) => ({ ...current, entriesLoading: reset && current.entries.length === 0, entriesRefreshing: true, entriesError: "" }));
      try {
        const feed = await fetchEntryFeed(options);
        if (requestId !== entriesRequestRef.current) return;
        setState((current) => {
          const merged = reset ? feed.entries : [...current.entries, ...feed.entries.filter((entry) => !current.entries.some((item) => item.id === entry.id))];
          return { ...current, entries: merged, entriesTotal: feed.total, entriesNextCursor: feed.nextCursor, entriesHasMore: Boolean(feed.nextCursor), entriesLoading: false, entriesRefreshing: false, entriesError: "", authorOptions: feed.authors, entriesQuery: { ...options, reset: true } };
        });
        const isBaseFeed = !options.query?.trim() && !options.from && !options.to && (!options.type || options.type === "all") && !options.authorId;
        if (isBaseFeed && state.cacheKey) await writeTimelineCache(state.cacheKey, { familyName: state.familyName, ownerLabel: state.ownerLabel, memberLabel: state.memberLabel, child: state.child, entries: feed.entries });
      } catch (error) {
        setState((current) => ({ ...current, entriesLoading: false, entriesRefreshing: false, entriesError: error instanceof Error ? error.message : "Jurnal belum bisa disegarkan" }));
      }
    },
    loadMoreEntries: async () => {
      if (!API_MODE || !state.entriesNextCursor || state.entriesRefreshing) return;
      const requestId = ++entriesRequestRef.current;
      setState((current) => ({ ...current, entriesRefreshing: true, entriesError: "" }));
      try {
        const feed = await fetchEntryFeed(state.entriesQuery, state.entriesNextCursor);
        if (requestId !== entriesRequestRef.current) return;
        setState((current) => ({ ...current, entries: [...current.entries, ...feed.entries.filter((entry) => !current.entries.some((item) => item.id === entry.id))], entriesTotal: feed.total, entriesNextCursor: feed.nextCursor, entriesHasMore: Boolean(feed.nextCursor), entriesRefreshing: false, authorOptions: feed.authors }));
        if (state.cacheKey) await writeTimelineCache(state.cacheKey, { familyName: state.familyName, ownerLabel: state.ownerLabel, memberLabel: state.memberLabel, child: state.child, entries: [...state.entries, ...feed.entries] });
      } catch (error) {
        setState((current) => ({ ...current, entriesRefreshing: false, entriesError: error instanceof Error ? error.message : "Jurnal belum bisa dimuat" }));
      }
    },
    loadEntry: async (id) => {
      if (!API_MODE) return state.entries.find((entry) => entry.id === id) || null;
      try {
        const entry = await apiRequest(`/api/entries/${encodeURIComponent(id)}`) as Entry;
        setState((current) => ({ ...current, entries: current.entries.some((item) => item.id === entry.id) ? current.entries.map((item) => item.id === entry.id ? entry : item) : [entry, ...current.entries] }));
        return entry;
      } catch {
        return null;
      }
    },
    saveEntry: async (input) => {
      const entry: Entry = {
        ...input,
        id: input.id ?? `entry-${Date.now()}`,
        updatedAt: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      };
      setState((current) => ({
        ...current,
        entries: current.entries.some((item) => item.id === entry.id)
          ? current.entries.map((item) => (item.id === entry.id ? entry : item))
          : [entry, ...current.entries],
      }));
      if (!API_MODE) return entry;
      const isNew = !input.id;
      try {
        const result = await apiRequest(isNew ? "/api/entries" : `/api/entries/${entry.id}`, { method: isNew ? "POST" : "PATCH", body: JSON.stringify({ childId: state.child?.id, type: entry.type, title: entry.title, body: entry.body, happenedAt: entry.happenedAt, photos: entry.photos.map((photo, index) => ({ id: photo.previewUrl?.startsWith("/api/photos/") ? photo.id : undefined, storageKey: `inline/${photo.id}`, dataUrl: photo.dataUrl, mimeType: photo.mimeType || "image/jpeg", byteSize: photo.byteSize || 0, altText: photo.label, sortOrder: index })) }) });
        if (isNew && result?.id) {
          const persisted = await apiRequest(`/api/entries/${result.id as string}`) as Entry;
          setState((current) => {
            const nextEntries = current.entries.map((item) => item.id === entry.id ? persisted : item);
            if (current.cacheKey) void writeTimelineCache(current.cacheKey, { familyName: current.familyName, ownerLabel: current.ownerLabel, memberLabel: current.memberLabel, child: current.child, entries: nextEntries });
            return { ...current, entries: nextEntries };
          });
          return persisted;
        }
        if (!isNew) {
          const persisted = await apiRequest(`/api/entries/${entry.id}`) as Entry;
          setState((current) => {
            const nextEntries = current.entries.map((item) => item.id === entry.id ? persisted : item);
            if (current.cacheKey) void writeTimelineCache(current.cacheKey, { familyName: current.familyName, ownerLabel: current.ownerLabel, memberLabel: current.memberLabel, child: current.child, entries: nextEntries });
            return { ...current, entries: nextEntries };
          });
          return persisted;
        }
        setState((current) => {
          if (current.cacheKey) void writeTimelineCache(current.cacheKey, { familyName: current.familyName, ownerLabel: current.ownerLabel, memberLabel: current.memberLabel, child: current.child, entries: current.entries });
          return current;
        });
        return entry;
      } catch (error) {
        if (isNew) setState((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== entry.id) }));
        throw error;
      }
    },
    deleteEntry: async (id) => {
      const deleted = state.entries.find((entry) => entry.id === id);
      setState((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== id) }));
      if (!API_MODE) return;
      try {
        await apiRequest(`/api/entries/${id}`, { method: "DELETE" });
        if (state.cacheKey) await writeTimelineCache(state.cacheKey, { familyName: state.familyName, ownerLabel: state.ownerLabel, memberLabel: state.memberLabel, child: state.child, entries: state.entries.filter((entry) => entry.id !== id) });
      } catch (error) {
        if (deleted) setState((current) => current.entries.some((entry) => entry.id === id) ? current : { ...current, entries: [deleted, ...current.entries] });
        throw error;
      }
    },
    setForcedState: (forcedState) => setState((current) => ({ ...current, forcedState })),
    startExport: () => {
      setState((current) => ({ ...current, exportStatus: "queued" }));
      window.setTimeout(() => setState((current) => ({ ...current, exportStatus: "ready" })), 1100);
    },
    resetDemo: () => {
      entriesRequestRef.current += 1;
      if (state.cacheKey) dropTimelineCache(state.cacheKey);
      setState(initialState);
      if (!API_MODE) window.localStorage.removeItem(STORAGE_KEY);
    },
    signOut: async () => {
      if (API_MODE) await authClient.signOut();
      entriesRequestRef.current += 1;
      if (state.cacheKey) dropTimelineCache(state.cacheKey);
      setState(initialState);
      if (!API_MODE) window.localStorage.removeItem(STORAGE_KEY);
    },
    leaveFamily: async () => {
      if (API_MODE) await apiRequest("/api/families", { method: "DELETE" });
      entriesRequestRef.current += 1;
      if (state.cacheKey) dropTimelineCache(state.cacheKey);
      setState(initialState);
      if (!API_MODE) window.localStorage.removeItem(STORAGE_KEY);
    },
  }), [state, hydrated]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
