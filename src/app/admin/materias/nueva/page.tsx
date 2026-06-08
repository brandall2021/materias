import { MateriaForm } from '@/components/MateriaForm'
import { createMateria } from '@/actions/materias'
import Link from 'next/link'

export default function NuevaMateriaPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <Link href="/admin/materias" className="text-sm font-medium text-gray-500 hover:text-cyan-700">
          Volver a materias
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-cyan-700">Nueva apertura</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-950">Nueva materia</h1>
        <p className="mt-1 text-sm text-gray-500">Definí el nombre, descripción y ventana de inscripción.</p>
      </header>
      <MateriaForm action={createMateria} />
    </div>
  )
}
