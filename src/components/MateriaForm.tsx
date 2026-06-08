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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <Input label="Nombre" name="nombre" required defaultValue={defaultValues?.nombre} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="descripcion" className="text-sm font-semibold text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          defaultValue={defaultValues?.descripcion}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
