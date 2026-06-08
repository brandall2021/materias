'use client'

import { buttonClassName } from './ui/Button'

export function ExportButtons({ materiaId }: { materiaId: string }) {
  const base = `/api/admin/materias/${materiaId}/export`
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`${base}?format=csv`} download>
        <span className={buttonClassName('secondary')}>CSV</span>
      </a>
      <a href={`${base}?format=pdf`} download>
        <span className={buttonClassName('secondary')}>PDF</span>
      </a>
    </div>
  )
}
