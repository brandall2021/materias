import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalMaterias, totalInscriptos] = await Promise.all([
    prisma.materia.count(),
    prisma.inscripcion.count(),
  ])

  const materiasActivas = await prisma.materia.count({
    where: {
      fechaApertura: { lte: new Date() },
      fechaCierre: { gte: new Date() },
    },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total materias" value={totalMaterias} />
        <StatCard label="Materias activas" value={materiasActivas} highlight />
        <StatCard label="Total inscriptos" value={totalInscriptos} />
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/admin/materias" className="text-sm text-blue-600 hover:underline">
          Ver materias →
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 ${highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
