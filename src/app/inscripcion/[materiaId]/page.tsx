import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { isMateriaActiva } from '@/lib/materia-status'
import { InscripcionForm } from '@/components/InscripcionForm'
import Link from 'next/link'

export default async function InscripcionPage({ params }: { params: { materiaId: string } }) {
  const materia = await prisma.materia.findUnique({ where: { id: params.materiaId } })

  if (!materia || !isMateriaActiva(materia)) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">Inscripción</h1>
        <p className="text-lg text-blue-700 font-medium mb-6">{materia.nombre}</p>
        {materia.descripcion && <p className="text-sm text-gray-500 mb-6">{materia.descripcion}</p>}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <InscripcionForm materiaId={materia.id} />
        </div>
      </div>
    </main>
  )
}
