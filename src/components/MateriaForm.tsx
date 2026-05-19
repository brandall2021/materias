'use client'

import { useState } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

interface MateriaFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>
  defaultValues?: {
    nombre: string
    descripcion: string
    fechaApertura: string
    fechaCierre: string
  }
}

export function MateriaForm({ action, defaultValues }: MateriaFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await action(formData)
    if (result && 'error' in result) {
      setError(result.error)
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Input label="Nombre" name="nombre" required defaultValue={defaultValues?.nombre} />
      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={defaultValues?.descripcion}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Input
        label="Fecha y hora de apertura"
        name="fechaApertura"
        type="datetime-local"
        required
        defaultValue={defaultValues?.fechaApertura}
      />
      <Input
        label="Fecha y hora de cierre"
        name="fechaCierre"
        type="datetime-local"
        required
        defaultValue={defaultValues?.fechaCierre}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
