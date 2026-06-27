import Navbar from '../../../components/Navbar/Navbar'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="min-h-dvh bg-primary text-[#f5f3f0] lg:flex lg:items-start">
      <Navbar />
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
