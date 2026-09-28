export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'

const FORMATO_ENTRADA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

function partesEn(instante: Date, conHora: boolean) {
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: ZONA_HORARIA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  if (conHora) {
    opciones.hour = '2-digit'
    opciones.minute = '2-digit'
    opciones.second = '2-digit'
  }
  const partes = new Intl.DateTimeFormat('en-CA', opciones).formatToParts(instante)
  return (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value)
}

function desplazamientoZona(instante: Date): number {
  const leer = partesEn(instante, true)
  const horaLocalComoUtc = Date.UTC(
    leer('year'),
    leer('month') - 1,
    leer('day'),
    leer('hour'),
    leer('minute'),
    leer('second')
  )
  return (horaLocalComoUtc - instante.getTime()) / 60_000
}

export function parseFechaLocal(valor: string): Date {
  const coincidencia = FORMATO_ENTRADA.exec((valor ?? '').trim())
  if (!coincidencia) {
    throw new Error(`Fecha inválida: "${valor}". Se espera el formato AAAA-MM-DDTHH:mm`)
  }
  const [, anio, mes, dia, hora, minuto, segundo = '0'] = coincidencia
  const horaDeParedComoUtc = Date.UTC(+anio, +mes - 1, +dia, +hora, +minuto, +segundo)
  const desplazamiento = desplazamientoZona(new Date(horaDeParedComoUtc))
  return new Date(horaDeParedComoUtc - desplazamiento * 60_000)
}

export function formatFechaHora(fecha: Date): string {
  return fecha.toLocaleString('es-AR', { timeZone: ZONA_HORARIA, hourCycle: 'h23' })
}

export function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-AR', { timeZone: ZONA_HORARIA })
}

export function toInputDateTimeLocal(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(fecha)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)!.value
  return `${valor('year')}-${valor('month')}-${valor('day')}T${valor('hour')}:${valor('minute')}`
}
