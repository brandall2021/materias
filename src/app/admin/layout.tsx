import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      {session && (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">Admin</span>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/admin/materias" className="text-sm text-gray-600 hover:text-gray-900">Materias</Link>
            <Link href="/admin/usuarios" className="text-sm text-gray-600 hover:text-gray-900">Usuarios</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session.user?.email}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login' }) }}>
              <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">Salir</button>
            </form>
          </div>
        </nav>
      )}
      <main className="p-6">{children}</main>
    </div>
  )
}
