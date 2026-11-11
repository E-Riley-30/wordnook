import { useEffect, useState } from 'react';
import type { Rating, StoreData } from './srs';
import { rateWord, todayStr } from './srs';

const KEY = 'wordnook:v1';

function load(): StoreData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreData;
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch {
    /* 损坏则重建 */
  }
  return { version: 1, progress: {}, logs: {}, settings: { dailyNew: 15 } };
}

let cache: StoreData = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* 存储满时静默失败 */
  }
  listeners.forEach((fn) => fn());
}

export function getData(): StoreData {
  return cache;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function rateWordInStore(wordId: string, rating: Rating) {
  const data = cache;
  const prev = data.progress[wordId];
  const isFirst = !prev || (prev.knows + prev.fuzzies + prev.unknowns === 0);
  data.progress = { ...data.progress, [wordId]: rateWord(prev, rating) };
  const today = todayStr();
  const log = data.logs[today] ?? { date: today, studied: 0, newLearned: 0, unknowns: 0 };
  const next = {
    ...log,
    studied: log.studied + 1,
    newLearned: log.newLearned + (isFirst ? 1 : 0),
    unknowns: log.unknowns + (rating === 'unknown' ? 1 : 0),
  };
  data.logs = { ...data.logs, [today]: next };
  persist();
}

export function setDailyNew(n: number) {
  cache = { ...cache, settings: { ...cache.settings, dailyNew: n } };
  persist();
}

export function resetAll() {
  cache = { version: 1, progress: {}, logs: {}, settings: { dailyNew: 15 } };
  persist();
}

export function useStore(): StoreData {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((t) => t + 1)), []);
  return cache;
}
