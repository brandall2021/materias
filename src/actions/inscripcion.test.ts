import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFindUniqueMat, mockFindUniqueInsc, mockCreate } = vi.hoisted(() => ({
  mockFindUniqueMat: vi.fn(),
  mockFindUniqueInsc: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    materia: { findUnique: mockFindUniqueMat },
    inscripcion: { findUnique: mockFindUniqueInsc, create: mockCreate },
  },
}))

vi.mock('@/lib/materia-status', () => ({ isMateriaActiva: vi.fn() }))

import { inscribirse } from './inscripcion'
import { isMateriaActiva } from '@/lib/materia-status'

const makeFormData = (overrides: Record<string, string> = {}) => {
  const base = {
    materiaId: 'mat-1',
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    ...overrides,
  }
  return {
    get: (key: string) => base[key as keyof typeof base] ?? null,
  } as unknown as FormData
}

beforeEach(() => vi.clearAllMocks())

describe('inscribirse', () => {
  it('returns error when fields are missing', async () => {
    const result = await inscribirse(makeFormData({ nombre: '' }))
    expect(result).toEqual({ success: false, error: expect.any(String) })
  })

  it('returns error when DNI format is invalid', async () => {
    const result = await inscribirse(makeFormData({ dni: 'abc' }))
    expect(result).toEqual({ success: false, error: expect.stringContaining('DNI') })
  })

  it('returns error when materia not found', async () => {
    mockFindUniqueMat.mockResolvedValueOnce(null)
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('no encontrada') })
  })

  it('returns error when materia is not active', async () => {
    mockFindUniqueMat.mockResolvedValueOnce({ id: 'mat-1', fechaApertura: new Date(), fechaCierre: new Date() })
    vi.mocked(isMateriaActiva).mockReturnValueOnce(false)
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('no está disponible') })
  })

  it('returns error when DNI already inscribed', async () => {
    mockFindUniqueMat.mockResolvedValueOnce({ id: 'mat-1', fechaApertura: new Date(), fechaCierre: new Date() })
    vi.mocked(isMateriaActiva).mockReturnValueOnce(true)
    mockFindUniqueInsc.mockResolvedValueOnce({ id: 'existing' })
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('Ya estás inscripto') })
  })

  it('returns success with inscripcionId on valid submission', async () => {
    mockFindUniqueMat.mockResolvedValueOnce({ id: 'mat-1', fechaApertura: new Date(), fechaCierre: new Date() })
    vi.mocked(isMateriaActiva).mockReturnValueOnce(true)
    mockFindUniqueInsc.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({ id: 'insc-1' })
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: true, inscripcionId: 'insc-1' })
  })
})
