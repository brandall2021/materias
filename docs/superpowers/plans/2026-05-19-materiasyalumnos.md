# Materias y Alumnos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web system where admins manage subjects (materias) and students self-enroll during open registration periods, with PDF receipts and QR codes.

**Architecture:** Next.js 14 App Router with Server Actions for all mutations. Admins authenticate via Google OAuth (NextAuth v5). Students submit a public form protected by reCAPTCHA v2. PDFs are generated server-side with pdfkit.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth v5 (@auth/prisma-adapter), Tailwind CSS, pdfkit, qrcode, Vitest, Google reCAPTCHA v2.

---

## File Map

```
materiasyalumnos/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                                  # Public: lista materias activas
│   │   ├── inscripcion/[materiaId]/
│   │   │   ├── page.tsx                              # Public: formulario inscripción
│   │   │   └── confirmacion/page.tsx                 # Public: confirmación + PDF
│   │   ├── admin/
│   │   │   ├── layout.tsx                            # Protección de sesión
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx                              # Dashboard
│   │   │   ├── materias/
│   │   │   │   ├── page.tsx                          # Listado admin
│   │   │   │   ├── nueva/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── editar/page.tsx
│   │   │   │       └── inscriptos/page.tsx
│   │   │   └── usuarios/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── comprobante/[inscripcionId]/route.ts   # PDF alumno
│   │       └── admin/materias/[id]/export/route.ts   # CSV + PDF admin
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── materia-status.ts                         # Lógica de estado (pura, testeable)
│   │   └── recaptcha.ts                              # Verificación server-side
│   ├── actions/
│   │   ├── inscripcion.ts
│   │   ├── materias.ts
│   │   └── usuarios.ts
│   ├── components/
│   │   ├── ui/Button.tsx
│   │   ├── ui/Input.tsx
│   │   ├── MateriaStatusBadge.tsx
│   │   ├── MateriaCard.tsx
│   │   ├── InscripcionForm.tsx                       # Client component con reCAPTCHA
│   │   ├── MateriaForm.tsx                           # Admin: crear/editar materia
│   │   ├── DeleteMateriaButton.tsx                   # Client: modal de confirmación
│   │   ├── InscriptosTable.tsx
│   │   └── ExportButtons.tsx
│   └── middleware.ts
├── .env.example
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
└── package.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`

- [ ] **Step 1: Scaffold Next.js 14 project**

```bash
cd /home/brandall/desarrollo
npx create-next-app@latest materiasyalumnos \
  --typescript --tailwind --app --src-dir \
  --no-eslint --import-alias "@/*"
cd materiasyalumnos
```

- [ ] **Step 2: Install dependencies**

```bash
npm install next-auth@beta @auth/prisma-adapter @prisma/client prisma
npm install pdfkit qrcode
npm install @types/pdfkit @types/qrcode --save-dev
npm install react-google-recaptcha
npm install @types/react-google-recaptcha --save-dev
npm install vitest @vitejs/plugin-react --save-dev
```

- [ ] **Step 3: Configure vitest.config.ts**

Replace the contents of `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Configure next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 project with Tailwind and Vitest"
```

---

## Task 2: Prisma Schema and Migration

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema.prisma**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("ADMIN")
  createdAt     DateTime  @default(now())
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Materia {
  id            String        @id @default(cuid())
  nombre        String
  descripcion   String?
  fechaApertura DateTime
  fechaCierre   DateTime
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  inscripciones Inscripcion[]
}

model Inscripcion {
  id               String   @id @default(cuid())
  nombre           String
  apellido         String
  dni              String
  materiaId        String
  fechaInscripcion DateTime @default(now())
  materia          Materia  @relation(fields: [materiaId], references: [id], onDelete: Cascade)

  @@unique([dni, materiaId])
}
```

- [ ] **Step 3: Create Prisma singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Run migration (requires DATABASE_URL set)**

Set `DATABASE_URL` in `.env` then:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Expected output: `✔ Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts
git commit -m "feat: add Prisma schema with Materia, Inscripcion and NextAuth models"
```

---

## Task 3: NextAuth Configuration

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: Extend NextAuth types**

Create `src/types/next-auth.d.ts`:

```typescript
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    role?: string
  }
}
```

- [ ] **Step 2: Create auth config**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL
      const existing = await prisma.user.findUnique({
        where: { email: user.email! },
      })
      if (existing) return true
      if (user.email === adminEmail) return true
      return false
    },
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role?: string }).role ?? 'ADMIN'
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
})
```

