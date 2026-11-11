import { NavLink, Route, Routes, useLocation } from 'react-router'
import { CalendarCheck, BookOpen, BarChart3 } from 'lucide-react'
import Home from './pages/Home'
import Study from './pages/Study'
import Library from './pages/Library'
import Stats from './pages/Stats'

const tabs = [
  { to: '/', label: '今日', icon: CalendarCheck, end: true },
  { to: '/library', label: '词库', icon: BookOpen, end: false },
  { to: '/stats', label: '统计', icon: BarChart3, end: false },
]

export default function App() {
  const location = useLocation()
  const isStudy = location.pathname === '/study'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/library" element={<Library />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
      {!isStudy && (
        <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
