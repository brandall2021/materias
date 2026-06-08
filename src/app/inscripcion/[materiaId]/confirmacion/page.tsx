import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ConfirmacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ materiaId: string }>
  searchParams: Promise<{ id?: string }>
}) {
  const { materiaId } = await params
  const { id: inscripcionId } = await searchParams
  if (!inscripcionId) notFound()

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    include: { materia: true },
  })

  if (!inscripcion || inscripcion.materiaId !== materiaId) notFound()

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 sm:px-6">
      <section className="mx-auto max-w-xl rounded-md border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Inscripción confirmada</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950">Tu inscripción fue registrada</h1>
            <p className="mt-1 text-sm text-gray-500">Ya podés descargar el comprobante en PDF.</p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Alumno</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {inscripcion.apellido}, {inscripcion.nombre}
            </dd>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">DNI</dt>
              <dd className="mt-1 text-sm text-gray-900">{inscripcion.dni}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {inscripcion.fechaInscripcion.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Materia</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">{inscripcion.materia.nombre}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`/api/comprobante/${inscripcion.id}`}
            download
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
          >
            Descargar comprobante
          </a>
          <Link
            href="/"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
