import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MateriaStatusBadge } from '@/components/MateriaStatusBadge'
import { DeleteMateriaButton } from '@/components/DeleteMateriaButton'

export default async function AdminMateriasPage() {
  const materias = await prisma.materia.findMany({
    include: { _count: { select: { inscripciones: true } } },
    orderBy: { fechaApertura: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Materias</h1>
        <Link href="/admin/materias/nueva">
          <Button>+ Nueva materia</Button>
        </Link>
      </div>

      {materias.length === 0 ? (
        <p className="text-gray-500">No hay materias creadas.</p>
      ) : (
        <div className="space-y-3">
          {materias.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{m.nombre}</span>
                  <MateriaStatusBadge fechaApertura={m.fechaApertura} fechaCierre={m.fechaCierre} />
                </div>
                {m.descripcion && <p className="text-sm text-gray-500 truncate">{m.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {m.fechaApertura.toLocaleString('es-AR')} → {m.fechaCierre.toLocaleString('es-AR')}
                  {' · '}
                  <span className="font-medium text-gray-600">{m._count.inscripciones} inscripto{m._count.inscripciones !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/materias/${m.id}/inscriptos`}>
                  <Button variant="secondary">Inscriptos</Button>
                </Link>
                <Link href={`/admin/materias/${m.id}/editar`}>
                  <Button variant="secondary">Editar</Button>
                </Link>
                <DeleteMateriaButton
                  id={m.id}
                  nombre={m.nombre}
                  inscriptosCount={m._count.inscripciones}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
