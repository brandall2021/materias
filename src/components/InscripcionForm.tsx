'use client'

import { useState, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { inscribirse } from '@/actions/inscripcion'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { useRouter } from 'next/navigation'

export function InscripcionForm({ materiaId }: { materiaId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const captchaToken = recaptchaRef.current?.getValue()
    if (!captchaToken) {
      setError('Por favor completá la verificación')
      return
    }

    setPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set('captchaToken', captchaToken)
    formData.set('materiaId', materiaId)

    const result = await inscribirse(formData)
    setPending(false)

    if (!result.success) {
      setError(result.error)
      recaptchaRef.current?.reset()
      return
    }

    router.push(`/inscripcion/${materiaId}/confirmacion?id=${result.inscripcionId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre" name="nombre" required autoComplete="given-name" />
      <Input label="Apellido" name="apellido" required autoComplete="family-name" />
      <Input
        label="DNI"
        name="dni"
        required
        inputMode="numeric"
        pattern="\d{7,8}"
        title="Ingresá 7 u 8 dígitos numéricos"
        placeholder="12345678"
      />
      <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50 p-3">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Inscribiendo...' : 'Confirmar inscripción'}
      </Button>
    </form>
  )
}
