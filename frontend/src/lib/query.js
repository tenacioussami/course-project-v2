import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import api from '../services/api';

/*
 * Tiny stale-while-revalidate cache.
 *
 *  - Every GET is cached by URL + params (in memory and in localStorage).
 *  - A page that was visited before renders INSTANTLY from cache, then
 *    refreshes quietly in the background — no full-page spinner.
 *  - Identical requests in flight are de-duplicated.
 *  - prefetch() lets the navbar load a page's data on hover, so it's
 *    already there by the time you click.
 */

const STORE_KEY = 'cb-cache-v1';
const FRESH_MS = 15_000; // don't refetch the same thing more often than this

const cache = new Map(); // key -> { data, ts }
const inflight = new Map(); // key -> Promise
const subs = new Map(); // key -> Set<fn>

// ── Persist (best-effort) ────────────────────────────────────────────
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  Object.entries(saved).forEach(([k, v]) => cache.set(k, { data: v, ts: 0 }));
} catch { /* storage unavailable — memory cache still works */ }

let persistTimer;
const persist = () => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const out = {};
      cache.forEach((v, k) => { out[k] = v.data; });
      localStorage.setItem(STORE_KEY, JSON.stringify(out));
    } catch { /* quota or private mode — ignore */ }
  }, 300);
};

export const clearCache = () => {
  cache.clear();
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
  subs.forEach((set) => set.forEach((fn) => fn()));
};

// ── Helpers ──────────────────────────────────────────────────────────
export const keyOf = (url, params) => {
  if (!params) return url;
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false));
  const qs = new URLSearchParams(clean).toString();
  return qs ? `${url}?${qs}` : url;
};

const notify = (key) => subs.get(key)?.forEach((fn) => fn());

const subscribe = (key, fn) => {
  if (!subs.has(key)) subs.set(key, new Set());
  subs.get(key).add(fn);
  return () => subs.get(key)?.delete(fn);
};

export const fetchQuery = (url, params, { force = false } = {}) => {
  const key = keyOf(url, params);
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.ts < FRESH_MS) return Promise.resolve(hit.data);
  if (inflight.has(key)) return inflight.get(key);

  const p = api
    .get(url, { params })
    .then((res) => {
      cache.set(key, { data: res.data, ts: Date.now() });
      persist();
      notify(key);
      return res.data;
    })
    .finally(() => {
      inflight.delete(key);
      notify(key);
    });
  inflight.set(key, p);
  notify(key);
  return p;
};

export const prefetch = (url, params) => fetchQuery(url, params).catch(() => {});

/** Update cached data locally (optimistic UI). */
export const setQueryData = (url, params, updater) => {
  const key = keyOf(url, params);
  const prev = cache.get(key)?.data;
  const next = typeof updater === 'function' ? updater(prev) : updater;
  cache.set(key, { data: next, ts: Date.now() });
  persist();
  notify(key);
};

/** Mark every cached key starting with `prefix` stale and refetch the ones on screen. */
export const invalidate = (prefix) => {
  cache.forEach((v, k) => {
    if (k.startsWith(prefix)) {
      v.ts = 0;
      if (subs.get(k)?.size) fetchQuery(k.split('?')[0], Object.fromEntries(new URLSearchParams(k.split('?')[1] || '')), { force: true }).catch(() => {});
    }
  });
};

// ── Hook ─────────────────────────────────────────────────────────────
/**
 * const { data, loading, refreshing, refetch } = useQuery('/tasks', { status })
 *   loading    → true only when there is nothing to show yet
 *   refreshing → a background refresh is running
 */
export const useQuery = (url, params, { enabled = true, refetchInterval, initialData } = {}) => {
  const key = keyOf(url, params);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const snap = useSyncExternalStore(
    useCallback((fn) => subscribe(key, fn), [key]),
    () => cache.get(key)?.data,
  );
  const busy = useSyncExternalStore(
    useCallback((fn) => subscribe(key, fn), [key]),
    () => inflight.has(key),
  );

  useEffect(() => {
    if (!enabled) return undefined;
    fetchQuery(url, paramsRef.current).catch(() => {});
    if (!refetchInterval) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchQuery(url, paramsRef.current, { force: true }).catch(() => {});
    }, refetchInterval);
    return () => clearInterval(id);
  }, [key, enabled, refetchInterval, url]);

  const refetch = useCallback(() => fetchQuery(url, paramsRef.current, { force: true }), [url]);

  // Keep showing the previous result while a new filter/search loads (no flicker)
  const lastRef = useRef();
  if (snap !== undefined) lastRef.current = snap;
  const data = snap !== undefined ? snap : lastRef.current !== undefined ? lastRef.current : initialData;
  return { data, loading: enabled && data === undefined, refreshing: busy || (snap === undefined && data !== undefined), refetch };
};

/** Debounce a fast-changing value (search boxes). */
export const useDebounced = (value, ms = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms, setV]);
  return v;
};

