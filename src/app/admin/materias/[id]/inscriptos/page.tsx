import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ExportButtons } from '@/components/ExportButtons'
import Link from 'next/link'

export default async function InscriptosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const materia = await prisma.materia.findUnique({
    where: { id },
    include: { inscripciones: { orderBy: { fechaInscripcion: 'asc' } } },
  })
  if (!materia) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/materias" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Inscriptos — {materia.nombre}
          </h1>
          <ExportButtons materiaId={materia.id} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{materia.inscripciones.length} inscripto{materia.inscripciones.length !== 1 ? 's' : ''}</p>
      </div>

      {materia.inscripciones.length === 0 ? (
        <p className="text-gray-500">No hay inscriptos aún.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Fecha de inscripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materia.inscripciones.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 text-gray-900">{i.apellido}</td>
                  <td className="px-4 py-3 text-gray-900">{i.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{i.dni}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {i.fechaInscripcion.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
