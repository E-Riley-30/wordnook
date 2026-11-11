export type Rating = 'know' | 'fuzzy' | 'unknown';

/** 单词的学习状态（持久化到 localStorage） */
export interface WordState {
  /** 学习阶段：0=新学，1/2=复习中，>=3 视为已掌握 */
  stage: number;
  /** 下次复习日期 YYYY-MM-DD（本地时区） */
  due: string;
  last: Rating;
  /** 历史评分次数统计 */
  knows: number;
  fuzzies: number;
  unknowns: number;
}

export interface DayLog {
  date: string;
  /** 当日评过分的卡片总数（含复习与新学） */
  studied: number;
  /** 当日新学单词数（首次评分） */
  newLearned: number;
  /** 当日评为「不认识」的次数 */
  unknowns: number;
}

export interface Settings {
  dailyNew: number;
}

export interface StoreData {
  version: 1;
  progress: Record<string, WordState>;
  logs: Record<string, DayLog>;
  settings: Settings;
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export const emptyState = (): WordState => ({
  stage: 0,
  due: todayStr(),
  last: 'unknown',
  knows: 0,
  fuzzies: 0,
  unknowns: 0,
});

/** 「认识」后按阶段推进的间隔天数 */
const KNOW_INTERVALS = [4, 4, 7, 15, 30];

/** 三档自评驱动间隔：认识 +4/7/15/30 天，模糊 +1 天，不认识回炉明天再见 */
export function rateWord(prev: WordState | undefined, rating: Rating): WordState {
  const s = prev ? { ...prev } : emptyState();
  const today = todayStr();
  if (rating === 'know') {
    s.knows += 1;
    const nextStage = Math.min(s.stage + 1, 4);
    s.due = addDays(today, KNOW_INTERVALS[Math.min(nextStage, KNOW_INTERVALS.length - 1)]);
    s.stage = nextStage;
  } else if (rating === 'fuzzy') {
    s.fuzzies += 1;
    s.stage = Math.max(s.stage, 1);
    s.due = addDays(today, 1);
  } else {
    s.unknowns += 1;
    s.stage = 0;
    s.due = addDays(today, 1);
  }
  s.last = rating;
  return s;
}

export function isMastered(s: WordState | undefined): boolean {
  return !!s && s.stage >= 3;
}

export function isLearned(s: WordState | undefined): boolean {
  return !!s && s.knows + s.fuzzies + s.unknowns > 0;
}

export interface TodayPlan {
  dueIds: string[];
  newIds: string[];
  /** 今日已学新词数 */
  newLearnedToday: number;
}

export function buildTodayPlan(
  words: { id: string }[],
  data: StoreData,
): TodayPlan {
  const today = todayStr();
  const log = data.logs[today];
  const newLearnedToday = log?.newLearned ?? 0;
  const remainingNew = Math.max(0, data.settings.dailyNew - newLearnedToday);

  const dueIds: string[] = [];
  const newIds: string[] = [];
  for (const w of words) {
    const s = data.progress[w.id];
    if (s && isLearned(s)) {
      if (s.due <= today && !isMastered(s)) dueIds.push(w.id);
      else if (s.due <= today && isMastered(s)) dueIds.push(w.id); // 掌握的词到期也来长间隔复习
    } else if (newIds.length < remainingNew) {
      newIds.push(w.id);
    }
  }
  return { dueIds, newIds, newLearnedToday };
}

export function streakDays(logs: Record<string, DayLog>): number {
  let streak = 0;
  let cursor = todayStr();
  // 今天还没学也能延续昨天的连胜
  if (!(logs[cursor]?.studied > 0)) cursor = addDays(cursor, -1);
  while (logs[cursor]?.studied > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
