# Especificación: Sistema de Materias y Alumnos

**Fecha:** 2026-05-19
**Estado:** Aprobada

---

## 1. Objetivo

Sistema web para la gestión de materias y la inscripción de alumnos. Los administradores crean y administran materias; los alumnos se inscriben en las materias habilitadas sin necesidad de crear una cuenta.

---

## 2. Arquitectura

```
materiasyalumnos/
├── Next.js 14 App Router (output: 'standalone')
├── Prisma ORM → PostgreSQL
├── NextAuth v5 → Google Provider (solo admins)
├── @react-pdf/renderer + qrcode → PDF comprobante del alumno
├── jsPDF o @react-pdf/renderer → PDF listado de inscriptos (admin)
├── papaparse → export CSV
├── Google reCAPTCHA v2 → formulario de inscripción de alumnos
└── Dockerfile standalone → deploy en Dokploy (panel.softgroup.com.ar)
```

**Decisiones clave:**
- Server Actions para todas las mutaciones (sin API REST separada).
- Base de datos Postgres propia, separada del proyecto Prode.
- Alumnos no tienen cuenta ni sesión; sus datos viven en el registro de inscripción.
- El primer admin se activa automáticamente cuando `cpereyra@face.unt.edu.ar` hace login con Google (configurado vía `ADMIN_EMAIL` en `.env`).

---

## 3. Modelo de datos

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  image     String?
  role      String    @default("ADMIN")
  createdAt DateTime  @default(now())
  accounts  Account[]
  sessions  Session[]
}

