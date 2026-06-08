import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { MateriaStatusBadge } from '@/components/MateriaStatusBadge'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const now = new Date()
  const materias = await prisma.materia.findMany({
    where: {
      fechaApertura: { lte: now },
      fechaCierre: { gte: now },
    },
    orderBy: { fechaCierre: 'asc' },
  })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Sistema de materias</p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal text-gray-950 sm:text-4xl">
              Inscripción a materias
            </h1>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Consultá las materias disponibles y completá tu inscripción en línea.
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Abiertas ahora</p>
            <p className="mt-1 text-3xl font-bold text-cyan-800">{materias.length}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Materias con inscripción abierta</h2>
            <p className="text-sm text-gray-500">Ordenadas por fecha de cierre.</p>
          </div>
        </div>

        {materias.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-gray-900">No hay inscripciones abiertas</h3>
            <p className="mt-1 text-sm text-gray-500">Volvé a consultar más tarde.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {materias.map((materia) => (
              <article
                key={materia.id}
                className="rounded-md border border-gray-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <MateriaStatusBadge fechaApertura={materia.fechaApertura} fechaCierre={materia.fechaCierre} />
                      <span className="text-xs font-medium text-gray-500">
                        Cierra {materia.fechaCierre.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-950">{materia.nombre}</h3>
                    {materia.descripcion && (
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">{materia.descripcion}</p>
                    )}
                  </div>
                  <Link href={`/inscripcion/${materia.id}`} className={buttonClassName('primary', 'w-full shrink-0 sm:w-auto')}>
                    Inscribirse
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
