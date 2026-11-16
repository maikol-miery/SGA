import { baseDatos } from '../utils/bd'
import type { AccionOffline, Usuario } from '~/types/sistema'

export default defineEventHandler(async (evento) => {
  const cuerpo = await readBody(evento)
  const acciones: AccionOffline[] = cuerpo.acciones || []
  const usuarioActual: Usuario = cuerpo.usuario

  if (!usuarioActual) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuario no autenticado o no proporcionado'
    })
  }

  const resultadosProcesados: { id: string; exito: boolean; error?: string }[] = []

  // Sentencias preparadas para reutilizacion eficiente
  const insertarIncidencia = baseDatos.prepare(`
    INSERT INTO incidencias 
    (id, estudiante_id, modulo_id, seccion_id, tipo_apartado, puntos_descontados, motivo, fecha, creado_por_usuario_id, es_falta_muy_grave)
    VALUES (@id, @estudiante_id, @modulo_id, @seccion_id, @tipo_apartado, @puntos_descontados, @motivo, @fecha, @creado_por_usuario_id, @es_falta_muy_grave)
  `)

  const eliminarIncidencia = baseDatos.prepare('DELETE FROM incidencias WHERE id = ?')

  const upsertConfiguracion = baseDatos.prepare(`
    INSERT INTO configuraciones_indicadores 
    (id, seccion_id, modulo_id, indicador_a_nombre, indicador_a_maximo, indicador_b_nombre, indicador_b_maximo, indicador_c_nombre, indicador_c_maximo, indicador_d_nombre, indicador_d_maximo, indicador_e_nombre, indicador_e_maximo)
    VALUES (@id, @seccion_id, @modulo_id, @indicador_a_nombre, @indicador_a_maximo, @indicador_b_nombre, @indicador_b_maximo, @indicador_c_nombre, @indicador_c_maximo, @indicador_d_nombre, @indicador_d_maximo, @indicador_e_nombre, @indicador_e_maximo)
    ON CONFLICT(seccion_id, modulo_id) DO UPDATE SET
      indicador_a_nombre = excluded.indicador_a_nombre,
      indicador_a_maximo = excluded.indicador_a_maximo,
      indicador_b_nombre = excluded.indicador_b_nombre,
      indicador_b_maximo = excluded.indicador_b_maximo,
      indicador_c_nombre = excluded.indicador_c_nombre,
      indicador_c_maximo = excluded.indicador_c_maximo,
      indicador_d_nombre = excluded.indicador_d_nombre,
      indicador_d_maximo = excluded.indicador_d_maximo,
      indicador_e_nombre = excluded.indicador_e_nombre,
      indicador_e_maximo = excluded.indicador_e_maximo
  `)

  const upsertNota = baseDatos.prepare(`
    INSERT INTO notas (id, estudiante_id, modulo_id, seccion_id, nota_a, nota_b, nota_c, nota_d, nota_e)
    VALUES (@id, @estudiante_id, @modulo_id, @seccion_id, @nota_a, @nota_b, @nota_c, @nota_d, @nota_e)
    ON CONFLICT(estudiante_id, modulo_id) DO UPDATE SET
      nota_a = excluded.nota_a,
      nota_b = excluded.nota_b,
      nota_c = excluded.nota_c,
      nota_d = excluded.nota_d,
      nota_e = excluded.nota_e
  `)

  const insertarControlDiario = baseDatos.prepare(`
    INSERT INTO controles_diarios (id, seccion_id, fecha, temas_dados, descripcion_clase, tarea_asignada, docente_id)
    VALUES (@id, @seccion_id, @fecha, @temas_dados, @descripcion_clase, @tarea_asignada, @docente_id)
    ON CONFLICT(id) DO UPDATE SET
      temas_dados = excluded.temas_dados,
      descripcion_clase = excluded.descripcion_clase,
      tarea_asignada = excluded.tarea_asignada
  `)

  const insertarEvento = baseDatos.prepare(`
    INSERT INTO eventos_calendario (id, titulo, descripcion, fecha, tipo, seccion_id, creado_por_usuario_id, bloqueado_para_docentes)
    VALUES (@id, @titulo, @descripcion, @fecha, @tipo, @seccion_id, @creado_por_usuario_id, @bloqueado_para_docentes)
  `)

  const upsertModulo = baseDatos.prepare(`
    INSERT INTO modulos (id, nombre, numero, lapso, tipo_evaluacion, ponderacion_porcentaje, activo)
    VALUES (@id, @nombre, @numero, @lapso, @tipo_evaluacion, @ponderacion_porcentaje, @activo)
    ON CONFLICT(id) DO UPDATE SET
      nombre = excluded.nombre,
      numero = excluded.numero,
      lapso = excluded.lapso,
      tipo_evaluacion = excluded.tipo_evaluacion,
      ponderacion_porcentaje = excluded.ponderacion_porcentaje,
      activo = excluded.activo
  `)

  const eliminarModulo = baseDatos.prepare('DELETE FROM modulos WHERE id = ?')

  // Transaccion para procesamiento atomico
  const ejecutarTransaccion = baseDatos.transaction(() => {
    for (const accion of acciones) {
      try {
        switch (accion.tipo) {
          case 'REGISTRAR_INCIDENCIA': {
            const inc = accion.datos
            insertarIncidencia.run({
              id: inc.id,
              estudiante_id: inc.estudiante_id,
              modulo_id: inc.modulo_id,
              seccion_id: inc.seccion_id,
              tipo_apartado: inc.tipo_apartado,
              puntos_descontados: inc.puntos_descontados,
              motivo: inc.motivo,
              fecha: inc.fecha,
              creado_por_usuario_id: inc.creado_por_usuario_id || usuarioActual.id,
              es_falta_muy_grave: inc.es_falta_muy_grave ? 1 : 0
            })
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'APLICAR_FALTA_MUY_GRAVE': {
            // Solo coordinadoras pueden aplicar sancion de falta muy grave
            if (!usuarioActual.rol.startsWith('COORDINADORA')) {
              throw new Error('Solo las coordinadoras tienen permiso para aplicar o retirar faltas muy graves')
            }
            const inc = accion.datos
            insertarIncidencia.run({
              id: inc.id,
              estudiante_id: inc.estudiante_id,
              modulo_id: inc.modulo_id,
              seccion_id: inc.seccion_id,
              tipo_apartado: 'CONDUCTA',
              puntos_descontados: 4.0,
              motivo: inc.motivo || 'Falta Muy Grave - Bloqueo de Convivir a 0.0 pts',
              fecha: inc.fecha,
              creado_por_usuario_id: usuarioActual.id,
              es_falta_muy_grave: 1
            })
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'ELIMINAR_INCIDENCIA': {
            eliminarIncidencia.run(accion.datos.id)
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'GUARDAR_CONFIGURACION_INDICADORES': {
            const cfg = accion.datos
            upsertConfiguracion.run({
              id: cfg.id || `cfg-${cfg.seccion_id}-${cfg.modulo_id}`,
              seccion_id: cfg.seccion_id,
              modulo_id: cfg.modulo_id,
              indicador_a_nombre: cfg.indicador_a_nombre,
              indicador_a_maximo: cfg.indicador_a_maximo,
              indicador_b_nombre: cfg.indicador_b_nombre,
              indicador_b_maximo: cfg.indicador_b_maximo,
              indicador_c_nombre: cfg.indicador_c_nombre,
              indicador_c_maximo: cfg.indicador_c_maximo,
              indicador_d_nombre: cfg.indicador_d_nombre,
              indicador_d_maximo: cfg.indicador_d_maximo,
              indicador_e_nombre: cfg.indicador_e_nombre,
              indicador_e_maximo: cfg.indicador_e_maximo
            })
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'GUARDAR_NOTAS': {
            const listaNotas = Array.isArray(accion.datos) ? accion.datos : [accion.datos]
            for (const nota of listaNotas) {
              upsertNota.run({
                id: nota.id || `nota-${nota.estudiante_id}-${nota.modulo_id}`,
                estudiante_id: nota.estudiante_id,
                modulo_id: nota.modulo_id,
                seccion_id: nota.seccion_id,
                nota_a: Number(nota.nota_a) || 0,
                nota_b: Number(nota.nota_b) || 0,
                nota_c: Number(nota.nota_c) || 0,
                nota_d: Number(nota.nota_d) || 0,
                nota_e: Number(nota.nota_e) || 0
              })
            }
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'GUARDAR_CONTROL_DIARIO': {
            const cd = accion.datos
            insertarControlDiario.run({
              id: cd.id,
              seccion_id: cd.seccion_id,
              fecha: cd.fecha,
              temas_dados: cd.temas_dados,
              descripcion_clase: cd.descripcion_clase,
              tarea_asignada: cd.tarea_asignada,
              docente_id: usuarioActual.id
            })
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'GUARDAR_EVENTO_CALENDARIO': {
            const ev = accion.datos
            const esCoordinacion = usuarioActual.rol.startsWith('COORDINADORA')
            const esBloqueado = ev.tipo === 'ENTREGA_NOTAS_COORDINACION'

            if (esBloqueado && !esCoordinacion) {
              throw new Error('Solo las coordinadoras pueden fijar fechas de entrega de notas')
            }

            insertarEvento.run({
              id: ev.id,
              titulo: ev.titulo,
              descripcion: ev.descripcion,
              fecha: ev.fecha,
              tipo: ev.tipo,
              seccion_id: ev.seccion_id || null,
              creado_por_usuario_id: usuarioActual.id,
              bloqueado_para_docentes: esBloqueado ? 1 : 0
            })
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'GUARDAR_MODULO': {
            const m = accion.datos
            upsertModulo.run({
              id: m.id,
              nombre: m.nombre,
              numero: Number(m.numero),
              lapso: Number(m.lapso),
              tipo_evaluacion: m.tipo_evaluacion || 'REGULAR',
              ponderacion_porcentaje: Number(m.ponderacion_porcentaje) || 50.0,
              activo: m.activo ? 1 : 0
            })
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          case 'ELIMINAR_MODULO': {
            eliminarModulo.run(accion.datos.id)
            resultadosProcesados.push({ id: accion.id, exito: true })
            break
          }

          default:
            resultadosProcesados.push({ id: accion.id, exito: false, error: 'Tipo de acción no reconocido' })
        }
      } catch (err: any) {
        resultadosProcesados.push({ id: accion.id, exito: false, error: err.message })
      }
    }
  })

  ejecutarTransaccion()

  return {
    exito: true,
    total_recibidas: acciones.length,
    resultados: resultadosProcesados
  }
})
