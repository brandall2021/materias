'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { removeUsuario } from '@/actions/usuarios'

interface Usuario {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

export function UsuariosTable({ usuarios, currentUserId }: { usuarios: Usuario[]; currentUserId: string }) {
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setPending(id)
    setError(null)
    const result = await removeUsuario(id)
    if (result && 'error' in result) setError(result.error)
    setPending(null)
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{u.createdAt.toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3">
                  {u.id !== currentUserId && (
                    <Button
                      variant="danger"
                      onClick={() => handleRemove(u.id)}
                      disabled={pending === u.id}
                    >
                      {pending === u.id ? '...' : 'Eliminar'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
