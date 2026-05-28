import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export async function GET(
  _req: Request,
  context: { params: Promise<{ inscripcionId: string }> }
) {
  const { inscripcionId } = await context.params
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
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
