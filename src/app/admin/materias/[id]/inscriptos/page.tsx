import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ExportButtons } from '@/components/ExportButtons'
import { MateriaStatusBadge } from '@/components/MateriaStatusBadge'
import Link from 'next/link'

export default async function InscriptosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const materia = await prisma.materia.findUnique({
    where: { id },
    include: { inscripciones: { orderBy: { fechaInscripcion: 'asc' } } },
  })
  if (!materia) notFound()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/materias" className="text-sm font-medium text-gray-500 hover:text-face-red">
            Volver a materias
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-face-blue">{materia.nombre}</h1>
            <MateriaStatusBadge fechaApertura={materia.fechaApertura} fechaCierre={materia.fechaCierre} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {materia.inscripciones.length} inscripto{materia.inscripciones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:text-right">Exportar</p>
          <ExportButtons materiaId={materia.id} />
        </div>
      </header>

      {materia.inscripciones.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-gray-900">Todavía no hay inscriptos</h2>
          <p className="mt-1 text-sm text-gray-500">Cuando se registren alumnos, aparecerán en esta tabla.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Apellido</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">DNI</th>
                  <th className="px-5 py-3">Fecha de inscripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materia.inscripciones.map((inscripcion) => (
                  <tr key={inscripcion.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-face-blue">{inscripcion.apellido}</td>
                    <td className="px-5 py-3 text-gray-800">{inscripcion.nombre}</td>
                    <td className="px-5 py-3 text-gray-600">{inscripcion.dni}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {inscripcion.fechaInscripcion.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
