import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Estudiante, Modulo, Seccion, RegistroNota, ConfiguracionIndicadores } from '~/types/sistema'

export interface FilaNotaEstudianteExportacion {
  numero_lista: number
  cedula: string
  nombre_completo: string
  nota_a: number
  nota_b: number
  nota_c: number
  nota_d: number
  nota_e: number
  convivir: number
  definitiva: number
  observacion: string
}

export interface FilaResumenLapsoExportacion {
  numero_lista: number
  cedula: string
  nombre_completo: string
  notas_modulos: { modulo_nombre: string; definitiva: number; porcentaje: number }[]
  definitiva_lapso: number
  estado_aprobacion: string
}

// 1. Exportar Modulo a Excel (.xlsx)
export function exportarModuloExcel(
  seccion: Seccion,
  modulo: Modulo,
  configuracion: ConfiguracionIndicadores,
  filas: FilaNotaEstudianteExportacion[]
) {
  const libro = XLSX.utils.book_new()

  const datosTabla = filas.map(f => ({
    'Nº': f.numero_lista,
    'Cédula': f.cedula,
    'Apellidos y Nombres': f.nombre_completo,
    [`A: ${configuracion.indicador_a_nombre} (${configuracion.indicador_a_maximo} pts)`]: f.nota_a,
    [`B: ${configuracion.indicador_b_nombre} (${configuracion.indicador_b_maximo} pts)`]: f.nota_b,
    [`C: ${configuracion.indicador_c_nombre} (${configuracion.indicador_c_maximo} pts)`]: f.nota_c,
    [`D: ${configuracion.indicador_d_nombre} (${configuracion.indicador_d_maximo} pts)`]: f.nota_d,
    [`E: ${configuracion.indicador_e_nombre} (${configuracion.indicador_e_maximo} pts)`]: f.nota_e,
    'F: Convivir (4.0 pts)': f.convivir,
    'Definitiva (1 al 20)': f.definitiva,
    'Observaciones Convivir': f.observacion
  }))

  const hoja = XLSX.utils.json_to_sheet(datosTabla)
  XLSX.utils.book_append_sheet(libro, hoja, 'Calificaciones')

  const nombreArchivo = `Notas_${seccion.nombre.replace(/\s+/g, '_')}_${modulo.nombre.replace(/\s+/g, '_')}.xlsx`
  XLSX.writeFile(libro, nombreArchivo)
}

// 2. Exportar Modulo a PDF
export function exportarModuloPDF(
  seccion: Seccion,
  modulo: Modulo,
  configuracion: ConfiguracionIndicadores,
  filas: FilaNotaEstudianteExportacion[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  // Encabezado institucional
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138) // Azul institucional
  doc.text('UNIDAD EDUCATIVA - PLANILLA OFICIAL DE CALIFICACIONES', 14, 15)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Sección: ${seccion.nombre} (${seccion.nivel}) | Módulo: ${modulo.nombre} | Tipo: ${modulo.tipo_evaluacion}`, 14, 22)
  doc.text(`Ponderación: A (${configuracion.indicador_a_maximo}) + B (${configuracion.indicador_b_maximo}) + C (${configuracion.indicador_c_maximo}) + D (${configuracion.indicador_d_maximo}) + E (${configuracion.indicador_e_maximo}) + F (Convivir 4.0) = 20.0 pts`, 14, 27)

  const encabezados = [
    ['Nº', 'Cédula', 'Estudiante', 'A', 'B', 'C', 'D', 'E', 'Convivir', 'Def.', 'Observación Convivir']
  ]

  const cuerpo = filas.map(f => [
    f.numero_lista,
    f.cedula,
    f.nombre_completo,
    f.nota_a.toFixed(1),
    f.nota_b.toFixed(1),
    f.nota_c.toFixed(1),
    f.nota_d.toFixed(1),
    f.nota_e.toFixed(1),
    f.convivir.toFixed(1),
    f.definitiva.toFixed(1),
    f.observacion
  ])

  autoTable(doc, {
    head: encabezados,
    body: cuerpo,
    startY: 32,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: 50 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18 },
      2: { cellWidth: 45 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 10, halign: 'center' },
      8: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 'auto' }
    }
  })

  const nombreArchivo = `Planilla_${seccion.nombre.replace(/\s+/g, '_')}_${modulo.nombre.replace(/\s+/g, '_')}.pdf`
  doc.save(nombreArchivo)
}

// 3. Exportar Lapso Completo a Excel (.xlsx)
export function exportarLapsoExcel(
  seccion: Seccion,
  numeroLapso: number,
  modulosDelLapso: Modulo[],
  filasLapso: FilaResumenLapsoExportacion[]
) {
  const libro = XLSX.utils.book_new()

  const datosTabla = filasLapso.map(f => {
    const filaObjeto: Record<string, any> = {
      'Nº': f.numero_lista,
      'Cédula': f.cedula,
      'Apellidos y Nombres': f.nombre_completo
    }

    for (const m of f.notas_modulos) {
      filaObjeto[`${m.modulo_nombre} (${m.porcentaje}%)`] = m.definitiva
    }

    filaObjeto['Definitiva Lapso'] = f.definitiva_lapso
    filaObjeto['Estado'] = f.estado_aprobacion

    return filaObjeto
  })

  const hoja = XLSX.utils.json_to_sheet(datosTabla)
  XLSX.utils.book_append_sheet(libro, hoja, `Lapso_${numeroLapso}`)

  const nombreArchivo = `Resumen_Lapso_${numeroLapso}_${seccion.nombre.replace(/\s+/g, '_')}.xlsx`
  XLSX.writeFile(libro, nombreArchivo)
}

// 4. Exportar Lapso Completo a PDF
export function exportarLapsoPDF(
  seccion: Seccion,
  numeroLapso: number,
  modulosDelLapso: Modulo[],
  filasLapso: FilaResumenLapsoExportacion[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  // Encabezado
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('UNIDAD EDUCATIVA - RESUMEN CONSOLIDADO DE LAPSO', 14, 15)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Sección: ${seccion.nombre} (${seccion.nivel}) | Período: Lapso ${numeroLapso}`, 14, 22)
  doc.text(`Módulos evaluados: ${modulosDelLapso.map(m => `${m.nombre} (${m.ponderacion_porcentaje}%)`).join(', ')}`, 14, 27)

  const encabezados = [
    [
      'Nº',
      'Cédula',
      'Estudiante',
      ...modulosDelLapso.map(m => `${m.nombre}\n(${m.ponderacion_porcentaje}%)`),
      'Def. Lapso',
      'Condición'
    ]
  ]

  const cuerpo = filasLapso.map(f => [
    f.numero_lista,
    f.cedula,
    f.nombre_completo,
    ...f.notas_modulos.map(m => m.definitiva.toFixed(1)),
    f.definitiva_lapso.toFixed(1),
    f.estado_aprobacion
  ])

  autoTable(doc, {
    head: encabezados,
    body: cuerpo,
    startY: 32,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: 50 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 'auto' }
    }
  })

  const nombreArchivo = `Consolidado_Lapso_${numeroLapso}_${seccion.nombre.replace(/\s+/g, '_')}.pdf`
  doc.save(nombreArchivo)
}
