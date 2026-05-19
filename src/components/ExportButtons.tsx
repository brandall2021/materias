'use client'

import { Button } from './ui/Button'

export function ExportButtons({ materiaId }: { materiaId: string }) {
  const base = `/api/admin/materias/${materiaId}/export`
  return (
    <div className="flex gap-2">
      <a href={`${base}?format=csv`} download>
        <Button variant="secondary">Exportar CSV</Button>
      </a>
      <a href={`${base}?format=pdf`} download>
        <Button variant="secondary">Exportar PDF</Button>
      </a>
    </div>
  )
}
