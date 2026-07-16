import { useEffect } from 'react'
import { useUI, useData } from './lib/store'
import { Sidebar, BottomNav } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './pages/Dashboard'
import { Trafego } from './pages/Trafego'
import { FollowUp } from './pages/FollowUp'
import { Leads } from './pages/Leads'
import { Equipe } from './pages/Equipe'
import { Perfil } from './pages/Perfil'
import { LeadEditor } from './components/LeadEditor'
import { LeadDetail } from './components/LeadDetail'
import { Toast } from './components/Toast'

export default function App() {
  const page = useUI((s) => s.page)
  const tema = useData((s) => s.tema)

  // Aplica o tema no <html> — o Tailwind está em darkMode: 'class'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
  }, [tema])

  return (
    <div className="min-h-dvh">
      {/* Aurora ambiente */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute right-[-6%] top-[-12%] h-[420px] w-[520px] rounded-full bg-ember/[0.10] blur-[120px] animate-aurora" />
        <div className="absolute left-[10%] top-[30%] h-[360px] w-[360px] rounded-full bg-ember-soft/[0.07] blur-[130px]" />
      </div>

      <Sidebar />

      {/* padding = largura do rail; a sidebar expande por cima ao passar o mouse */}
      <div className="lg:pl-[68px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1360px] px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          <div key={page} className="animate-fade-up">
            {page === 'dashboard' && <Dashboard />}
            {page === 'trafego' && <Trafego />}
            {page === 'followup' && <FollowUp />}
            {page === 'leads' && <Leads />}
            {page === 'equipe' && <Equipe />}
            {page === 'perfil' && <Perfil />}
          </div>
        </main>
      </div>

      <BottomNav />
      <LeadEditor />
      <LeadDetail />
      <Toast />
    </div>
  )
}
