import { MateriaForm } from '@/components/MateriaForm'
import { createMateria } from '@/actions/materias'
import Link from 'next/link'

export default function NuevaMateriaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/materias" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nueva materia</h1>
      </div>
      <MateriaForm action={createMateria} />
    </div>
  )
}
