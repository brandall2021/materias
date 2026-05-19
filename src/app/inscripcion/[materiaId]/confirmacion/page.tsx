import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ConfirmacionPage({
  params,
  searchParams,
}: {
  params: { materiaId: string }
  searchParams: { id?: string }
}) {
  const inscripcionId = searchParams.id
  if (!inscripcionId) notFound()

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    include: { materia: true },
  })

  if (!inscripcion || inscripcion.materiaId !== params.materiaId) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">¡Inscripción confirmada!</h1>
          <p className="text-gray-500 mb-6">Tu inscripción fue registrada correctamente.</p>

          <div className="text-left bg-gray-50 rounded-lg p-4 space-y-1 mb-6">
            <p className="text-sm"><span className="font-medium">Apellido y Nombre:</span> {inscripcion.apellido}, {inscripcion.nombre}</p>
            <p className="text-sm"><span className="font-medium">DNI:</span> {inscripcion.dni}</p>
            <p className="text-sm"><span className="font-medium">Materia:</span> {inscripcion.materia.nombre}</p>
            <p className="text-sm"><span className="font-medium">Fecha:</span> {inscripcion.fechaInscripcion.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
          </div>

          <a
            href={`/api/comprobante/${inscripcion.id}`}
            download
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-md transition-colors mb-3"
          >
            Descargar comprobante PDF
          </a>
          <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