- [ ] **Step 3: Create route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/types
git commit -m "feat: configure NextAuth v5 with Google provider and admin email gate"
```

---

## Task 4: Middleware (protect /admin routes)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts`:

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  if (!isLoginPage && !req.auth) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware to protect /admin routes"
```

---

## Task 5: Materia Status Utility (TDD)

**Files:**
- Create: `src/lib/materia-status.ts`
- Create: `src/lib/materia-status.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/materia-status.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './materia-status'`

- [ ] **Step 3: Implement**

Create `src/lib/materia-status.ts`:

```typescript
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
```

- [ ] **Step 4: Run to verify they pass**

```bash
npm test
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/materia-status.ts src/lib/materia-status.test.ts
git commit -m "feat: add materia status utility with tests"
```

---

## Task 6: reCAPTCHA Verification Utility (TDD)

**Files:**
- Create: `src/lib/recaptcha.ts`
- Create: `src/lib/recaptcha.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/recaptcha.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './recaptcha'`

- [ ] **Step 3: Implement**

Create `src/lib/recaptcha.ts`:

```typescript
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  })
  const data = await response.json()
  return data.success === true
}
```

- [ ] **Step 4: Run to verify they pass**

```bash
npm test
```

Expected: PASS — 7 tests passing total

- [ ] **Step 5: Commit**

```bash
git add src/lib/recaptcha.ts src/lib/recaptcha.test.ts
git commit -m "feat: add reCAPTCHA server-side verification utility with tests"
```

---

## Task 7: Server Action — Inscribirse (TDD)

**Files:**
- Create: `src/actions/inscripcion.ts`
- Create: `src/actions/inscripcion.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/actions/inscripcion.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const mockFindUniqueMat = vi.fn()
const mockFindUniqueInsc = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    materia: { findUnique: mockFindUniqueMat },
    inscripcion: { findUnique: mockFindUniqueInsc, create: mockCreate },
  },
}))

vi.mock('@/lib/recaptcha', () => ({ verifyRecaptcha: vi.fn() }))
vi.mock('@/lib/materia-status', () => ({ isMateriaActiva: vi.fn() }))

import { inscribirse } from './inscripcion'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { isMateriaActiva } from '@/lib/materia-status'

