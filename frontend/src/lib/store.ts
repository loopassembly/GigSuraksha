import type { BackendPolicy, BackendQuoteResponse, StoredEvent, StoredWorker } from './types';

const STORAGE_KEYS = {
  worker: 'gigsuraksha_worker',
  quote: 'gigsuraksha_quote',
  policy: 'gigsuraksha_policy',
  event: 'gigsuraksha_event',
} as const;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }
  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(key);
}

export function getWorker() {
  return readJson<StoredWorker>(STORAGE_KEYS.worker);
}

export function saveWorker(worker: StoredWorker) {
  writeJson(STORAGE_KEYS.worker, worker);
}

export function getQuote() {
  return readJson<BackendQuoteResponse>(STORAGE_KEYS.quote);
}

export function saveQuote(quote: BackendQuoteResponse) {
  writeJson(STORAGE_KEYS.quote, quote);
}

export function getPolicy() {
  return readJson<BackendPolicy>(STORAGE_KEYS.policy);
}

export function savePolicy(policy: BackendPolicy) {
  writeJson(STORAGE_KEYS.policy, policy);
}

export function getEvent() {
  return readJson<StoredEvent>(STORAGE_KEYS.event);
}

export function saveEvent(event: StoredEvent) {
  writeJson(STORAGE_KEYS.event, event);
}

export function clearAll() {
  remove(STORAGE_KEYS.worker);
  remove(STORAGE_KEYS.quote);
  remove(STORAGE_KEYS.policy);
  remove(STORAGE_KEYS.event);
}
