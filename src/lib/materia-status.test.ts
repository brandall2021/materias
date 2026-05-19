import { describe, it, expect } from 'vitest'
import { getMateriaEstado, isMateriaActiva } from './materia-status'

const past = (offsetMinutes: number) =>
  new Date(Date.now() - offsetMinutes * 60 * 1000)
const future = (offsetMinutes: number) =>
  new Date(Date.now() + offsetMinutes * 60 * 1000)

describe('getMateriaEstado', () => {
  it('returns proxima when apertura is in the future', () => {
    expect(getMateriaEstado({ fechaApertura: future(60), fechaCierre: future(120) }))
      .toBe('proxima')
  })

  it('returns activa when now is between apertura and cierre', () => {
    expect(getMateriaEstado({ fechaApertura: past(60), fechaCierre: future(60) }))
      .toBe('activa')
  })

  it('returns cerrada when cierre is in the past', () => {
    expect(getMateriaEstado({ fechaApertura: past(120), fechaCierre: past(60) }))
      .toBe('cerrada')
  })
})

describe('isMateriaActiva', () => {
  it('returns true only when activa', () => {
    expect(isMateriaActiva({ fechaApertura: past(60), fechaCierre: future(60) })).toBe(true)
    expect(isMateriaActiva({ fechaApertura: future(60), fechaCierre: future(120) })).toBe(false)
    expect(isMateriaActiva({ fechaApertura: past(120), fechaCierre: past(60) })).toBe(false)
  })
})
