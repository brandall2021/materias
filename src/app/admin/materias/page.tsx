import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { MateriaStatusBadge } from '@/components/MateriaStatusBadge'
import { DeleteMateriaButton } from '@/components/DeleteMateriaButton'

export default async function AdminMateriasPage() {
  const materias = await prisma.materia.findMany({
    include: { _count: { select: { inscripciones: true } } },
    orderBy: { fechaApertura: 'desc' },
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-face-red">Gestión académica</p>
          <h1 className="mt-1 text-2xl font-bold text-face-blue">Materias</h1>
          <p className="mt-1 text-sm text-gray-500">Administrá aperturas, cierres e inscriptos.</p>
        </div>
        <Link href="/admin/materias/nueva" className={buttonClassName()}>
          Nueva materia
        </Link>
      </header>

      {materias.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-gray-900">No hay materias creadas</h2>
          <p className="mt-1 text-sm text-gray-500">Creá la primera materia para abrir inscripciones.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_150px_170px_260px] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:grid">
            <span>Materia</span>
            <span>Estado</span>
            <span>Inscriptos</span>
            <span className="text-right">Acciones</span>
          </div>
          <div className="divide-y divide-gray-100">
            {materias.map((materia) => (
              <article
                key={materia.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_150px_170px_260px] lg:items-center"
              >
                <div className="min-w-0">
                  <h2 className="font-semibold text-face-blue">{materia.nombre}</h2>
                  {materia.descripcion && (
                    <p className="mt-1 truncate text-sm text-gray-500">{materia.descripcion}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    {materia.fechaApertura.toLocaleString('es-AR')} a {materia.fechaCierre.toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <MateriaStatusBadge fechaApertura={materia.fechaApertura} fechaCierre={materia.fechaCierre} />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {materia._count.inscripciones} inscripto{materia._count.inscripciones !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <Link href={`/admin/materias/${materia.id}/inscriptos`} className={buttonClassName('secondary')}>
                    Inscriptos
                  </Link>
                  <Link href={`/admin/materias/${materia.id}/editar`} className={buttonClassName('secondary')}>
                    Editar
                  </Link>
                  <DeleteMateriaButton
                    id={materia.id}
                    nombre={materia.nombre}
                    inscriptosCount={materia._count.inscripciones}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
