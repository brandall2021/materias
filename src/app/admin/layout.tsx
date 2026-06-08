import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {session && (
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/admin" className="font-bold text-gray-950">
                Admin Materias
              </Link>
              <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-cyan-700">
                Dashboard
              </Link>
              <Link href="/admin/materias" className="text-sm font-medium text-gray-600 hover:text-cyan-700">
                Materias
              </Link>
              <Link href="/admin/usuarios" className="text-sm font-medium text-gray-600 hover:text-cyan-700">
                Usuarios
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="max-w-[220px] truncate text-sm text-gray-500">{session.user?.email}</span>
              <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login' }) }}>
                <button type="submit" className="text-sm font-semibold text-gray-600 hover:text-rose-700">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </nav>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
