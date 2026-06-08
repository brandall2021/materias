'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { deleteMateria } from '@/actions/materias'

export function DeleteMateriaButton({
  id,
  nombre,
  inscriptosCount,
}: {
  id: string
  nombre: string
  inscriptosCount: number
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteMateria(id)
    setPending(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2 rounded-md border border-rose-200 bg-rose-50 p-2">
        <span className="max-w-[260px] text-xs font-medium text-rose-800">
          {inscriptosCount > 0
            ? `${nombre} tiene ${inscriptosCount} inscripto${inscriptosCount !== 1 ? 's' : ''}.`
            : `Eliminar ${nombre}.`}
        </span>
        <Button variant="danger" onClick={handleDelete} disabled={pending}>
          {pending ? 'Eliminando...' : 'Confirmar'}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      Eliminar
    </Button>
  )
}
