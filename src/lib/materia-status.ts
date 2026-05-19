export type MateriaEstado = 'proxima' | 'activa' | 'cerrada'

export function getMateriaEstado(materia: {
  fechaApertura: Date
  fechaCierre: Date
}): MateriaEstado {
  const now = new Date()
  if (now < materia.fechaApertura) return 'proxima'
  if (now > materia.fechaCierre) return 'cerrada'
  return 'activa'
}

export function isMateriaActiva(materia: {
  fechaApertura: Date
  fechaCierre: Date
}): boolean {
  return getMateriaEstado(materia) === 'activa'
}
