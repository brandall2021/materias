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
    <div className="max-w-3xl space-y-6">
      <header>
        <Link href="/admin/materias" className="text-sm font-medium text-gray-500 hover:text-face-red">
          Volver a materias
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-face-red">Editar apertura</p>
        <h1 className="mt-1 text-2xl font-bold text-face-blue">{materia.nombre}</h1>
        <p className="mt-1 text-sm text-gray-500">Actualizá la información visible para alumnos.</p>
      </header>
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
