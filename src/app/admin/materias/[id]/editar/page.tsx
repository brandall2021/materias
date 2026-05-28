import { prisma } from '@/lib/prisma'
import { updateMateria } from '@/actions/materias'
import { MateriaForm } from '@/components/MateriaForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default async function EditarMateriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const materia = await prisma.materia.findUnique({ where: { id } })
  if (!materia) notFound()

  const action = updateMateria.bind(null, materia.id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/materias" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar materia</h1>
      </div>
      <MateriaForm
        action={action}
        defaultValues={{
          nombre: materia.nombre,
          descripcion: materia.descripcion ?? '',
          fechaApertura: toDatetimeLocal(materia.fechaApertura),
          fechaCierre: toDatetimeLocal(materia.fechaCierre),
        }}
      />
    </div>
  )
}