model Materia {
  id            String        @id @default(cuid())
  nombre        String
  descripcion   String?
  fechaApertura DateTime      // fecha + hora de apertura combinadas
  fechaCierre   DateTime      // fecha + hora de cierre combinadas
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

// + modelos estándar de NextAuth: Account, Session, VerificationToken
```

**Notas:**
- `@@unique([dni, materiaId])` previene duplicados a nivel de base de datos.
- `fechaApertura` y `fechaCierre` son `DateTime` completos — simplifican la validación de rango.
- `onDelete: Cascade` en `Inscripcion` elimina inscriptos cuando se elimina la materia.

---

## 4. Rutas y páginas

### Módulo público (alumnos, sin login)

| Ruta | Descripción |
|------|-------------|
| `/` | Lista de materias con inscripción activa |
| `/inscripcion/[materiaId]` | Formulario de inscripción + reCAPTCHA v2 |
| `/inscripcion/[materiaId]/confirmacion` | Confirmación de inscripción + botón descargar comprobante PDF |

### Módulo admin (requiere sesión Google válida)

| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Pantalla de login con Google |
| `/admin` | Dashboard: total materias, total inscriptos |
| `/admin/materias` | Listado completo de materias (activas, próximas y cerradas) |
| `/admin/materias/nueva` | Formulario para crear materia |
| `/admin/materias/[id]/editar` | Formulario de edición de materia |
| `/admin/materias/[id]/inscriptos` | Lista de inscriptos + export CSV y PDF |
| `/admin/usuarios` | Gestión de admins: agregar por email / dar de baja |

**Middleware:** protege todas las rutas `/admin/*` excepto `/admin/login`. Redirige a `/admin/login` si no hay sesión.

### Route handlers

| Endpoint | Descripción |
|----------|-------------|
| `/api/comprobante/[inscripcionId]` | Genera y descarga el PDF comprobante del alumno con QR |
| `/api/admin/materias/[id]/export?format=csv` | Descarga CSV de inscriptos |
| `/api/admin/materias/[id]/export?format=pdf` | Descarga PDF de inscriptos |

---

## 5. Flujos clave

### 5.1 Inscripción de alumno

1. Alumno entra a `/` y ve las materias con estado **Activa**.
2. Hace click en "Inscribirse" → navega a `/inscripcion/[materiaId]`.
3. Completa nombre, apellido, DNI. Resuelve reCAPTCHA v2.
4. Server Action valida en orden:
   - Token reCAPTCHA válido (llamada server-side a Google).
   - Período activo: `fechaApertura <= now() <= fechaCierre`.
   - DNI no duplicado en esa materia.
5. Si todo pasa: crea `Inscripcion` en DB → redirige a `/inscripcion/[materiaId]/confirmacion`.
6. Confirmación muestra nombre de la materia, datos del alumno y botón "Descargar comprobante PDF".

### 5.2 Comprobante PDF (alumno)

Generado on-demand por `/api/comprobante/[inscripcionId]`.

Contenido:
- Nombre y apellido
- DNI
- Nombre de la materia
- Fecha y hora de inscripción
- Código QR que codifica: `nombre|apellido|DNI|materia|fechaInscripcion`

### 5.3 Gestión de materias (admin)

- Crear / editar: formulario con nombre, descripción, fecha+hora de apertura, fecha+hora de cierre.
- Eliminar: si la materia tiene inscriptos, pide confirmación explícita informando la cantidad.
- Listado muestra badge de estado: **Próxima** / **Activa** / **Cerrada**.

### 5.4 Export de inscriptos (admin)

- **CSV**: columnas `nombre, apellido, dni, fechaInscripcion`. Descarga directa.
- **PDF**: tabla con los mismos campos, encabezado con nombre de la materia y fecha de exportación.

### 5.5 Gestión de admins

- Primer admin: el primer login con `ADMIN_EMAIL=cpereyra@face.unt.edu.ar` crea automáticamente el registro con `role = "ADMIN"`.
- Desde `/admin/usuarios` se agregan admins por email (quedan activos al primer login con Google) o se eliminan.
- El sistema impide eliminar al único admin restante.

---

## 6. Estados de materia

| Estado | Condición | Visible para alumnos | Inscripción disponible |
|--------|-----------|----------------------|------------------------|
| Próxima | `fechaApertura > now()` | No | No |
| Activa | `fechaApertura <= now() <= fechaCierre` | Sí | Sí |
| Cerrada | `fechaCierre < now()` | No | No |

---

## 7. Validaciones y manejo de errores

### Inscripción de alumnos

| Condición | Respuesta |
|-----------|-----------|
| Período cerrado | "La inscripción para esta materia no está disponible" |
| DNI ya inscripto en esa materia | "Ya estás inscripto en esta materia con ese DNI" |
| CAPTCHA inválido o no resuelto | "Por favor completá la verificación" |
| Campos vacíos | Validación client-side con mensajes inline |
| DNI con formato inválido (no numérico o fuera de rango) | Validación client-side |

### Panel admin

| Condición | Respuesta |
|-----------|-----------|
| `fechaCierre` anterior a `fechaApertura` | "La fecha de cierre debe ser posterior a la apertura" |
| Eliminar materia con inscriptos | Modal: "Esta materia tiene X inscriptos. ¿Confirmar eliminación?" |
| Eliminar el único admin | Bloqueado: "No podés eliminar el único administrador del sistema" |
| Acceso a `/admin/*` sin sesión | Redirect a `/admin/login` |

---

## 8. Variables de entorno

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://materias.softgroup.com.ar"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_EMAIL="cpereyra@face.unt.edu.ar"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."
```

---

## 9. Deploy

- **Servidor:** Dokploy en `panel.softgroup.com.ar`
- **Dominio previsto:** `materias.softgroup.com.ar`
- **Build:** Dockerfile multi-stage con `prisma generate` + `next build` standalone
- **Base de datos:** Postgres externo en `panel.softgroup.com.ar` (puerto a confirmar), base de datos separada del Prode

---

## 10. Requerimientos funcionales cubiertos

| RF | Descripción | Cubierto |
|----|-------------|----------|
| RF01 | Crear materia con nombre, descripción, fechas y horas | ✓ |
| RF02 | Listar todas las materias | ✓ |
| RF03 | Editar materia | ✓ |
| RF04 | Eliminar materia | ✓ |
| RF05 | Ver inscriptos + export CSV y PDF | ✓ |
| RF06 | Alumnos ven solo materias activas | ✓ |
| RF07 | Inscripción con nombre, apellido, DNI, hora automática | ✓ |
| RF08 | Validación de período de inscripción | ✓ |
| RF09 | Confirmación + comprobante PDF con QR | ✓ |

## 11. Requerimientos no funcionales cubiertos

| RNF | Descripción | Cubierto |
|-----|-------------|----------|
| RNF01 | Interfaz simple e intuitiva | ✓ Tailwind + componentes claros |
| RNF02 | Disponibilidad según servidor | ✓ Deploy Dokploy |
| RNF03 | Persistencia en PostgreSQL | ✓ Prisma + Postgres |
| RNF04 | Autenticación admin + CAPTCHA alumnos | ✓ NextAuth Google + reCAPTCHA v2 |
| RNF05 | Integridad: sin inscripciones fuera de período ni duplicados | ✓ Validación + constraint DB |
