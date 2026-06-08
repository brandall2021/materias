import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { isMateriaActiva } from '@/lib/materia-status'
import { InscripcionForm } from '@/components/InscripcionForm'
import Link from 'next/link'

export default async function InscripcionPage({ params }: { params: Promise<{ materiaId: string }> }) {
  const { materiaId } = await params
  const materia = await prisma.materia.findUnique({ where: { id: materiaId } })

  if (!materia || !isMateriaActiva(materia)) notFound()

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:py-12">
        <section className="pt-2">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-cyan-700">
            Volver a materias
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-cyan-700">Inscripción abierta</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-950">{materia.nombre}</h1>
          {materia.descripcion && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">{materia.descripcion}</p>
          )}
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Apertura</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {materia.fechaApertura.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
              </dd>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cierre</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {materia.fechaCierre.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-950">Datos del alumno</h2>
            <p className="mt-1 text-sm text-gray-500">Completá tus datos tal como figuran en tu DNI.</p>
          </div>
          <InscripcionForm materiaId={materia.id} />
        </section>
      </div>
    </main>
  )
}
