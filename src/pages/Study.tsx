import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { X, RotateCw, CheckCircle2, PartyPopper } from 'lucide-react'
import { ALL_WORDS, type WordItem } from '../data/banks'
import { buildTodayPlan, type Rating } from '../lib/srs'
import { getData, rateWordInStore } from '../lib/store'

const WORD_MAP = new Map(ALL_WORDS.map((w) => [w.id, w]))

export default function Study() {
  const navigate = useNavigate()
  // 进入页面时一次性生成学习队列：先复习到期词，再学新词
  const [queue, setQueue] = useState<string[]>(() => {
    const plan = buildTodayPlan(ALL_WORDS, getData())
    return [...plan.dueIds, ...plan.newIds]
  })
  const [initialTotal] = useState(queue.length)
  const [flipped, setFlipped] = useState(false)
  const [counts, setCounts] = useState({ know: 0, fuzzy: 0, unknown: 0 })

  const currentId = queue[0]
  const word: WordItem | undefined = currentId ? WORD_MAP.get(currentId) : undefined
  const done = initialTotal - queue.length + 1
  const featured = !!word?.familiar

  const rate = (rating: Rating) => {
    if (!currentId) return
    rateWordInStore(currentId, rating)
    setCounts((c) => ({ ...c, [rating]: c[rating] + 1 }))
    setFlipped(false)
    setQueue((q) => {
      const rest = q.slice(1)
      if (rating === 'unknown') {
        // 不认识的词隔 3 张卡片后重新出现
        const pos = Math.min(3, rest.length)
        rest.splice(pos, 0, currentId)
      }
      return rest
    })
  }

  // 键盘操作：空格/回车翻面，1/2/3 评分
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!word) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped) {
        if (e.key === '1') rate('unknown')
        else if (e.key === '2') rate('fuzzy')
        else if (e.key === '3') rate('know')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (initialTotal === 0) navigate('/', { replace: true })
  }, [initialTotal, navigate])

  const progressPct = useMemo(
    () => (initialTotal === 0 ? 0 : Math.round(((initialTotal - queue.length) / initialTotal) * 100)),
    [initialTotal, queue.length],
  )

  if (initialTotal === 0) return null

  // 学习完成总结
  if (!word) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <PartyPopper className="h-12 w-12 text-accent" aria-hidden />
        <h1 className="text-2xl font-bold">今日学习完成！</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          共 {counts.know + counts.fuzzy + counts.unknown} 次评分：
          认识 {counts.know} · 模糊 {counts.fuzzy} · 不认识 {counts.unknown}
          {counts.unknown > 0 && <><br />不认识的词明天会优先出现，别担心。</>}
        </p>
        <Link
          to="/"
          className="mt-2 flex min-h-[48px] items-center rounded-xl bg-primary px-8 font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring"
        >
          返回今日
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-6 pt-4">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="退出学习"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="h-5 w-5" aria-hidden />
        </Link>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="本次学习进度"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
          {Math.min(done, initialTotal)}/{initialTotal}
        </span>
      </header>

      {/* 单词卡片：点击翻面 */}
      <button
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? '卡片背面，查看释义；点击回到单词' : '卡片正面，点击翻面查看释义'}
        className="mt-6 flex flex-1 cursor-pointer flex-col rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-transform duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
      >
        {!flipped ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <span className="font-word text-5xl font-semibold tracking-tight text-foreground">{word.word}</span>
            <span className="text-sm text-muted-foreground">{word.pos}</span>
            {featured && (
              <span className="mt-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                你以为你认识它？
              </span>
            )}
            <span className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
              点击翻面看释义
            </span>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-word text-3xl font-semibold">{word.word}</span>
              <span className="text-sm text-muted-foreground">{word.pos}</span>
            </div>
            {featured ? (
              <div className="flex flex-col gap-2.5">
                <div className="rounded-xl bg-accent/10 p-3.5">
                  <p className="text-xs font-semibold text-accent">僻义 · 高考考点</p>
                  <p className="mt-1 text-lg font-bold leading-snug">{word.meaning}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  熟义：<span className="font-medium text-foreground">{word.familiar}</span>
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold leading-snug">{word.meaning}</p>
            )}
            <div className="rounded-xl bg-secondary p-3.5">
              <p className="font-word text-base leading-relaxed">{word.example}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{word.exampleCn}</p>
            </div>
          </div>
        )}
      </button>

      {/* 三档自评 */}
      <div className="mt-5 flex flex-col gap-2">
        {flipped ? (
          <div className="flex gap-2.5">
            <RateButton label="不认识" hint="10分钟后重出" onClick={() => rate('unknown')} tone="red" />
            <RateButton label="模糊" hint="明天再考" onClick={() => rate('fuzzy')} tone="amber" />
            <RateButton label="认识" hint="4天后复习" onClick={() => rate('know')} tone="green" />
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">先翻面看释义，再诚实自评</p>
        )}
        <p className="text-center text-xs text-muted-foreground">键盘：空格翻面 · 1 不认识 · 2 模糊 · 3 认识</p>
      </div>
    </div>
  )
}

function RateButton({
  label,
  hint,
  onClick,
  tone,
}: {
  label: string
  hint: string
  onClick: () => void
  tone: 'red' | 'amber' | 'green'
}) {
  const styles = {
    red: 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
    amber: 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20',
    green: 'border-primary/40 bg-primary text-primary-foreground hover:opacity-90',
  }[tone]
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border font-semibold transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring ${styles}`}
    >
      <span className="flex items-center gap-1 text-sm">
        {tone === 'green' && <CheckCircle2 className="h-4 w-4" aria-hidden />}
        {label}
      </span>
      <span className={`text-[11px] font-normal ${tone === 'green' ? 'text-primary-foreground/80' : 'opacity-75'}`}>
        {hint}
      </span>
    </button>
  )
}
