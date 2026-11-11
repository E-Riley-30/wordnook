import { useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'
import { BANKS, type WordItem } from '../data/banks'
import { isLearned, isMastered, type WordState } from '../lib/srs'
import { useStore } from '../lib/store'

function statusOf(s: WordState | undefined): { label: string; className: string } {
  if (!isLearned(s)) return { label: '未学', className: 'bg-secondary text-secondary-foreground' }
  if (isMastered(s)) return { label: '已掌握', className: 'bg-primary text-primary-foreground' }
  if (s!.last === 'unknown') return { label: '薄弱', className: 'bg-destructive/15 text-destructive' }
  return { label: '复习中', className: 'bg-accent/15 text-accent' }
}

export default function Library() {
  const data = useStore()
  const [openBank, setOpenBank] = useState<string | null>(BANKS[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-4 px-5 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">词库</h1>
        <p className="mt-1 text-sm text-muted-foreground">点开词库可以查看每个词的学习状态</p>
      </header>

      {BANKS.map((bank) => {
        const learned = bank.words.filter((w) => isLearned(data.progress[w.id])).length
        const mastered = bank.words.filter((w) => isMastered(data.progress[w.id])).length
        const open = openBank === bank.id
        return (
          <section key={bank.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <button
              onClick={() => setOpenBank(open ? null : bank.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden />
                  {bank.name}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{bank.desc}</p>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                  共 {bank.words.length} 词 · 已学 {learned} · 掌握 {mastered}
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {open && (
              <ul className="divide-y divide-border border-t border-border">
                {bank.words.map((w: WordItem) => {
                  const s = statusOf(data.progress[w.id])
                  return (
                    <li key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <span className="font-word font-semibold">{w.word}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{w.pos}</span>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {w.familiar ? `僻义：${w.meaning}` : w.meaning}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>
                        {s.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
