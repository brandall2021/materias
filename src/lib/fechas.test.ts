import { describe, it, expect } from 'vitest'
import {
  parseFechaLocal,
  formatFechaHora,
  formatFecha,
  toInputDateTimeLocal,
} from './fechas'

describe('parseFechaLocal', () => {
  it('interpreta el valor del input como hora de Argentina, no del servidor', () => {
    expect(parseFechaLocal('2026-09-30T18:00').toISOString()).toBe('2026-09-30T21:00:00.000Z')
  })

  it('no depende de la zona horaria del proceso que corre', () => {
    expect(parseFechaLocal('2026-01-15T09:30').toISOString()).toBe('2026-01-15T12:30:00.000Z')
  })

  it('acepta segundos opcionales', () => {
    expect(parseFechaLocal('2026-09-30T18:00:45').toISOString()).toBe('2026-09-30T21:00:45.000Z')
  })

  it('rechaza valores que no son fecha-hora local', () => {
    expect(() => parseFechaLocal('')).toThrow()
    expect(() => parseFechaLocal('no-es-fecha')).toThrow()
    expect(() => parseFechaLocal('30/09/2026 18:00')).toThrow()
  })
})

describe('formatFechaHora', () => {
  it('muestra la hora de Argentina en formato de 24 horas', () => {
    expect(formatFechaHora(new Date('2026-09-30T21:00:00.000Z'))).toBe('30/9/2026, 18:00:00')
  })

  it('no cae en el formato de 12 horas que usa ICU para es-AR', () => {
    const salida = formatFechaHora(new Date('2026-09-30T21:00:00.000Z'))
    expect(salida).not.toContain('06:00')
    expect(salida).toContain('18:00')
  })

  it('es equivalente a formatear con timeZone explícito', () => {
    const fecha = new Date('2026-09-30T21:00:00.000Z')
    expect(formatFechaHora(fecha)).toBe(
      fecha.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hourCycle: 'h23',
      })
    )
  })
})

describe('formatFecha', () => {
  it('usa el día de Argentina y no el de UTC', () => {
    expect(formatFecha(new Date('2026-09-30T02:00:00.000Z'))).toBe('29/9/2026')
  })
})

describe('toInputDateTimeLocal', () => {
  it('vuelve al valor que el administrador escribió', () => {
    expect(toInputDateTimeLocal(new Date('2026-09-30T21:00:00.000Z'))).toBe('2026-09-30T18:00')
  })

  it('mantiene el mismo valor al editar y volver a guardar', () => {
    const original = '2026-09-30T18:00'
    expect(toInputDateTimeLocal(parseFechaLocal(original))).toBe(original)
  })
})
