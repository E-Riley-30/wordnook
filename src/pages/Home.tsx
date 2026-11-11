import { Link } from 'react-router'
import { Flame, ArrowRight, BookMarked, RefreshCw, Sparkles, PartyPopper } from 'lucide-react'
import { ALL_WORDS, BANKS } from '../data/banks'
import { buildTodayPlan, isLearned, isMastered, streakDays, todayStr } from '../lib/srs'
import { setDailyNew, useStore } from '../lib/store'

const QUOTA_OPTIONS = [5, 10, 15, 20]

export default function Home() {
  const data = useStore()
  const plan = buildTodayPlan(ALL_WORDS, data)
  const total = plan.dueIds.length + plan.newIds.length
  const streak = streakDays(data.logs)
  const today = data.logs[todayStr()]
  const learned = ALL_WORDS.filter((w) => isLearned(data.progress[w.id])).length
  const allDone = learned >= ALL_WORDS.length && plan.dueIds.length === 0

  return (
    <div className="flex flex-col gap-5 px-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{formatDate()}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            词隐 <span className="font-word text-primary">WordNook</span>
          </h1>
        </div>
        <div
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground"
          title="连续学习天数"
        >
          <Flame className="h-4 w-4 text-accent" aria-hidden />
          {streak} 天
        </div>
      </header>

      {total > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">今日任务</h2>
          <div className="mt-3 flex gap-3">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-secondary px-3 py-3">
              <RefreshCw className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-lg font-bold leading-tight">{plan.dueIds.length}</p>
                <p className="text-xs text-muted-foreground">到期复习</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-secondary px-3 py-3">
              <Sparkles className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="text-lg font-bold leading-tight">{plan.newIds.length}</p>
                <p className="text-xs text-muted-foreground">新词</p>
              </div>
            </div>
          </div>
          <Link
            to="/study"
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            开始学习
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <p className="mt-2.5 text-center text-xs text-muted-foreground">大约需要 10 分钟</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-5 text-center">
          <PartyPopper className="mx-auto h-10 w-10 text-accent" aria-hidden />
          <h2 className="mt-2 text-lg font-bold">{allDone ? '全部词库学完了！' : '今日任务已完成'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {allDone
              ? '可以在统计页回顾薄弱词，巩固记忆。'
              : `今天已学 ${today?.studied ?? 0} 张卡片，明天记得回来复习。`}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <BookMarked className="h-4 w-4 text-primary" aria-hidden />
            每日新词量
          </h2>
          <div className="flex gap-1.5" role="radiogroup" aria-label="每日新词量">
            {QUOTA_OPTIONS.map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={data.settings.dailyNew === n}
                onClick={() => setDailyNew(n)}
                className={`min-h-[36px] min-w-[44px] rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  data.settings.dailyNew === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          建议 10–15 个，压力小、能坚持。到期复习的词不受此限制。
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">词库进度</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {BANKS.map((bank) => {
            const bankMastered = bank.words.filter((w) => isMastered(data.progress[w.id])).length
            const bankLearned = bank.words.filter((w) => isLearned(data.progress[w.id])).length
            const pct = Math.round((bankLearned / bank.words.length) * 100)
            return (
              <li key={bank.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{bank.name}</span>
                  <span className="text-xs text-muted-foreground">
                    已学 {bankLearned}/{bank.words.length} · 掌握 {bankMastered}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${bank.name} 学习进度`}
                >
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function formatDate(): string {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
}
