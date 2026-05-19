# Sistema de Inscripción a Materias

Aplicación web para gestión de materias e inscripción de alumnos.

- **Alumnos:** ven materias activas, se inscriben con nombre/apellido/DNI y descargan un comprobante PDF con código QR.
- **Administradores:** crean/editan/eliminan materias, consultan inscriptos, exportan a CSV y PDF. Login con Google OAuth.

**Stack:** Next.js 16 · Prisma · PostgreSQL · NextAuth v5 · Tailwind CSS · pdfkit

---

## Deploy en Dokploy

### Requisitos previos

- Servidor con Dokploy instalado (`panel.softgroup.com.ar`)
- Base de datos PostgreSQL accesible desde el servidor
- App de Google OAuth creada en [console.cloud.google.com](https://console.cloud.google.com)
- Claves de Google reCAPTCHA v2 en [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)

---

### 1. Crear la aplicación en Dokploy

1. Ingresar al panel de Dokploy → **Applications** → **Create Application**
2. Completar:
   - **Name:** `materiasyalumnos`
   - **Build Type:** `Dockerfile`
   - **Repository:** `git@github.com:brandall2021/materias.git`
   - **Branch:** `master`
   - **Dockerfile Path:** `./Dockerfile`
3. Guardar.

---

### 2. Configurar variables de entorno

En Dokploy → aplicación → **Environment** → agregar las siguientes variables:

```env
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST:PUERTO/materiasyalumnos

NEXTAUTH_URL=https://materias.softgroup.com.ar
NEXTAUTH_SECRET=<generá con: openssl rand -base64 32>

GOOGLE_CLIENT_ID=<desde Google Cloud Console>
GOOGLE_CLIENT_SECRET=<desde Google Cloud Console>

ADMIN_EMAIL=cpereyra@face.unt.edu.ar

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<desde Google reCAPTCHA>
RECAPTCHA_SECRET_KEY=<desde Google reCAPTCHA>
```

> **Nota:** para `NEXTAUTH_SECRET` ejecutar en cualquier terminal:
> ```bash
> openssl rand -base64 32
> ```

---

### 3. Configurar dominio

En Dokploy → aplicación → **Domains**:

- **Domain:** `materias.softgroup.com.ar`
- **Port:** `3000`
- **HTTPS:** activar (Let's Encrypt)

---

### 4. Configurar Google OAuth

En [console.cloud.google.com](https://console.cloud.google.com):

1. Crear proyecto (o usar uno existente)
2. Ir a **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
3. Tipo: **Web application**
4. Agregar en **Authorized redirect URIs**:
   ```
   https://materias.softgroup.com.ar/api/auth/callback/google
   ```
5. Copiar **Client ID** y **Client Secret** a las variables de entorno de Dokploy.

---

### 5. Crear la base de datos y ejecutar migraciones

La migración se ejecuta **una sola vez** antes del primer deploy, o vía un comando en el servidor:

```bash
# Desde el servidor, con DATABASE_URL configurada:
npx prisma migrate deploy
```

O bien, agregar en Dokploy → aplicación → **Build** → **Post-deploy command**:
```bash
npx prisma migrate deploy
```

---

### 6. Deploy

En Dokploy → aplicación → **Deploy** → **Deploy Now**.

El proceso:
1. Clona el repo desde GitHub
2. Construye la imagen Docker con `node:20-alpine`
3. Ejecuta `prisma generate` + `next build`
4. Levanta el contenedor en el puerto 3000

---

### 7. Primer acceso como administrador

Al entrar por primera vez a `https://materias.softgroup.com.ar/admin/login`:

1. Hacer click en **Ingresar con Google**
2. Autenticarse con `cpereyra@face.unt.edu.ar` (el email configurado en `ADMIN_EMAIL`)
3. El sistema lo registrará automáticamente como administrador

Desde `/admin/usuarios` se pueden agregar otros administradores por email.

---

## Desarrollo local

### Requisitos

- Node.js 20+
- PostgreSQL

### Setup

```bash
# Clonar el repo
git clone git@github.com:brandall2021/materias.git
cd materias

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores locales

# Crear la base de datos y correr migraciones
npx prisma migrate dev --name init

# Iniciar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Tests

```bash
npm test
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                        # Página pública: materias activas
│   ├── inscripcion/[materiaId]/        # Formulario de inscripción + confirmación
│   ├── admin/                          # Panel administrativo (protegido)
│   │   ├── materias/                   # CRUD materias + inscriptos
│   │   └── usuarios/                   # Gestión de admins
│   └── api/
│       ├── auth/[...nextauth]/         # NextAuth handlers
│       ├── comprobante/[id]/           # PDF comprobante alumno
│       └── admin/materias/[id]/export/ # Export CSV y PDF
├── actions/                            # Server Actions
├── components/                         # Componentes React
└── lib/                                # Utilidades (auth, prisma, recaptcha)
prisma/
└── schema.prisma                       # Modelos de base de datos
```
