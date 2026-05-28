import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const materias = await prisma.materia.findMany({
    where: {
      fechaApertura: { lte: new Date() },
      fechaCierre: { gte: new Date() },
    },
    orderBy: { fechaCierre: 'asc' },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscripción a Materias</h1>
        <p className="text-gray-500 mb-8">Materias con inscripción abierta</p>

        {materias.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">No hay materias con inscripción abierta en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {materias.map((m) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{m.nombre}</h2>
                  {m.descripcion && <p className="text-sm text-gray-500 mt-0.5">{m.descripcion}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Cierre: {m.fechaCierre.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                  </p>
                </div>
                <Link href={`/inscripcion/${m.id}`}>
                  <Button>Inscribirse</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