const makeFormData = (overrides: Record<string, string> = {}) => {
  const base = {
    materiaId: 'mat-1',
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    captchaToken: 'token',
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

  it('returns error when captcha fails', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValueOnce(false)
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('verificación') })
  })

  it('returns error when materia not found', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValueOnce(true)
    mockFindUniqueMat.mockResolvedValueOnce(null)
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('no encontrada') })
  })

  it('returns error when materia is not active', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValueOnce(true)
    mockFindUniqueMat.mockResolvedValueOnce({ id: 'mat-1', fechaApertura: new Date(), fechaCierre: new Date() })
    vi.mocked(isMateriaActiva).mockReturnValueOnce(false)
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('no está disponible') })
  })

  it('returns error when DNI already inscribed', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValueOnce(true)
    mockFindUniqueMat.mockResolvedValueOnce({ id: 'mat-1', fechaApertura: new Date(), fechaCierre: new Date() })
    vi.mocked(isMateriaActiva).mockReturnValueOnce(true)
    mockFindUniqueInsc.mockResolvedValueOnce({ id: 'existing' })
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: false, error: expect.stringContaining('Ya estás inscripto') })
  })

  it('returns success with inscripcionId on valid submission', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValueOnce(true)
    mockFindUniqueMat.mockResolvedValueOnce({ id: 'mat-1', fechaApertura: new Date(), fechaCierre: new Date() })
    vi.mocked(isMateriaActiva).mockReturnValueOnce(true)
    mockFindUniqueInsc.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({ id: 'insc-1' })
    const result = await inscribirse(makeFormData())
    expect(result).toEqual({ success: true, inscripcionId: 'insc-1' })
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './inscripcion'`

- [ ] **Step 3: Implement**

Create `src/actions/inscripcion.ts`:

```typescript
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
```

- [ ] **Step 4: Run to verify they pass**

```bash
npm test
```

Expected: PASS — 14 tests passing total

- [ ] **Step 5: Commit**

```bash
git add src/actions/inscripcion.ts src/actions/inscripcion.test.ts
git commit -m "feat: add inscribirse server action with validation and tests"
```

---

## Task 8: Server Actions — Materias (Admin)

**Files:**
- Create: `src/actions/materias.ts`

- [ ] **Step 1: Create materias actions**

Create `src/actions/materias.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
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
  const fechaApertura = new Date(formData.get('fechaApertura') as string)
  const fechaCierre = new Date(formData.get('fechaCierre') as string)

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
  const fechaApertura = new Date(formData.get('fechaApertura') as string)
  const fechaCierre = new Date(formData.get('fechaCierre') as string)

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
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/materias.ts
git commit -m "feat: add materias CRUD server actions"
```

---

## Task 9: Server Actions — Usuarios (Admin)

**Files:**
- Create: `src/actions/usuarios.ts`

- [ ] **Step 1: Create usuarios actions**

Create `src/actions/usuarios.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')
}

export type UsuarioActionResult = { error: string } | { success: true } | void

