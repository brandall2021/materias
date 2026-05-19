import { getMateriaEstado } from '@/lib/materia-status'

const styles = {
  proxima: 'bg-yellow-100 text-yellow-800',
  activa: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-600',
}

const labels = {
  proxima: 'Próxima',
  activa: 'Activa',
  cerrada: 'Cerrada',
}

export function MateriaStatusBadge({ fechaApertura, fechaCierre }: { fechaApertura: Date; fechaCierre: Date }) {
  const estado = getMateriaEstado({ fechaApertura, fechaCierre })
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[estado]}`}>
      {labels[estado]}
    </span>
  )
}
