import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyRecaptcha } from './recaptcha'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => vi.clearAllMocks())

describe('verifyRecaptcha', () => {
  it('returns true when Google responds success: true', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    })
    expect(await verifyRecaptcha('valid-token')).toBe(true)
  })

  it('returns false when Google responds success: false', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    })
    expect(await verifyRecaptcha('bad-token')).toBe(false)
  })

  it('calls the correct Google endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ success: true }) })
    await verifyRecaptcha('token-abc')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
