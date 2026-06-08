import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MateriaStatusBadge } from '@/components/MateriaStatusBadge'

export default async function AdminDashboard() {
  const now = new Date()
  const [totalMaterias, totalInscriptos, materiasActivas, recientes] = await Promise.all([
    prisma.materia.count(),
    prisma.inscripcion.count(),
    prisma.materia.count({
      where: {
        fechaApertura: { lte: now },
        fechaCierre: { gte: now },
      },
    }),
    prisma.materia.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 4,
      include: { _count: { select: { inscripciones: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-face-red">Panel administrativo</p>
          <h1 className="mt-1 text-2xl font-bold text-face-blue">Dashboard</h1>
        </div>
        <Link href="/admin/materias/nueva" className="text-sm font-semibold text-face-red hover:text-red-700">
          Crear materia
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total materias" value={totalMaterias} />
        <StatCard label="Materias activas" value={materiasActivas} tone="success" />
        <StatCard label="Total inscriptos" value={totalInscriptos} tone="info" />
      </section>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-face-blue">Actividad reciente</h2>
          <p className="text-sm text-gray-500">Últimas materias modificadas.</p>
        </div>
        {recientes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500">Todavía no hay materias creadas.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recientes.map((materia) => (
              <Link
                key={materia.id}
                href={`/admin/materias/${materia.id}/inscriptos`}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-face-blue">{materia.nombre}</h3>
                    <MateriaStatusBadge fechaApertura={materia.fechaApertura} fechaCierre={materia.fechaCierre} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {materia._count.inscripciones} inscripto{materia._count.inscripciones !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-face-red">Ver inscriptos</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'success' | 'info'
}) {
  const tones = {
    neutral: 'border-gray-200 bg-white text-face-blue',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-face-blue',
  }

  return (
    <div className={`rounded-md border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}
