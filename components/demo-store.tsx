"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PhotoStatus = "uploaded" | "ready" | "error";
export type EntryType = "story" | "milestone";

export type Photo = {
  id: string;
  label: string;
  status: PhotoStatus;
  previewUrl?: string;
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
  photos: Photo[];
  updatedAt: string;
};

type DemoState = {
  session: boolean;
  child: { id?: string; nickname: string; birthDate: string } | null;
  partnerEmail: string;
  entries: Entry[];
  forcedState: "empty" | "upload-error" | "storage-full" | null;
  exportStatus: "idle" | "queued" | "ready";
};

const today = new Date();
const isoDate = (value: Date) => value.toISOString().slice(0, 10);

const defaultState: DemoState = {
  session: false,
  child: { id: "child-1", nickname: "Aksa", birthDate: "2025-01-12" },
  partnerEmail: "mama@example.com",
  entries: [
    {
      id: "entry-1",
      type: "milestone",
      title: "Langkah pertamanya",
      body: "Hari ini Aksa berdiri sendiri untuk pertama kali. Kita semua langsung bersorak.",
      happenedAt: isoDate(new Date(today.getTime() - 86400000)),
      author: "Bapak",
      photos: [
        { id: "photo-1", label: "Aksa berdiri", status: "uploaded" },
        { id: "photo-2", label: "Tangan kecil Aksa", status: "uploaded" },
      ],
      updatedAt: "09.12",
    },
    {
      id: "entry-2",
      type: "story",
      title: "",
      body: "Pagi ini Aksa tertawa waktu dengar suara air. Suaranya bikin dapur terasa ramai.",
      happenedAt: isoDate(today),
      author: "Mama",
      photos: [],
      updatedAt: "07.48",
    },
  ],
  forcedState: null,
  exportStatus: "idle",
};

type DemoContextValue = DemoState & {
  signIn: () => void;
  saveChild: (nickname: string, birthDate: string) => void;
  invitePartner: (email: string) => void;
  saveEntry: (entry: Omit<Entry, "id" | "updatedAt"> & { id?: string }) => Entry;
  deleteEntry: (id: string) => void;
  setForcedState: (state: DemoState["forcedState"]) => void;
  startExport: () => void;
  resetDemo: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const STORAGE_KEY = "little-moment-prototype-v1";
const API_MODE = process.env.NEXT_PUBLIC_BACKEND_MODE === "api";
const initialState: DemoState = API_MODE
  ? { ...defaultState, child: null, partnerEmail: "", entries: [] }
  : defaultState;

async function apiRequest(path: string, init?: RequestInit) {
  if (!API_MODE) return null;
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || `Request failed: ${response.status}`);
  return response.json();
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (API_MODE) {
      fetch("/api/bootstrap", { credentials: "include" }).then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        setState((current) => ({ ...current, child: payload.child ? { id: payload.child.id, nickname: payload.child.nickname, birthDate: payload.child.birthDate } : null, entries: payload.entries || current.entries, partnerEmail: payload.members?.find((member: { role: string }) => member.role === "member")?.displayName || current.partnerEmail, session: true }));
      }).catch(() => undefined);
      setHydrated(true);
      return;
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
    signIn: () => setState((current) => ({ ...current, session: true })),
    saveChild: (nickname, birthDate) => {
      setState((current) => ({ ...current, child: { nickname, birthDate } }));
      void apiRequest("/api/families", { method: "POST", body: JSON.stringify({ nickname, birthDate, familyName: "Keluarga Prakoso" }) })
        .then((result) => {
          if (result?.childId) setState((current) => current.child ? { ...current, child: { ...current.child, id: result.childId } } : current);
        })
        .catch(() => undefined);
    },
    invitePartner: (partnerEmail) => {
      setState((current) => ({ ...current, partnerEmail }));
      void apiRequest("/api/invites", { method: "POST", body: JSON.stringify({ email: partnerEmail }) }).catch(() => undefined);
    },
    saveEntry: (input) => {
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
      void apiRequest(entry.id.startsWith("entry-") && !input.id ? "/api/entries" : `/api/entries/${entry.id}`, { method: input.id ? "PATCH" : "POST", body: JSON.stringify({ childId: state.child?.id, type: entry.type, title: entry.title, body: entry.body, happenedAt: entry.happenedAt, photos: entry.photos.map((photo, index) => ({ storageKey: `mock/${photo.id}`, mimeType: "image/jpeg", byteSize: 0, altText: photo.label, sortOrder: index })) }) }).catch(() => undefined);
      return entry;
    },
    deleteEntry: (id) => {
      setState((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== id) }));
      void apiRequest(`/api/entries/${id}`, { method: "DELETE" }).catch(() => undefined);
    },
    setForcedState: (forcedState) => setState((current) => ({ ...current, forcedState })),
    startExport: () => {
      setState((current) => ({ ...current, exportStatus: "queued" }));
      window.setTimeout(() => setState((current) => ({ ...current, exportStatus: "ready" })), 1100);
    },
    resetDemo: () => {
      setState(initialState);
      if (!API_MODE) window.localStorage.removeItem(STORAGE_KEY);
    },
  }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