export async function addUsuario(formData: FormData): Promise<UsuarioActionResult> {
  await requireAdmin()
  const email = (formData.get('email') as string).trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Email inválido' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Este email ya está registrado como administrador' }

  await prisma.user.create({ data: { email, role: 'ADMIN' } })
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function removeUsuario(id: string): Promise<UsuarioActionResult> {
  await requireAdmin()

  const count = await prisma.user.count()
  if (count <= 1) {
    return { error: 'No podés eliminar el único administrador del sistema' }
  }

  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/usuarios')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/usuarios.ts
git commit -m "feat: add admin user management server actions"
```

---

## Task 10: PDF Comprobante Route Handler

**Files:**
- Create: `src/app/api/comprobante/[inscripcionId]/route.ts`

- [ ] **Step 1: Create route handler**

Create `src/app/api/comprobante/[inscripcionId]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export async function GET(
  _req: Request,
  { params }: { params: { inscripcionId: string } }
) {
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: params.inscripcionId },
    include: { materia: true },
  })

  if (!inscripcion) {
    return new NextResponse('No encontrado', { status: 404 })
  }

  const qrContent = [
    `Nombre: ${inscripcion.apellido}, ${inscripcion.nombre}`,
    `DNI: ${inscripcion.dni}`,
    `Materia: ${inscripcion.materia.nombre}`,
    `Inscripto el: ${inscripcion.fechaInscripcion.toLocaleString('es-AR')}`,
  ].join('\n')

  const qrBuffer = await QRCode.toBuffer(qrContent, { width: 150 })

  const doc = new PDFDocument({ size: 'A4', margin: 60 })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  await new Promise<void>((resolve) => {
    doc.on('end', resolve)

    doc.fontSize(22).font('Helvetica-Bold').text('Comprobante de Inscripción', { align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
    doc.moveDown()

    doc.fontSize(13).font('Helvetica')
    doc.text(`Apellido y Nombre:  ${inscripcion.apellido}, ${inscripcion.nombre}`)
    doc.text(`DNI:  ${inscripcion.dni}`)
    doc.moveDown(0.5)
    doc.fontSize(14).font('Helvetica-Bold').text(`Materia:  ${inscripcion.materia.nombre}`)
    doc.moveDown(0.5)
    doc.fontSize(12).font('Helvetica').text(
      `Fecha de inscripción:  ${inscripcion.fechaInscripcion.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`
    )
    doc.moveDown(1.5)
    doc.image(qrBuffer, { fit: [150, 150], align: 'center' })
    doc.end()
  })

  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprobante-${inscripcion.dni}.pdf"`,
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/comprobante
git commit -m "feat: add comprobante PDF route handler with QR code"
```

---

## Task 11: Export Route Handler (CSV + PDF admin)

**Files:**
- Create: `src/app/api/admin/materias/[id]/export/route.ts`

- [ ] **Step 1: Create export route handler**

Create `src/app/api/admin/materias/[id]/export/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') ?? 'csv'

  const materia = await prisma.materia.findUnique({
    where: { id: params.id },
    include: {
      inscripciones: { orderBy: { fechaInscripcion: 'asc' } },
    },
  })

  if (!materia) return new NextResponse('No encontrado', { status: 404 })

  if (format === 'csv') {
    const header = 'Apellido,Nombre,DNI,Fecha de inscripción\n'
    const rows = materia.inscripciones
      .map((i) =>
        [
          `"${i.apellido}"`,
          `"${i.nombre}"`,
          `"${i.dni}"`,
          `"${i.fechaInscripcion.toLocaleString('es-AR')}"`,
        ].join(',')
      )
      .join('\n')
    const csv = header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inscriptos-${materia.nombre}.csv"`,
      },
    })
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    await new Promise<void>((resolve) => {
      doc.on('end', resolve)

      doc.fontSize(18).font('Helvetica-Bold').text(`Inscriptos — ${materia.nombre}`, { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica').text(
        `Exportado el ${new Date().toLocaleString('es-AR')} | Total: ${materia.inscripciones.length}`,
        { align: 'center' }
      )
      doc.moveDown()
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
      doc.moveDown(0.5)

      const colX = [60, 200, 340, 420]
      doc.fontSize(11).font('Helvetica-Bold')
      doc.text('Apellido', colX[0], doc.y, { width: 130, continued: true })
      doc.text('Nombre', colX[1], doc.y, { width: 130, continued: true })
      doc.text('DNI', colX[2], doc.y, { width: 70, continued: true })
      doc.text('Fecha inscripción', colX[3], doc.y)
      doc.moveDown(0.3)
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke()
      doc.moveDown(0.3)

      doc.fontSize(10).font('Helvetica')
      for (const i of materia.inscripciones) {
        const y = doc.y
        doc.text(i.apellido, colX[0], y, { width: 130, continued: true })
        doc.text(i.nombre, colX[1], y, { width: 130, continued: true })
        doc.text(i.dni, colX[2], y, { width: 70, continued: true })
        doc.text(new Date(i.fechaInscripcion).toLocaleDateString('es-AR'), colX[3], y)
        doc.moveDown(0.2)
      }

      doc.end()
    })

    const pdfBuffer = Buffer.concat(chunks)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inscriptos-${materia.nombre}.pdf"`,
      },
    })
  }

  return new NextResponse('Formato no soportado', { status: 400 })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin
git commit -m "feat: add CSV and PDF export route handlers for admin"
```

---

## Task 12: UI Components (base)

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/MateriaStatusBadge.tsx`

- [ ] **Step 1: Create Button**

Create `src/components/ui/Button.tsx`:

```typescript
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <button
      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create Input**

Create `src/components/ui/Input.tsx`:

```typescript
import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, ...props }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 3: Create MateriaStatusBadge**

Create `src/components/MateriaStatusBadge.tsx`:

```typescript
import { getMateriaEstado } from '@/lib/materia-status'

const styles = {
  proxima: 'bg-yellow-100 text-yellow-800',
  activa: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-600',
}

const labels = {
  proxima: 'Próxima',
  activa: 'Activa',
  cerrada: 'Cerrada',
}

export function MateriaStatusBadge({ fechaApertura, fechaCierre }: { fechaApertura: Date; fechaCierre: Date }) {
  const estado = getMateriaEstado({ fechaApertura, fechaCierre })
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[estado]}`}>
      {labels[estado]}
    </span>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "feat: add base UI components and MateriaStatusBadge"
