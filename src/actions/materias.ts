'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseFechaLocal } from '@/lib/fechas'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')
}

export type MateriaActionResult = { error: string } | void

export async function createMateria(formData: FormData): Promise<MateriaActionResult> {
  await requireAdmin()
  const nombre = (formData.get('nombre') as string).trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  let fechaApertura: Date
  let fechaCierre: Date
  try {
    fechaApertura = parseFechaLocal(formData.get('fechaApertura') as string)
    fechaCierre = parseFechaLocal(formData.get('fechaCierre') as string)
  } catch {
    return { error: 'Revisá las fechas de apertura y cierre' }
  }

  if (fechaCierre <= fechaApertura) {
    return { error: 'La fecha de cierre debe ser posterior a la apertura' }
  }

  await prisma.materia.create({ data: { nombre, descripcion, fechaApertura, fechaCierre } })
  revalidatePath('/admin/materias')
  redirect('/admin/materias')
}

export async function updateMateria(id: string, formData: FormData): Promise<MateriaActionResult> {
  await requireAdmin()
  const nombre = (formData.get('nombre') as string).trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  let fechaApertura: Date
  let fechaCierre: Date
  try {
    fechaApertura = parseFechaLocal(formData.get('fechaApertura') as string)
    fechaCierre = parseFechaLocal(formData.get('fechaCierre') as string)
  } catch {
    return { error: 'Revisá las fechas de apertura y cierre' }
  }

  if (fechaCierre <= fechaApertura) {
    return { error: 'La fecha de cierre debe ser posterior a la apertura' }
  }

  await prisma.materia.update({
    where: { id },
    data: { nombre, descripcion, fechaApertura, fechaCierre },
  })
  revalidatePath('/admin/materias')
  redirect('/admin/materias')
}

export async function deleteMateria(id: string): Promise<MateriaActionResult> {
  await requireAdmin()
  await prisma.materia.delete({ where: { id } })
  revalidatePath('/admin/materias')
}
