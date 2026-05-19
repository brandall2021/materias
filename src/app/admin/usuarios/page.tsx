import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { addUsuario } from '@/actions/usuarios'
import { UsuariosTable } from '@/components/UsuariosTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

async function handleAddUsuario(formData: FormData) {
  'use server'
  await addUsuario(formData)
}

export default async function UsuariosPage() {
  const session = await auth()
  const usuarios = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Administradores</h1>

      <form action={handleAddUsuario} className="flex gap-3 mb-8 max-w-md">
        <div className="flex-1">
          <Input label="Agregar admin por email" name="email" type="email" placeholder="usuario@example.com" />
        </div>
        <div className="pt-6">
          <Button type="submit">Agregar</Button>
        </div>
      </form>

      <UsuariosTable usuarios={usuarios} currentUserId={session?.user?.id ?? ''} />
    </div>
  )
}
