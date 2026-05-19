'use server'

import { prisma } from '@/lib/prisma'
import { isMateriaActiva } from '@/lib/materia-status'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { revalidatePath } from 'next/cache'

export type InscripcionResult =
  | { success: true; inscripcionId: string }
  | { success: false; error: string }

export async function inscribirse(formData: FormData): Promise<InscripcionResult> {
  const materiaId = formData.get('materiaId') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const apellido = (formData.get('apellido') as string)?.trim()
  const dni = (formData.get('dni') as string)?.trim()
  const captchaToken = formData.get('captchaToken') as string

  if (!nombre || !apellido || !dni || !materiaId) {
    return { success: false, error: 'Todos los campos son obligatorios' }
  }

  if (!/^\d{7,8}$/.test(dni)) {
    return { success: false, error: 'El DNI debe tener 7 u 8 dígitos numéricos' }
  }

  const captchaOk = await verifyRecaptcha(captchaToken)
  if (!captchaOk) {
    return { success: false, error: 'Por favor completá la verificación' }
  }

  const materia = await prisma.materia.findUnique({ where: { id: materiaId } })
  if (!materia) {
    return { success: false, error: 'Materia no encontrada' }
  }

  if (!isMateriaActiva(materia)) {
    return { success: false, error: 'La inscripción para esta materia no está disponible' }
  }

  const duplicado = await prisma.inscripcion.findUnique({
    where: { dni_materiaId: { dni, materiaId } },
  })
  if (duplicado) {
    return { success: false, error: 'Ya estás inscripto en esta materia con ese DNI' }
  }

  try {
    const inscripcion = await prisma.inscripcion.create({
      data: { nombre, apellido, dni, materiaId },
    })
    revalidatePath(`/admin/materias/${materiaId}/inscriptos`)
    return { success: true, inscripcionId: inscripcion.id }
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') {
      return { success: false, error: 'Ya estás inscripto en esta materia con ese DNI' }
    }
    return { success: false, error: 'Error interno. Intentá nuevamente.' }
  }
}
