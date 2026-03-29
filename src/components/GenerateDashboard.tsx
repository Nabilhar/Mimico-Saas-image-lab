"use client";

import { useState, useEffect, useRef } from "react";
import {
  loadHistory,
  persistHistory,
  MAX_HISTORY_ITEMS,
  type HistoryEntry,
} from "@/lib/postHistory";

const NICHES = ["Dentist", "Realtor", "Cafe"] as const;
const POST_TYPES = ["5 Tips", "Myth-Buster"] as const;

export function GenerateDashboard() {
  const [niche, setNiche] = useState<(typeof NICHES)[number]>("Dentist");
  const [postType, setPostType] = useState<(typeof POST_TYPES)[number]>("5 Tips");
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
    };
  }, []);

  function pushHistory(entry: HistoryEntry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      persistHistory(next);
      return next;
    });
  }

  function handleSaveToHistory() {
    if (!content) return;
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      niche,
      postType,
      content,
      savedAt: new Date().toISOString(),
    };
    pushHistory(entry);
    if (savedResetRef.current) clearTimeout(savedResetRef.current);
    setSavedFeedback(true);
    savedResetRef.current = setTimeout(() => {
      setSavedFeedback(false);
      savedResetRef.current = null;
    }, 2000);
  }

  function handleDeleteHistory(id: string) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      persistHistory(next);
      return next;
    });
  }

  function handleClearHistory() {
    if (history.length === 0) return;
    if (!window.confirm("Remove all saved posts from this browser?")) return;
    setHistory([]);
    persistHistory([]);
  }

  async function handleCopy() {
    if (!content) {
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
      setCopied(true);
      copyResetRef.current = setTimeout(() => {
        setCopied(false);
        copyResetRef.current = null;
      }, 2000);
    } catch {
      // Clipboard may be denied (permissions / non-secure context)
    }
  }

  async function handleCopyEntry(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setContent(null);
    setCopied(false);
    setSavedFeedback(false);
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current);
      copyResetRef.current = null;
    }
    if (savedResetRef.current) {
      clearTimeout(savedResetRef.current);
      savedResetRef.current = null;
    }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, postType }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setContent(data.content ?? null);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="bento-card">
        <h2 className="text-lg font-semibold text-slate-900">Compose</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a niche and format, then generate. Your request is sent to{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">/api/generate</code>.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="niche" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Niche
            </label>
            <select
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value as (typeof NICHES)[number])}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-cyan-600/20 transition focus:border-cyan-600 focus:ring-4"
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="postType" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Post type
            </label>
            <select
              id="postType"
              value={postType}
              onChange={(e) => setPostType(e.target.value as (typeof POST_TYPES)[number])}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-cyan-600/20 transition focus:border-cyan-600 focus:ring-4"
            >
              {POST_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span
                className="size-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden
              />
            )}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        <div className="mt-8">
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200/90 bg-red-50 px-5 py-4 text-sm text-red-900 shadow-sm"
            >
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-cyan-50/40 px-5 py-14 shadow-sm">
              <span
                className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-cyan-800 border-t-transparent"
                aria-hidden
              />
              <span className="text-sm font-medium text-slate-700">Calling the API…</span>
            </div>
          )}

          {!loading && !error && !content && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-12 text-center text-sm text-slate-500">
              Your generated caption will show up here after you click Generate.
            </div>
          )}

          {content && !loading && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft</span>
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-600 hover:text-cyan-900"
                  >
                    {savedFeedback ? "Saved!" : "Save to History"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-600 hover:text-cyan-900"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <span className="text-xs text-slate-400">
                    {niche} · {postType}
                  </span>
                </div>
              </div>
              <div className="max-h-[min(28rem,60vh)] overflow-y-auto px-5 py-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{content}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bento-card-muted">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">History</h3>
            <p className="mt-1 text-sm text-slate-600">
              Saved in this browser only ({history.length}/{MAX_HISTORY_ITEMS}).
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-red-300 hover:text-red-800"
            >
              Clear all
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            No saved posts yet. Generate a caption and click &quot;Save to History&quot;.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {new Date(entry.savedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-cyan-900">
                      {entry.niche} · {entry.postType}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyEntry(entry.content)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-900"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHistory(entry.id)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-800"
                      aria-label="Remove from history"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {entry.content}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
