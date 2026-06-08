import { getMateriaEstado } from '@/lib/materia-status'

const styles = {
  proxima: 'border-amber-200 bg-amber-50 text-amber-800',
  activa: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cerrada: 'border-gray-200 bg-gray-50 text-gray-600',
}

const labels = {
  proxima: 'Próxima',
  activa: 'Activa',
  cerrada: 'Cerrada',
}

export function MateriaStatusBadge({ fechaApertura, fechaCierre }: { fechaApertura: Date; fechaCierre: Date }) {
  const estado = getMateriaEstado({ fechaApertura, fechaCierre })
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[estado]}`}>
      {labels[estado]}
    </span>
  )
}
