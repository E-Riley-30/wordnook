import { Flame, Trophy, BookOpen, TriangleAlert } from 'lucide-react'
import { ALL_WORDS } from '../data/banks'
import { addDays, isLearned, isMastered, streakDays, todayStr } from '../lib/srs'
import { useStore } from '../lib/store'

export default function Stats() {
  const data = useStore()
  const mastered = ALL_WORDS.filter((w) => isMastered(data.progress[w.id])).length
  const learning = ALL_WORDS.filter((w) => {
    const s = data.progress[w.id]
    return isLearned(s) && !isMastered(s)
  }).length
  const streak = streakDays(data.logs)

  // 最近 14 天的学习量柱状图
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(todayStr(), i - 13)
    return { date, studied: data.logs[date]?.studied ?? 0 }
  })
  const maxStudied = Math.max(1, ...days.map((d) => d.studied))

  // 薄弱词：按「不认识」次数排序
  const weak = ALL_WORDS.map((w) => ({ word: w, s: data.progress[w.id] }))
    .filter(({ s }) => s && s.unknowns > 0)
    .sort((a, b) => b.s!.unknowns - a.s!.unknowns)
    .slice(0, 10)

  return (
    <div className="flex flex-col gap-4 px-5 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">统计</h1>
        <p className="mt-1 text-sm text-muted-foreground">你和学生都该常看的学情面板</p>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard icon={<Flame className="h-4 w-4 text-accent" />} value={`${streak} 天`} label="连续打卡" />
        <StatCard icon={<Trophy className="h-4 w-4 text-primary" />} value={String(mastered)} label="已掌握" />
        <StatCard icon={<BookOpen className="h-4 w-4 text-accent" />} value={String(learning)} label="复习中" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">近 14 天学习量</h2>
        <div className="mt-4 flex h-28 items-end gap-1" role="img" aria-label="近14天每日学习卡片数柱状图">
          {days.map((d) => {
            const isToday = d.date === todayStr()
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${d.studied > 0 ? (isToday ? 'bg-primary' : 'bg-primary/50') : 'bg-secondary'}`}
                  style={{ height: `${Math.max(4, Math.round((d.studied / maxStudied) * 88))}px` }}
                  title={`${d.date.slice(5)}：${d.studied} 张`}
                />
                <span className={`text-[9px] tabular-nums ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                  {d.date.slice(8)}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <TriangleAlert className="h-4 w-4 text-destructive" aria-hidden />
          薄弱词 TOP 10
        </h2>
        {weak.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">还没有薄弱词，继续保持！</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {weak.map(({ word, s }) => (
              <li key={word.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <span className="font-word font-semibold">{word.word}</span>
                  <p className="truncate text-xs text-muted-foreground">
                    {word.familiar ? `僻义：${word.meaning}` : word.meaning}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
                  错 {s!.unknowns} 次
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-2 py-4">
      {icon}
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