```

---

## Task 13: Admin Layout and Login Page

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Create admin layout**

Create `src/app/admin/layout.tsx`:

```typescript
import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      {session && (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">Admin</span>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/admin/materias" className="text-sm text-gray-600 hover:text-gray-900">Materias</Link>
            <Link href="/admin/usuarios" className="text-sm text-gray-600 hover:text-gray-900">Usuarios</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session.user?.email}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login' }) }}>
              <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">Salir</button>
            </form>
          </div>
        </nav>
      )}
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create login page**

Create `src/app/admin/login/page.tsx`:

```typescript
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel Administrativo</h1>
        <p className="text-sm text-gray-500 mb-8">Ingresá con tu cuenta Google autorizada</p>
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/admin' })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Ingresar con Google
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/login
git commit -m "feat: add admin layout with nav and login page"
```

---

## Task 14: Admin Dashboard

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/app/admin/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalMaterias, totalInscriptos] = await Promise.all([
    prisma.materia.count(),
    prisma.inscripcion.count(),
  ])

  const materiasActivas = await prisma.materia.count({
    where: {
      fechaApertura: { lte: new Date() },
      fechaCierre: { gte: new Date() },
    },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total materias" value={totalMaterias} />
        <StatCard label="Materias activas" value={materiasActivas} highlight />
        <StatCard label="Total inscriptos" value={totalInscriptos} />
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/admin/materias" className="text-sm text-blue-600 hover:underline">
          Ver materias →
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 ${highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add admin dashboard with stats"
```

---

## Task 15: Admin Materias Pages

**Files:**
- Create: `src/components/MateriaForm.tsx`
- Create: `src/components/DeleteMateriaButton.tsx`
- Create: `src/app/admin/materias/page.tsx`
- Create: `src/app/admin/materias/nueva/page.tsx`
- Create: `src/app/admin/materias/[id]/editar/page.tsx`

- [ ] **Step 1: Create MateriaForm component**

Create `src/components/MateriaForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

interface MateriaFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>
  defaultValues?: {
    nombre: string
    descripcion: string
    fechaApertura: string
    fechaCierre: string
  }
}

export function MateriaForm({ action, defaultValues }: MateriaFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await action(formData)
    if (result && 'error' in result) {
      setError(result.error)
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Input label="Nombre" name="nombre" required defaultValue={defaultValues?.nombre} />
      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={defaultValues?.descripcion}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Input
        label="Fecha y hora de apertura"
        name="fechaApertura"
        type="datetime-local"
        required
        defaultValue={defaultValues?.fechaApertura}
      />
      <Input
        label="Fecha y hora de cierre"
        name="fechaCierre"
        type="datetime-local"
        required
        defaultValue={defaultValues?.fechaCierre}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create DeleteMateriaButton**

Create `src/components/DeleteMateriaButton.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { deleteMateria } from '@/actions/materias'

export function DeleteMateriaButton({
  id,
  nombre,
  inscriptosCount,
}: {
  id: string
  nombre: string
  inscriptosCount: number
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    await deleteMateria(id)
    setPending(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-700">
          {inscriptosCount > 0
            ? `Esta materia tiene ${inscriptosCount} inscripto${inscriptosCount !== 1 ? 's' : ''}. ¿Confirmar eliminación?`
            : '¿Eliminar esta materia?'}
        </span>
        <Button variant="danger" onClick={handleDelete} disabled={pending}>
          {pending ? 'Eliminando...' : 'Confirmar'}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      Eliminar
    </Button>
  )
}
```

- [ ] **Step 3: Create materias list page**

Create `src/app/admin/materias/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MateriaStatusBadge } from '@/components/MateriaStatusBadge'
import { DeleteMateriaButton } from '@/components/DeleteMateriaButton'

export default async function AdminMateriasPage() {
  const materias = await prisma.materia.findMany({
    include: { _count: { select: { inscripciones: true } } },
    orderBy: { fechaApertura: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Materias</h1>
        <Link href="/admin/materias/nueva">
          <Button>+ Nueva materia</Button>
        </Link>
      </div>

      {materias.length === 0 ? (
        <p className="text-gray-500">No hay materias creadas.</p>
      ) : (
        <div className="space-y-3">
          {materias.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{m.nombre}</span>
                  <MateriaStatusBadge fechaApertura={m.fechaApertura} fechaCierre={m.fechaCierre} />
                </div>
                {m.descripcion && <p className="text-sm text-gray-500 truncate">{m.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {m.fechaApertura.toLocaleString('es-AR')} → {m.fechaCierre.toLocaleString('es-AR')}
                  {' · '}
                  <span className="font-medium text-gray-600">{m._count.inscripciones} inscripto{m._count.inscripciones !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/materias/${m.id}/inscriptos`}>
                  <Button variant="secondary">Inscriptos</Button>
                </Link>
                <Link href={`/admin/materias/${m.id}/editar`}>
                  <Button variant="secondary">Editar</Button>
                </Link>
                <DeleteMateriaButton
                  id={m.id}
                  nombre={m.nombre}
                  inscriptosCount={m._count.inscripciones}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create nueva materia page**

Create `src/app/admin/materias/nueva/page.tsx`:

```typescript
import { MateriaForm } from '@/components/MateriaForm'
import { createMateria } from '@/actions/materias'
import Link from 'next/link'

export default function NuevaMateriaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/materias" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nueva materia</h1>
      </div>
      <MateriaForm action={createMateria} />
    </div>
  )
}
```

- [ ] **Step 5: Create editar page**

Create `src/app/admin/materias/[id]/editar/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { updateMateria } from '@/actions/materias'
import { MateriaForm } from '@/components/MateriaForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default async function EditarMateriaPage({ params }: { params: { id: string } }) {
  const materia = await prisma.materia.findUnique({ where: { id: params.id } })
  if (!materia) notFound()

  const action = updateMateria.bind(null, materia.id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/materias" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar materia</h1>
      </div>
      <MateriaForm
        action={action}
        defaultValues={{
          nombre: materia.nombre,
          descripcion: materia.descripcion ?? '',
          fechaApertura: toDatetimeLocal(materia.fechaApertura),
          fechaCierre: toDatetimeLocal(materia.fechaCierre),
        }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/materias src/components/MateriaForm.tsx src/components/DeleteMateriaButton.tsx
git commit -m "feat: add admin materias CRUD pages"
```

---

## Task 16: Admin Inscriptos Page

**Files:**
- Create: `src/app/admin/materias/[id]/inscriptos/page.tsx`
- Create: `src/components/ExportButtons.tsx`

- [ ] **Step 1: Create ExportButtons component**

Create `src/components/ExportButtons.tsx`:

```typescript
'use client'

import { Button } from './ui/Button'

export function ExportButtons({ materiaId }: { materiaId: string }) {
  const base = `/api/admin/materias/${materiaId}/export`
  return (
    <div className="flex gap-2">
      <a href={`${base}?format=csv`} download>
        <Button variant="secondary">Exportar CSV</Button>
      </a>
      <a href={`${base}?format=pdf`} download>
        <Button variant="secondary">Exportar PDF</Button>
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Create inscriptos page**

Create `src/app/admin/materias/[id]/inscriptos/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ExportButtons } from '@/components/ExportButtons'
import Link from 'next/link'

export default async function InscriptosPage({ params }: { params: { id: string } }) {
  const materia = await prisma.materia.findUnique({
    where: { id: params.id },
    include: { inscripciones: { orderBy: { fechaInscripcion: 'asc' } } },
  })
  if (!materia) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/materias" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Inscriptos — {materia.nombre}
          </h1>
          <ExportButtons materiaId={materia.id} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{materia.inscripciones.length} inscripto{materia.inscripciones.length !== 1 ? 's' : ''}</p>
      </div>

      {materia.inscripciones.length === 0 ? (
        <p className="text-gray-500">No hay inscriptos aún.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Fecha de inscripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materia.inscripciones.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 text-gray-900">{i.apellido}</td>
                  <td className="px-4 py-3 text-gray-900">{i.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{i.dni}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {i.fechaInscripcion.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/materias/\[id\]/inscriptos src/components/ExportButtons.tsx
git commit -m "feat: add inscriptos page with CSV and PDF export"
```

---

## Task 17: Admin Usuarios Page

**Files:**
- Create: `src/app/admin/usuarios/page.tsx`
- Create: `src/components/UsuariosTable.tsx`

- [ ] **Step 1: Create UsuariosTable client component**

Create `src/components/UsuariosTable.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { removeUsuario } from '@/actions/usuarios'

interface Usuario {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

export function UsuariosTable({ usuarios, currentUserId }: { usuarios: Usuario[]; currentUserId: string }) {
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setPending(id)
    setError(null)
    const result = await removeUsuario(id)
    if (result && 'error' in result) setError(result.error)
    setPending(null)
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{u.createdAt.toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3">
                  {u.id !== currentUserId && (
                    <Button
                      variant="danger"
                      onClick={() => handleRemove(u.id)}
                      disabled={pending === u.id}
                    >
                      {pending === u.id ? '...' : 'Eliminar'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create usuarios page**

Create `src/app/admin/usuarios/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { addUsuario } from '@/actions/usuarios'
import { UsuariosTable } from '@/components/UsuariosTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default async function UsuariosPage() {
  const session = await auth()
  const usuarios = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Administradores</h1>

      <form action={addUsuario} className="flex gap-3 mb-8 max-w-md">
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/usuarios src/components/UsuariosTable.tsx
git commit -m "feat: add admin usuarios management page"
```

---

## Task 18: Public Pages (Home + Inscripcion)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/InscripcionForm.tsx`
- Create: `src/app/inscripcion/[materiaId]/page.tsx`
- Create: `src/app/inscripcion/[materiaId]/confirmacion/page.tsx`

- [ ] **Step 1: Create public home page**

Create `src/app/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const revalidate = 60

export default async function HomePage() {
  const materias = await prisma.materia.findMany({
    where: {
      fechaApertura: { lte: new Date() },
      fechaCierre: { gte: new Date() },
    },
    orderBy: { fechaCierre: 'asc' },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscripción a Materias</h1>
        <p className="text-gray-500 mb-8">Materias con inscripción abierta</p>

        {materias.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">No hay materias con inscripción abierta en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {materias.map((m) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{m.nombre}</h2>
                  {m.descripcion && <p className="text-sm text-gray-500 mt-0.5">{m.descripcion}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Cierre: {m.fechaCierre.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                  </p>
                </div>
                <Link href={`/inscripcion/${m.id}`}>
                  <Button>Inscribirse</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create InscripcionForm client component**

Create `src/components/InscripcionForm.tsx`:

```typescript
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
      <div>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Inscribiendo...' : 'Confirmar inscripción'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create inscripcion page**

Create `src/app/inscripcion/[materiaId]/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { isMateriaActiva } from '@/lib/materia-status'
import { InscripcionForm } from '@/components/InscripcionForm'
import Link from 'next/link'

export default async function InscripcionPage({ params }: { params: { materiaId: string } }) {
  const materia = await prisma.materia.findUnique({ where: { id: params.materiaId } })

  if (!materia || !isMateriaActiva(materia)) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">Inscripción</h1>
        <p className="text-lg text-blue-700 font-medium mb-6">{materia.nombre}</p>
        {materia.descripcion && <p className="text-sm text-gray-500 mb-6">{materia.descripcion}</p>}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <InscripcionForm materiaId={materia.id} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Create confirmacion page**

Create `src/app/inscripcion/[materiaId]/confirmacion/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ConfirmacionPage({
  params,
  searchParams,
}: {
  params: { materiaId: string }
  searchParams: { id?: string }
}) {
  const inscripcionId = searchParams.id
  if (!inscripcionId) notFound()

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    include: { materia: true },
  })

  if (!inscripcion || inscripcion.materiaId !== params.materiaId) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">¡Inscripción confirmada!</h1>
          <p className="text-gray-500 mb-6">Tu inscripción fue registrada correctamente.</p>

          <div className="text-left bg-gray-50 rounded-lg p-4 space-y-1 mb-6">
            <p className="text-sm"><span className="font-medium">Apellido y Nombre:</span> {inscripcion.apellido}, {inscripcion.nombre}</p>
            <p className="text-sm"><span className="font-medium">DNI:</span> {inscripcion.dni}</p>
            <p className="text-sm"><span className="font-medium">Materia:</span> {inscripcion.materia.nombre}</p>
            <p className="text-sm"><span className="font-medium">Fecha:</span> {inscripcion.fechaInscripcion.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
          </div>

          <a
            href={`/api/comprobante/${inscripcion.id}`}
            download
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 rounded-md transition-colors mb-3"
          >
            Descargar comprobante PDF
          </a>
          <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/inscripcion src/components/InscripcionForm.tsx
git commit -m "feat: add public home page and inscription flow with confirmation"
```

---

## Task 19: Root Layout and App Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Inscripción a Materias',
  description: 'Inscribite a las materias disponibles',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore: configure root layout with metadata"
```

---

## Task 20: .env.example and Dockerfile

**Files:**
- Create: `.env.example`
- Create: `Dockerfile`

- [ ] **Step 1: Create .env.example**

Create `.env.example`:

```bash
# Base de datos PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/materiasyalumnos"

# NextAuth
NEXTAUTH_URL="https://materias.softgroup.com.ar"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Admin inicial (primer login con este email crea el admin)
ADMIN_EMAIL="cpereyra@face.unt.edu.ar"

# Google reCAPTCHA v2 (console.developers.google.com)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=""
RECAPTCHA_SECRET_KEY=""
```

- [ ] **Step 2: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

- [ ] **Step 3: Commit**

```bash
git add .env.example Dockerfile
git commit -m "chore: add Dockerfile standalone and .env.example"
```

---

## Task 21: Final Smoke Test

- [ ] **Step 1: Run all unit tests**

```bash
npm test
```

Expected: All tests pass (materia-status, recaptcha, inscripcion action)

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

- [ ] **Step 3: Run locally and verify golden paths**

```bash
# Requiere .env con DATABASE_URL real y claves Google
npx prisma migrate deploy
npm run dev
```

Verificar:
1. `/` muestra materias activas (o mensaje vacío si no hay)
2. Flujo inscripcion: formulario → reCAPTCHA → confirmación → descarga PDF
3. `/admin/login` → OAuth Google con `cpereyra@face.unt.edu.ar`
4. CRUD materias, badge de estado correcto
5. Inscriptos: tabla + export CSV + export PDF
6. Gestión de usuarios: agregar email, eliminar (no permite eliminar el único admin)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final smoke test verified"
```

---

## Summary

| # | Task | Key Output |
|---|------|------------|
| 1 | Project scaffold | Next.js 14 + Vitest configured |
| 2 | Prisma schema | Models + migration |
| 3 | NextAuth config | Google OAuth + admin email gate |
| 4 | Middleware | `/admin/*` protected |
| 5 | materia-status utility | TDD, 4 tests |
| 6 | recaptcha utility | TDD, 3 tests |
| 7 | inscribirse action | TDD, 7 tests |
| 8 | materias actions | CRUD server actions |
| 9 | usuarios actions | add/remove admin |
| 10 | PDF comprobante route | pdfkit + QR |
| 11 | Export route | CSV + PDF admin |
| 12 | UI base components | Button, Input, Badge |
| 13 | Admin login + layout | Google sign-in page |
| 14 | Admin dashboard | Stats |
| 15 | Admin materias | List + create + edit + delete |
| 16 | Admin inscriptos | Table + export |
| 17 | Admin usuarios | Add/remove admins |
| 18 | Public pages | Home + inscripcion form + confirmacion |
| 19 | Root layout | Metadata |
| 20 | Dockerfile + .env | Deploy ready |
| 21 | Smoke test | Build + verify |
