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
