import Navbar from '../../../components/Navbar/Navbar'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="min-h-dvh lg:flex lg:items-start" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Navbar />
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
